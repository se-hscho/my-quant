import Link from "next/link";
import { SparklesIcon } from "lucide-react";
import { Button } from "@/components/ui/button";

export function DemoPreviewBanner() {
  return (
    <div
      className="rounded-lg border border-amber-500/40 bg-amber-500/10 px-4 py-3"
      data-testid="demo-preview-banner"
      role="status"
    >
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex gap-2 text-sm">
          <SparklesIcon className="mt-0.5 h-4 w-4 shrink-0 text-amber-600" aria-hidden />
          <div>
            <p className="font-medium text-foreground">예시 포트폴리오 미리보기</p>
            <p className="text-muted-foreground">
              삼성전자·SOXX·KODEX 200 등 샘플 보유로 실제 시세·환율 기반 브리핑을
              체험할 수 있습니다. 내 포트폴리오를 등록하면 맞춤 분석으로 전환됩니다.
            </p>
          </div>
        </div>
        <Button asChild size="sm" className="shrink-0">
          <Link href="/agent/holdings">내 보유 등록하기</Link>
        </Button>
      </div>
    </div>
  );
}
