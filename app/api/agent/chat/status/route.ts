import { NextResponse } from "next/server";
import {
  GEMINI_DEFAULT_MODEL,
  getGeminiModelCandidates,
  isBlockedGeminiModel,
  isGeminiConfigured,
  probeGeminiConnection,
} from "@/services/ai/gemini";

export async function GET() {
  const configured = isGeminiConfigured();
  const envModel = process.env.GEMINI_MODEL?.trim() || null;
  const modelCandidates = configured ? await getGeminiModelCandidates() : [];

  const probe = configured ? await probeGeminiConnection() : null;

  return NextResponse.json({
    geminiConfigured: configured,
    geminiModelEnv: envModel,
    geminiModelBlocked: envModel ? isBlockedGeminiModel(envModel) : false,
    defaultModel: GEMINI_DEFAULT_MODEL,
    effectiveModel: modelCandidates[0] ?? GEMINI_DEFAULT_MODEL,
    modelCandidates: modelCandidates.slice(0, 10),
    probe,
    geminiActive: probe?.ok === true,
  });
}
