import { BundleDetailView } from "@/components/bundle/BundleDetailView";

export default async function BundleDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return <BundleDetailView bundleId={id} />;
}
