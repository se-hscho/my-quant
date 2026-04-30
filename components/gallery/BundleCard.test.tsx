import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { act } from "react";
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

const customBundle: Bundle = {
  ...sample,
  id: "custom-1",
  name: "내 커스텀 번들",
  category: "내 전략",
  isCustom: true,
};

describe("BundleCard — 기본 번들", () => {
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

  it("기본 번들 카드에는 삭제 버튼이 없다", () => {
    render(<BundleCard bundle={sample} onDelete={vi.fn()} />);
    expect(screen.queryByRole("button", { name: /삭제/ })).not.toBeInTheDocument();
  });
});

describe("BundleCard — 사용자 번들", () => {
  it("isCustom 번들에는 삭제 버튼이 노출된다", () => {
    render(<BundleCard bundle={customBundle} onDelete={vi.fn()} />);
    expect(screen.getByRole("button", { name: /삭제/ })).toBeInTheDocument();
  });

  it("삭제 버튼 클릭 시 확인 Dialog가 나타난다", async () => {
    render(<BundleCard bundle={customBundle} onDelete={vi.fn()} />);
    await act(async () => {
      fireEvent.click(screen.getByRole("button", { name: /삭제/ }));
    });
    expect(screen.getByRole("alertdialog")).toBeInTheDocument();
  });

  it("확인 Dialog에서 취소하면 onDelete가 호출되지 않는다", async () => {
    const onDelete = vi.fn();
    render(<BundleCard bundle={customBundle} onDelete={onDelete} />);
    await act(async () => {
      fireEvent.click(screen.getByRole("button", { name: /삭제/ }));
    });
    await act(async () => {
      fireEvent.click(screen.getByRole("button", { name: /취소/ }));
    });
    expect(onDelete).not.toHaveBeenCalled();
  });

  it("확인 Dialog에서 삭제 확인하면 onDelete가 호출된다", async () => {
    const onDelete = vi.fn();
    render(<BundleCard bundle={customBundle} onDelete={onDelete} />);
    await act(async () => {
      fireEvent.click(screen.getByRole("button", { name: /삭제/ }));
    });
    await act(async () => {
      fireEvent.click(screen.getByRole("button", { name: /^삭제$/ }));
    });
    expect(onDelete).toHaveBeenCalledTimes(1);
  });

  it("이름과 카테고리가 카드에 표시된다", () => {
    render(<BundleCard bundle={customBundle} onDelete={vi.fn()} />);
    expect(screen.getByText("내 커스텀 번들")).toBeInTheDocument();
    expect(screen.getByText("내 전략")).toBeInTheDocument();
  });
});
