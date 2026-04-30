import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import { act } from "react";
import { saveCustomBundle } from "@/lib/custom-bundles";
import { BundleDetailView } from "./BundleDetailView";

vi.mock("next/navigation", () => ({
  notFound: vi.fn(),
}));

vi.mock("@/hooks/useOptimization", () => ({
  useOptimization: () => ({ status: "idle", run: vi.fn(), retry: vi.fn(), message: "" }),
}));

const { notFound } = await import("next/navigation");

beforeEach(() => {
  localStorage.clear();
  vi.clearAllMocks();
});

describe("BundleDetailView — custom bundle", () => {
  it("custom bundle id를 전달하면 해당 번들 이름이 렌더링된다", async () => {
    saveCustomBundle({
      id: "my-custom-1",
      name: "내 테스트 번들",
      category: "내 전략",
      description: "설명",
      stocks: [
        { ticker: "AAPL", name: "Apple", description: "" },
        { ticker: "MSFT", name: "Microsoft", description: "" },
      ],
      isCustom: true,
    });

    await act(async () => {
      render(<BundleDetailView bundleId="my-custom-1" />);
    });

    expect(screen.getByText("내 테스트 번들")).toBeInTheDocument();
  });

  it("static bundle id를 전달하면 static 번들 이름이 렌더링된다", async () => {
    const { BUNDLES } = await import("@/config/bundles");
    const first = BUNDLES[0];

    await act(async () => {
      render(<BundleDetailView bundleId={first.id} />);
    });

    expect(screen.getByText(first.name)).toBeInTheDocument();
  });

  it("존재하지 않는 id를 전달하면 로딩 완료 후 notFound()가 호출된다", async () => {
    await act(async () => {
      render(<BundleDetailView bundleId="does-not-exist" />);
    });

    expect(notFound).toHaveBeenCalled();
  });
});
