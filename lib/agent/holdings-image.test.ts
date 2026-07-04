import { describe, expect, it } from "vitest";
import { validateHoldingsImageFile, HOLDINGS_IMAGE_MAX_BYTES } from "./holdings-image";

describe("validateHoldingsImageFile", () => {
  it("이미지가 아니면 에러", () => {
    const file = new File(["x"], "doc.pdf", { type: "application/pdf" });
    expect(validateHoldingsImageFile(file)).toMatch(/이미지/);
  });

  it("4MB 초과면 에러", () => {
    const file = new File([new Uint8Array(HOLDINGS_IMAGE_MAX_BYTES + 1)], "a.png", {
      type: "image/png",
    });
    expect(validateHoldingsImageFile(file)).toMatch(/4MB/);
  });

  it("유효한 png는 null", () => {
    const file = new File(["x"], "a.png", { type: "image/png" });
    expect(validateHoldingsImageFile(file)).toBeNull();
  });
});
