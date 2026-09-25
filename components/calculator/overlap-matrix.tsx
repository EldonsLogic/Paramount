import { overlapMatrix } from "@/lib/calc";
import type { Channel } from "@/lib/types";

interface OverlapMatrixProps {
  channels: Channel[]; // enabled channels only
  overlapPct: number;
}

export function OverlapMatrix({ channels, overlapPct }: OverlapMatrixProps) {
  if (channels.length === 0) {
    return <p className="py-8 text-center text-sm text-muted-foreground">Enable at least one channel to see the overlap matrix.</p>;
  }

  const m = overlapMatrix(channels, overlapPct);
  const offDiag = m.flatMap((row, i) => row.filter((_, j) => i !== j));
  const max = Math.max(0.0001, ...offDiag);

  return (
    <div>
      <p className="rounded-md bg-muted px-4 py-6 text-center text-sm text-muted-foreground xs:hidden print:hidden">
        View on desktop for full matrix
      </p>
      <div className="hidden xs:block print:!block">
        <div className="relative overflow-x-auto">
          <table className="border-separate border-spacing-1 text-xs sm:text-sm">
            <caption className="sr-only">Estimated percentage of universe exposed to both channels</caption>
            <thead>
              <tr>
                <th scope="col">
                  <span className="sr-only">Channel</span>
                </th>
                {channels.map((c) => (
                  <th key={c.id} scope="col" className="max-w-[110px] px-1 pb-1 align-bottom font-medium text-muted-foreground">
                    <span className="flex items-center justify-center gap-1.5">
                      <span className="h-2 w-2 shrink-0 rounded-full" style={{ backgroundColor: c.color }} aria-hidden="true" />
                      <span className="line-clamp-2 break-words">{c.name || "Untitled"}</span>
                    </span>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {m.map((row, i) => (
                <tr key={channels[i].id}>
                  <th scope="row" className="max-w-[140px] whitespace-nowrap pr-2 text-left font-medium text-muted-foreground">
                    <span className="flex items-center gap-1.5">
                      <span className="h-2 w-2 shrink-0 rounded-full" style={{ backgroundColor: channels[i].color }} aria-hidden="true" />
                      <span className="truncate">{channels[i].name || "Untitled"}</span>
                    </span>
                  </th>
                  {row.map((v, j) => {
                    const diag = i === j;
                    const t = diag ? 1 : v / max;
                    const bg = diag ? "#0D1B2A" : `rgba(29, 95, 170, ${(0.06 + t * 0.84).toFixed(3)})`;
                    const light = diag || t > 0.5;
                    return (
                      <td
                        key={channels[j].id}
                        className="min-w-[64px] rounded-md px-2 py-2.5 text-center font-medium tabular-nums"
                        style={{ backgroundColor: bg, color: light ? "#fff" : "#0D1B2A" }}
                        title={diag ? `${channels[i].name}: own reach` : `${channels[i].name} × ${channels[j].name}`}
                      >
                        {v.toFixed(1)}%
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className="mt-3 text-xs text-muted-foreground">
          Darker cells = more audience duplication between those channels. Diagonal shows each channel&rsquo;s own reach. Cell = (Rᵢ × Rⱼ ×
          overlap) as % of universe.
        </p>
      </div>
    </div>
  );
}
