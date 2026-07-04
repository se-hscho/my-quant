import { describe, expect, it, vi } from "vitest";
import { fetchKrxInvestorFlow } from "./krx-live";

vi.mock("@npmc_5/krxjs", () => ({
  Stock: {
    getTradingValueByDate: vi.fn(),
  },
}));

import { Stock } from "@npmc_5/krxjs";

describe("fetchKrxInvestorFlow", () => {
  it("외국인·기관 순매수를 조원으로 파싱한다", async () => {
    vi.mocked(Stock.getTradingValueByDate).mockResolvedValue({
      output: [
        { INVST_TP_NM: "외국인", NETBID_TRDVAL: "1500000000000" },
        { INVST_TP_NM: "기관", NETBID_TRDVAL: "-400000000000" },
      ],
    });

    const flow = await fetchKrxInvestorFlow("20250703");
    expect(flow).toEqual({
      dateYmd: "20250703",
      foreignNetBuyBn: 1.5,
      institutionNetBuyBn: -0.4,
    });
  });

  it("LOGOUT 응답이면 null", async () => {
    vi.mocked(Stock.getTradingValueByDate).mockResolvedValue("LOGOUT" as never);
    expect(await fetchKrxInvestorFlow("20250703")).toBeNull();
  });
});
