import type { CurrencyCode } from "./types";

export const CURRENCIES: { code: CurrencyCode; label: string; symbol: string }[] = [
  { code: "USD", label: "US Dollar", symbol: "$" },
  { code: "EUR", label: "Euro", symbol: "€" },
  { code: "GBP", label: "British Pound", symbol: "£" },
  { code: "AED", label: "UAE Dirham", symbol: "AED " },
  { code: "SAR", label: "Saudi Riyal", symbol: "SAR " },
  { code: "EGP", label: "Egyptian Pound", symbol: "EGP " },
];

const intFmt = new Intl.NumberFormat("en-US", { maximumFractionDigits: 0 });
const moneyCache = new Map<string, Intl.NumberFormat>();

function moneyFmt(currency: CurrencyCode, decimals: number): Intl.NumberFormat {
  const key = `${currency}:${decimals}`;
  let f = moneyCache.get(key);
  if (!f) {
    f = new Intl.NumberFormat("en-US", {
      style: "currency",
      currency,
      minimumFractionDigits: decimals,
      maximumFractionDigits: decimals,
    });
    moneyCache.set(key, f);
  }
  return f;
}

export const currencySymbol = (c: CurrencyCode) => CURRENCIES.find((x) => x.code === c)?.symbol ?? `${c} `;

export const fmtInt = (n: number) => intFmt.format(n);
export const fmtMoney = (n: number, c: CurrencyCode) => moneyFmt(c, 0).format(n);
export const fmtCPIR = (n: number, c: CurrencyCode) => (n > 0 ? moneyFmt(c, 2).format(n) : "—");
export const fmtPct = (n: number, digits = 1) => `${n.toFixed(digits)}%`;
/** e.g. "$1K", "€1K", "AED 1K" */
export const per1KLabel = (c: CurrencyCode) => `${currencySymbol(c)}1K`;

export function fmtCompact(n: number): string {
  if (Math.abs(n) >= 1e9) return `${(n / 1e9).toFixed(1)}B`;
  if (Math.abs(n) >= 1e6) return `${(n / 1e6).toFixed(1)}M`;
  if (Math.abs(n) >= 1e3) return `${(n / 1e3).toFixed(0)}K`;
  return String(n);
}
