import { describe, expect, it, vi } from "vitest";

const SAMPLE_HTML = `
<table>
<td class="snapshot-td-label"><div>Recom</div></td>
<td class="snapshot-td2"><div class="snapshot-td-content">2.02</div></td>
<td class="snapshot-td-label"><div>Target Price</div></td>
<td class="snapshot-td2"><div class="snapshot-td-content">317.39</div></td>
</table>`;

describe("fetchFinvizPublicReports", () => {
  it("Finviz HTML에서 Recom을 파싱한다", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => ({
        ok: true,
        text: async () => SAMPLE_HTML,
      })) as unknown as typeof fetch
    );

    const { fetchFinvizPublicReports } = await import("./finviz-public");
    const rows = await fetchFinvizPublicReports(["AAPL"]);
    expect(rows).toHaveLength(1);
    expect(rows[0].broker).toBe("Finviz 컨센서스");
    expect(rows[0].rating).toBe("Buy");

    vi.unstubAllGlobals();
  });
});
