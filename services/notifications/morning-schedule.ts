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

/**
 * KST 시(hour)가 설정과 일치할 때 아침 알림을 발송한다.
 * Vercel Hobby는 cron을 하루 1회·±1시간 내 실행하므로 분 단위 정확 매칭은 Pro/외부 스케줄러에서만 가능.
 */
export function shouldSendMorningBriefing(morningTimeKst: string, now = new Date()): boolean {
  const target = parseMorningTimeKst(morningTimeKst);
  const kst = getKstHourMinute(now);
  return kst.hour === target.hour;
}
