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

export function NotificationSettingsForm() {
  const [settings, setSettings] = useState<NotificationSettings | null>(null);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    setSettings(loadNotificationSettings());
  }, []);

  if (!settings) return null;

  function update<K extends keyof NotificationSettings>(key: K, value: NotificationSettings[K]) {
    setSettings((s) => (s ? { ...s, [key]: value } : s));
    setSaved(false);
  }

  function handleSave() {
    if (settings && saveNotificationSettings(settings)) {
      setSaved(true);
    }
  }

  return (
    <Card data-testid="notification-settings">
      <CardHeader>
        <CardTitle className="text-base">알림 설정</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
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
        </div>
        <Button type="button" onClick={handleSave}>
          저장
        </Button>
        {saved ? <p className="text-sm text-muted-foreground">저장되었습니다.</p> : null}
      </CardContent>
    </Card>
  );
}
