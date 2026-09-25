# Incremental Reach Calculator

A media-planning tool for cross-media audience deduplication. Planners enter a target universe, a global overlap assumption, and each channel's reach and spend (TV, Digital, CTV, Social, OOH, …). The calculator returns **total deduplicated reach** (not the double-counted sum of channel reaches), **incremental reach** per channel (the net-new people each channel adds beyond the rest of the mix), **CPIR** (cost per incremental reach), a **reach curve** showing how reach builds as channels are added, and a pairwise **overlap matrix**. Plans can be exported to PDF and emailed as a formatted report.

Built with Next.js 14 (App Router), TypeScript, Tailwind CSS, shadcn/ui and Recharts. All calculations run client-side in real time.

## How the Total Overlap Model (TOM) works

For channels with reach `Rᵢ` (as a fraction of the universe) and a global overlap assumption `ov`:

```
Combined reach      = 1 − ∏ [1 − Rᵢ × (1 − ov)]
Incremental reach X = Reach(all channels) − Reach(all channels except X)
CPIR                = Spend ÷ Incremental unique people reached
```

- Higher overlap ⇒ more conservative reach estimates.
- Efficiency rating splits the CPIR range into thirds: bottom = **Efficient**, middle = **Average**, top = **Costly**.
- Overlap matrix cell `(i, j)` = `Rᵢ × Rⱼ × ov` as a % of universe; the diagonal is each channel's own reach.
- Average CPIR = total spend ÷ total incremental people.

The implementation lives in [`lib/calc.ts`](lib/calc.ts).

## Run locally

```bash
cp .env.example .env.local   # then fill in AUTH_PASSWORD and AUTH_SECRET
npm install && npm run dev
```

Open http://localhost:3000 and sign in.

## Environment variables

| Variable | Required | Purpose |
|---|---|---|
| `AUTH_EMAIL` | no (defaults to `zaki.hussein@paramountcarat.com`) | The account allowed to sign in |
| `AUTH_PASSWORD` | **yes** | Password for that account |
| `AUTH_SECRET` | **yes** | 32+ char random string used to sign session cookies (`openssl rand -hex 32`) |

### Emailing a plan

No email service or setup is needed — plans are sent from your own Outlook mailbox:

- **Create email in Outlook** downloads an unsent email draft (`.eml`). Opening it launches Outlook (Windows or Mac desktop) with a new, fully formatted message: metrics, reach-curve chart, channel ranking, overlap matrix and plan inputs, with recipients, subject and a BCC to `zaki.hussein@paramountcarat.com` already filled in. Review and press Send.
  Tip: in Chrome/Edge, use the download's **⋯ → Always open files of this type** so future drafts open in Outlook straight away.
- **Use Outlook on the web instead** copies the formatted plan to the clipboard and opens an Outlook on the web compose window with recipient, subject and BCC filled in — paste into the body and send.

## Deploy to Vercel

1. Push this repo to GitHub.
2. In Vercel, **Add New → Project** and import the repo. Framework preset **Next.js** is detected automatically — no build settings or `vercel.json` needed.
3. Under **Settings → Environment Variables** add the variables above.
4. Deploy.

## Features

- Login-protected (single account, signed HTTP-only session cookie, 12-hour expiry)
- Plans auto-save to `localStorage` (`irc_campaign_v1`); **Reset to defaults** in the header
- Currency selector (USD, EUR, GBP, AED, SAR, EGP) — display only, no FX conversion
- **Export PDF** → print-optimized A4 report with all three result views
- One-click formatted Outlook email of the plan (including the reach-curve chart), always BCC'd to the plan owner
- Responsive: desktop, tablet (stacked config, 2×2 metrics), mobile (single column, scrollable channel table, matrix hidden)

## A note on "no server-side logic"

The calculator and email drafting are 100% client-side. The only server code is **login** (`/api/login`, `/api/logout` and the middleware), because a password checked in the browser would be visible to anyone who opens dev tools. No database, no email service.
