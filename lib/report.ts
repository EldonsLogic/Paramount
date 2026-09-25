import { calculateCampaign, overlapMatrix } from "./calc";
import { fmtCPIR, fmtInt, fmtMoney, fmtPct, per1KLabel } from "./format";
import type { CampaignConfig } from "./types";

export interface PlanMeta {
  planName?: string;
  note?: string;
  sender?: string;
}

const esc = (s: string) =>
  s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&#39;");

const BADGE: Record<string, { bg: string; fg: string }> = {
  Efficient: { bg: "#e7f6ef", fg: "#0f6b47" },
  Average: { bg: "#fdf3dc", fg: "#8a5a00" },
  Costly: { bg: "#fde8e8", fg: "#a42323" },
};

export function planSubject(meta: PlanMeta): string {
  return `Incremental Reach Plan${meta.planName ? ` — ${meta.planName}` : ""}`;
}

/** Table-based, inline-styled HTML that renders in Outlook, Gmail and Apple Mail. */
export function renderPlanEmailHtml(config: CampaignConfig, meta: PlanMeta = {}): string {
  const r = calculateCampaign(config);
  const cur = config.currency;
  const maxInc = Math.max(1, ...r.channelResults.map((c) => c.incrementalReach));
  const active = config.channels.filter((c) => c.enabled);
  const matrix = overlapMatrix(active, config.overlapPct);
  const date = new Date().toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" });
  const font = "font-family:-apple-system,Segoe UI,Helvetica,Arial,sans-serif;";

  const metric = (label: string, value: string, sub: string) => `
    <td width="50%" style="padding:6px;" valign="top">
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f4f7fb;border-radius:8px;">
        <tr><td style="padding:14px 16px;${font}">
          <div style="font-size:12px;color:#5b6b7f;text-transform:uppercase;letter-spacing:.04em;">${label}</div>
          <div style="font-size:22px;font-weight:700;color:#0D1B2A;margin-top:4px;">${value}</div>
          <div style="font-size:12px;color:#5b6b7f;margin-top:2px;">${sub}</div>
        </td></tr>
      </table>
    </td>`;

  const rankingRows = r.channelResults
    .map((c, i) => {
      const b = BADGE[c.efficiencyRating];
      const w = Math.max(2, Math.round((c.incrementalReach / maxInc) * 100));
      return `
      <tr>
        <td style="padding:10px 8px;border-bottom:1px solid #e6ebf1;${font}font-size:13px;color:#5b6b7f;">${i + 1}</td>
        <td style="padding:10px 8px;border-bottom:1px solid #e6ebf1;${font}font-size:13px;color:#0D1B2A;">
          <span style="display:inline-block;width:10px;height:10px;border-radius:50%;background:${c.channel.color};margin-right:6px;"></span>${esc(c.channel.name)}
          <div style="margin-top:6px;height:6px;background:#e6ebf1;border-radius:3px;"><div style="height:6px;width:${w}%;background:${c.channel.color};border-radius:3px;"></div></div>
        </td>
        <td align="right" style="padding:10px 8px;border-bottom:1px solid #e6ebf1;${font}font-size:13px;font-weight:600;color:#0D1B2A;">${fmtInt(c.incrementalReach)}</td>
        <td align="right" style="padding:10px 8px;border-bottom:1px solid #e6ebf1;${font}font-size:13px;color:#0D1B2A;">${fmtCPIR(c.cpir, cur)}</td>
        <td align="right" style="padding:10px 8px;border-bottom:1px solid #e6ebf1;${font}">
          <span style="display:inline-block;padding:2px 8px;border-radius:10px;font-size:11px;font-weight:600;background:${b.bg};color:${b.fg};">${c.efficiencyRating}</span>
        </td>
      </tr>`;
    })
    .join("");

  const inputRows = config.channels
    .map(
      (c) => `
      <tr>
        <td style="padding:6px 8px;border-bottom:1px solid #e6ebf1;${font}font-size:12px;color:${c.enabled ? "#0D1B2A" : "#9aa7b6"};">${esc(c.name)}${c.enabled ? "" : " (off)"}</td>
        <td align="right" style="padding:6px 8px;border-bottom:1px solid #e6ebf1;${font}font-size:12px;color:#0D1B2A;">${fmtPct(c.reach, 0)}</td>
        <td align="right" style="padding:6px 8px;border-bottom:1px solid #e6ebf1;${font}font-size:12px;color:#0D1B2A;">${fmtMoney(c.spend, cur)}</td>
      </tr>`
    )
    .join("");

  const maxOff = Math.max(0.0001, ...matrix.flatMap((row, i) => row.filter((_, j) => i !== j)));
  const matrixHtml =
    active.length > 1
      ? `
      <tr><td style="padding:24px 24px 8px;${font}font-size:15px;font-weight:700;color:#0D1B2A;">Overlap matrix (% of universe seeing both)</td></tr>
      <tr><td style="padding:0 24px;">
        <table role="presentation" cellpadding="0" cellspacing="0" style="border-collapse:collapse;">
          <tr><td></td>${active
            .map((c) => `<td style="padding:4px;${font}font-size:10px;color:#5b6b7f;text-align:center;max-width:70px;">${esc(c.name)}</td>`)
            .join("")}</tr>
          ${matrix
            .map(
              (row, i) => `<tr><td style="padding:4px 8px 4px 0;${font}font-size:10px;color:#5b6b7f;">${esc(active[i].name)}</td>${row
                .map((v, j) => {
                  const t = i === j ? 1 : Math.min(1, v / maxOff);
                  const bg = i === j ? "#0D1B2A" : `rgba(55,138,221,${(0.08 + t * 0.85).toFixed(2)})`;
                  const fg = i === j || t > 0.55 ? "#ffffff" : "#0D1B2A";
                  return `<td style="padding:6px 8px;${font}font-size:11px;text-align:center;background:${bg};color:${fg};border:1px solid #ffffff;">${v.toFixed(1)}%</td>`;
                })
                .join("")}</tr>`
            )
            .join("")}
        </table>
      </td></tr>`
      : "";

  return `<!doctype html>
<html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${esc(planSubject(meta))}</title></head>
<body style="margin:0;padding:0;background:#eef2f6;">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#eef2f6;padding:24px 8px;">
<tr><td align="center">
<table role="presentation" width="640" cellpadding="0" cellspacing="0" style="max-width:640px;width:100%;background:#ffffff;border-radius:10px;overflow:hidden;">
  <tr><td style="background:#0D1B2A;padding:24px;${font}">
    <div style="font-size:20px;font-weight:700;color:#ffffff;">Incremental Reach Report</div>
    <div style="font-size:13px;color:#9fb3c8;margin-top:4px;">${meta.planName ? esc(meta.planName) + " · " : ""}${date}</div>
  </td></tr>
  ${
    meta.note
      ? `<tr><td style="padding:20px 24px 0;${font}font-size:14px;line-height:1.5;color:#0D1B2A;white-space:pre-line;">${esc(meta.note)}</td></tr>`
      : ""
  }
  <tr><td style="padding:18px 18px 0;">
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
      <tr>
        ${metric("Deduplicated reach", fmtInt(r.totalDeduplicatedReach), `${fmtPct(r.totalDeduplicatedReachPct)} of universe`)}
        ${metric("Total media spend", fmtMoney(r.totalSpend, cur), `${r.channelResults.length} active channels`)}
      </tr>
      <tr>
        ${metric("Average CPIR", fmtCPIR(r.averageCPIR, cur), "per incremental person")}
        ${metric(`Reach per ${per1KLabel(cur)} spent`, fmtInt(r.reachPer1KSpend), "people")}
      </tr>
    </table>
  </td></tr>
  <tr><td style="padding:24px 24px 8px;${font}font-size:15px;font-weight:700;color:#0D1B2A;">Channel ranking by incremental reach</td></tr>
  <tr><td style="padding:0 24px;">
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="border-collapse:collapse;">
      <tr>
        <th align="left" style="padding:6px 8px;${font}font-size:11px;color:#5b6b7f;border-bottom:2px solid #e6ebf1;">#</th>
        <th align="left" style="padding:6px 8px;${font}font-size:11px;color:#5b6b7f;border-bottom:2px solid #e6ebf1;">Channel</th>
        <th align="right" style="padding:6px 8px;${font}font-size:11px;color:#5b6b7f;border-bottom:2px solid #e6ebf1;">Incremental</th>
        <th align="right" style="padding:6px 8px;${font}font-size:11px;color:#5b6b7f;border-bottom:2px solid #e6ebf1;">CPIR</th>
        <th align="right" style="padding:6px 8px;${font}font-size:11px;color:#5b6b7f;border-bottom:2px solid #e6ebf1;">Rating</th>
      </tr>
      ${rankingRows || `<tr><td colspan="5" style="padding:12px 8px;${font}font-size:13px;color:#5b6b7f;">No active channels.</td></tr>`}
    </table>
  </td></tr>
  ${matrixHtml}
  <tr><td style="padding:24px 24px 8px;${font}font-size:15px;font-weight:700;color:#0D1B2A;">Plan inputs</td></tr>
  <tr><td style="padding:0 24px;${font}font-size:12px;color:#5b6b7f;">
    Universe: <b style="color:#0D1B2A;">${fmtInt(config.universe)}</b> · Overlap assumption: <b style="color:#0D1B2A;">${fmtPct(config.overlapPct, 0)}</b> · Currency: <b style="color:#0D1B2A;">${cur}</b>
  </td></tr>
  <tr><td style="padding:8px 24px 0;">
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="border-collapse:collapse;">
      <tr>
        <th align="left" style="padding:6px 8px;${font}font-size:11px;color:#5b6b7f;border-bottom:2px solid #e6ebf1;">Channel</th>
        <th align="right" style="padding:6px 8px;${font}font-size:11px;color:#5b6b7f;border-bottom:2px solid #e6ebf1;">Reach</th>
        <th align="right" style="padding:6px 8px;${font}font-size:11px;color:#5b6b7f;border-bottom:2px solid #e6ebf1;">Spend</th>
      </tr>
      ${inputRows}
    </table>
  </td></tr>
  <tr><td style="padding:24px;${font}font-size:11px;line-height:1.5;color:#7a8898;">
    Methodology — Total Overlap Model: combined reach = 1 − ∏[1 − Rᵢ × (1 − overlap%)]. Incremental reach of a channel = reach(all) − reach(all minus that channel). CPIR = spend ÷ incremental unique people.
    ${meta.sender ? `<br><br>Sent by ${esc(meta.sender)} via Incremental Reach Calculator.` : ""}
  </td></tr>
</table>
</td></tr>
</table>
</body></html>`;
}

