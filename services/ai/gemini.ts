import { GoogleGenerativeAI } from "@google/generative-ai";

/** Google AI Studio 권장 기본 모델 */
export const GEMINI_DEFAULT_MODEL = "gemini-2.5-flash";

const STATIC_MODELS = [
  GEMINI_DEFAULT_MODEL,
  "gemini-2.5-flash-lite",
  "gemini-2.0-flash",
] as const;

/** API에서 제거된 모델 — GEMINI_MODEL에 있어도 시도하지 않음 */
const BLOCKED_MODEL_PREFIXES = ["gemini-1.5", "gemini-1.0"];

const API_MODELS_TTL_MS = 10 * 60 * 1000;
const MAX_MODEL_ATTEMPTS = 6;
const RETRY_DELAY_MS = 500;

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export function isTransientGeminiError(error: string): boolean {
  return /HTTP 503|HTTP 429|high demand|overloaded|temporarily unavailable|UNAVAILABLE/i.test(
    error
  );
}

function isChatCapableModel(id: string): boolean {
  return (
    !id.includes("-image") &&
    !id.includes("-tts") &&
    !id.includes("native-audio") &&
    !id.includes("embedding")
  );
}

let client: GoogleGenerativeAI | null = null;
let cachedApiModels: { ids: string[]; fetchedAt: number } | null = null;

export type GeminiJsonResult<T> =
  | { ok: true; data: T; model: string }
  | { ok: false; error: string };

export type GeminiModelsListResult = {
  ok: boolean;
  status?: number;
  modelCount?: number;
  error?: string;
  modelIds?: string[];
  sampleModels?: string[];
};

export function getGeminiApiKey(): string | null {
  const key =
    process.env.GEMINI_API_KEY?.trim() ||
    process.env.GOOGLE_GENERATIVE_AI_API_KEY?.trim() ||
    process.env.GOOGLE_API_KEY?.trim();
  return key || null;
}

export function isGeminiConfigured(): boolean {
  return getGeminiApiKey() !== null;
}

