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
const MAX_MODEL_ATTEMPTS = 3;

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
      .filter((id) => id.includes("gemini") && !isBlockedGeminiModel(id))
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

  if (preferred && !isBlockedGeminiModel(preferred)) {
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

async function generateWithRestApi<T>(
  apiKey: string,
  modelName: string,
  systemInstruction: string,
  userPrompt: string,
  jsonMode: boolean
): Promise<T> {
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(modelName)}:generateContent?key=${encodeURIComponent(apiKey)}`;

  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    cache: "no-store",
    body: JSON.stringify({
      systemInstruction: { parts: [{ text: systemInstruction }] },
      contents: [{ role: "user", parts: [{ text: userPrompt }] }],
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
  jsonMode: boolean
): Promise<T> {
  const model = genAI.getGenerativeModel({
    model: modelName,
    systemInstruction,
    generationConfig: jsonMode
      ? { responseMimeType: "application/json", temperature: 0.1 }
      : { temperature: 0.1 },
  });

  const result = await model.generateContent(userPrompt);
  const rawText = result.response.text()?.trim();
  if (!rawText) {
    throw new Error("empty response");
  }

  return JSON.parse(extractJsonText(rawText)) as T;
}

export async function generateGeminiJson<T>(
  systemInstruction: string,
  userPrompt: string
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
    for (const [label, fn] of [
      ["rest/json", () => generateWithRestApi<T>(apiKey, modelName, systemInstruction, userPrompt, true)],
      ["sdk/json", () => {
        if (!genAI) throw new Error("sdk unavailable");
        return generateWithSdk<T>(genAI, modelName, systemInstruction, userPrompt, true);
      }],
    ] as const) {
      try {
        const data = await fn();
        return { ok: true, data, model: modelName };
      } catch (err) {
        const message = err instanceof Error ? err.message : String(err);
        errors.push(`${modelName}[${label}]: ${message.slice(0, 160)}`);
      }
    }
  }

  return { ok: false, error: errors.slice(0, 3).join(" | ") || "all models failed" };
}

export async function probeGeminiConnection(): Promise<{
  ok: boolean;
  model?: string;
  error?: string;
  modelsList?: GeminiModelsListResult;
  availableModels?: string[];
}> {
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
  const result = await generateGeminiJson<{ ping: string }>(
    'Respond JSON only: {"ping":"ok"}',
    "ping"
  );

  if (result.ok) {
    return { ok: true, model: result.model, modelsList, availableModels };
  }

  return {
    ok: false,
    error: result.error,
    modelsList,
    availableModels,
  };
}

export function buildGeminiStatusHints(input: {
  configured: boolean;
  modelsList: GeminiModelsListResult | null;
  probeOk: boolean;
  envModel: string | null;
}): string[] {
  const hints: string[] = [];

  if (!input.configured) {
    hints.push("Vercel Preview에 GEMINI_API_KEY를 추가하고 재배포하세요.");
    return hints;
  }

  if (input.envModel && isBlockedGeminiModel(input.envModel)) {
    hints.push(
      `GEMINI_MODEL=${input.envModel} 은 지원 종료되었습니다. 삭제하거나 ${GEMINI_DEFAULT_MODEL} 로 변경하세요.`
    );
  }

  if (input.modelsList && !input.modelsList.ok) {
    hints.push(input.modelsList.error ?? "API 키 검증 실패");
    hints.push("https://aistudio.google.com/apikey 에서 새 키를 발급해 Preview 환경 변수에 넣으세요.");
    return hints;
  }

  if (input.modelsList?.ok && !input.probeOk) {
    hints.push("키는 유효하지만 generateContent 호출이 실패했습니다. probe.error를 확인하세요.");
  }

  if (input.modelsList?.ok && input.probeOk) {
    hints.push("Gemini 연결이 정상입니다.");
  }

  return hints;
}
