import { NextResponse } from "next/server";
import type { BriefingErrorInfo } from "@/types/agent-briefing";
import { mapGenerationErrorMessage } from "@/types/agent-briefing";

export function briefingErrorResponse(
  info: BriefingErrorInfo,
  status: number
): NextResponse {
  return NextResponse.json(
    {
      error: info.message,
      code: info.code,
      detail: info.detail,
    },
    { status }
  );
}

export function fromThrownError(e: unknown, status = 503): NextResponse {
  const msg = e instanceof Error ? e.message : "generation failed";
  const info = mapGenerationErrorMessage(msg);
  if (e instanceof Error && e.stack) {
    info.detail = [info.detail, e.stack.split("\n")[0]].filter(Boolean).join(" | ");
  }
  return briefingErrorResponse(info, status);
}
