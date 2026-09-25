"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { OVERLAP_MAX, OVERLAP_MIN, UNIVERSE_MAX, UNIVERSE_MIN } from "@/lib/defaults";
import { benchmarkValue } from "@/lib/calc";
import { fmtInt } from "@/lib/format";
import type { OverlapBenchmark } from "@/lib/types";
import { MethodologyDialog } from "./methodology-dialog";
import { NumberField } from "./number-field";

interface ConfigCardsProps {
  universe: number;
  overlapPct: number;
  useBenchmarks: boolean;
  benchmarks: OverlapBenchmark[];
  onUniverse: (n: number) => void;
  onOverlap: (n: number) => void;
}

export function ConfigCards({ universe, overlapPct, useBenchmarks, benchmarks, onUniverse, onOverlap }: ConfigCardsProps) {
  return (
    <section aria-label="Campaign configuration" className="grid gap-4 lg:grid-cols-2 print:grid-cols-2">
      <Card>
        <CardHeader className="pb-3">
          <CardTitle>Target Universe</CardTitle>
          <CardDescription>Total addressable audience</CardDescription>
        </CardHeader>
        <CardContent>
          <Label htmlFor="universe" className="sr-only">
            Total addressable audience
          </Label>
          <NumberField
            id="universe"
            value={universe}
            onValueChange={onUniverse}
            min={UNIVERSE_MIN}
            max={UNIVERSE_MAX}
            integer
            className="h-11 text-lg font-semibold print:hidden"
            aria-describedby="universe-help"
          />
          <p className="hidden text-2xl font-semibold tabular-nums print:block">{fmtInt(universe)}</p>
          <p id="universe-help" className="mt-2 text-xs text-muted-foreground">
            <span className="tabular-nums print:hidden">{fmtInt(universe)} people · </span>
            e.g. Adults 25–54 in your market
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center gap-1.5">
            <CardTitle>Overlap Model</CardTitle>
            <MethodologyDialog />
          </div>
          <CardDescription id="overlap-label">
            {useBenchmarks ? "Default cross-channel overlap % (pairs without a benchmark)" : "Cross-channel audience overlap %"}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-baseline justify-between gap-4">
            <span className="text-3xl font-semibold tabular-nums text-primary" aria-live="polite">
              {overlapPct}%
            </span>
          </div>
          <div className="print:hidden">
            <Slider
              value={[overlapPct]}
              min={OVERLAP_MIN}
              max={OVERLAP_MAX}
              step={1}
              onValueChange={([v]) => onOverlap(v)}
              aria-labelledby="overlap-label"
              thumbLabel="Cross-channel audience overlap %"
              className="mt-2"
            />
            <div className="mt-1 flex justify-between gap-2 text-xs text-muted-foreground">
              <span>Low (niche audience)</span>
              <span className="text-right">High (mass market)</span>
            </div>
          </div>
          <p className="mt-3 text-xs text-muted-foreground print:hidden">
            {useBenchmarks
              ? `Channel-pair benchmarks are on (${benchmarks.length} pairs) — edit them under “Industry overlap benchmarks” below.`
              : "Channel-pair benchmarks are off — this overlap applies to every pair."}
          </p>
          {useBenchmarks && benchmarks.length > 0 && (
            <p className="mt-2 hidden text-xs text-muted-foreground print:block">
              Pair benchmarks applied: {benchmarks.map((b) => `${b.label} ${benchmarkValue(b).toFixed(1)}%`).join(" · ")}
            </p>
          )}
        </CardContent>
      </Card>
    </section>
  );
}
