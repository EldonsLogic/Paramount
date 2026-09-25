"use client";

import { useState } from "react";
import { ChevronDown } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { cn } from "@/lib/utils";

interface CollapsibleSectionProps {
  title: string;
  icon?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
}

export function CollapsibleSection({ title, icon, children, className }: CollapsibleSectionProps) {
  const [open, setOpen] = useState(false);
  return (
    <Card className={cn("print:hidden", className)}>
      <Collapsible open={open} onOpenChange={setOpen}>
        <CollapsibleTrigger className="flex w-full items-center justify-between gap-3 rounded-lg p-4 text-left text-sm font-semibold hover:bg-muted/50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring sm:px-5">
          <span className="flex items-center gap-2 [&>svg]:shrink-0">
            {icon}
            {title}
          </span>
          <ChevronDown className={cn("h-4 w-4 shrink-0 transition-transform", open && "rotate-180")} aria-hidden="true" />
        </CollapsibleTrigger>
        <CollapsibleContent className="px-4 pb-5 sm:px-5">{children}</CollapsibleContent>
      </Collapsible>
    </Card>
  );
}
