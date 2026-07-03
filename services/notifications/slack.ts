export async function sendSlackWebhook(
  webhookUrl: string,
  text: string
): Promise<boolean> {
  if (!webhookUrl) return false;
  const res = await fetch(webhookUrl, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ text }),
  });
  return res.ok;
}
