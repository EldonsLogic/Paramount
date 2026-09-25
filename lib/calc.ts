import type {
  CampaignConfig,
  CampaignResult,
  Channel,
  ChannelResult,
  EfficiencyRating,
  OverlapBenchmark,
  ReachCurvePoint,
} from "./types";

/** Total Overlap Model — combined deduplicated reach fraction (0–1) with one global overlap. */
export function dedup(channels: Channel[], overlapPct: number): number {
  if (channels.length === 0) return 0;
  const ov = overlapPct / 100;
  let unreach = 1;
  channels.forEach((ch) => {
    unreach *= 1 - (ch.reach / 100) * (1 - ov);
  });
  return 1 - unreach;
}

/** Applied overlap for a benchmark range (midpoint), in %. */
export const benchmarkValue = (b: OverlapBenchmark) => (b.low + b.high) / 2;

/** The benchmark covering a pair of channels. Later rows win, so user-added pairs override the defaults. */
export function findBenchmark(a: Channel, b: Channel, benchmarks: OverlapBenchmark[]): OverlapBenchmark | undefined {
  for (let i = benchmarks.length - 1; i >= 0; i--) {
    const bm = benchmarks[i];
    if ((bm.a.includes(a.category) && bm.b.includes(b.category)) || (bm.a.includes(b.category) && bm.b.includes(a.category))) {
      return bm;
    }
  }
  return undefined;
}

/** Overlap % between two channels: benchmark midpoint when enabled and one matches, else the global slider. */
export function pairOverlap(a: Channel, b: Channel, config: Pick<CampaignConfig, "overlapPct" | "useBenchmarks" | "benchmarks">): number {
  if (!config.useBenchmarks) return config.overlapPct;
  const bm = findBenchmark(a, b, config.benchmarks);
  return bm ? benchmarkValue(bm) : config.overlapPct;
}

type OverlapConfig = Pick<CampaignConfig, "overlapPct" | "useBenchmarks" | "benchmarks">;

/**
 * TOM with pairwise overlaps. Each channel's overlap is the reach-weighted average of its overlap
 * with every other channel in the set, then fed into the standard TOM product. With benchmarks off
 * (or a single channel) this is exactly `dedup(channels, overlapPct)`.
 */
export function dedupMix(channels: Channel[], config: OverlapConfig): number {
  if (!config.useBenchmarks || channels.length < 2) return dedup(channels, config.overlapPct);
  let unreach = 1;
  channels.forEach((ch) => {
    let weighted = 0;
    let weight = 0;
    channels.forEach((other) => {
      if (other.id === ch.id) return;
      weighted += other.reach * pairOverlap(ch, other, config);
      weight += other.reach;
    });
    const ov = (weight > 0 ? weighted / weight : config.overlapPct) / 100;
    unreach *= 1 - (ch.reach / 100) * (1 - ov);
  });
  return 1 - unreach;
}

/** Net-new people a channel adds beyond the rest of the mix. */
export function incrementalReach(channel: Channel, allChannels: Channel[], config: OverlapConfig, universe: number): number {
  const withAll = dedupMix(allChannels, config);
  const without = dedupMix(
    allChannels.filter((c) => c.id !== channel.id),
    config
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
  const { universe } = config;
  const active = config.channels.filter((c) => c.enabled);

  const partial = active.map((channel) => {
    const inc = incrementalReach(channel, active, config, universe);
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

  const reachFraction = dedupMix(active, config);
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
  const points: ReachCurvePoint[] = [{ label: "Baseline (0)", reach: 0, added: 0, color: "#94a3b8" }];
  const added: Channel[] = [];
  for (const r of result.channelResults) {
    added.push(r.channel);
    const reach = Math.round(dedupMix(added, config) * config.universe);
    points.push({
      label: r.channel.name || "Untitled",
      reach,
      added: reach - points[points.length - 1].reach,
      color: r.channel.color,
    });
  }
  return points;
}

/** Estimated % of universe exposed to both channels i and j. Diagonal = own reach. */
export function overlapMatrix(channels: Channel[], config: OverlapConfig): number[][] {
  return channels.map((a, i) =>
    channels.map((b, j) => (i === j ? a.reach : (a.reach / 100) * (b.reach / 100) * (pairOverlap(a, b, config) / 100) * 100))
  );
}
