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
| `GMAIL_USER` | for one-click send | Gmail address the app sends from |
| `GMAIL_APP_PASSWORD` | for one-click send | 16-character app password from https://myaccount.google.com/apppasswords (requires 2-Step Verification) |
| `EMAIL_BCC` | no (defaults to `zaki.hussein@paramountcarat.com`) | Every plan email is BCC'd here |

### Emailing a plan

- **Open in Outlook app / Outlook on the web** — always available, no setup. Copies the formatted report to the clipboard and opens a new email with recipient, subject and BCC filled in; paste into the body and press Send. The email comes from your own mailbox.
- **Send email** — appears only when `GMAIL_USER` and `GMAIL_APP_PASSWORD` are set. Sends the formatted HTML report directly via Gmail, BCC'd to `EMAIL_BCC`, with replies going to the signed-in user.

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
- Email a formatted HTML report via Outlook (no setup) or Gmail (one-click), always BCC'd to the plan owner
- Responsive: desktop, tablet (stacked config, 2×2 metrics), mobile (single column, scrollable channel table, matrix hidden)

## A note on "no server-side logic"

The calculator itself is 100% client-side. Two small server routes exist because the features require them: **login** (a password checked in the browser would be visible to anyone who opens dev tools) and **one-click email sending** (browsers cannot send email directly, and the Gmail app password must stay secret). Both run as Vercel serverless functions — no database.
