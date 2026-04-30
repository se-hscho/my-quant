import { ResultView } from "@/components/results/ResultView";

export default async function ResultsPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return <ResultView id={id} />;
}
