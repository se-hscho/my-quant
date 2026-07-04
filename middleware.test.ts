import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { NextRequest } from "next/server";
import { middleware } from "./middleware";

describe("middleware AGENT_ROOT_REDIRECT", () => {
  const originalRedirect = process.env.AGENT_ROOT_REDIRECT;
  const originalVercelEnv = process.env.VERCEL_ENV;

  beforeEach(() => {
    vi.unstubAllEnvs();
  });

  afterEach(() => {
    if (originalRedirect === undefined) {
      delete process.env.AGENT_ROOT_REDIRECT;
    } else {
      process.env.AGENT_ROOT_REDIRECT = originalRedirect;
    }
    if (originalVercelEnv === undefined) {
      delete process.env.VERCEL_ENV;
    } else {
      process.env.VERCEL_ENV = originalVercelEnv;
    }
  });

  it("env 미설정·production 이면 / 리다이렉트하지 않는다", () => {
    delete process.env.AGENT_ROOT_REDIRECT;
    process.env.VERCEL_ENV = "production";
    const req = new NextRequest("https://example.com/");
    const res = middleware(req);
    expect(res.status).not.toBe(307);
    expect(res.headers.get("location")).toBeNull();
  });

  it("AGENT_ROOT_REDIRECT=true 이면 / → /agent", () => {
    vi.stubEnv("AGENT_ROOT_REDIRECT", "true");
    const req = new NextRequest("https://example.com/");
    const res = middleware(req);
    expect(res.status).toBe(307);
    expect(res.headers.get("location")).toBe("https://example.com/agent");
  });

  it("VERCEL_ENV=preview 이면 / → /agent", () => {
    vi.stubEnv("VERCEL_ENV", "preview");
    const req = new NextRequest("https://example.com/");
    const res = middleware(req);
    expect(res.status).toBe(307);
    expect(res.headers.get("location")).toBe("https://example.com/agent");
  });
});
