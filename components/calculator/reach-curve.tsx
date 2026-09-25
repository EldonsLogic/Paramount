"use client";

import { Area, CartesianGrid, ComposedChart, Line, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
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

function Chart({ data, universe, width, height, fillId }: ReachCurveProps & { width?: number; height?: number; fillId: string }) {
  return (
    <ComposedChart data={data} width={width} height={height} margin={{ top: 16, right: 28, bottom: 8, left: 28 }}>
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
      <Tooltip
        formatter={(v: number) => [`${fmtInt(v)} (${fmtPct((v / universe) * 100)})`, "Cumulative reach"]}
        contentStyle={{ borderRadius: 8, border: "1px solid #e2e8f0", fontSize: 12 }}
      />
      <Area type="monotone" dataKey="reach" stroke="none" fill={`url(#${fillId})`} isAnimationActive={false} />
      <Line
        type="monotone"
        dataKey="reach"
        stroke="#378ADD"
        strokeWidth={2.5}
        dot={<ColoredDot />}
        activeDot={{ r: 7 }}
        isAnimationActive={false}
      />
    </ComposedChart>
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
        <span className="font-medium text-foreground">{fmtInt(final)}</span> people.
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
      {/* Also rasterised into the Outlook email draft — keep the id in sync with email-plan.tsx. */}
      <div id="reach-curve-fixed" className="hidden print:block">
        <Chart data={data} universe={universe} width={680} height={300} fillId="reachFillPrint" />
      </div>
    </figure>
  );
}
