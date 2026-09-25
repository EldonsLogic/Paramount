"use client";

import { Info } from "lucide-react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";

export function MethodologyDialog() {
  return (
    <Dialog>
      <DialogTrigger
        className="inline-flex h-6 w-6 items-center justify-center rounded-full text-muted-foreground hover:bg-muted hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring print:hidden"
        aria-label="How the Total Overlap Model works"
      >
        <Info className="h-4 w-4" aria-hidden="true" />
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Total Overlap Model (TOM)</DialogTitle>
          <DialogDescription>How reach is deduplicated across channels.</DialogDescription>
        </DialogHeader>
        <dl className="space-y-3 text-sm">
          <div>
            <dt className="font-medium">Combined reach</dt>
            <dd className="mt-1 rounded-md bg-muted px-3 py-2 font-mono text-[13px]">1 − ∏[1 − Rᵢ × (1 − overlap%)]</dd>
          </div>
          <div>
            <dt className="font-medium">Incremental reach of channel X</dt>
            <dd className="mt-1 rounded-md bg-muted px-3 py-2 font-mono text-[13px]">Reach(all) − Reach(all minus X)</dd>
          </div>
          <div>
            <dt className="font-medium">CPIR</dt>
            <dd className="mt-1 rounded-md bg-muted px-3 py-2 font-mono text-[13px]">Spend ÷ Incremental unique people reached</dd>
          </div>
        </dl>
        <p className="text-sm text-muted-foreground">Lower CPIR = more efficient reach extension.</p>
      </DialogContent>
    </Dialog>
  );
}
