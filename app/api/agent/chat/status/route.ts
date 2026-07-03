import { NextResponse } from "next/server";
import {
  GEMINI_DEFAULT_MODEL,
  getGeminiModelCandidates,
  isGeminiConfigured,
} from "@/services/ai/gemini";

export async function GET() {
  return NextResponse.json({
    geminiConfigured: isGeminiConfigured(),
    defaultModel: GEMINI_DEFAULT_MODEL,
    modelCandidates: getGeminiModelCandidates(),
  });
}
