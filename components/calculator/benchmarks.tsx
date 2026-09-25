"use client";

import { useState } from "react";
import { BarChart3, Plus, RotateCcw, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { benchmarkValue, findBenchmark } from "@/lib/calc";
import { BENCHMARK_MAX, BENCHMARK_MIN, CATEGORIES, categoryLabel, defaultBenchmarks, uid } from "@/lib/defaults";
import type { CampaignConfig, ChannelCategory, OverlapBenchmark } from "@/lib/types";
import { CollapsibleSection } from "./collapsible-section";
import { NumberField } from "./number-field";

interface BenchmarksProps {
  config: CampaignConfig;
  onChange: (benchmarks: OverlapBenchmark[]) => void;
  onToggle: (useBenchmarks: boolean) => void;
}

const selectCls =
  "h-9 rounded-md border border-input bg-background px-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring";

export function Benchmarks({ config, onChange, onToggle }: BenchmarksProps) {
  const [newA, setNewA] = useState<ChannelCategory>("tv");
  const [newB, setNewB] = useState<ChannelCategory>("display");
  const { benchmarks, useBenchmarks, overlapPct } = config;
  const active = config.channels.filter((c) => c.enabled);

  // Which active channel pairs each benchmark currently drives, and which pairs fall back to the slider.
  const usage = new Map<string, string[]>();
  const unmatched: string[] = [];
  for (let i = 0; i < active.length; i++) {
    for (let j = i + 1; j < active.length; j++) {
      const pair = `${active[i].name || "Untitled"} ↔ ${active[j].name || "Untitled"}`;
      const bm = findBenchmark(active[i], active[j], benchmarks);
      if (bm) usage.set(bm.id, [...(usage.get(bm.id) ?? []), pair]);
      else unmatched.push(pair);
    }
  }

  const update = (id: string, patch: Partial<OverlapBenchmark>) =>
    onChange(benchmarks.map((b) => (b.id === id ? { ...b, ...patch } : b)));

  function addPair() {
    onChange([
      ...benchmarks,
      { id: uid(), label: `${categoryLabel(newA)} ↔ ${categoryLabel(newB)}`, a: [newA], b: [newB], low: 20, high: 30 },
    ]);
  }

  return (
    <CollapsibleSection
      title="Industry overlap benchmarks — use these to calibrate your overlap slider"
      icon={<BarChart3 className="h-4 w-4 text-primary" aria-hidden="true" />}
    >
      <div className="space-y-4">
        <label className="flex items-start gap-3 rounded-md bg-muted/60 p-3 text-sm">
          <input
            type="checkbox"
            checked={useBenchmarks}
            onChange={(e) => onToggle(e.target.checked)}
            className="mt-0.5 h-4 w-4 shrink-0 accent-[#378ADD]"
          />
          <span>
            <span className="font-medium">Apply these benchmarks to the calculations</span>
            <span className="block text-muted-foreground">
              Each channel pair uses the midpoint of its range. Pairs without a benchmark use the default overlap slider ({overlapPct}%).
              Turn off to use the slider for every pair.
            </span>
          </span>
        </label>

        <div className={useBenchmarks ? "" : "opacity-60"}>
          <div className="relative overflow-x-auto">
            <table className="w-full min-w-[560px] text-sm">
              <thead>
                <tr className="border-b text-left text-xs uppercase tracking-wide text-muted-foreground">
                  <th className="py-2 pr-2 font-medium">Channel pair</th>
                  <th className="w-20 px-1 py-2 font-medium">Low %</th>
                  <th className="w-20 px-1 py-2 font-medium">High %</th>
                  <th className="w-20 px-2 py-2 text-right font-medium">Applied</th>
                  <th className="w-10 py-2">
                    <span className="sr-only">Remove</span>
                  </th>
                </tr>
              </thead>
              <tbody>
                {benchmarks.map((b) => {
                  const used = usage.get(b.id) ?? [];
                  return (
                    <tr key={b.id} className="border-b align-top last:border-0">
                      <td className="py-2 pr-2">
                        <Input
                          value={b.label}
                          onChange={(e) => update(b.id, { label: e.target.value })}
                          aria-label="Benchmark name"
                          maxLength={80}
                          className="h-9"
                        />
                        <p className="mt-1 text-xs text-muted-foreground">
                          {b.a.map(categoryLabel).join(" / ")} ↔ {b.b.map(categoryLabel).join(" / ")}
                          {" · "}
                          {used.length ? `applies to ${used.join(", ")}` : "not used by current channels"}
                        </p>
                      </td>
                      <td className="px-1 py-2">
                        <NumberField
                          value={b.low}
                          onValueChange={(low) => update(b.id, { low })}
                          min={BENCHMARK_MIN}
                          max={BENCHMARK_MAX}
                          aria-label={`${b.label} low %`}
                          className="h-9"
                        />
                      </td>
                      <td className="px-1 py-2">
                        <NumberField
                          value={b.high}
                          onValueChange={(high) => update(b.id, { high })}
                          min={BENCHMARK_MIN}
                          max={BENCHMARK_MAX}
                          aria-label={`${b.label} high %`}
                          className="h-9"
                        />
                      </td>
                      <td className="px-2 py-2 pt-4 text-right font-semibold tabular-nums">{benchmarkValue(b).toFixed(1)}%</td>
                      <td className="py-2">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-9 w-9 text-muted-foreground hover:text-destructive"
                          onClick={() => onChange(benchmarks.filter((x) => x.id !== b.id))}
                          aria-label={`Remove ${b.label}`}
                        >
                          <X className="h-4 w-4" aria-hidden="true" />
                        </Button>
                      </td>
                    </tr>
                  );
                })}
                {benchmarks.length === 0 && (
                  <tr>
                    <td colSpan={5} className="py-4 text-center text-muted-foreground">
                      No benchmarks — every pair uses the default overlap slider.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          <div className="mt-3 flex flex-wrap items-center gap-2">
            <span className="text-sm text-muted-foreground">Add pair:</span>
            <select value={newA} onChange={(e) => setNewA(e.target.value as ChannelCategory)} aria-label="First channel type" className={selectCls}>
              {CATEGORIES.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.label}
                </option>
              ))}
            </select>
            <span aria-hidden="true">↔</span>
            <select value={newB} onChange={(e) => setNewB(e.target.value as ChannelCategory)} aria-label="Second channel type" className={selectCls}>
              {CATEGORIES.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.label}
                </option>
              ))}
            </select>
            <Button size="sm" variant="outline" onClick={addPair}>
              <Plus className="h-4 w-4" aria-hidden="true" />
              Add
            </Button>
            <Button size="sm" variant="ghost" onClick={() => onChange(defaultBenchmarks())} className="sm:ml-auto">
              <RotateCcw className="h-4 w-4" aria-hidden="true" />
              Reset benchmarks
            </Button>
          </div>

          {useBenchmarks && unmatched.length > 0 && (
            <p className="mt-3 text-xs text-muted-foreground">
              Using the default {overlapPct}% for: {unmatched.join(", ")}.
            </p>
          )}
          <p className="mt-2 text-xs text-muted-foreground">
            A pair added later overrides an earlier one covering the same channel types. Set each channel&rsquo;s type in the Channel
            Manager.
          </p>
        </div>
      </div>
    </CollapsibleSection>
  );
}
