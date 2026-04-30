import { BUNDLES } from "@/config/bundles";
import { BundleGallery } from "@/components/gallery/BundleGallery";
import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function HomePage() {
  return (
    <main className="container mx-auto max-w-6xl px-4 py-8">
      <header className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">퀀트 포트폴리오 최적화</h1>
          <p className="text-sm text-muted-foreground">
            큐레이션된 번들에서 시작해 최적 포트폴리오를 계산해보세요.
          </p>
        </div>
        <Button asChild variant="outline">
          <Link href="/history">기록 보기</Link>
        </Button>
      </header>
      <BundleGallery bundles={BUNDLES} />
    </main>
  );
}
