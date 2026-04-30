import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { BundleCard } from "./BundleCard";
import type { Bundle } from "@/types";

const sample: Bundle = {
  id: "test",
  name: "테스트 번들",
  category: "테마형",
  description: "한 줄 설명",
  stocks: [
    { ticker: "AAA", name: "A Co", description: "" },
    { ticker: "BBB", name: "B Co", description: "" },
    { ticker: "CCC", name: "C Co", description: "" },
  ],
};

describe("BundleCard", () => {
  it("번들 이름·카테고리·종목 수·설명을 표시한다", () => {
    render(<BundleCard bundle={sample} />);
    expect(screen.getByText("테스트 번들")).toBeInTheDocument();
    expect(screen.getByText("테마형")).toBeInTheDocument();
    expect(screen.getByText("3개 종목")).toBeInTheDocument();
    expect(screen.getByText("한 줄 설명")).toBeInTheDocument();
  });

  it("번들 상세 페이지로 가는 링크를 가진다", () => {
    render(<BundleCard bundle={sample} />);
    const link = screen.getByRole("link", { name: /선택/ });
    expect(link).toHaveAttribute("href", "/bundle/test");
  });
});
