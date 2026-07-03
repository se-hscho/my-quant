import { notFound } from "next/navigation";
import { getBriefing } from "@/services/briefing/kv";
import { ReportPageContent } from "@/components/agent/ReportPageContent";

export default async function ReportPage({
  params,
}: {
  params: Promise<{ date: string }>;
}) {
  const { date } = await params;
  const briefing = await getBriefing(date);
  if (!briefing || briefing.status !== "complete") {
    notFound();
  }
  return <ReportPageContent briefing={briefing} />;
}
