/** 브리핑 API/UI 검증용 구조화 오류 */
export type BriefingErrorCode =
  | "BRIEFING_GET_EMPTY"
  | "FX_OR_PRICE_UNAVAILABLE"
  | "GENERATION_FAILED"
  | "DEMO_FALLBACK_FAILED"
  | "BRIEFING_NOT_FOUND"
  | "BRIEFING_INCOMPLETE"
  | "INVALID_REQUEST"
  | "NETWORK_ERROR"
  | "UNKNOWN";

export interface BriefingErrorInfo {
  code: BriefingErrorCode;
  message: string;
  detail?: string;
  httpStatus?: number;
}

export interface BriefingApiErrorBody {
  error: string;
  code?: BriefingErrorCode;
  detail?: string;
}

export class BriefingFetchError extends Error {
  readonly info: BriefingErrorInfo;

  constructor(info: BriefingErrorInfo) {
    super(info.message);
    this.name = "BriefingFetchError";
    this.info = info;
  }
}

export function parseBriefingApiError(
  body: unknown,
  httpStatus: number,
  fallbackCode: BriefingErrorCode = "UNKNOWN"
): BriefingErrorInfo {
  if (body && typeof body === "object" && "error" in body) {
    const b = body as BriefingApiErrorBody;
    return {
      code: b.code ?? fallbackCode,
      message: typeof b.error === "string" ? b.error : "브리핑 요청 실패",
      detail: b.detail,
      httpStatus,
    };
  }
  return {
    code: fallbackCode,
    message: `HTTP ${httpStatus}`,
    httpStatus,
  };
}

export function mapGenerationErrorMessage(message: string): BriefingErrorInfo {
  if (/FX or price/i.test(message)) {
    return {
      code: "FX_OR_PRICE_UNAVAILABLE",
      message: "시세·환율 데이터를 가져오지 못했습니다",
      detail: message,
    };
  }
  if (/forced fail/i.test(message)) {
    return {
      code: "GENERATION_FAILED",
      message: "브리핑 생성이 거부되었습니다",
      detail: message,
    };
  }
  return {
    code: "GENERATION_FAILED",
    message: "브리핑 생성 중 오류가 발생했습니다",
    detail: message,
  };
}
