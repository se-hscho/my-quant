"use client";

import { useRef, useState } from "react";
import type { HoldingsImportResult, ImportedHoldingDraft } from "@/types/holdings-import";
import { fetchHoldingsImportFromImage } from "@/lib/agent/holdings-image";
import { Button } from "@/components/ui/button";
import { ImageUpIcon, Loader2Icon } from "lucide-react";
import { toast } from "sonner";
import { HoldingsImportPreviewDialog } from "./HoldingsImportPreviewDialog";

const ACCEPT = "image/jpeg,image/png,image/webp,image/heic,image/heif";

export interface HoldingsScreenshotImportProps {
  onImport: (result: HoldingsImportResult) => void;
  /** compact: 보유 편집 페이지용 full width / chat: 아이콘+짧은 라벨 */
  variant?: "full" | "compact";
  disabled?: boolean;
}

export function HoldingsScreenshotImport({
  onImport,
  variant = "full",
  disabled = false,
}: HoldingsScreenshotImportProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [loading, setLoading] = useState(false);
  const [previewOpen, setPreviewOpen] = useState(false);
  const [previewResult, setPreviewResult] = useState<HoldingsImportResult | null>(null);
  const [previewThumb, setPreviewThumb] = useState<string | null>(null);

  async function handleFileChange(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;

    setLoading(true);
    try {
      const data = await fetchHoldingsImportFromImage(file);
      if (!data.ok) {
        toast.error("스크린샷 인식 실패", { description: data.error });
        return;
      }

      setPreviewResult(data.result);
      setPreviewThumb(URL.createObjectURL(file));
      setPreviewOpen(true);
    } catch {
      toast.error("업로드 실패", { description: "네트워크 연결을 확인해 주세요." });
    } finally {
      setLoading(false);
    }
  }

  function handleConfirm(selected: ImportedHoldingDraft[], cash?: HoldingsImportResult["cash"]) {
    if (!previewResult) return;
    onImport({
      holdings: selected,
      cash: cash ?? previewResult.cash,
      confidence: previewResult.confidence,
      notes: previewResult.notes,
    });
    setPreviewOpen(false);
    setPreviewResult(null);
    if (previewThumb) {
      URL.revokeObjectURL(previewThumb);
      setPreviewThumb(null);
    }
    toast.success("스크린샷에서 종목을 가져왔습니다", {
      description: `${selected.length}개 종목 — 저장 버튼으로 반영하세요.`,
    });
  }

  function closePreview(open: boolean) {
    setPreviewOpen(open);
    if (!open && previewThumb) {
      URL.revokeObjectURL(previewThumb);
      setPreviewThumb(null);
    }
  }

  return (
    <>
      <input
        ref={inputRef}
        type="file"
        accept={ACCEPT}
        capture="environment"
        className="sr-only"
        aria-hidden
        onChange={handleFileChange}
      />
      {variant === "full" ? (
        <>
          <Button
            type="button"
            variant="secondary"
            className="w-full"
            disabled={loading || disabled}
            onClick={() => inputRef.current?.click()}
          >
            {loading ? (
              <Loader2Icon className="mr-2 h-4 w-4 animate-spin" aria-hidden />
            ) : (
              <ImageUpIcon className="mr-2 h-4 w-4" aria-hidden />
            )}
            {loading ? "스크린샷 분석 중…" : "보유 화면 캡처 업로드"}
          </Button>
          <p className="text-xs text-muted-foreground">
            토스·키움·미래에셋 등 보유 캡처 → 티커·수량·매수가 추출. 채팅 📷 버튼으로도
            등록할 수 있습니다. GEMINI_API_KEY 필요.
          </p>
        </>
      ) : (
        <Button
          type="button"
          variant="outline"
          size="icon"
          disabled={loading || disabled}
          aria-label="보유 화면 캡처 업로드"
          title="보유 화면 캡처로 등록"
          onClick={() => inputRef.current?.click()}
        >
          {loading ? (
            <Loader2Icon className="h-4 w-4 animate-spin" aria-hidden />
          ) : (
            <ImageUpIcon className="h-4 w-4" aria-hidden />
          )}
        </Button>
      )}

      {previewResult ? (
        <HoldingsImportPreviewDialog
          open={previewOpen}
          onOpenChange={closePreview}
          result={previewResult}
          thumbnailUrl={previewThumb}
          onConfirm={handleConfirm}
        />
      ) : null}
    </>
  );
}
