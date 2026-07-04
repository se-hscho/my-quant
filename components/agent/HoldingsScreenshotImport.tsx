"use client";

import { useRef, useState } from "react";
import type { ImportedHoldingDraft, HoldingsImportResult } from "@/types/holdings-import";
import { Button } from "@/components/ui/button";
import { ImageUpIcon, Loader2Icon } from "lucide-react";
import { toast } from "sonner";
import { HoldingsImportPreviewDialog } from "./HoldingsImportPreviewDialog";

const MAX_FILE_BYTES = 4 * 1024 * 1024;
const ACCEPT = "image/jpeg,image/png,image/webp,image/heic,image/heif";

export interface HoldingsScreenshotImportProps {
  onImport: (result: HoldingsImportResult) => void;
}

function readFileAsBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const dataUrl = reader.result;
      if (typeof dataUrl !== "string") {
        reject(new Error("read failed"));
        return;
      }
      const base64 = dataUrl.split(",")[1];
      if (!base64) {
        reject(new Error("invalid data url"));
        return;
      }
      resolve(base64);
    };
    reader.onerror = () => reject(reader.error ?? new Error("read failed"));
    reader.readAsDataURL(file);
  });
}

export function HoldingsScreenshotImport({ onImport }: HoldingsScreenshotImportProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [loading, setLoading] = useState(false);
  const [previewOpen, setPreviewOpen] = useState(false);
  const [previewResult, setPreviewResult] = useState<HoldingsImportResult | null>(null);
  const [previewThumb, setPreviewThumb] = useState<string | null>(null);

  async function handleFileChange(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      toast.error("이미지 파일만 업로드할 수 있습니다.");
      return;
    }

    if (file.size > MAX_FILE_BYTES) {
      toast.error("이미지는 4MB 이하여야 합니다.");
      return;
    }

    setLoading(true);
    try {
      const base64 = await readFileAsBase64(file);
      const res = await fetch("/api/agent/holdings/import", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ imageBase64: base64, mimeType: file.type }),
      });
      const data = (await res.json()) as
        | { ok: true; result: HoldingsImportResult }
        | { ok: false; error: string };

      if (!res.ok || !data.ok) {
        toast.error("스크린샷 인식 실패", {
          description: "error" in data ? data.error : "다시 시도해 주세요.",
        });
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
      <Button
        type="button"
        variant="secondary"
        className="w-full"
        disabled={loading}
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
        토스·키움·미래에셋 등 다른 앱의 보유 현황 캡처를 올리면 티커·수량·매수가를
        자동 추출합니다. GEMINI_API_KEY 필요.
      </p>

      {previewResult ? (
        <HoldingsImportPreviewDialog
          open={previewOpen}
          onOpenChange={setPreviewOpen}
          result={previewResult}
          thumbnailUrl={previewThumb}
          onConfirm={handleConfirm}
        />
      ) : null}
    </>
  );
}
