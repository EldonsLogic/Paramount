export interface Channel {
  id: string;
  name: string;
  reach: number; // 1–99 (% of universe)
  spend: number; // in the campaign currency
  enabled: boolean;
  color: string;
}

export type CurrencyCode = "USD" | "EUR" | "GBP" | "AED" | "SAR" | "EGP";

export interface CampaignConfig {
  universe: number;
  overlapPct: number; // 5–70
  currency: CurrencyCode; // display only — no FX conversion
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
  reach: number;
  color: string;
}
