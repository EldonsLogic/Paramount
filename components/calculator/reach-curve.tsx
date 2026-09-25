"use client";

import { Area, CartesianGrid, ComposedChart, LabelList, Line, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { fmtCompact, fmtInt, fmtPct } from "@/lib/format";
import type { ReachCurvePoint } from "@/lib/types";

interface ReachCurveProps {
  data: ReachCurvePoint[];
  universe: number;
}

interface DotProps {
  cx?: number;
  cy?: number;
  payload?: ReachCurvePoint;
  index?: number;
}

function ColoredDot({ cx, cy, payload, index }: DotProps) {
  if (cx == null || cy == null || !payload) return null;
  return <circle key={index} cx={cx} cy={cy} r={5} fill={payload.color} stroke="#fff" strokeWidth={2} />;
}

function truncate(s: string, n = 14) {
  return s.length > n ? `${s.slice(0, n - 1)}…` : s;
}

interface TooltipProps {
  active?: boolean;
  payload?: { payload: ReachCurvePoint }[];
  universe: number;
}

function CurveTooltip({ active, payload, universe }: TooltipProps) {
  const p = active && payload?.[0]?.payload;
  if (!p) return null;
  return (
    <div className="max-w-[220px] rounded-lg border bg-white px-3 py-2 text-xs shadow-sm sm:max-w-none">
      <p className="mb-1 flex items-center gap-1.5 font-semibold text-foreground">
        <span className="h-2 w-2 rounded-full" style={{ backgroundColor: p.color }} aria-hidden="true" />
        {p.label}
      </p>
      <p>
        Cumulative reach: <span className="font-medium tabular-nums">{fmtInt(p.reach)}</span>{" "}
        <span className="text-muted-foreground">({fmtPct((p.reach / universe) * 100)})</span>
      </p>
      {p.added > 0 && (
        <p className="text-muted-foreground">
          Added at this step: <span className="tabular-nums">+{fmtInt(p.added)}</span>
        </p>
      )}
    </div>
  );
}

interface PointLabelProps {
  x?: number | string;
  y?: number | string;
  index?: number;
}

/** Static value labels for the print/email chart, where there is no hover tooltip. */
function pointLabel(data: ReachCurvePoint[], universe: number) {
  function PointLabel({ x, y, index }: PointLabelProps) {
    const p = index != null ? data[index] : undefined;
    if (!p || index === 0 || x == null || y == null) return null;
    const cx = Number(x);
    const cy = Number(y);
    return (
      <text x={cx} y={cy - 26} textAnchor="middle" fontSize={11} fill="#0D1B2A">
        <tspan fontWeight={700}>{fmtCompact(p.reach)}</tspan>
        <tspan x={cx} dy={12} fill="#52606d" fontSize={10}>
          {fmtPct((p.reach / universe) * 100)}
        </tspan>
      </text>
    );
  }
  return PointLabel;
}

function Chart({
  data,
  universe,
  width,
  height,
  fillId,
  showLabels,
}: ReachCurveProps & { width?: number; height?: number; fillId: string; showLabels?: boolean }) {
  return (
    <ComposedChart
      data={data}
      width={width}
      height={height}
      margin={{ top: showLabels ? 34 : 16, right: showLabels ? 40 : 28, bottom: 8, left: 28 }}
    >
      <defs>
        <linearGradient id={fillId} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#378ADD" stopOpacity={0.35} />
          <stop offset="100%" stopColor="#378ADD" stopOpacity={0.03} />
        </linearGradient>
      </defs>
      <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" vertical={false} />
      <XAxis
        dataKey="label"
        interval={0}
        tick={{ fontSize: 11, fill: "#52606d" }}
        tickFormatter={(v: string) => truncate(v)}
        angle={-30}
        textAnchor="end"
        height={70}
        tickLine={false}
        axisLine={{ stroke: "#cbd5e1" }}
      />
      <YAxis
        tickFormatter={(v: number) => fmtCompact(v)}
        tick={{ fontSize: 11, fill: "#52606d" }}
        width={48}
        tickLine={false}
        axisLine={false}
        domain={[0, "auto"]}
        allowDecimals={false}
      />
      {!showLabels && <Tooltip content={<CurveTooltip universe={universe} />} />}
      {/* Area is decoration only — keep it out of the tooltip so the value isn't listed twice. */}
      <Area type="monotone" dataKey="reach" stroke="none" fill={`url(#${fillId})`} isAnimationActive={false} tooltipType="none" activeDot={false} />
      <Line
        type="monotone"
        dataKey="reach"
        stroke="#378ADD"
        strokeWidth={2.5}
        dot={<ColoredDot />}
        activeDot={{ r: 7 }}
        isAnimationActive={false}
      >
        {showLabels && <LabelList dataKey="reach" content={pointLabel(data, universe)} />}
      </Line>
    </ComposedChart>
  );
}

function BuildUpTable({ data, universe }: ReachCurveProps) {
  const th = "px-1.5 py-1.5 text-xs font-medium sm:px-2 uppercase tracking-wide text-muted-foreground whitespace-nowrap";
  return (
    <div className="relative mt-4 overflow-x-auto print-avoid-break">
      <table className="w-full border-collapse text-[13px] sm:text-sm">
        <caption className="sr-only">Reach build-up by channel</caption>
        <thead>
          <tr className="border-b">
            <th className={`${th} text-left`}>Step</th>
            <th className={`${th} hidden text-right sm:table-cell print:table-cell`}>Added</th>
            <th className={`${th} text-right`}>Cumulative</th>
            <th className={`${th} hidden text-right sm:table-cell print:table-cell`}>% universe</th>
          </tr>
        </thead>
        <tbody>
          {data.slice(1).map((p, i) => (
            <tr key={`${p.label}-${i}`} className="border-b last:border-0">
              <td className="px-1.5 py-1.5 sm:px-2">
                <span className="flex items-start gap-1.5">
                  <span className="text-muted-foreground tabular-nums">{i + 1}.</span>
                  <span className="mt-1.5 h-2 w-2 shrink-0 rounded-full" style={{ backgroundColor: p.color }} aria-hidden="true" />
                  <span className="break-words">{p.label}</span>
                </span>
                <span className="block pl-5 text-xs text-muted-foreground tabular-nums sm:hidden print:hidden">+{fmtInt(p.added)} added</span>
              </td>
              <td className="hidden whitespace-nowrap px-1.5 py-1.5 text-right tabular-nums text-muted-foreground sm:table-cell sm:px-2 print:table-cell">
                +{fmtInt(p.added)}
              </td>
              <td className="whitespace-nowrap px-1.5 py-1.5 sm:px-2 text-right font-semibold tabular-nums">
                {fmtInt(p.reach)}
                <span className="block text-xs font-normal text-muted-foreground sm:hidden print:hidden">{fmtPct((p.reach / universe) * 100)}</span>
              </td>
              <td className="hidden whitespace-nowrap px-1.5 py-1.5 sm:px-2 text-right tabular-nums sm:table-cell print:table-cell">
                {fmtPct((p.reach / universe) * 100)}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export function ReachCurve({ data, universe, visible }: ReachCurveProps & { visible: boolean }) {
  if (data.length <= 1) {
    return <p className="py-8 text-center text-sm text-muted-foreground">Enable at least one channel to see the reach curve.</p>;
  }
  const final = data[data.length - 1].reach;
  return (
    <figure>
      <figcaption className="mb-2 text-sm text-muted-foreground">
        Cumulative deduplicated reach as channels are added in order of incremental contribution — reaching{" "}
        <span className="font-medium text-foreground">{fmtInt(final)}</span> people ({fmtPct((final / universe) * 100)} of universe).
      </figcaption>
      {/* Responsive chart on screen; fixed-size copy for print (ResponsiveContainer can't measure hidden/print layouts). */}
      <div className="h-[320px] w-full sm:h-[360px] print:hidden">
        {/* Mount only while visible: ResponsiveContainer measures 0×0 inside a hidden tab. */}
        {visible && (
          <ResponsiveContainer width="100%" height="100%">
            <Chart data={data} universe={universe} fillId="reachFillScreen" />
          </ResponsiveContainer>
        )}
      </div>
      {/* Labelled copy for print and the Outlook email (rasterised) — keep the id in sync with email-plan.tsx. */}
      <div id="reach-curve-fixed" className="hidden print:block">
        <Chart data={data} universe={universe} width={680} height={320} fillId="reachFillPrint" showLabels />
      </div>
      <BuildUpTable data={data} universe={universe} />
    </figure>
  );
}