/** Plain-text version, used as the email text part and for the mailto fallback. */
export function renderPlanEmailText(config: CampaignConfig, meta: PlanMeta = {}): string {
  const r = calculateCampaign(config);
  const cur = config.currency;
  const lines = [
    "INCREMENTAL REACH REPORT" + (meta.planName ? ` — ${meta.planName}` : ""),
    "",
    ...(meta.note ? [meta.note, ""] : []),
    `Deduplicated reach: ${fmtInt(r.totalDeduplicatedReach)} (${fmtPct(r.totalDeduplicatedReachPct)} of universe)`,
    `Total media spend: ${fmtMoney(r.totalSpend, cur)}`,
    `Average CPIR: ${fmtCPIR(r.averageCPIR, cur)} per incremental person`,
    `Reach per ${per1KLabel(cur)} spent: ${fmtInt(r.reachPer1KSpend)} people`,
    "",
    "CHANNEL RANKING (by incremental reach)",
    ...r.channelResults.map(
      (c, i) => `${i + 1}. ${c.channel.name} — ${fmtInt(c.incrementalReach)} incremental · CPIR ${fmtCPIR(c.cpir, cur)} · ${c.efficiencyRating}`
    ),
    "",
    `Universe: ${fmtInt(config.universe)} · Overlap assumption: ${fmtPct(config.overlapPct, 0)} · Currency: ${cur}`,
  ];
  return lines.join("\n");
}
