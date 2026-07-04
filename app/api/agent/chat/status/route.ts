import { NextResponse } from "next/server";
import {
  GEMINI_DEFAULT_MODEL,
  buildGeminiStatusHints,
  getGeminiModelCandidates,
  isBlockedGeminiModel,
  isGeminiConfigured,
  probeGeminiConnection,
  verifyGeminiModelsList,
} from "@/services/ai/gemini";
import { getLlmRateLimitStatus } from "@/services/ai/llm-rate-limit";

export async function GET() {
  const configured = isGeminiConfigured();
  const envModel = process.env.GEMINI_MODEL?.trim() || null;
  const modelsList = configured ? await verifyGeminiModelsList() : null;
  const modelCandidates = configured && modelsList?.ok ? await getGeminiModelCandidates() : [];
  const probe = configured && modelsList?.ok ? await probeGeminiConnection() : null;

  const hints = buildGeminiStatusHints({
    configured,
    modelsList,
    probeOk: probe?.ok === true,
    probeError: probe?.error ?? null,
    envModel,
  });

  return NextResponse.json({
    geminiConfigured: configured,
    geminiModelEnv: envModel,
    geminiModelBlocked: envModel ? isBlockedGeminiModel(envModel) : false,
    defaultModel: GEMINI_DEFAULT_MODEL,
    effectiveModel: modelCandidates[0] ?? GEMINI_DEFAULT_MODEL,
    modelCandidates: modelCandidates.slice(0, 8),
    modelsList,
    probe,
    geminiActive: probe?.ok === true,
    llmRateLimit: getLlmRateLimitStatus(),
    hints,
  });
}
