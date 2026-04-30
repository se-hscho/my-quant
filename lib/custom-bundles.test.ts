import { describe, it, expect, beforeEach } from "vitest";
import {
  loadCustomBundles,
  saveCustomBundle,
  deleteCustomBundle,
  getCustomBundleById,
} from "./custom-bundles";
import type { Bundle } from "@/types";

const makeBundle = (id: string, category = "테마형"): Bundle => ({
  id,
  name: `번들 ${id}`,
  category,
  description: "테스트",
  stocks: [
    { ticker: "AAPL", name: "", description: "" },
    { ticker: "MSFT", name: "", description: "" },
  ],
  isCustom: true,
});

beforeEach(() => {
  localStorage.clear();
});

describe("loadCustomBundles", () => {
  it("저장된 번들이 없으면 빈 배열을 반환한다", () => {
    expect(loadCustomBundles()).toEqual([]);
  });

  it("저장된 번들 목록을 반환한다", () => {
    saveCustomBundle(makeBundle("a"));
    saveCustomBundle(makeBundle("b"));
    const list = loadCustomBundles();
    expect(list).toHaveLength(2);
    expect(list.map((b) => b.id)).toContain("a");
    expect(list.map((b) => b.id)).toContain("b");
  });
});

describe("saveCustomBundle", () => {
  it("저장된 번들은 isCustom: true를 가진다", () => {
    saveCustomBundle(makeBundle("x"));
    const list = loadCustomBundles();
    expect(list[0].isCustom).toBe(true);
  });

  it("같은 id로 재저장해도 중복되지 않는다", () => {
    saveCustomBundle(makeBundle("dup"));
    saveCustomBundle(makeBundle("dup"));
    expect(loadCustomBundles()).toHaveLength(1);
  });
});

describe("deleteCustomBundle", () => {
  it("해당 id의 번들을 삭제한다", () => {
    saveCustomBundle(makeBundle("del"));
    saveCustomBundle(makeBundle("keep"));
    deleteCustomBundle("del");
    const list = loadCustomBundles();
    expect(list).toHaveLength(1);
    expect(list[0].id).toBe("keep");
  });

  it("isCustom이 없는(기본 번들) id를 전달해도 목록이 변경되지 않는다", () => {
    saveCustomBundle(makeBundle("custom1"));
    // 기본 번들 id인 척 — isCustom 없는 번들을 직접 localStorage에 삽입
    const key = "quant:bundles:v1";
    const raw = localStorage.getItem(key)!;
    const arr = JSON.parse(raw);
    arr.push({ id: "static-bundle", name: "정적", category: "테마형", description: "", stocks: [] });
    localStorage.setItem(key, JSON.stringify(arr));

    deleteCustomBundle("static-bundle");
    const list = loadCustomBundles();
    // isCustom이 없는 항목은 삭제되지 않아야 한다
    expect(list.some((b) => b.id === "static-bundle")).toBe(true);
    expect(list.some((b) => b.id === "custom1")).toBe(true);
  });
});

describe("getCustomBundleById", () => {
  it("저장된 번들을 반환한다", () => {
    saveCustomBundle(makeBundle("find-me", "내 전략"));
    const found = getCustomBundleById("find-me");
    expect(found).toBeDefined();
    expect(found?.name).toBe("번들 find-me");
    expect(found?.category).toBe("내 전략");
  });

  it("없는 id이면 undefined를 반환한다", () => {
    expect(getCustomBundleById("ghost")).toBeUndefined();
  });
});
