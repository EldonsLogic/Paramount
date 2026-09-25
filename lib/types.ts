export type ChannelCategory = "tv" | "video" | "ctv" | "social" | "display" | "ooh" | "audio" | "other";

/** An editable industry overlap range for a pair of channel types. Applied value = midpoint. */
export interface OverlapBenchmark {
  id: string;
  label: string;
  a: ChannelCategory[];
  b: ChannelCategory[];
  low: number; // %
  high: number; // %
}

export interface Channel {
  id: string;
  name: string;
  reach: number; // 1–99 (% of universe)
  spend: number; // in the campaign currency
  enabled: boolean;
  color: string;
  category: ChannelCategory; // drives which benchmark applies to each channel pair
}

export type CurrencyCode = "USD" | "EUR" | "GBP" | "AED" | "SAR" | "EGP";

export interface CampaignConfig {
  universe: number;
  overlapPct: number; // 5–70
  currency: CurrencyCode; // display only — no FX conversion
  useBenchmarks: boolean; // true = per-pair overlap from benchmarks; false = single global overlapPct
  benchmarks: OverlapBenchmark[];
  channels: Channel[];
}

export type EfficiencyRating = "Efficient" | "Average" | "Costly";

export interface ChannelResult {
  channel: Channel;
  uniqueReach: number;
  incrementalReach: number;
  cpir: number;
  efficiencyRating: EfficiencyRating;
}

export interface CampaignResult {
  totalDeduplicatedReach: number;
  totalDeduplicatedReachPct: number;
  totalSpend: number;
  averageCPIR: number;
  reachPer1KSpend: number;
  channelResults: ChannelResult[]; // enabled channels, sorted by incrementalReach desc
}

export interface ReachCurvePoint {
  label: string;
  reach: number; // cumulative deduplicated people
  added: number; // people added at this step (vs the previous point)
  color: string;
}
