import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { BundleGallery } from "./BundleGallery";
import type { Bundle } from "@/types";

const bundles: Bundle[] = [
  { id: "a", name: "테마A", category: "테마형", description: "", stocks: [{ ticker: "X", name: "", description: "" }] },
  { id: "b", name: "팩터B", category: "팩터형", description: "", stocks: [{ ticker: "Y", name: "", description: "" }] },
  { id: "c", name: "테마C", category: "테마형", description: "", stocks: [{ ticker: "Z", name: "", description: "" }] },
];

describe("BundleGallery", () => {
  it("처음에는 모든 번들 카드를 표시한다", () => {
    render(<BundleGallery bundles={bundles} />);
    expect(screen.getByText("테마A")).toBeInTheDocument();
    expect(screen.getByText("팩터B")).toBeInTheDocument();
    expect(screen.getByText("테마C")).toBeInTheDocument();
  });

  it("카테고리 필터 클릭 시 해당 카테고리만 표시한다", async () => {
    const user = userEvent.setup();
    render(<BundleGallery bundles={bundles} />);
    await user.click(screen.getByRole("button", { name: "테마형" }));
    expect(screen.getByText("테마A")).toBeInTheDocument();
    expect(screen.getByText("테마C")).toBeInTheDocument();
    expect(screen.queryByText("팩터B")).not.toBeInTheDocument();
  });

  it("전체 필터 클릭 시 모든 카드를 다시 표시한다", async () => {
    const user = userEvent.setup();
    render(<BundleGallery bundles={bundles} />);
    await user.click(screen.getByRole("button", { name: "팩터형" }));
    await user.click(screen.getByRole("button", { name: "전체" }));
    expect(screen.getByText("테마A")).toBeInTheDocument();
    expect(screen.getByText("팩터B")).toBeInTheDocument();
    expect(screen.getByText("테마C")).toBeInTheDocument();
  });
});
