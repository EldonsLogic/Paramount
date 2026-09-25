import { CURRENCIES } from "./format";
import type { CampaignConfig, Channel, CurrencyCode } from "./types";

export const STORAGE_KEY = "irc_campaign_v1";

export const PALETTE = ["#378ADD", "#1D9E75", "#D85A30", "#D4537E", "#BA7517", "#634AB7", "#639922", "#E24B4A"];

export const UNIVERSE_MIN = 1;
export const UNIVERSE_MAX = 10_000_000_000;
export const OVERLAP_MIN = 5;
export const OVERLAP_MAX = 70;
export const MAX_CHANNELS = 20;

export function uid(): string {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) return crypto.randomUUID();
  return Math.random().toString(36).slice(2) + Date.now().toString(36);
}

const DEFAULT_CHANNELS: Omit<Channel, "id">[] = [
  { name: "TV (Linear)", reach: 45, spend: 500_000, enabled: true, color: "#378ADD" },
  { name: "Digital Display", reach: 30, spend: 150_000, enabled: true, color: "#1D9E75" },
  { name: "Online Video", reach: 25, spend: 200_000, enabled: true, color: "#D85A30" },
  { name: "Social Media", reach: 35, spend: 180_000, enabled: true, color: "#D4537E" },
  { name: "CTV / Streaming", reach: 20, spend: 220_000, enabled: true, color: "#BA7517" },
];

export function defaultConfig(): CampaignConfig {
  return {
    universe: 10_000_000,
    overlapPct: 25,
    currency: "USD",
    // Deterministic ids keep server and client renders identical
    channels: DEFAULT_CHANNELS.map((c, i) => ({ ...c, id: `default-${i + 1}` })),
  };
}

export function newChannel(existing: Channel[]): Channel {
  return {
    id: uid(),
    name: `New Channel ${existing.length + 1}`,
    reach: 15,
    spend: 100_000,
    enabled: true,
    color: PALETTE[existing.length % PALETTE.length],
  };
}

const clamp = (n: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, n));
const num = (v: unknown, fallback: number) => (typeof v === "number" && Number.isFinite(v) ? v : fallback);

/** Coerce untrusted input (localStorage, request bodies) into a valid CampaignConfig. */
export function sanitizeConfig(raw: unknown): CampaignConfig | null {
  if (!raw || typeof raw !== "object") return null;
  const r = raw as Record<string, unknown>;
  if (!Array.isArray(r.channels)) return null;
  const channels: Channel[] = r.channels.slice(0, MAX_CHANNELS).map((c, i) => {
    const ch = (c ?? {}) as Record<string, unknown>;
    const color = typeof ch.color === "string" && /^#[0-9a-fA-F]{6}$/.test(ch.color) ? ch.color : PALETTE[i % PALETTE.length];
    return {
      id: typeof ch.id === "string" && ch.id ? ch.id.slice(0, 64) : uid(),
      name: typeof ch.name === "string" ? ch.name.slice(0, 80) : `Channel ${i + 1}`,
      reach: clamp(num(ch.reach, 10), 1, 99),
      spend: clamp(num(ch.spend, 0), 0, 1e12),
      enabled: ch.enabled !== false,
      color,
    };
  });
  return {
    universe: Math.round(clamp(num(r.universe, 10_000_000), UNIVERSE_MIN, UNIVERSE_MAX)),
    overlapPct: clamp(num(r.overlapPct, 25), OVERLAP_MIN, OVERLAP_MAX),
    currency: CURRENCIES.some((c) => c.code === r.currency) ? (r.currency as CurrencyCode) : "USD",
    channels,
  };
}
