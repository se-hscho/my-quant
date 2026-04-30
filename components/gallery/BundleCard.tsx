import Link from "next/link";
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

export function BundleCard({ bundle }: { bundle: Bundle }) {
  return (
    <Card data-testid={`bundle-card-${bundle.id}`} className="flex flex-col">
      <CardHeader>
        <div className="flex items-center gap-2">
          <Badge variant="secondary">{bundle.category}</Badge>
          <span className="text-xs text-muted-foreground">
            {bundle.stocks.length}개 종목
          </span>
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
