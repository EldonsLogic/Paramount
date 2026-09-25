import { CURRENCIES } from "./format";
import type { CampaignConfig, Channel, ChannelCategory, CurrencyCode, OverlapBenchmark } from "./types";

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

export const CATEGORIES: { id: ChannelCategory; label: string }[] = [
  { id: "tv", label: "TV" },
  { id: "video", label: "Digital Video" },
  { id: "ctv", label: "CTV" },
  { id: "social", label: "Social" },
  { id: "display", label: "Digital Display" },
  { id: "ooh", label: "OOH" },
  { id: "audio", label: "Audio" },
  { id: "other", label: "Other" },
];
const CATEGORY_IDS = CATEGORIES.map((c) => c.id);
export const categoryLabel = (c: ChannelCategory) => CATEGORIES.find((x) => x.id === c)?.label ?? c;

/** Best guess at a channel's type from its name (user can change it). */
export function inferCategory(name: string): ChannelCategory {
  const n = name.toLowerCase();
  if (/\bctv\b|stream|connected tv|ott/.test(n)) return "ctv";
  if (/\btv\b|television|linear|broadcast/.test(n)) return "tv";
  if (/video|olv|youtube|pre-?roll/.test(n)) return "video";
  if (/social|facebook|instagram|tiktok|snap|meta|linkedin|twitter|\bx\b/.test(n)) return "social";
  if (/ooh|outdoor|billboard|dooh|transit/.test(n)) return "ooh";
  if (/radio|audio|podcast|spotify|anghami/.test(n)) return "audio";
  if (/display|banner|programmatic|digital|native|search/.test(n)) return "display";
  return "other";
}

const DEFAULT_BENCHMARKS: OverlapBenchmark[] = [
  { id: "tv-video", label: "TV ↔ Digital Video", a: ["tv"], b: ["video"], low: 20, high: 35 },
  { id: "tv-ctv", label: "TV ↔ CTV", a: ["tv"], b: ["ctv"], low: 15, high: 25 },
  { id: "tv-social", label: "TV ↔ Social", a: ["tv"], b: ["social"], low: 25, high: 45 },
  { id: "digital-social", label: "Digital ↔ Social", a: ["display", "video"], b: ["social"], low: 35, high: 55 },
  { id: "ctv-video", label: "CTV ↔ Digital Video", a: ["ctv"], b: ["video"], low: 30, high: 50 },
  { id: "ooh-digital", label: "OOH ↔ Any Digital", a: ["ooh"], b: ["display", "video", "ctv", "social"], low: 10, high: 20 },
];

export const defaultBenchmarks = (): OverlapBenchmark[] => DEFAULT_BENCHMARKS.map((b) => ({ ...b, a: [...b.a], b: [...b.b] }));

export const BENCHMARK_MIN = 0;
export const BENCHMARK_MAX = 90;

const DEFAULT_CHANNELS: Omit<Channel, "id">[] = [
  { name: "TV (Linear)", reach: 45, spend: 500_000, enabled: true, color: "#378ADD", category: "tv" },
  { name: "Digital Display", reach: 30, spend: 150_000, enabled: true, color: "#1D9E75", category: "display" },
  { name: "Online Video", reach: 25, spend: 200_000, enabled: true, color: "#D85A30", category: "video" },
  { name: "Social Media", reach: 35, spend: 180_000, enabled: true, color: "#D4537E", category: "social" },
  { name: "CTV / Streaming", reach: 20, spend: 220_000, enabled: true, color: "#BA7517", category: "ctv" },
];

export function defaultConfig(): CampaignConfig {
  return {
    universe: 10_000_000,
    overlapPct: 25,
    currency: "USD",
    useBenchmarks: true,
    benchmarks: defaultBenchmarks(),
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
    category: "other",
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
      category: CATEGORY_IDS.includes(ch.category as ChannelCategory)
        ? (ch.category as ChannelCategory)
        : inferCategory(typeof ch.name === "string" ? ch.name : ""),
    };
  });
  return {
    universe: Math.round(clamp(num(r.universe, 10_000_000), UNIVERSE_MIN, UNIVERSE_MAX)),
    overlapPct: clamp(num(r.overlapPct, 25), OVERLAP_MIN, OVERLAP_MAX),
    currency: CURRENCIES.some((c) => c.code === r.currency) ? (r.currency as CurrencyCode) : "USD",
    useBenchmarks: r.useBenchmarks !== false,
    benchmarks: Array.isArray(r.benchmarks) ? sanitizeBenchmarks(r.benchmarks) : defaultBenchmarks(),
    channels,
  };
}

function sanitizeBenchmarks(list: unknown[]): OverlapBenchmark[] {
  const cats = (v: unknown) =>
    Array.isArray(v) ? (v.filter((c) => CATEGORY_IDS.includes(c as ChannelCategory)) as ChannelCategory[]) : [];
  return list.slice(0, 40).flatMap((raw) => {
    const b = (raw ?? {}) as Record<string, unknown>;
    const a = cats(b.a);
    const bb = cats(b.b);
    if (!a.length || !bb.length) return [];
    return [
      {
        id: typeof b.id === "string" && b.id ? b.id.slice(0, 64) : uid(),
        label: typeof b.label === "string" ? b.label.slice(0, 80) : "",
        a,
        b: bb,
        low: clamp(num(b.low, 20), BENCHMARK_MIN, BENCHMARK_MAX),
        high: clamp(num(b.high, 30), BENCHMARK_MIN, BENCHMARK_MAX),
      },
    ];
  });
}
