import { Card, CardContent } from "@/components/ui/card";
import { fmtCPIR, fmtInt, fmtMoney, fmtPct, per1KLabel } from "@/lib/format";
import type { CampaignResult, CurrencyCode } from "@/lib/types";

function Metric({ label, value, sub }: { label: string; value: string; sub: string }) {
  return (
    <Card className="print-avoid-break">
      <CardContent className="p-4 sm:p-5">
        <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">{label}</p>
        <p className="mt-2 break-words text-2xl font-semibold tabular-nums tracking-tight sm:text-[1.75rem]">{value}</p>
        <p className="mt-1 text-sm text-muted-foreground">{sub}</p>
      </CardContent>
    </Card>
  );
}

export function SummaryMetrics({ result, currency }: { result: CampaignResult; currency: CurrencyCode }) {
  return (
    <section aria-label="Summary metrics" className="grid grid-cols-1 gap-4 xs:grid-cols-2 lg:grid-cols-4 print:grid-cols-4">
      <Metric
        label="Total Deduplicated Reach"
        value={fmtInt(result.totalDeduplicatedReach)}
        sub={`${fmtPct(result.totalDeduplicatedReachPct)} of universe`}
      />
      <Metric label="Total Media Spend" value={fmtMoney(result.totalSpend, currency)} sub={`${result.channelResults.length} active channels`} />
      <Metric label="Average CPIR" value={fmtCPIR(result.averageCPIR, currency)} sub="per incremental person" />
      <Metric label={`Reach per ${per1KLabel(currency)} Spent`} value={fmtInt(result.reachPer1KSpend)} sub="people" />
    </section>
  );
}
