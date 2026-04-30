import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import { act } from "react";
import userEvent from "@testing-library/user-event";
import { BundleGallery } from "./BundleGallery";
import { saveCustomBundle } from "@/lib/custom-bundles";
import type { Bundle } from "@/types";

const bundles: Bundle[] = [
  { id: "a", name: "테마A", category: "테마형", description: "", stocks: [{ ticker: "X", name: "", description: "" }] },
  { id: "b", name: "팩터B", category: "팩터형", description: "", stocks: [{ ticker: "Y", name: "", description: "" }] },
  { id: "c", name: "테마C", category: "테마형", description: "", stocks: [{ ticker: "Z", name: "", description: "" }] },
];

beforeEach(() => localStorage.clear());

describe("BundleGallery — 기본 동작", () => {
  it("처음에는 모든 번들 카드를 표시한다", async () => {
    await act(async () => { render(<BundleGallery bundles={bundles} />); });
    expect(screen.getByText("테마A")).toBeInTheDocument();
    expect(screen.getByText("팩터B")).toBeInTheDocument();
    expect(screen.getByText("테마C")).toBeInTheDocument();
  });

  it("카테고리 필터 클릭 시 해당 카테고리만 표시한다", async () => {
    const user = userEvent.setup();
    await act(async () => { render(<BundleGallery bundles={bundles} />); });
    await user.click(screen.getByRole("button", { name: "테마형" }));
    expect(screen.getByText("테마A")).toBeInTheDocument();
    expect(screen.getByText("테마C")).toBeInTheDocument();
    expect(screen.queryByText("팩터B")).not.toBeInTheDocument();
  });

  it("전체 필터 클릭 시 모든 카드를 다시 표시한다", async () => {
    const user = userEvent.setup();
    await act(async () => { render(<BundleGallery bundles={bundles} />); });
    await user.click(screen.getByRole("button", { name: "팩터형" }));
    await user.click(screen.getByRole("button", { name: "전체" }));
    expect(screen.getByText("테마A")).toBeInTheDocument();
    expect(screen.getByText("팩터B")).toBeInTheDocument();
    expect(screen.getByText("테마C")).toBeInTheDocument();
  });

  it('"번들 추가하기" 버튼이 존재한다', async () => {
    await act(async () => { render(<BundleGallery bundles={bundles} />); });
    expect(screen.getByRole("button", { name: /번들 추가하기/ })).toBeInTheDocument();
  });
});

describe("BundleGallery — custom bundle", () => {
  it("localStorage의 custom bundle이 갤러리에 표시된다", async () => {
    saveCustomBundle({
      id: "my-1", name: "내 번들", category: "내 전략",
      description: "", stocks: [], isCustom: true,
    });
    await act(async () => { render(<BundleGallery bundles={bundles} />); });
    expect(screen.getByText("내 번들")).toBeInTheDocument();
  });

  it("custom bundle의 카테고리가 신규이면 필터 버튼이 추가된다", async () => {
    saveCustomBundle({
      id: "my-2", name: "전략 번들", category: "내 전략",
      description: "", stocks: [], isCustom: true,
    });
    await act(async () => { render(<BundleGallery bundles={bundles} />); });
    expect(screen.getByRole("button", { name: "내 전략" })).toBeInTheDocument();
  });
});
