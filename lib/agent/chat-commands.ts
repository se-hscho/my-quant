import type { AssetType, Currency, HoldingsSnapshot } from "@/types/agent";
import type {
  CashField,
  ChatAction,
  ChatCommandResult,
  ParseChatOptions,
} from "@/types/agent-chat";
import { KNOWN_TICKER_CLASSIFICATIONS } from "@/config/agent";
import { ASSET_TYPE_LABELS, formatCashAmount } from "./holdings-display";
import { parseKoreanAmount } from "./korean-amount";
import { normalizeNaturalLanguageCommand } from "./ticker-aliases";

export { parseKoreanAmount } from "./korean-amount";
export { normalizeNaturalLanguageCommand } from "./ticker-aliases";

const REGISTER =
  /(?:등록|추가|넣어|설정|업데이트|변경)/;
const REMOVE = /(?:삭제|제거|빼|취소)/;
const LIST = /(?:보유\s*목록|내\s*자산|보유\s*보여|보유\s*알려|목록\s*보여)/;
const HELP = /^(?:도움말|help|명령|사용법)\s*$/i;

/** 조회·도움말·QA — LLM 없이 규칙 파서만 사용 */
export function isReadOnlyChatMessage(message: string): boolean {
  const text = message.trim();
  if (!text) return false;
  if (HELP.test(text)) return true;
  if (LIST.test(text)) return true;
  if (/안\s*2|선점/.test(text)) return true;
  if (/안\s*1|follow/i.test(text)) return true;
  if (/환전|usd|달러/i.test(text) && !/(등록|추가|샀|구매|매수|삭제|제거)/.test(text)) {
    return true;
  }
  return false;
}

const HOLDING_PATTERN =
  /(?:자산|종목)?\s*([A-Z0-9][A-Z0-9.\-]{0,11})\s+(\d+(?:\.\d+)?)\s*(?:주|개|shares?)?/i;

const HOLDING_PATTERN_ALT =
  /([A-Z0-9][A-Z0-9.\-]{0,11})\s+(\d+(?:\.\d+)?)\s*(?:주|개)?\s*(?:등록|추가)/i;

const CASH_PATTERN =
  /(KRW|USD|JPY|원화?|달러|엔|₩|\$|¥)\s*(?:현금|캐시)?\s*([\d,일이삼사오육칠팔구십백천만억]+(?:\.\d+)?(?:만|억|원)?)/i;

const CASH_KR_LEADING =
  /현금\s+([\d,일이삼사오육칠팔구십백천만억]+(?:\.\d+)?(?:만|억|원)?)\s*(?:추가|등록|넣|설정)/i;

const CASH_KR_TRAILING =
  /([\d,일이삼사오육칠팔구십백천만억]+(?:\.\d+)?(?:만|억|원)?)\s*(?:원\s*)?현금\s*(?:추가|등록|넣|설정)/i;

const REMOVE_PATTERN = /([A-Z0-9][A-Z0-9.\-]{0,11})\s*(?:삭제|제거)/i;

const RESERVED_TICKER_TOKENS = new Set([
  "ETF",
  "USD",
  "KRW",
  "JPY",
  "STOCK",
  "BOND",
  "GOLD",
]);

function isValidTickerSymbol(raw: string): boolean {
  const ticker = raw.trim().toUpperCase();
  if (!ticker || RESERVED_TICKER_TOKENS.has(ticker)) return false;
  if (/^\d+$/.test(ticker)) return false;
  return /[A-Z]/.test(ticker) || /\d{6}\.[A-Z]{2}/.test(ticker);
}

function defaultCashField(message: string): CashField {
  const inferred = parseCashField(message);
  if (inferred) return inferred;
  if (/usd|달러|\$/i.test(message)) return "usd";
  if (/jpy|엔|¥/i.test(message)) return "jpy";
  return "krw";
}

function parseCashField(token: string): CashField | null {
  const t = token.toLowerCase();
  if (/krw|원|₩/.test(t)) return "krw";
  if (/usd|달러|\$/.test(t)) return "usd";
  if (/jpy|엔|¥/.test(t)) return "jpy";
  return null;
}

function parseAssetType(text: string): AssetType {
  const t = text.toLowerCase();
  if (/채권|bond/.test(t)) return "bond_etf";
  if (/금|gold/.test(t)) return "gold_etf";
  if (/\betf\b/.test(t)) return "etf";
  if (/주식|stock/.test(t)) return "stock";
  return "stock";
}

function parseCurrency(text: string, ticker: string): Currency {
  const t = text.toLowerCase();
  if (/krw|원화|원\b|₩/.test(t)) return "KRW";
  if (/usd|달러|\$/.test(t)) return "USD";
  if (/jpy|엔화|엔\b|¥/.test(t)) return "JPY";
  if (ticker.endsWith(".KS") || ticker.endsWith(".KQ")) return "KRW";
  if (ticker.endsWith(".T")) return "JPY";
  return "USD";
}

function normalizeTicker(raw: string): string {
  return raw.trim().toUpperCase();
}

function formatSnapshotSummary(snapshot: HoldingsSnapshot): string {
  const lines: string[] = [];
  if (snapshot.holdings.length === 0) {
    lines.push("등록된 종목이 없습니다.");
  } else {
    for (const h of snapshot.holdings) {
      lines.push(
        `• ${h.ticker} ${h.quantity} (${ASSET_TYPE_LABELS[h.assetType]}, ${h.currency})`
      );
    }
  }
  lines.push(
    `현금: KRW ${formatCashAmount("KRW", snapshot.cash.krw)}, USD ${formatCashAmount("USD", snapshot.cash.usd)}, JPY ${formatCashAmount("JPY", snapshot.cash.jpy)}`
  );
  return lines.join("\n");
}

