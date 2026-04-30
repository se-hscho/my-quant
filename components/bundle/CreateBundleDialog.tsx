"use client";

import * as React from "react";
import { PlusIcon, XIcon } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Field,
  FieldGroup,
  FieldLabel,
  FieldError,
} from "@/components/ui/field";
import {
  InputGroup,
  InputGroupInput,
  InputGroupAddon,
} from "@/components/ui/input-group";
import type { Bundle } from "@/types";
import { BUNDLES } from "@/config/bundles";

const EXISTING_CATEGORIES = [...new Set(BUNDLES.map((b) => b.category))];

const genId = () =>
  typeof crypto !== "undefined" && "randomUUID" in crypto
    ? crypto.randomUUID()
    : `c_${Date.now()}_${Math.random().toString(36).slice(2)}`;

export interface CreateBundleDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSave: (bundle: Bundle) => void;
}

export function CreateBundleDialog({
  open,
  onOpenChange,
  onSave,
}: CreateBundleDialogProps) {
  const [name, setName] = React.useState("");
  const [category, setCategory] = React.useState("");
  const [description, setDescription] = React.useState("");
  const [tickers, setTickers] = React.useState<string[]>([]);
  const [tickerInput, setTickerInput] = React.useState("");
  const [nameError, setNameError] = React.useState("");
  const [tickerError, setTickerError] = React.useState("");
  const [duplicateError, setDuplicateError] = React.useState("");

  const reset = () => {
    setName("");
    setCategory("");
    setDescription("");
    setTickers([]);
    setTickerInput("");
    setNameError("");
    setTickerError("");
    setDuplicateError("");
  };

  const handleOpenChange = (next: boolean) => {
    if (!next) reset();
    onOpenChange(next);
  };

  const addTicker = () => {
    const t = tickerInput.trim().toUpperCase();
    if (!t) return;
    if (tickers.includes(t)) {
      setDuplicateError("이미 추가된 종목입니다.");
      return;
    }
    setDuplicateError("");
    setTickerError("");
    setTickers((prev) => [...prev, t]);
    setTickerInput("");
  };

  const removeTicker = (t: string) => {
    setTickers((prev) => prev.filter((x) => x !== t));
    setTickerError("");
  };

  const handleSave = () => {
    let valid = true;
    if (!name.trim()) {
      setNameError("이름을 입력해 주세요.");
      valid = false;
    }
    if (tickers.length < 2) {
      setTickerError("종목을 2개 이상 추가해 주세요.");
      valid = false;
    }
    if (!valid) return;

    onSave({
      id: genId(),
      name: name.trim(),
      category: category.trim() || "내 번들",
      description: description.trim(),
      stocks: tickers.map((ticker) => ({ ticker, name: "", description: "" })),
      isCustom: true,
    });
    handleOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>번들 추가하기</DialogTitle>
        </DialogHeader>

        <FieldGroup className="gap-4 py-2">
          <Field data-invalid={nameError ? true : undefined}>
            <FieldLabel htmlFor="bundle-name">번들 이름 *</FieldLabel>
            <Input
              id="bundle-name"
              placeholder="번들 이름을 입력하세요"
              value={name}
              onChange={(e) => {
                setName(e.target.value);
                setNameError("");
              }}
              aria-invalid={!!nameError}
            />
            <FieldError>{nameError}</FieldError>
          </Field>

          <Field>
            <FieldLabel htmlFor="bundle-category">카테고리</FieldLabel>
            <Input
              id="bundle-category"
              placeholder="테마형, 팩터형 또는 직접 입력"
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              list="category-suggestions"
            />
            <datalist id="category-suggestions">
              {EXISTING_CATEGORIES.map((c) => (
                <option key={c} value={c} />
              ))}
            </datalist>
          </Field>

          <Field>
            <FieldLabel htmlFor="bundle-desc">설명 (선택)</FieldLabel>
            <Input
              id="bundle-desc"
              placeholder="번들 설명"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
          </Field>

          <Field data-invalid={tickerError || duplicateError ? true : undefined}>
            <FieldLabel>종목 *</FieldLabel>
            <InputGroup>
              <InputGroupInput
                placeholder="AAPL, MSFT 등 ticker 입력"
                value={tickerInput}
                onChange={(e) => {
                  setTickerInput(e.target.value);
                  setDuplicateError("");
                }}
                onKeyDown={(e) => e.key === "Enter" && addTicker()}
              />
              <InputGroupAddon>
                <Button type="button" size="sm" onClick={addTicker}>
                  추가
                </Button>
              </InputGroupAddon>
            </InputGroup>
            <FieldError>{duplicateError || tickerError}</FieldError>
            {tickers.length > 0 && (
              <div className="mt-2 flex flex-wrap gap-1.5">
                {tickers.map((t) => (
                  <Badge
                    key={t}
                    variant="secondary"
                    className="gap-1 font-mono"
                  >
                    {t}
                    <button
                      type="button"
                      aria-label={`${t} 삭제`}
                      onClick={() => removeTicker(t)}
                      className="rounded-full hover:text-destructive"
                    >
                      <XIcon className="h-3 w-3" />
                    </button>
                  </Badge>
                ))}
              </div>
            )}
          </Field>
        </FieldGroup>

        <DialogFooter>
          <Button variant="outline" onClick={() => handleOpenChange(false)}>
            취소
          </Button>
          <Button onClick={handleSave}>저장</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
