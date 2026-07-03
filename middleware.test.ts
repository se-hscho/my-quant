import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { NextRequest } from "next/server";
import { middleware } from "./middleware";

describe("middleware AGENT_ROOT_REDIRECT", () => {
  const original = process.env.AGENT_ROOT_REDIRECT;

  beforeEach(() => {
    vi.unstubAllEnvs();
  });

  afterEach(() => {
    if (original === undefined) {
      delete process.env.AGENT_ROOT_REDIRECT;
    } else {
      process.env.AGENT_ROOT_REDIRECT = original;
    }
  });

  it("env 미설정 시 / 리다이렉트하지 않는다", () => {
    delete process.env.AGENT_ROOT_REDIRECT;
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
});
