import Link from "next/link";
import { Trash2Icon } from "lucide-react";
import type { Bundle } from "@/types";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

export interface BundleCardProps {
  bundle: Bundle;
  onDelete?: () => void;
}

export function BundleCard({ bundle, onDelete }: BundleCardProps) {
  const showDelete = bundle.isCustom && !!onDelete;

  return (
    <Card data-testid={`bundle-card-${bundle.id}`} className="flex flex-col">
      <CardHeader>
        <div className="flex items-center gap-2">
          <Badge variant="secondary">{bundle.category}</Badge>
          <span className="text-xs text-muted-foreground">
            {bundle.stocks.length}개 종목
          </span>
          {showDelete && (
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="ml-auto h-6 w-6 text-muted-foreground hover:text-destructive"
                  aria-label="삭제"
                >
                  <Trash2Icon className="h-3.5 w-3.5" />
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>번들을 삭제할까요?</AlertDialogTitle>
                  <AlertDialogDescription>
                    &ldquo;{bundle.name}&rdquo; 번들이 삭제됩니다. 이 작업은 되돌릴 수 없습니다.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>취소</AlertDialogCancel>
                  <AlertDialogAction onClick={onDelete}>삭제</AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          )}
        </div>
        <CardTitle>{bundle.name}</CardTitle>
        <CardDescription>{bundle.description}</CardDescription>
      </CardHeader>
      <CardContent className="flex-1">
        <div className="flex flex-wrap gap-1">
          {bundle.stocks.slice(0, 5).map((s) => (
            <Badge key={s.ticker} variant="outline" className="font-mono">
              {s.ticker}
            </Badge>
          ))}
        </div>
      </CardContent>
      <CardFooter>
        <Button asChild className="ml-auto">
          <Link href={`/bundle/${bundle.id}`}>선택 →</Link>
        </Button>
      </CardFooter>
    </Card>
  );
}
