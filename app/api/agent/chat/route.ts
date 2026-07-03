import { NextResponse } from "next/server";

export async function POST(request: Request) {
  let message = "";
  try {
    const body = (await request.json()) as { message?: string };
    message = body.message?.trim() ?? "";
  } catch {
    return NextResponse.json({ error: "invalid body" }, { status: 400 });
  }

  if (!message) {
    return NextResponse.json({ error: "message required" }, { status: 400 });
  }

  // Task 20: Gemini 연동 전 스텁 — 당일 브리핑 맥락 톤 유지
  const lower = message.toLowerCase();
  let reply =
    "당일 브리핑이 아직 생성되지 않았습니다. 보유를 등록하고 브리핑이 준비되면 안·섹터·티커 맥락으로 답변드립니다. (참고용)";

  if (/안\s*2|선점/.test(message)) {
    reply =
      "안 2(선점)는 유입 상위 섹터로 먼저 기울이는 검토안입니다. Follow(안 1)보다 변동성은 높을 수 있으며, 환전·매수 시점은 이벤트 전후를 함께 검토하는 것이 좋습니다. (참고용·투자 권유 아님)";
  } else if (/안\s*1|follow/i.test(lower)) {
    reply =
      "안 1(Follow)은 외국인·기관 수급 방향에 맞춰 점진적으로 비중을 조정하는 검토안입니다. (참고용)";
  } else if (/환전|usd|달러/i.test(lower)) {
    reply =
      "환전 시점은 환율 추세·금리 이벤트(FOMC 등)와 함께 검토합니다. USD 현금이 부족하면 playbook에서 환전 단계가 매수보다 앞에 옵니다. (참고용)";
  } else if (/etf|에너지|xle/i.test(lower)) {
    reply =
      "유입 상위 섹터의 대표 ETF·종목은 신규 추천 섹션에서 검토 톤으로 제안됩니다. 구체 티커는 당일 브리핑 생성 후 확인할 수 있습니다. (참고용)";
  }

  return NextResponse.json({ reply });
}
