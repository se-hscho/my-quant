import Link from "next/link";
import { WalletIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export function EmptyHoldingsState() {
  return (
    <Card className="mx-auto max-w-md text-center">
      <CardHeader className="items-center">
        <div className="mb-2 flex h-16 w-16 items-center justify-center rounded-full bg-muted">
          <WalletIcon className="h-8 w-8 text-muted-foreground" aria-hidden />
        </div>
        <CardTitle>보유 자산을 등록해주세요</CardTitle>
        <CardDescription>
          티커·수량·통화별 현금을 입력하면
          <br />
          매일 맞춤 브리핑을 받을 수 있습니다.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Button asChild className="w-full sm:w-auto">
          <Link href="/agent/holdings">보유 자산 등록하기</Link>
        </Button>
      </CardContent>
    </Card>
  );
}
