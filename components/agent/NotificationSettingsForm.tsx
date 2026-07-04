"use client";

import { useEffect, useState } from "react";
import {
  loadNotificationSettings,
  saveNotificationSettings,
  type NotificationSettings,
} from "@/lib/agent/settings-storage";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

async function fetchServerSettings(): Promise<NotificationSettings | null> {
  try {
    const res = await fetch("/api/agent/settings/notifications", { cache: "no-store" });
    if (!res.ok) return null;
    const data = (await res.json()) as { settings?: NotificationSettings };
    return data.settings ?? null;
  } catch {
    return null;
  }
}

async function syncSettingsToServer(settings: NotificationSettings): Promise<boolean> {
  try {
    const res = await fetch("/api/agent/settings/notifications", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(settings),
    });
    return res.ok;
  } catch {
    return false;
  }
}

export function NotificationSettingsForm() {
  const [settings, setSettings] = useState<NotificationSettings | null>(null);
  const [saved, setSaved] = useState(false);
  const [serverSynced, setServerSynced] = useState<boolean | null>(null);
  const [testResult, setTestResult] = useState<"ok" | "failed" | null>(null);

  useEffect(() => {
    const local = loadNotificationSettings();
    setSettings(local);
    void fetchServerSettings().then((server) => {
      if (server) {
        setSettings((prev) => ({ ...(prev ?? local), ...server }));
      }
    });
  }, []);

  if (!settings) return null;

  function update<K extends keyof NotificationSettings>(key: K, value: NotificationSettings[K]) {
    setSettings((s) => (s ? { ...s, [key]: value } : s));
    setSaved(false);
    setServerSynced(null);
  }

  async function handleSave() {
    if (!settings) return;
    const localOk = saveNotificationSettings(settings);
    const remoteOk = await syncSettingsToServer(settings);
    setSaved(localOk);
    setServerSynced(remoteOk);
    setTestResult(null);
  }

  async function handleTestSend() {
    if (!settings) return;
    await handleSave();
    setTestResult(null);
    try {
      const res = await fetch("/api/agent/notifications/test", { method: "POST" });
      setTestResult(res.ok ? "ok" : "failed");
    } catch {
      setTestResult("failed");
    }
  }

  return (
    <Card data-testid="notification-settings">
      <CardHeader>
        <CardTitle className="text-base">알림 설정</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <p className="text-xs text-muted-foreground">
          저장 시 이 기기(localStorage)와 서버(KV)에 동기화됩니다. Cron·이벤트 알림은 활성화된
          채널의 주소·Webhook으로 발송됩니다.
        </p>
        <div className="flex items-center justify-between">
          <Label htmlFor="email-enabled">이메일 알림</Label>
          <Switch
            id="email-enabled"
            checked={settings.emailEnabled}
            onCheckedChange={(v) => update("emailEnabled", v)}
          />
        </div>
        <div className="space-y-1">
          <Label htmlFor="email">이메일 주소</Label>
          <Input
            id="email"
            type="email"
            value={settings.emailAddress}
            onChange={(e) => update("emailAddress", e.target.value)}
          />
        </div>
        <div className="flex items-center justify-between">
          <Label htmlFor="slack-enabled">Slack 알림</Label>
          <Switch
            id="slack-enabled"
            checked={settings.slackEnabled}
            onCheckedChange={(v) => update("slackEnabled", v)}
          />
        </div>
        <div className="space-y-1">
          <Label htmlFor="slack">Slack Webhook URL</Label>
          <Input
            id="slack"
            value={settings.slackWebhookUrl}
            onChange={(e) => update("slackWebhookUrl", e.target.value)}
          />
        </div>
        <div className="space-y-1">
          <Label htmlFor="time">아침 발송 시각 (KST)</Label>
          <Input
            id="time"
            type="time"
            value={settings.morningTimeKst}
            onChange={(e) => update("morningTimeKst", e.target.value)}
          />
          <p className="text-[10px] text-muted-foreground">
            Cron이 30분마다 확인하며, 설정한 시·분(KST)에 하루 1회 아침 요약을 보냅니다.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button type="button" onClick={() => void handleSave()}>
            저장
          </Button>
          <Button type="button" variant="outline" onClick={() => void handleTestSend()}>
            테스트 알림 보내기
          </Button>
        </div>
        {testResult === "ok" ? (
          <p className="text-sm text-muted-foreground" data-testid="settings-test-ok">
            테스트 알림을 보냈습니다. 이메일·Slack 수신함을 확인해 주세요.
          </p>
        ) : null}
        {testResult === "failed" ? (
          <p className="text-sm text-destructive" data-testid="settings-test-failed">
            테스트 발송에 실패했습니다. 채널 설정·RESEND_API_KEY·Webhook을 확인해 주세요.
          </p>
        ) : null}
        {saved ? (
          <p className="text-sm text-muted-foreground" data-testid="settings-saved-local">
            이 기기에 저장되었습니다.
          </p>
        ) : null}
        {serverSynced === true ? (
          <p className="text-sm text-muted-foreground" data-testid="settings-saved-server">
            서버에 동기화되었습니다. Cron·이벤트 알림에 반영됩니다.
          </p>
        ) : null}
        {serverSynced === false ? (
          <p className="text-sm text-destructive" data-testid="settings-sync-failed">
            서버 동기화에 실패했습니다. 로컬 설정은 저장되었습니다.
          </p>
        ) : null}
      </CardContent>
    </Card>
  );
}
