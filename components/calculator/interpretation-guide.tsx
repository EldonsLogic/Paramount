import { BookOpen } from "lucide-react";
import { CollapsibleSection } from "./collapsible-section";

const GUIDE: [string, string][] = [
  [
    "Total deduplicated reach",
    "This is the only reach figure that matters. The sum of individual channel reaches overcounts because people appear on multiple platforms. Below 50% of universe = room to expand. Above 70% = diminishing returns territory.",
  ],
  [
    "Incremental reach ranking",
    "The channel ranked #1 is adding the most net-new unique people to your plan. This should be the first channel funded (after anchor GRP thresholds on TV are met). The last-ranked channel is the first to cut when budgets tighten.",
  ],
  [
    "CPIR",
    "Compare CPIR across channels, not in isolation. A channel with $0.30 CPIR might be rated “Efficient” if all other channels are $0.50+. Only cut a channel if both its incremental reach AND its CPIR are unfavorable.",
  ],
  [
    "The overlap slider",
    "If you are unsure, start at 25% for mixed audiences and 40%+ for mass-market FMCG campaigns (like food brands). Higher overlap = more conservative, more realistic reach estimates.",
  ],
  [
    "Order dependency",
    "Incremental reach results depend on what channels are already in the mix. A channel evaluated alone will show higher incremental reach than the same channel added to a plan that already includes a similar platform.",
  ],
];

export function InterpretationGuide() {
  return (
    <CollapsibleSection title="How to interpret results" icon={<BookOpen className="h-4 w-4 text-primary" aria-hidden="true" />}>
      <div className="grid gap-5 md:grid-cols-2">
        {GUIDE.map(([h, body]) => (
          <div key={h}>
            <h3 className="text-sm font-semibold">{h}</h3>
            <p className="mt-1 text-sm leading-relaxed text-muted-foreground">{body}</p>
          </div>
        ))}
      </div>
    </CollapsibleSection>
  );
}
