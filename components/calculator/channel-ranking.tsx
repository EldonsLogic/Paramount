import { Badge } from "@/components/ui/badge";
import { fmtCPIR, fmtInt } from "@/lib/format";
import type { CampaignResult, CurrencyCode, EfficiencyRating } from "@/lib/types";

const badgeVariant: Record<EfficiencyRating, "efficient" | "average" | "costly"> = {
  Efficient: "efficient",
  Average: "average",
  Costly: "costly",
};

const th = "px-1 py-2 sm:px-2 text-left text-xs font-medium uppercase tracking-wide text-muted-foreground whitespace-nowrap";

export function ChannelRanking({ result, currency }: { result: CampaignResult; currency: CurrencyCode }) {
  const rows = result.channelResults;
  const max = Math.max(1, ...rows.map((r) => r.incrementalReach));

  if (rows.length === 0) {
    return <p className="py-8 text-center text-sm text-muted-foreground">Enable at least one channel to see the ranking.</p>;
  }

  return (
    <div className="relative overflow-x-auto">
      <table className="w-full border-collapse text-[13px] sm:min-w-[540px] sm:text-sm print:min-w-0">
        <caption className="sr-only">Channels ranked by incremental reach</caption>
        <thead>
          <tr className="border-b">
            <th className={`${th} w-8 sm:w-10`}>#</th>
            <th className={th}>Channel</th>
            <th className={`${th} hidden w-[32%] sm:table-cell print:table-cell`}>
              <span className="sr-only">Relative incremental reach</span>
            </th>
            <th className={`${th} text-right`}>
              <span className="sm:hidden">Incr. reach</span>
              <span className="hidden sm:inline">Incremental reach</span>
            </th>
            <th className={`${th} text-right`}>CPIR</th>
            <th className={`${th} hidden text-right sm:table-cell print:table-cell`}>Efficiency</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((r, i) => (
            <tr key={r.channel.id} className="border-b last:border-0">
              <td className="px-1 py-3 tabular-nums text-muted-foreground sm:px-2">{i + 1}</td>
              <td className="px-1 py-3 sm:px-2">
                <span className="flex items-start gap-2 font-medium">
                  <span className="mt-1 h-2.5 w-2.5 shrink-0 rounded-full" style={{ backgroundColor: r.channel.color }} aria-hidden="true" />
                  <span className="break-words">{r.channel.name || "Untitled"}</span>
                </span>
                {/* On phones the bar sits under the name instead of in its own column. */}
                <div className="mt-1.5 h-1.5 w-full rounded-full bg-muted sm:hidden print:hidden" aria-hidden="true">
                  <div
                    className="h-1.5 rounded-full"
                    style={{ width: `${Math.max(1, (r.incrementalReach / max) * 100)}%`, backgroundColor: r.channel.color }}
                  />
                </div>
              </td>
              <td className="hidden px-1 py-3 sm:px-2 sm:table-cell print:table-cell" aria-hidden="true">
                <div className="h-2.5 w-full rounded-full bg-muted">
                  <div
                    className="h-2.5 rounded-full transition-[width] duration-300"
                    style={{
                      width: `${Math.max(1, (r.incrementalReach / max) * 100)}%`,
                      backgroundColor: r.channel.color,
                    }}
                  />
                </div>
              </td>
              <td className="whitespace-nowrap px-1 py-3 sm:px-2 text-right font-semibold tabular-nums">{fmtInt(r.incrementalReach)}</td>
              <td className="px-1 py-3 text-right tabular-nums sm:whitespace-nowrap sm:px-2">
                {fmtCPIR(r.cpir, currency)}
                <Badge variant={badgeVariant[r.efficiencyRating]} className="mt-1 flex w-fit px-2 text-[10px] ml-auto sm:hidden print:hidden">
                  {r.efficiencyRating}
                </Badge>
              </td>
              <td className="hidden px-1 py-3 sm:px-2 text-right sm:table-cell print:table-cell">
                <Badge variant={badgeVariant[r.efficiencyRating]}>{r.efficiencyRating}</Badge>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
