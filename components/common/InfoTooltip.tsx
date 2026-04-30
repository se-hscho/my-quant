"use client";

import { HelpCircleIcon } from "lucide-react";
import {
  HoverCard,
  HoverCardContent,
  HoverCardTrigger,
} from "@/components/ui/hover-card";

export interface InfoTooltipProps {
  label: string;
  description: string;
}

export function InfoTooltip({ label, description }: InfoTooltipProps) {
  return (
    <HoverCard openDelay={0} closeDelay={0}>
      <HoverCardTrigger asChild>
        <button
          type="button"
          aria-label={`${label} 설명`}
          className="inline-flex h-4 w-4 items-center justify-center rounded-full text-muted-foreground hover:text-foreground"
        >
          <HelpCircleIcon className="h-4 w-4" aria-hidden />
        </button>
      </HoverCardTrigger>
      <HoverCardContent>
        <div className="text-sm font-medium">{label}</div>
        <p className="mt-1 text-xs text-muted-foreground">{description}</p>
      </HoverCardContent>
    </HoverCard>
  );
}
