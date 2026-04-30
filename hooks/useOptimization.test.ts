import { describe, it, expect, beforeEach, vi } from "vitest";
import { renderHook, act, waitFor } from "@testing-library/react";
import { useOptimization } from "./useOptimization";

const pushMock = vi.fn();

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: pushMock }),
}));

const sampleSeries = (closes: number[]) => ({
  ticker: "X",
  range: "10y",
  dates: closes.map((_, i) => `2024-01-${String(i + 1).padStart(2, "0")}`),
  closes,
});

describe("useOptimization", () => {
  beforeEach(() => {
    pushMock.mockReset();
    localStorage.clear();
    // 결정적 가격 — 두 자산
    const s1 = Array.from({ length: 300 }, (_, i) => 100 * (1 + 0.0003 * i));
    const s2 = Array.from({ length: 300 }, (_, i) => 100 * (1 + 0.0006 * i + 0.01 * Math.sin(i * 0.3)));
    vi.stubGlobal(
      "fetch",
      vi.fn((url: string) => {
        const ticker = new URL(url, "http://localhost").searchParams.get("ticker");
        return Promise.resolve({
          ok: true,
          json: async () =>
            ticker === "AAPL" ? sampleSeries(s1) : sampleSeries(s2),
        });
      })
    );
  });

  it("run() 호출 → fetching → computing → done 흐름이 진행되고 onComplete가 호출된다", async () => {
    const onComplete = vi.fn();
    const { result } = renderHook(() =>
      useOptimization({
        bundleId: "b",
        bundleName: "B",
        method: "max-sharpe",
        tickers: ["AAPL", "MSFT"],
        onComplete,
      })
    );

    expect(result.current.status).toBe("idle");
    await act(async () => {
      await result.current.run();
    });

    await waitFor(() => expect(onComplete).toHaveBeenCalled());
    expect(result.current.status).toBe("done");
    expect(onComplete).toHaveBeenCalledWith(expect.any(String));

    // localStorage에 quant:temp:<id>가 저장됐는지
    const id = onComplete.mock.calls[0][0] as string;
    expect(localStorage.getItem(`quant:temp:${id}`)).toBeTruthy();
  });

  it("fetch 실패 시 status='error', error 메시지 저장, retry로 재시도", async () => {
    let calls = 0;
    vi.stubGlobal(
      "fetch",
      vi.fn(() => {
        calls++;
        if (calls <= 2) {
          return Promise.resolve({
            ok: false,
            status: 502,
            json: async () => ({ error: "upstream" }),
          });
        }
        // 재시도 시 정상 응답
        const closes = Array.from({ length: 300 }, (_, i) => 100 * (1 + 0.0005 * i));
        return Promise.resolve({ ok: true, json: async () => sampleSeries(closes) });
      })
    );
    const onComplete = vi.fn();
    const { result } = renderHook(() =>
      useOptimization({
        bundleId: "b",
        bundleName: "B",
        method: "min-variance",
        tickers: ["AAPL", "MSFT"],
        onComplete,
      })
    );

    await act(async () => {
      await result.current.run();
    });
    await waitFor(() => expect(result.current.status).toBe("error"));
    expect(result.current.error).toMatch(/upstream/);

    await act(async () => {
      await result.current.retry();
    });
    await waitFor(() => expect(onComplete).toHaveBeenCalled());
  });
});
