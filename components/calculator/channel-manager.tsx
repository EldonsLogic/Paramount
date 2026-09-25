"use client";

import { Plus, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { MAX_CHANNELS } from "@/lib/defaults";
import { CURRENCIES, fmtCPIR, fmtInt, fmtMoney } from "@/lib/format";
import type { Channel, ChannelResult, CurrencyCode } from "@/lib/types";
import { cn } from "@/lib/utils";
import { NumberField } from "./number-field";

interface ChannelManagerProps {
  channels: Channel[];
  universe: number;
  currency: CurrencyCode;
  onCurrency: (c: CurrencyCode) => void;
  results: Map<string, ChannelResult>;
  onUpdate: (id: string, patch: Partial<Channel>) => void;
  onRemove: (id: string) => void;
  onAdd: () => void;
}

const th = "px-2 py-2 text-left text-xs font-medium uppercase tracking-wide text-muted-foreground whitespace-nowrap";

export function ChannelManager({ channels, universe, currency, onCurrency, results, onUpdate, onRemove, onAdd }: ChannelManagerProps) {
  const atLimit = channels.length >= MAX_CHANNELS;

  return (
    <Card className="print-avoid-break">
      <CardHeader className="flex-row flex-wrap items-center justify-between gap-3 space-y-0 pb-3">
        <div className="space-y-1.5">
          <CardTitle>Channel Manager</CardTitle>
          <CardDescription>Click a dot to switch a channel on or off. Results update as you type.</CardDescription>
        </div>
        <div className="flex w-full flex-wrap items-center gap-2 sm:w-auto print:hidden">
          <label htmlFor="currency" className="text-sm text-muted-foreground">
            Currency
          </label>
          <select
            id="currency"
            value={currency}
            onChange={(e) => onCurrency(e.target.value as CurrencyCode)}
            className="h-9 min-w-0 flex-1 rounded-md border border-input bg-background px-2 text-sm font-medium sm:flex-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            {CURRENCIES.map((c) => (
              <option key={c.code} value={c.code}>
                {c.code} — {c.label}
              </option>
            ))}
          </select>
          <Button onClick={onAdd} disabled={atLimit} size="sm">
            <Plus className="h-4 w-4" aria-hidden="true" />
            Add Channel
          </Button>
        </div>
      </CardHeader>
      <CardContent className="px-0 pb-2 sm:px-5">
        <div className="relative overflow-x-auto overscroll-x-contain">
          <table className="w-full min-w-[680px] border-collapse text-sm print:min-w-0">
            <thead>
              <tr className="border-b">
                <th className={cn(th, "w-10 pl-5 sm:pl-2")}>
                  <span className="sr-only">Enabled</span>
                </th>
                <th className={th}>Channel</th>
                <th className={cn(th, "w-20")}>Reach %</th>
                <th className={cn(th, "w-32")}>Spend ({currency})</th>
                <th className={cn(th, "text-right")}>Unique reach</th>
                <th className={cn(th, "text-right")}>Incremental</th>
                <th className={cn(th, "text-right")}>CPIR</th>
                <th className={cn(th, "w-10 pr-5 sm:pr-2 print:hidden")}>
                  <span className="sr-only">Delete</span>
                </th>
              </tr>
            </thead>
            <tbody>
              {channels.map((ch) => {
                const r = results.get(ch.id);
                const label = ch.name || "Untitled channel";
                return (
                  <tr key={ch.id} className={cn("border-b last:border-0", !ch.enabled && "text-muted-foreground")}>
                    <td className="py-2 pl-5 pr-2 sm:pl-2">
                      <button
                        type="button"
                        onClick={() => onUpdate(ch.id, { enabled: !ch.enabled })}
                        aria-pressed={ch.enabled}
                        aria-label={`${ch.enabled ? "Disable" : "Enable"} ${label}`}
                        className="flex h-8 w-8 items-center justify-center rounded-full hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                      >
                        <span
                          className="block h-3.5 w-3.5 rounded-full border-2 transition-colors"
                          style={{ borderColor: ch.color, backgroundColor: ch.enabled ? ch.color : "transparent" }}
                        />
                      </button>
                    </td>
                    <td className="px-2 py-2">
                      <Input
                        value={ch.name}
                        onChange={(e) => onUpdate(ch.id, { name: e.target.value })}
                        aria-label="Channel name"
                        maxLength={80}
                        className="h-9 min-w-[130px] print:hidden"
                      />
                      <span className="hidden print:inline">{label}</span>
                    </td>
                    <td className="px-2 py-2">
                      <NumberField
                        value={ch.reach}
                        onValueChange={(reach) => onUpdate(ch.id, { reach })}
                        min={1}
                        max={99}
                        aria-label={`${label} reach %`}
                        className="h-9 print:hidden"
                      />
                      <span className="hidden print:inline">{ch.reach}%</span>
                    </td>
                    <td className="px-2 py-2">
                      <NumberField
                        value={ch.spend}
                        onValueChange={(spend) => onUpdate(ch.id, { spend })}
                        min={0}
                        max={1e12}
                        integer
                        aria-label={`${label} spend in ${currency}`}
                        className="h-9 print:hidden"
                      />
                      <span className="hidden print:inline">{fmtMoney(ch.spend, currency)}</span>
                    </td>
                    <td className="whitespace-nowrap px-2 py-2 text-right tabular-nums">
                      {fmtInt(Math.round((ch.reach / 100) * universe))}
                    </td>
                    <td className="whitespace-nowrap px-2 py-2 text-right font-semibold tabular-nums">
                      {r ? fmtInt(r.incrementalReach) : "—"}
                    </td>
                    <td className="whitespace-nowrap px-2 py-2 text-right tabular-nums">{r ? fmtCPIR(r.cpir, currency) : "—"}</td>
                    <td className="py-2 pl-2 pr-5 sm:pr-2 print:hidden">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-muted-foreground hover:text-destructive"
                        onClick={() => onRemove(ch.id)}
                        aria-label={`Delete ${label}`}
                      >
                        <X className="h-4 w-4" aria-hidden="true" />
                      </Button>
                    </td>
                  </tr>
                );
              })}
              {channels.length === 0 && (
                <tr>
                  <td colSpan={8} className="px-5 py-8 text-center text-muted-foreground">
                    No channels yet — add one to start planning.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
        {atLimit && <p className="px-5 pt-2 text-xs text-muted-foreground sm:px-0">Maximum of {MAX_CHANNELS} channels.</p>}
      </CardContent>
    </Card>
  );
}
