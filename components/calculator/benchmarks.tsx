import { BarChart3 } from "lucide-react";
import { CollapsibleSection } from "./collapsible-section";

const BENCHMARKS: [string, string][] = [
  ["TV ↔ Digital Video", "20–35%"],
  ["TV ↔ CTV", "15–25%"],
  ["TV ↔ Social", "25–45%"],
  ["Digital ↔ Social", "35–55%"],
  ["CTV ↔ Digital Video", "30–50%"],
  ["OOH ↔ Any Digital", "10–20%"],
];

export function Benchmarks() {
  return (
    <CollapsibleSection
      title="Industry overlap benchmarks — use these to calibrate your overlap slider"
      icon={<BarChart3 className="h-4 w-4 text-primary" aria-hidden="true" />}
    >
      <table className="w-full max-w-md text-sm">
        <thead>
          <tr className="border-b">
            <th className="py-2 text-left text-xs font-medium uppercase tracking-wide text-muted-foreground">Channel pair</th>
            <th className="py-2 text-right text-xs font-medium uppercase tracking-wide text-muted-foreground">Typical overlap</th>
          </tr>
        </thead>
        <tbody>
          {BENCHMARKS.map(([pair, range]) => (
            <tr key={pair} className="border-b last:border-0">
              <td className="py-2">{pair}</td>
              <td className="py-2 text-right font-medium tabular-nums">{range}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </CollapsibleSection>
  );
}
