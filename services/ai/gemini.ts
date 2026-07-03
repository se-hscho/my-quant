import { GoogleGenerativeAI } from "@google/generative-ai";

const DEFAULT_MODEL = "gemini-2.0-flash";

let client: GoogleGenerativeAI | null = null;

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

export async function generateGeminiJson<T>(
  systemInstruction: string,
  userPrompt: string
): Promise<T | null> {
  const genAI = getClient();
  if (!genAI) return null;

  try {
    const model = genAI.getGenerativeModel({
      model: process.env.GEMINI_MODEL?.trim() || DEFAULT_MODEL,
      systemInstruction,
      generationConfig: {
        responseMimeType: "application/json",
        temperature: 0.1,
      },
    });

    const result = await model.generateContent(userPrompt);
    const text = result.response.text()?.trim();
    if (!text) return null;
    return JSON.parse(text) as T;
  } catch {
    return null;
  }
}
