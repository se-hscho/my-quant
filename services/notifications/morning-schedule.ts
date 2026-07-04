export function parseMorningTimeKst(value: string): { hour: number; minute: number } {
  const [h, m] = value.split(":");
  return {
    hour: Number(h) || 7,
    minute: Number(m) || 0,
  };
}

export function getKstHourMinute(now = new Date()): { hour: number; minute: number } {
  const parts = new Intl.DateTimeFormat("en-GB", {
    timeZone: "Asia/Seoul",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).formatToParts(now);

  const hour = Number(parts.find((p) => p.type === "hour")?.value ?? 0);
  const minute = Number(parts.find((p) => p.type === "minute")?.value ?? 0);
  return { hour, minute };
}

/** KST 시각이 설정과 일치할 때만 아침 알림을 발송한다. */
export function shouldSendMorningBriefing(morningTimeKst: string, now = new Date()): boolean {
  const target = parseMorningTimeKst(morningTimeKst);
  const kst = getKstHourMinute(now);
  return kst.hour === target.hour && kst.minute === target.minute;
}
