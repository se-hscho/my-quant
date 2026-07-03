import type { Briefing } from "@/services/briefing/types";
import {
  BriefingFetchError,
  parseBriefingApiError,
  type BriefingErrorInfo,
} from "@/types/agent-briefing";

async function readJsonSafe(res: Response): Promise<unknown> {
  try {
    return await res.json();
  } catch {
    return null;
  }
}

export async function fetchOrGenerateBriefing(
  snapshot: Parameters<typeof JSON.stringify>[0],
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

    const postRes = await fetch("/api/agent/briefing", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ snapshot, demo: isDemo }),
    });
    const postBody = await readJsonSafe(postRes);

    if (postRes.ok) {
      const briefing = postBody as Briefing;
      if (briefing?.status === "complete") return briefing;
      steps.push("POST: status !== complete");
      throw new BriefingFetchError({
        code: "BRIEFING_INCOMPLETE",
        message: "불완전한 브리핑 응답",
        detail: steps.join(" → "),
        httpStatus: postRes.status,
      });
    }

    const postErr = parseBriefingApiError(postBody, postRes.status, "GENERATION_FAILED");
    steps.push(`POST HTTP ${postRes.status}: [${postErr.code}] ${postErr.message}`);
    throw new BriefingFetchError({
      ...postErr,
      detail: [postErr.detail, steps.join(" → ")].filter(Boolean).join(" | "),
    });
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
