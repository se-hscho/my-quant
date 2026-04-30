import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function NotFound() {
  return (
    <main className="container mx-auto flex min-h-[60vh] max-w-md flex-col items-center justify-center gap-4 px-4 py-12 text-center">
      <h1 className="text-2xl font-bold">페이지를 찾을 수 없습니다</h1>
      <p className="text-sm text-muted-foreground">
        요청한 결과가 더 이상 존재하지 않거나, 다른 브라우저·기기에서 저장된 결과일 수 있습니다.
      </p>
      <div className="mt-2 flex gap-2">
        <Button asChild>
          <Link href="/">홈으로</Link>
        </Button>
        <Button asChild variant="outline">
          <Link href="/history">기록으로</Link>
        </Button>
      </div>
    </main>
  );
}
