import type { CampaignConfig, CampaignResult, Channel, ChannelResult, EfficiencyRating, ReachCurvePoint } from "./types";

/** Total Overlap Model — combined deduplicated reach fraction (0–1). */
export function dedup(channels: Channel[], overlapPct: number): number {
  if (channels.length === 0) return 0;
  const ov = overlapPct / 100;
  let unreach = 1;
  channels.forEach((ch) => {
    unreach *= 1 - (ch.reach / 100) * (1 - ov);
  });
  return 1 - unreach;
}

/** Net-new people a channel adds beyond the rest of the mix. */
export function incrementalReach(channel: Channel, allChannels: Channel[], overlapPct: number, universe: number): number {
  const withAll = dedup(allChannels, overlapPct);
  const without = dedup(
    allChannels.filter((c) => c.id !== channel.id),
    overlapPct
  );
  return Math.round((withAll - without) * universe);
}

/** Cost per incremental reach. */
export function cpir(spend: number, incrementalPeople: number): number {
  return spend > 0 && incrementalPeople > 0 ? spend / incrementalPeople : 0;
}

/** Efficient = bottom third of CPIR range, Average = middle, Costly = top third. */
function rate(value: number, spend: number, min: number, max: number): EfficiencyRating {
  if (value <= 0) return spend > 0 ? "Costly" : "Efficient"; // spend with no incremental reach is the worst case
  const range = max - min;
  if (range <= 0) return "Efficient";
  const pos = (value - min) / range;
  if (pos <= 1 / 3) return "Efficient";
  if (pos <= 2 / 3) return "Average";
  return "Costly";
}

export function calculateCampaign(config: CampaignConfig): CampaignResult {
  const { universe, overlapPct } = config;
  const active = config.channels.filter((c) => c.enabled);

  const partial = active.map((channel) => {
    const inc = incrementalReach(channel, active, overlapPct, universe);
    return {
      channel,
      uniqueReach: Math.round((channel.reach / 100) * universe),
      incrementalReach: inc,
      cpir: cpir(channel.spend, inc),
    };
  });

  const cpirs = partial.map((p) => p.cpir).filter((v) => v > 0);
  const min = cpirs.length ? Math.min(...cpirs) : 0;
  const max = cpirs.length ? Math.max(...cpirs) : 0;

  const channelResults: ChannelResult[] = partial
    .map((p) => ({ ...p, efficiencyRating: rate(p.cpir, p.channel.spend, min, max) }))
    .sort((a, b) => b.incrementalReach - a.incrementalReach);

  const reachFraction = dedup(active, overlapPct);
  const totalDeduplicatedReach = Math.round(reachFraction * universe);
  const totalSpend = active.reduce((s, c) => s + c.spend, 0);
  const totalIncremental = channelResults.reduce((s, r) => s + r.incrementalReach, 0);

  return {
    totalDeduplicatedReach,
    totalDeduplicatedReachPct: reachFraction * 100,
    totalSpend,
    // Spend-weighted average: total spend ÷ total incremental people
    averageCPIR: cpir(totalSpend, totalIncremental),
    reachPer1KSpend: totalSpend > 0 ? totalDeduplicatedReach / (totalSpend / 1000) : 0,
    channelResults,
  };
}

/** Cumulative dedup reach as channels are added in order of incremental contribution. */
export function reachCurve(config: CampaignConfig, result: CampaignResult): ReachCurvePoint[] {
  const points: ReachCurvePoint[] = [{ label: "Baseline (0)", reach: 0, color: "#94a3b8" }];
  const added: Channel[] = [];
  for (const r of result.channelResults) {
    added.push(r.channel);
    points.push({
      label: r.channel.name || "Untitled",
      reach: Math.round(dedup(added, config.overlapPct) * config.universe),
      color: r.channel.color,
    });
  }
  return points;
}

/** Estimated % of universe exposed to both channels i and j. Diagonal = own reach. */
export function overlapMatrix(channels: Channel[], overlapPct: number): number[][] {
  const ov = overlapPct / 100;
  return channels.map((a, i) =>
    channels.map((b, j) => (i === j ? a.reach : (a.reach / 100) * (b.reach / 100) * ov * 100))
  );
}
