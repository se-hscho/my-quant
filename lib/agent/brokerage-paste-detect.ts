/** 증권앱 보유 목록 붙여넣기(브로커명·종목명·평가액·손익) 패턴 */
export function looksLikeBrokeragePaste(message: string): boolean {
  const text = message.trim();
  if (text.length < 80) return false;

  const lines = text.split(/\n+/).map((l) => l.trim()).filter(Boolean);
  if (lines.length < 6) return false;

  const krwValueLines = lines.filter((l) => /[\d,]+원/.test(l)).length;
  const brokerLines = lines.filter((l) => /증권|한투|한두|미래에셋|토스|KB/i.test(l)).length;

  return krwValueLines >= 2 && (brokerLines >= 1 || krwValueLines >= 4);
}