export function isBlockedGeminiModel(model: string): boolean {
  const id = model.replace(/^models\//, "");
  return BLOCKED_MODEL_PREFIXES.some((p) => id.startsWith(p));
}

function rankModel(id: string): number {
  if (id.includes("2.5-flash") && !id.includes("lite")) return 0;
  if (id.includes("2.5-flash-lite")) return 1;
  if (id.includes("2.0-flash") && !id.includes("lite")) return 2;
  if (id.includes("flash")) return 5;
  return 10;
}

function formatApiError(status: number, body: string): string {
  if (status === 400 && /API key not valid/i.test(body)) {
    return "API key not valid — Google AI Studio(https://aistudio.google.com/apikey) 키인지 확인하세요";
  }
  if (status === 403) {
    return "API key forbidden — Generative Language API가 활성화된 AI Studio 키인지 확인하세요";
  }
  if (status === 404) {
    return "model not found — GEMINI_MODEL을 gemini-2.5-flash 로 설정하세요";
  }
  if (status === 503) {
    return "model temporarily unavailable (503) — retry or use fallback model";
  }
  if (status === 429) {
    return "rate limited (429) — retry shortly";
  }
  return `HTTP ${status}: ${body.slice(0, 180)}`;
}

export async function verifyGeminiModelsList(): Promise<GeminiModelsListResult> {
  const apiKey = getGeminiApiKey();
  if (!apiKey) {
    return { ok: false, error: "GEMINI_API_KEY not configured" };
  }

  try {
    const res = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models?key=${encodeURIComponent(apiKey)}`,
      { cache: "no-store" }
    );
    const body = await res.text();

    if (!res.ok) {
      return {
        ok: false,
        status: res.status,
        error: formatApiError(res.status, body),
      };
    }

    const parsed = JSON.parse(body) as {
      models?: Array<{
        name?: string;
        supportedGenerationMethods?: string[];
      }>;
    };

    const ids = (parsed.models ?? [])
      .filter((m) => m.supportedGenerationMethods?.includes("generateContent"))
      .map((m) => (m.name ?? "").replace(/^models\//, ""))
      .filter(
        (id) =>
          id.includes("gemini") &&
          !isBlockedGeminiModel(id) &&
          isChatCapableModel(id)
      )
      .toSorted((a, b) => rankModel(a) - rankModel(b));

    return {
      ok: true,
      status: res.status,
      modelCount: ids.length,
      modelIds: ids,
      sampleModels: ids.slice(0, 8),
    };
  } catch (err) {
    return {
      ok: false,
      error: err instanceof Error ? err.message : String(err),
    };
  }
}

export async function fetchAvailableGeminiModelIds(): Promise<string[]> {
  const apiKey = getGeminiApiKey();
  if (!apiKey) return [];

  const now = Date.now();
  if (cachedApiModels && now - cachedApiModels.fetchedAt < API_MODELS_TTL_MS) {
    return cachedApiModels.ids;
  }

  const list = await verifyGeminiModelsList();
  if (!list.ok || !list.modelIds) return [];

  cachedApiModels = { ids: list.modelIds, fetchedAt: now };
  return list.modelIds;
}

export async function getGeminiModelCandidates(): Promise<string[]> {
  const preferred = process.env.GEMINI_MODEL?.trim();
  const fromApi = await fetchAvailableGeminiModelIds();

  const ordered: string[] = [];

  for (const id of fromApi) {
    ordered.push(id);
  }

  if (
    preferred &&
    !isBlockedGeminiModel(preferred) &&
    (fromApi.length === 0 || fromApi.includes(preferred))
  ) {
    ordered.unshift(preferred);
  }

  for (const id of STATIC_MODELS) {
    ordered.push(id);
  }

  return [...new Set(ordered.filter((id) => id && !isBlockedGeminiModel(id)))].slice(
    0,
    MAX_MODEL_ATTEMPTS + 2
  );
}

async function probeSimpleGenerate(
  apiKey: string,
  modelName: string
): Promise<{ ok: true } | { ok: false; error: string }> {
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(modelName)}:generateContent?key=${encodeURIComponent(apiKey)}`;

  try {
    const res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      cache: "no-store",
      body: JSON.stringify({
        contents: [{ role: "user", parts: [{ text: "Reply with the word OK" }] }],
        generationConfig: { temperature: 0, maxOutputTokens: 16 },
      }),
    });
    const body = await res.text();
    if (!res.ok) {
      return { ok: false, error: formatApiError(res.status, body) };
    }
    return { ok: true };
  } catch (err) {
    return {
      ok: false,
      error: err instanceof Error ? err.message : String(err),
    };
  }
}

function getClient(): GoogleGenerativeAI | null {
  const apiKey = getGeminiApiKey();
  if (!apiKey) return null;
  if (!client) {
    client = new GoogleGenerativeAI(apiKey);
  }
  return client;
}

/** ```json ... ``` 또는 본문에서 JSON 추출 */
export function extractJsonText(text: string): string {
  const fenced = text.match(/```(?:json)?\s*([\s\S]*?)```/i);
  if (fenced?.[1]) return fenced[1].trim();
  const start = text.indexOf("{");
  const end = text.lastIndexOf("}");
  if (start >= 0 && end > start) {
    return text.slice(start, end + 1);
  }
  return text.trim();
}

export interface GeminiInlineImage {
  mimeType: string;
  base64: string;
}

