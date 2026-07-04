import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

function shouldRedirectRootToAgent(): boolean {
  return (
    process.env.AGENT_ROOT_REDIRECT === "true" ||
    process.env.VERCEL_ENV === "preview"
  );
}

/**
 * Preview 배포(`VERCEL_ENV=preview`) 또는 `AGENT_ROOT_REDIRECT=true` 일 때
 * `/` → `/agent` 리다이렉트. 프로덕션 퀀트 홈(`/`)은 env 미설정 시 유지.
 */
export function middleware(request: NextRequest) {
  if (!shouldRedirectRootToAgent()) {
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