function helpReply(): string {
  return [
    "다음처럼 입력하면 보유 편집이 실행됩니다. (참고용)",
    "• 종목: `SOXX 10주 등록` / `자산 005930.KS 50주 등록`",
    "• 유형·통화: `AAPL 10 etf usd 등록`",
    "• 현금: `KRW 현금 5000만 등록` / `현금 오만원 추가` / `usd 현금 12000 추가`",
    "• 삭제: `SOXX 삭제`",
    "• 조회: `보유 목록 보여줘`",
    "브리핑·시나리오 질문도 이어서 할 수 있습니다.",
  ].join("\n");
}

function defaultAssetType(ticker: string, text: string): AssetType {
  const fromText = parseAssetType(text);
  if (fromText !== "stock" || /\betf\b|채권|bond|금|gold/.test(text.toLowerCase())) {
    return fromText;
  }
  const known = KNOWN_TICKER_CLASSIFICATIONS[ticker];
  if (!known) return fromText;
  if (known.sector === "bonds") return "bond_etf";
  if (known.sector === "gold") return "gold_etf";
  if (ticker.endsWith(".KS") || ticker.endsWith(".KQ") || ticker.endsWith(".T")) {
    return "stock";
  }
  return "etf";
}

function tryParseHolding(message: string): ChatAction | null {
  if (!REGISTER.test(message) && !/등록|추가/.test(message)) return null;

  const match =
    message.match(HOLDING_PATTERN) ?? message.match(HOLDING_PATTERN_ALT);
  if (!match) return null;

  const ticker = normalizeTicker(match[1]);
  const quantity = parseFloat(match[2]);
  if (!isValidTickerSymbol(ticker) || quantity <= 0) return null;

  return {
    type: "add_holding",
    ticker,
    quantity,
    assetType: defaultAssetType(ticker, message),
    currency: parseCurrency(message, ticker),
  };
}

function tryParseCash(message: string): ChatAction | null {
  if (!REGISTER.test(message)) return null;

  const match = message.match(CASH_PATTERN);
  if (match) {
    const field = parseCashField(match[1]) ?? defaultCashField(message);
    const amount = parseKoreanAmount(match[2]);
    if (amount > 0) {
      return { type: "set_cash", field, amount };
    }
  }

  const krMatch =
    message.match(CASH_KR_LEADING) ?? message.match(CASH_KR_TRAILING);
  if (krMatch) {
    const amount = parseKoreanAmount(krMatch[1]);
    if (amount > 0) {
      return { type: "set_cash", field: defaultCashField(message), amount };
    }
  }

  return null;
}

function tryParseRemove(message: string): ChatAction | null {
  const match = message.match(REMOVE_PATTERN);
  if (!match) return null;
  return { type: "remove_holding", ticker: normalizeTicker(match[1]) };
}

function tryQaReply(message: string): string | null {
  const lower = message.toLowerCase();
  if (/안\s*2|선점/.test(message)) {
    return "안 2(선점)는 유입 상위 섹터로 먼저 기울이는 검토안입니다. (참고용·투자 권유 아님)";
  }
  if (/안\s*1|follow/i.test(lower)) {
    return "안 1(Follow)은 수급 방향에 맞춰 점진 조정하는 검토안입니다. (참고용)";
  }
  if (/환전|usd|달러/i.test(lower)) {
    return "환전 시점은 환율 추세·FOMC 등 이벤트와 함께 검토합니다. (참고용)";
  }
  return null;
}

export function parseChatCommand(options: ParseChatOptions): ChatCommandResult {
  const message = normalizeNaturalLanguageCommand(options.message.trim());
  if (!message) {
    return { reply: "질문을 입력해 주세요.", actions: [] };
  }

  if (HELP.test(message)) {
    return { reply: helpReply(), actions: [] };
  }

  if (LIST.test(message)) {
    const snap = options.snapshot;
    if (!snap || (!snap.holdings.length && !snap.cash.krw && !snap.cash.usd && !snap.cash.jpy)) {
      return {
        reply: "등록된 보유가 없습니다. 예: `SOXX 10주 등록` 또는 `/agent/holdings`에서 입력하세요.",
        actions: [],
      };
    }
    return {
      reply: `현재 보유입니다.\n${formatSnapshotSummary(snap!)}\n(참고용)`,
      actions: [],
    };
  }

  const remove = tryParseRemove(message);
  if (remove && remove.type === "remove_holding") {
    return {
      reply: `${remove.ticker} 종목을 보유에서 제거했습니다. (참고용)`,
      actions: [remove],
    };
  }

  const cash = tryParseCash(message);
  if (cash && cash.type === "set_cash") {
    const label = cash.field.toUpperCase();
    return {
      reply: `${label} 현금을 ${cash.amount.toLocaleString("ko-KR")}으로 반영했습니다. (참고용)`,
      actions: [cash],
    };
  }

  const holding = tryParseHolding(message);
  if (holding && holding.type === "add_holding") {
    return {
      reply: `${holding.ticker} ${holding.quantity}을(를) ${ASSET_TYPE_LABELS[holding.assetType]}·${holding.currency}로 등록했습니다. (참고용)`,
      actions: [holding],
    };
  }

  const qa = tryQaReply(message);
  if (qa) {
    return { reply: qa, actions: [] };
  }

  return {
    reply:
      "명령을 이해하지 못했습니다. `도움말`을 입력하거나 예: `SOXX 10주 등록`, `KRW 현금 5000만 등록` (참고용)",
    actions: [],
  };
}
