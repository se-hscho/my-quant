import { NextResponse } from "next/server";
import { isGeminiConfigured } from "@/services/ai/gemini";
import {
  canInvokeLlm,
  getLlmRateLimitStatus,
  recordLlmCall,
} from "@/services/ai/llm-rate-limit";
import { extractHoldingsFromScreenshot } from "@/services/agent/holdings-import-vision";
import type { HoldingsImportApiError, HoldingsImportApiResponse } from "@/types/holdings-import";

const MAX_IMAGE_BYTES = 4 * 1024 * 1024;
const ALLOWED_MIME = new Set(["image/jpeg", "image/png", "image/webp", "image/heic", "image/heif"]);

function estimateBase64Bytes(base64: string): number {
  const padding = base64.endsWith("==") ? 2 : base64.endsWith("=") ? 1 : 0;
  return Math.floor((base64.length * 3) / 4) - padding;
}

export async function POST(request: Request) {
  let body: { imageBase64?: string; mimeType?: string };

  try {
    body = (await request.json()) as { imageBase64?: string; mimeType?: string };
  } catch {
    return NextResponse.json<HoldingsImportApiError>(
      { ok: false, error: "invalid body", code: "invalid_image" },
      { status: 400 }
    );
  }

  const mimeType = body.mimeType?.trim() ?? "";
  const imageBase64 = body.imageBase64?.trim() ?? "";

  if (!mimeType || !ALLOWED_MIME.has(mimeType)) {
    return NextResponse.json<HoldingsImportApiError>(
      { ok: false, error: "JPEG·PNG·WebP 이미지만 업로드할 수 있습니다.", code: "invalid_image" },
      { status: 400 }
    );
  }

  if (!imageBase64) {
    return NextResponse.json<HoldingsImportApiError>(
      { ok: false, error: "imageBase64 required", code: "invalid_image" },
      { status: 400 }
    );
  }

  if (estimateBase64Bytes(imageBase64) > MAX_IMAGE_BYTES) {
    return NextResponse.json<HoldingsImportApiError>(
      { ok: false, error: "이미지는 4MB 이하여야 합니다.", code: "invalid_image" },
      { status: 400 }
    );
  }

  if (!isGeminiConfigured()) {
    return NextResponse.json<HoldingsImportApiError>(
      {
        ok: false,
        error: "스크린샷 인식은 GEMINI_API_KEY 설정 후 사용할 수 있습니다.",
        code: "unconfigured",
      },
      { status: 503 }
    );
  }

  if (!canInvokeLlm()) {
    const { retryAfterMs } = getLlmRateLimitStatus();
    return NextResponse.json<HoldingsImportApiError>(
      {
        ok: false,
        error: `요청이 많습니다. ${Math.ceil(retryAfterMs / 1000)}초 후 다시 시도해 주세요.`,
        code: "rate_limited",
      },
      { status: 429 }
    );
  }

  recordLlmCall();

  const result = await extractHoldingsFromScreenshot({
    mimeType,
    base64: imageBase64,
  });

  if (!result.ok) {
    return NextResponse.json<HoldingsImportApiError>(
      {
        ok: false,
        error: result.error,
        code: result.code ?? "parse_failed",
      },
      { status: result.code === "parse_failed" ? 422 : 502 }
    );
  }

  return NextResponse.json<HoldingsImportApiResponse>({
    ok: true,
    result: result.result,
    model: result.model,
  });
}
