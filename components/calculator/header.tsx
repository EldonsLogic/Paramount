"use client";

import { FileDown, LogOut, RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/button";

interface HeaderProps {
  onReset: () => void;
  onExport: () => void;
  onSignOut: () => void;
}

export function Header({ onReset, onExport, onSignOut }: HeaderProps) {
  return (
    <header className="bg-navy text-white print:bg-white print:text-foreground">
      <div className="container flex flex-col gap-4 py-5 sm:flex-row sm:items-center sm:justify-between">
        <div className="min-w-0">
          <h1 className="text-xl font-semibold tracking-tight sm:text-2xl">
            <span className="print:hidden">Incremental Reach Calculator</span>
            <span className="hidden print:inline">Incremental Reach Report</span>
          </h1>
          <p className="mt-1 text-sm text-slate-300 print:text-muted-foreground">
            Cross-media audience deduplication · Total Overlap Model
          </p>
        </div>
        <div className="-mx-3 flex flex-wrap gap-1 sm:mx-0 sm:shrink-0 sm:flex-nowrap sm:gap-2 print:hidden">
          <Button
            variant="ghost"
            size="sm"
            onClick={onReset}
            className="text-slate-200 hover:bg-navy-700 hover:text-white"
          >
            <RotateCcw className="h-4 w-4" aria-hidden="true" />
            Reset to defaults
          </Button>
          <Button size="sm" onClick={onExport} className="bg-[#378ADD] text-white hover:bg-[#2f78c2]">
            <FileDown className="h-4 w-4" aria-hidden="true" />
            Export PDF
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={onSignOut}
            className="text-slate-200 hover:bg-navy-700 hover:text-white"
            aria-label="Sign out"
          >
            <LogOut className="h-4 w-4" aria-hidden="true" />
            <span className="sm:sr-only">Sign out</span>
          </Button>
        </div>
      </div>
    </header>
  );
}
