import { GoogleGenerativeAI } from "@google/generative-ai";

/** Google AI Studio 권장 기본 모델 */
export const GEMINI_DEFAULT_MODEL = "gemini-2.5-flash";

const STATIC_MODELS = [
  GEMINI_DEFAULT_MODEL,
  "gemini-2.5-flash-lite",
  "gemini-2.0-flash",
  "gemini-3.5-flash",
  "gemini-3.1-flash-lite",
  "gemini-2.0-flash-lite",
] as const;

/** API에서 제거된 모델 — GEMINI_MODEL에 있어도 시도하지 않음 */
const BLOCKED_MODEL_PREFIXES = ["gemini-1.5", "gemini-1.0"];

let client: GoogleGenerativeAI | null = null;
let cachedApiModels: { ids: string[]; fetchedAt: number } | null = null;
const API_MODELS_TTL_MS = 10 * 60 * 1000;

export type GeminiJsonResult<T> =
  | { ok: true; data: T; model: string }
  | { ok: false; error: string };

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
  if (id.includes("3.5-flash")) return 3;
  if (id.includes("3.1-flash-lite")) return 4;
  if (id.includes("flash")) return 5;
  return 10;
}

export async function fetchAvailableGeminiModelIds(): Promise<string[]> {
  const apiKey = getGeminiApiKey();
  if (!apiKey) return [];

  const now = Date.now();
  if (cachedApiModels && now - cachedApiModels.fetchedAt < API_MODELS_TTL_MS) {
    return cachedApiModels.ids;
  }

  try {
    const res = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models?key=${encodeURIComponent(apiKey)}`,
      { cache: "no-store" }
    );
    if (!res.ok) return [];

    const body = (await res.json()) as {
      models?: Array<{
        name?: string;
        supportedGenerationMethods?: string[];
      }>;
    };

    const ids = (body.models ?? [])
      .filter((m) => m.supportedGenerationMethods?.includes("generateContent"))
      .map((m) => (m.name ?? "").replace(/^models\//, ""))
      .filter((id) => id.includes("gemini") && !isBlockedGeminiModel(id))
      .toSorted((a, b) => rankModel(a) - rankModel(b));

    cachedApiModels = { ids, fetchedAt: now };
    return ids;
  } catch {
    return [];
  }
}

export async function getGeminiModelCandidates(): Promise<string[]> {
  const preferred = process.env.GEMINI_MODEL?.trim();
  const fromApi = await fetchAvailableGeminiModelIds();

  const ordered: string[] = [];

  if (preferred && !isBlockedGeminiModel(preferred)) {
    ordered.push(preferred);
  }

  for (const id of STATIC_MODELS) {
    ordered.push(id);
  }

  for (const id of fromApi) {
    ordered.push(id);
  }

  return [...new Set(ordered.filter((id) => id && !isBlockedGeminiModel(id)))];
}

/** @deprecated 비동기 getGeminiModelCandidates 사용 */
export function getGeminiModelCandidatesSync(): string[] {
  const preferred = process.env.GEMINI_MODEL?.trim();
  const list =
    preferred && !isBlockedGeminiModel(preferred)
      ? [preferred, ...STATIC_MODELS]
      : [...STATIC_MODELS];
  return [...new Set(list)];
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

async function generateWithModel<T>(
  genAI: GoogleGenerativeAI,
  modelName: string,
  systemInstruction: string,
  userPrompt: string,
  jsonMode: boolean,
  inlineSystem: boolean
): Promise<T> {
  const prompt = inlineSystem
    ? `${systemInstruction}\n\n---\n${userPrompt}\n\nJSON만 출력하세요.`
    : userPrompt;

  const model = genAI.getGenerativeModel({
    model: modelName,
    ...(inlineSystem ? {} : { systemInstruction }),
    generationConfig: jsonMode
      ? { responseMimeType: "application/json", temperature: 0.1 }
      : { temperature: 0.1 },
  });

  const result = await model.generateContent(prompt);
  const rawText = result.response.text()?.trim();
  if (!rawText) {
    throw new Error("empty response");
  }

  const jsonText = extractJsonText(rawText);
  return JSON.parse(jsonText) as T;
}

export async function generateGeminiJson<T>(
  systemInstruction: string,
  userPrompt: string
): Promise<GeminiJsonResult<T>> {
  const genAI = getClient();
  if (!genAI) {
    return { ok: false, error: "GEMINI_API_KEY not configured" };
  }

  const errors: string[] = [];
  const models = await getGeminiModelCandidates();

  if (models.length === 0) {
    return { ok: false, error: "no model candidates" };
  }

  for (const modelName of models) {
    for (const inlineSystem of [false, true] as const) {
      for (const jsonMode of [true, false] as const) {
        try {
          const data = await generateWithModel<T>(
            genAI,
            modelName,
            systemInstruction,
            userPrompt,
            jsonMode,
            inlineSystem
          );
          return { ok: true, data, model: modelName };
        } catch (err) {
          const message = err instanceof Error ? err.message : String(err);
          const tag = `${inlineSystem ? "inline" : "sys"}/${jsonMode ? "json" : "text"}`;
          errors.push(`${modelName}[${tag}]: ${message.slice(0, 160)}`);
        }
      }
    }
  }

  return { ok: false, error: errors.slice(0, 4).join(" | ") || "all models failed" };
}

export async function probeGeminiConnection(): Promise<{
  ok: boolean;
  model?: string;
  error?: string;
  availableModels?: string[];
}> {
  const availableModels = await fetchAvailableGeminiModelIds();
  const result = await generateGeminiJson<{ ping: string }>(
    'Respond JSON only: {"ping":"ok"}',
    "ping"
  );
  if (result.ok) {
    return { ok: true, model: result.model, availableModels: availableModels.slice(0, 8) };
  }
  return {
    ok: false,
    error: result.error,
    availableModels: availableModels.slice(0, 8),
  };
}
