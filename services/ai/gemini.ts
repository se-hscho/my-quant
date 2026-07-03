import { GoogleGenerativeAI } from "@google/generative-ai";

const DEFAULT_MODELS = [
  "gemini-2.0-flash",
  "gemini-1.5-flash",
  "gemini-2.0-flash-lite",
  "gemini-1.5-flash-8b",
] as const;

let client: GoogleGenerativeAI | null = null;

export type GeminiJsonResult<T> =
  | { ok: true; data: T; model: string }
  | { ok: false; error: string };

export function getGeminiApiKey(): string | null {
  const key = process.env.GEMINI_API_KEY?.trim();
  return key || null;
}

export function isGeminiConfigured(): boolean {
  return getGeminiApiKey() !== null;
}

function getClient(): GoogleGenerativeAI | null {
  const apiKey = getGeminiApiKey();
  if (!apiKey) return null;
  if (!client) {
    client = new GoogleGenerativeAI(apiKey);
  }
  return client;
}

function modelCandidates(): string[] {
  const preferred = process.env.GEMINI_MODEL?.trim();
  const list = preferred ? [preferred, ...DEFAULT_MODELS] : [...DEFAULT_MODELS];
  return [...new Set(list)];
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

export async function generateGeminiJson<T>(
  systemInstruction: string,
  userPrompt: string
): Promise<GeminiJsonResult<T>> {
  const genAI = getClient();
  if (!genAI) {
    return { ok: false, error: "GEMINI_API_KEY not configured" };
  }

  const errors: string[] = [];

  for (const modelName of modelCandidates()) {
    try {
      const model = genAI.getGenerativeModel({
        model: modelName,
        systemInstruction,
        generationConfig: {
          responseMimeType: "application/json",
          temperature: 0.1,
        },
      });

      const result = await model.generateContent(userPrompt);
      const rawText = result.response.text()?.trim();
      if (!rawText) {
        errors.push(`${modelName}: empty response`);
        continue;
      }

      const jsonText = extractJsonText(rawText);
      const data = JSON.parse(jsonText) as T;
      return { ok: true, data, model: modelName };
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      errors.push(`${modelName}: ${message}`);
      console.error(`[gemini] ${modelName} failed:`, message);
    }
  }

  return { ok: false, error: errors.join(" | ") || "all models failed" };
}

/** @deprecated generateGeminiJson 사용 */
export async function generateGeminiJsonLegacy<T>(
  systemInstruction: string,
  userPrompt: string
): Promise<T | null> {
  const result = await generateGeminiJson<T>(systemInstruction, userPrompt);
  return result.ok ? result.data : null;
}
