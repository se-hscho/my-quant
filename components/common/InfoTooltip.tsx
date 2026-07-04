"use client";

import { HelpCircleIcon } from "lucide-react";
import {
  HoverCard,
  HoverCardContent,
  HoverCardTrigger,
} from "@/components/ui/hover-card";

export interface InfoTooltipProps {
  label: string;
  description: string | string[];
}

function renderDescription(description: string | string[]) {
  const lines = Array.isArray(description) ? description : [description];
  if (lines.length === 1) {
    return <p className="mt-1 text-xs text-muted-foreground">{lines[0]}</p>;
  }
  return (
    <ul className="mt-1 list-disc space-y-1 pl-4 text-xs text-muted-foreground">
      {lines.map((line) => (
        <li key={line}>{line}</li>
      ))}
    </ul>
  );
}

export function InfoTooltip({ label, description }: InfoTooltipProps) {
  return (
    <HoverCard openDelay={0} closeDelay={0}>
      <HoverCardTrigger asChild>
        <button
          type="button"
          aria-label={`${label} 설명`}
          className="inline-flex h-4 w-4 shrink-0 items-center justify-center rounded-full text-muted-foreground hover:text-foreground"
        >
          <HelpCircleIcon className="h-4 w-4" aria-hidden />
        </button>
      </HoverCardTrigger>
      <HoverCardContent className="max-w-sm">
        <div className="text-sm font-medium">{label}</div>
        {renderDescription(description)}
      </HoverCardContent>
    </HoverCard>
  );
}