async function generateWithRestApi<T>(
  apiKey: string,
  modelName: string,
  systemInstruction: string,
  userPrompt: string,
  jsonMode: boolean,
  image?: GeminiInlineImage
): Promise<T> {
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(modelName)}:generateContent?key=${encodeURIComponent(apiKey)}`;

  const userParts: Array<{ text?: string; inlineData?: { mimeType: string; data: string } }> = [
    { text: userPrompt },
  ];
  if (image) {
    userParts.push({
      inlineData: { mimeType: image.mimeType, data: image.base64 },
    });
  }

  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    cache: "no-store",
    body: JSON.stringify({
      systemInstruction: { parts: [{ text: systemInstruction }] },
      contents: [{ role: "user", parts: userParts }],
      generationConfig: jsonMode
        ? { responseMimeType: "application/json", temperature: 0.1 }
        : { temperature: 0.1 },
    }),
  });

  const body = await res.text();
  if (!res.ok) {
    throw new Error(formatApiError(res.status, body));
  }

  const parsed = JSON.parse(body) as {
    candidates?: Array<{ content?: { parts?: Array<{ text?: string }> } }>;
  };
  const rawText = parsed.candidates?.[0]?.content?.parts?.[0]?.text?.trim();
  if (!rawText) {
    throw new Error("empty response");
  }

  return JSON.parse(extractJsonText(rawText)) as T;
}

async function generateWithSdk<T>(
  genAI: GoogleGenerativeAI,
  modelName: string,
  systemInstruction: string,
  userPrompt: string,
  jsonMode: boolean,
  image?: GeminiInlineImage
): Promise<T> {
  const model = genAI.getGenerativeModel({
    model: modelName,
    systemInstruction,
    generationConfig: jsonMode
      ? { responseMimeType: "application/json", temperature: 0.1 }
      : { temperature: 0.1 },
  });

  const content = image
    ? [
        userPrompt,
        {
          inlineData: {
            mimeType: image.mimeType,
            data: image.base64,
          },
        },
      ]
    : userPrompt;

  const result = await model.generateContent(content);
  const rawText = result.response.text()?.trim();
  if (!rawText) {
    throw new Error("empty response");
  }

  return JSON.parse(extractJsonText(rawText)) as T;
}

async function generateGeminiJsonInternal<T>(
  systemInstruction: string,
  userPrompt: string,
  image?: GeminiInlineImage
): Promise<GeminiJsonResult<T>> {
  const apiKey = getGeminiApiKey();
  if (!apiKey) {
    return { ok: false, error: "GEMINI_API_KEY not configured" };
  }

  const modelsList = await verifyGeminiModelsList();
  if (!modelsList.ok) {
    return { ok: false, error: modelsList.error ?? "models.list failed" };
  }

  const models = await getGeminiModelCandidates();
  if (models.length === 0) {
    return { ok: false, error: "no model candidates" };
  }

  const genAI = getClient();
  const errors: string[] = [];

  for (const modelName of models.slice(0, MAX_MODEL_ATTEMPTS)) {
    for (let attempt = 0; attempt < 2; attempt++) {
      try {
        const data = await generateWithRestApi<T>(
          apiKey,
          modelName,
          systemInstruction,
          userPrompt,
          true,
          image
        );
        return { ok: true, data, model: modelName };
      } catch (err) {
        const message = err instanceof Error ? err.message : String(err);
        errors.push(`${modelName}[rest/json]: ${message.slice(0, 160)}`);

        if (isTransientGeminiError(message) && attempt === 0) {
          await sleep(RETRY_DELAY_MS);
          continue;
        }
        break;
      }
    }

    if (!genAI) continue;
    try {
      const data = await generateWithSdk<T>(
        genAI,
        modelName,
        systemInstruction,
        userPrompt,
        true,
        image
      );
      return { ok: true, data, model: modelName };
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      errors.push(`${modelName}[sdk/json]: ${message.slice(0, 120)}`);
    }
  }

  return { ok: false, error: errors.slice(0, 4).join(" | ") || "all models failed" };
}

export async function generateGeminiJson<T>(
  systemInstruction: string,
  userPrompt: string
): Promise<GeminiJsonResult<T>> {
  return generateGeminiJsonInternal<T>(systemInstruction, userPrompt);
}

export async function generateGeminiJsonWithImage<T>(
  systemInstruction: string,
  userPrompt: string,
  image: GeminiInlineImage
): Promise<GeminiJsonResult<T>> {
  return generateGeminiJsonInternal<T>(systemInstruction, userPrompt, image);
}

export async function probeGeminiConnection(): Promise<{
  ok: boolean;
  model?: string;
  error?: string;
  modelsList?: GeminiModelsListResult;
  availableModels?: string[];
}> {
  const apiKey = getGeminiApiKey();
  const modelsList = await verifyGeminiModelsList();
  if (!modelsList.ok) {
    return {
      ok: false,
      error: modelsList.error,
      modelsList,
      availableModels: modelsList.sampleModels,
    };
  }

  const availableModels = modelsList.sampleModels ?? [];
  const models = await getGeminiModelCandidates();
  const errors: string[] = [];

  if (apiKey) {
    for (const modelName of models.slice(0, MAX_MODEL_ATTEMPTS)) {
      const simple = await probeSimpleGenerate(apiKey, modelName);
      if (simple.ok) {
        return { ok: true, model: modelName, modelsList, availableModels };
      }
      errors.push(`${modelName}: ${simple.error}`);
    }
  }

  const result = await generateGeminiJson<{ ping: string }>(
    'Respond JSON only: {"ping":"ok"}',
    "ping"
  );

  if (result.ok) {
    return { ok: true, model: result.model, modelsList, availableModels };
  }

  return {
    ok: false,
    error: result.error || errors.slice(0, 3).join(" | ") || "all models failed",
    modelsList,
    availableModels,
  };
}

export function buildGeminiStatusHints(input: {
  configured: boolean;
  modelsList: GeminiModelsListResult | null;
  probeOk: boolean;
  probeError?: string | null;
  envModel: string | null;
}): string[] {
  const hints: string[] = [];

  if (!input.configured) {
    hints.push(
      "Vercel → Settings → Environment Variables에 GEMINI_API_KEY를 Production(및 Preview)에 추가한 뒤 Redeploy하세요."
    );
    return hints;
  }

  if (input.envModel && isBlockedGeminiModel(input.envModel)) {
    hints.push(
      `GEMINI_MODEL=${input.envModel} 은 지원 종료되었습니다. Vercel env에서 삭제하거나 ${GEMINI_DEFAULT_MODEL} 로 변경 후 Redeploy하세요.`
    );
  } else if (
    input.envModel &&
    input.modelsList?.modelIds &&
    !input.modelsList.modelIds.includes(input.envModel.replace(/^models\//, ""))
  ) {
    hints.push(
      `GEMINI_MODEL=${input.envModel} 이(가) API 목록에 없습니다. env에서 삭제하면 ${GEMINI_DEFAULT_MODEL} 등으로 자동 시도합니다.`
    );
  }

  if (input.modelsList && !input.modelsList.ok) {
    hints.push(input.modelsList.error ?? "API 키 검증 실패");
    hints.push(
      "https://aistudio.google.com/apikey 에서 AI Studio 키를 발급해 Production·Preview 환경 변수에 넣으세요."
    );
    return hints;
  }

  if (input.modelsList?.ok && !input.probeOk) {
    if (input.probeError) {
      hints.push(input.probeError.slice(0, 240));
    }
    if (/429|rate limit/i.test(input.probeError ?? "")) {
      hints.push("Gemini 할당량 초과 — 잠시 후 다시 시도하거나 AI Studio 할당량을 확인하세요.");
    } else if (/403|forbidden/i.test(input.probeError ?? "")) {
      hints.push("Google Cloud Console 키가 아닌 AI Studio(https://aistudio.google.com/apikey) 키를 사용하세요.");
    } else if (/404|not found/i.test(input.probeError ?? "")) {
      hints.push(`GEMINI_MODEL env를 삭제하고 Redeploy하세요. 기본값: ${GEMINI_DEFAULT_MODEL}`);
    } else if (!hints.some((h) => h.includes("GEMINI_MODEL"))) {
      hints.push(
        "Vercel env의 GEMINI_MODEL을 삭제하고 Redeploy한 뒤, AI Studio에서 새 키를 발급해 보세요."
      );
    }
  }

  if (input.modelsList?.ok && input.probeOk) {
    hints.push("Gemini 연결이 정상입니다.");
  }

  return hints;
}
