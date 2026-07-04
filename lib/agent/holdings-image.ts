import type { HoldingsImportResult } from "@/types/holdings-import";

export const HOLDINGS_IMAGE_ACCEPT = "image/jpeg,image/png,image/webp,image/heic,image/heif";
export const HOLDINGS_IMAGE_MAX_BYTES = 4 * 1024 * 1024;

export function validateHoldingsImageFile(file: File): string | null {
  if (!file.type.startsWith("image/")) {
    return "이미지 파일만 업로드할 수 있습니다.";
  }
  if (file.size > HOLDINGS_IMAGE_MAX_BYTES) {
    return "이미지는 4MB 이하여야 합니다.";
  }
  return null;
}

export function readImageFileAsBase64(file: File): Promise<string> {
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

export async function fetchHoldingsImportFromImage(
  file: File
): Promise<
  | { ok: true; result: HoldingsImportResult }
  | { ok: false; error: string }
> {
  const validationError = validateHoldingsImageFile(file);
  if (validationError) {
    return { ok: false, error: validationError };
  }

  const base64 = await readImageFileAsBase64(file);
  const res = await fetch("/api/agent/holdings/import", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ imageBase64: base64, mimeType: file.type }),
  });

  const data = (await res.json()) as
    | { ok: true; result: HoldingsImportResult }
    | { ok: false; error: string };

  if (!res.ok || !data.ok) {
    return {
      ok: false,
      error: "error" in data ? data.error : "스크린샷 인식에 실패했습니다.",
    };
  }

  return { ok: true, result: data.result };
}
