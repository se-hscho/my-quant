import type { HoldingsSnapshot } from "@/types/agent";
import type { Briefing } from "@/services/briefing/types";
import {
  BriefingFetchError,
  parseBriefingApiError,
  type BriefingErrorInfo,
} from "@/types/agent-briefing";
import {
  DEMO_PORTFOLIO_SNAPSHOT,
  resolveBriefingDate,
} from "@/lib/agent/demo-portfolio";
import { hasRegisteredHoldings, loadHoldingsSnapshot } from "@/lib/agent/holdings-storage";

async function readJsonSafe(res: Response): Promise<unknown> {
  try {
    return await res.json();
  } catch {
    return null;
  }
}

export interface ReportBriefingResult {
  briefing: Briefing;
  isDemo: boolean;
}

function resolveReportContext(isDemoQuery: boolean): {
  isDemo: boolean;
  snapshot: HoldingsSnapshot;
} {
  const registered = hasRegisteredHoldings();
  const isDemo = isDemoQuery || !registered;
  if (isDemo) {
    return { isDemo: true, snapshot: DEMO_PORTFOLIO_SNAPSHOT };
  }
  const snap = loadHoldingsSnapshot();
  if (!snap) {
    throw new BriefingFetchError({
      code: "INVALID_REQUEST",
      message: "보유 스냅샷을 찾을 수 없습니다",
      detail: "localStorage agent:holdings:v1 없음",
    });
  }
  return { isDemo: false, snapshot: snap };
}

async function postGenerateBriefing(
  snapshot: HoldingsSnapshot,
  isDemo: boolean,
  date?: string
): Promise<Briefing> {
  const postRes = await fetch("/api/agent/briefing", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ snapshot, demo: isDemo, date }),
  });
  const postBody = await readJsonSafe(postRes);

  if (postRes.ok) {
    const briefing = postBody as Briefing;
    if (briefing?.status === "complete") return briefing;
    throw new BriefingFetchError({
      code: "BRIEFING_INCOMPLETE",
      message: "불완전한 브리핑 응답",
      detail: `date=${date ?? "today"}`,
      httpStatus: postRes.status,
    });
  }

  throw new BriefingFetchError(
    parseBriefingApiError(postBody, postRes.status, "GENERATION_FAILED")
  );
}

export async function fetchOrGenerateBriefing(
  snapshot: HoldingsSnapshot,
  isDemo: boolean
): Promise<Briefing> {
  const steps: string[] = [];
  const demoQuery = isDemo ? "?demo=1" : "";

  try {
    const getRes = await fetch(`/api/agent/briefing${demoQuery}`, { cache: "no-store" });
    const getBody = await readJsonSafe(getRes);

    if (getRes.ok) {
      const data = getBody as {
        briefing?: Briefing | null;
        error?: BriefingErrorInfo;
      };
      if (data.briefing?.status === "complete") return data.briefing;
      if (data.error) {
        steps.push(`GET: [${data.error.code}] ${data.error.message}`);
      } else {
        steps.push("GET: complete 브리핑 없음");
      }
    } else {
      const err = parseBriefingApiError(getBody, getRes.status, "BRIEFING_GET_EMPTY");
      steps.push(`GET HTTP ${getRes.status}: [${err.code}] ${err.message}`);
    }

    try {
      return await postGenerateBriefing(snapshot, isDemo);
    } catch (postErr) {
      if (postErr instanceof BriefingFetchError) {
        throw new BriefingFetchError({
          ...postErr.info,
          detail: [postErr.info.detail, steps.join(" → ")].filter(Boolean).join(" | "),
        });
      }
      throw postErr;
    }
  } catch (e) {
    if (e instanceof BriefingFetchError) throw e;
    const msg = e instanceof Error ? e.message : String(e);
    throw new BriefingFetchError({
      code: "NETWORK_ERROR",
      message: "브리핑 API 네트워크 오류",
      detail: [msg, steps.join(" → ")].filter(Boolean).join(" | "),
    });
  }
}

export async function fetchBriefingByDate(
  date: string,
  isDemo: boolean
): Promise<Briefing> {
  const q = isDemo ? "?demo=1" : "";
  const res = await fetch(`/api/agent/briefing/${date}${q}`, { cache: "no-store" });
  const body = await readJsonSafe(res);

  if (!res.ok) {
    throw new BriefingFetchError(
      parseBriefingApiError(body, res.status, "BRIEFING_NOT_FOUND")
    );
  }

  const briefing = body as Briefing;
  if (briefing.status !== "complete") {
    throw new BriefingFetchError({
      code: "BRIEFING_INCOMPLETE",
      message: "불완전한 브리핑",
      detail: `date=${date}, status=${briefing.status ?? "unknown"}`,
      httpStatus: res.status,
    });
  }
  return briefing;
}

/** 상세 레포트: GET 실패 시 POST로 재생성 (Vercel cold instance 대응) */
export async function loadReportBriefing(
  rawDate: string,
  isDemoQuery: boolean
): Promise<ReportBriefingResult> {
  const date = resolveBriefingDate(rawDate);
  const { isDemo, snapshot } = resolveReportContext(isDemoQuery);
  const steps: string[] = [];

  try {
    const briefing = await fetchBriefingByDate(date, isDemo);
    return { briefing, isDemo };
  } catch (e) {
    if (e instanceof BriefingFetchError) {
      steps.push(`GET: [${e.info.code}] ${e.info.detail ?? e.info.message}`);
      if (
        e.info.code !== "BRIEFING_NOT_FOUND" &&
        e.info.code !== "BRIEFING_INCOMPLETE" &&
        e.info.code !== "BRIEFING_GET_EMPTY"
      ) {
        throw new BriefingFetchError({
          ...e.info,
          detail: steps.join(" → "),
        });
      }
    } else {
      steps.push(`GET: ${e instanceof Error ? e.message : String(e)}`);
    }
  }

  try {
    const briefing = await postGenerateBriefing(snapshot, isDemo, date);
    steps.push("POST: regenerated");
    return { briefing, isDemo };
  } catch (e) {
    if (e instanceof BriefingFetchError) {
      throw new BriefingFetchError({
        ...e.info,
        detail: [e.info.detail, steps.join(" → ")].filter(Boolean).join(" | "),
      });
    }
    throw e;
  }
}
