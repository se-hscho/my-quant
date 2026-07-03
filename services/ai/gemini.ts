import { GoogleGenerativeAI } from "@google/generative-ai";

/** Google AI Studio 기준 안정 모델 (2026). 1.5-flash 계열은 404. */
export const GEMINI_DEFAULT_MODEL = "gemini-2.5-flash";

const DEFAULT_MODELS = [
  GEMINI_DEFAULT_MODEL,
  "gemini-2.5-flash-lite",
  "gemini-2.0-flash",
  "gemini-3.5-flash",
  "gemini-3.1-flash-lite",
] as const;

let client: GoogleGenerativeAI | null = null;

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

export function getGeminiModelCandidates(): string[] {
  const preferred = process.env.GEMINI_MODEL?.trim();
  const list = preferred ? [preferred, ...DEFAULT_MODELS] : [...DEFAULT_MODELS];
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

  for (const modelName of getGeminiModelCandidates()) {
    for (const jsonMode of [true, false] as const) {
      try {
        const data = await generateWithModel<T>(
          genAI,
          modelName,
          systemInstruction,
          userPrompt,
          jsonMode
        );
        return { ok: true, data, model: modelName };
      } catch (err) {
        const message = err instanceof Error ? err.message : String(err);
        const tag = jsonMode ? "json" : "text";
        errors.push(`${modelName}(${tag}): ${message}`);
        console.error(`[gemini] ${modelName}(${tag}) failed:`, message);
      }
    }
  }

  return { ok: false, error: errors.join(" | ") || "all models failed" };
}
