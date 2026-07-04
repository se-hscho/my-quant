import { describe, expect, it } from "vitest";
import { getKstHourMinute, shouldSendMorningBriefing } from "./morning-schedule";

describe("morning-schedule", () => {
  it("07:00 KST 설정은 UTC 22시대(KST 07시)에 매칭된다", () => {
    const utc0700Kst = new Date("2026-07-03T22:00:00.000Z");
    expect(getKstHourMinute(utc0700Kst)).toEqual({ hour: 7, minute: 0 });
    expect(shouldSendMorningBriefing("07:00", utc0700Kst)).toBe(true);

    const utc0745Kst = new Date("2026-07-03T22:45:00.000Z");
    expect(shouldSendMorningBriefing("07:00", utc0745Kst)).toBe(true);
  });

  it("08:30 KST 설정은 KST 08시대에 매칭된다", () => {
    const utc0815Kst = new Date("2026-07-03T23:15:00.000Z");
    expect(shouldSendMorningBriefing("08:30", utc0815Kst)).toBe(true);
    expect(shouldSendMorningBriefing("07:00", utc0815Kst)).toBe(false);
  });

  it("설정 시각이 아니면 false", () => {
    const utc0800Kst = new Date("2026-07-03T23:00:00.000Z");
    expect(shouldSendMorningBriefing("07:00", utc0800Kst)).toBe(false);
  });
});
