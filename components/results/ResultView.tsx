"use client";

import * as React from "react";
import { notFound, useRouter } from "next/navigation";
import Link from "next/link";
import { toast } from "sonner";
import { loadResult, saveResult } from "@/lib/storage";
import type { PortfolioResult } from "@/types";
import { MetricCards } from "@/components/results/MetricCards";
import { EfficientFrontierChart } from "@/components/results/EfficientFrontierChart";
import { WeightPieChart } from "@/components/results/WeightPieChart";
import { BacktestChart } from "@/components/results/BacktestChart";
import { InfoTooltip } from "@/components/common/InfoTooltip";
import { Button } from "@/components/ui/button";
import { ArrowLeftIcon, SaveIcon } from "lucide-react";

const METHOD_LABEL: Record<string, string> = {
  "max-sharpe": "Max Sharpe",
  "min-variance": "Min Variance",
  "risk-parity": "Risk Parity",
};

export function ResultView({ id }: { id: string }) {
  const router = useRouter();
  const [result, setResult] = React.useState<PortfolioResult | null | undefined>(
    undefined
  );

  React.useEffect(() => {
    setResult(loadResult(id));
  }, [id]);

  const handleSave = React.useCallback(() => {
    if (!result) return;
    const status = saveResult(result);
    if (status === "saved") {
      toast.success("저장됨", {
        description: "기록 페이지에서 다시 볼 수 있습니다.",
        action: {
          label: "기록 보기",
          onClick: () => router.push("/history"),
        },
      });
    } else if (status === "duplicate") {
      toast.info("이미 저장됨", {
        description: "이 결과는 이미 기록에 있습니다.",
      });
    } else if (status === "quota-exceeded") {
      toast.error("저장 공간 부족", {
        description: "기록을 일부 삭제한 뒤 다시 시도해 주세요.",
      });
    } else {
      toast.error("저장 실패", { description: "다시 시도해 주세요." });
    }
  }, [result, router]);

  if (result === undefined) {
    return <div className="container mx-auto p-8 text-sm text-muted-foreground">불러오는 중…</div>;
  }
  if (result === null) notFound();

  return (
    <main className="container mx-auto max-w-5xl px-4 py-8">
      <header className="mb-6 flex items-center gap-3">
        <Button asChild variant="outline" size="sm">
          <Link href={`/bundle/${result.bundleId}`}>
            <ArrowLeftIcon className="h-4 w-4" data-icon="inline-start" />
            번들로
          </Link>
        </Button>
        <div className="flex-1">
          <h1 className="text-xl font-bold">{result.bundleName}</h1>
          <p className="text-sm text-muted-foreground">
            방법: {METHOD_LABEL[result.method] ?? result.method}
          </p>
        </div>
        <Button onClick={handleSave}>
          <SaveIcon className="h-4 w-4" data-icon="inline-start" />
          결과 저장
        </Button>
      </header>

      <section className="mb-6">
        <MetricCards metrics={result.metrics} />
      </section>

      <section className="mb-6 grid gap-6 lg:grid-cols-2">
        <div>
          <div className="mb-2 flex items-center gap-1.5">
            <h2 className="text-sm font-semibold">효율적 프론티어</h2>
            <InfoTooltip
              label="효율적 프론티어란?"
              description="같은 변동성(위험)에서 가장 높은 기대수익률을 내는 포트폴리오 조합을 선으로 이은 것입니다. 점들은 10,000개 무작위 비중 조합이고, ★은 선택된 최적화 방법으로 산출된 최적 포트폴리오입니다."
            />
          </div>
          <EfficientFrontierChart
            frontier={result.frontier}
            optimal={{
              weights: result.weights,
              expectedReturn: result.metrics.annualReturn,
              volatility: result.metrics.volatility,
              sharpe: result.metrics.sharpe,
            }}
          />
        </div>
        <div>
          <h2 className="mb-2 text-sm font-semibold">최적 가중치</h2>
          <WeightPieChart weights={result.weights} />
        </div>
      </section>

      <section className="mb-6">
        <div className="mb-2 flex items-center gap-1.5">
          <h2 className="text-sm font-semibold">백테스팅</h2>
          <InfoTooltip
            label="최적 포트폴리오 vs Buy & Hold"
            description="최적 포트폴리오는 최적화된 비중을 매일 유지한다고 가정한 누적 수익률입니다. Buy & Hold는 모든 종목을 균등 비중(1/N)으로 사서 그대로 보유한 경우의 수익률로, 단순 보유 대비 최적화의 효과를 비교할 수 있습니다."
          />
        </div>
        <BacktestChart tickers={result.tickers} weights={result.weights} />
      </section>
    </main>
  );
}
