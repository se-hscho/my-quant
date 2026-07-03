import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

/**
 * 포트폴리오 에이전트 Preview 전용: Vercel env `AGENT_ROOT_REDIRECT=true` 일 때
 * `/` → `/agent` 리다이렉트. 프로덕션 퀀트 홈(`/`)은 env 미설정 시 유지.
 */
export function middleware(request: NextRequest) {
  if (process.env.AGENT_ROOT_REDIRECT !== "true") {
    return NextResponse.next();
  }

  if (request.nextUrl.pathname === "/") {
    return NextResponse.redirect(new URL("/agent", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/"],
};
