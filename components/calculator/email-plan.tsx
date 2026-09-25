"use client";

import { useState } from "react";
import { CheckCircle2, Globe, Loader2, Mail } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { DEFAULT_AUTH_EMAIL } from "@/lib/auth";
import { buildDraftEml, downloadFile, svgToPngBase64 } from "@/lib/eml";
import { planSubject, renderPlanEmailFragment, renderPlanEmailHtml, renderPlanEmailText } from "@/lib/report";
import type { CampaignConfig } from "@/lib/types";

const EMAIL_RE = /^[^\s@<>,;]+@[^\s@<>,;]+\.[^\s@<>,;]+$/;
const BCC = DEFAULT_AUTH_EMAIL;
const CHART_W = 680;
const CHART_H = 300;

type Status =
  | { kind: "idle" }
  | { kind: "working" }
  | { kind: "downloaded"; filename: string }
  | { kind: "copied" }
  | { kind: "prefilled" }
  | { kind: "error"; message: string };

/** Query string for deeplinks (spaces as %20 — mail clients show "+" literally). */
const qs = (params: Record<string, string>) =>
  Object.entries(params)
    .filter(([, v]) => v)
    .map(([k, v]) => `${k}=${encodeURIComponent(v)}`)
    .join("&");

async function reachCurvePng(): Promise<string | null> {
  const svg = document.querySelector<SVGSVGElement>("#reach-curve-fixed svg.recharts-surface");
  return svg ? svgToPngBase64(svg, CHART_W, CHART_H) : null;
}

function safeFilename(s: string) {
  return s.replace(/[\\/:*?"<>|]+/g, "").trim() || "Incremental Reach Plan";
}

export function EmailPlan({ config }: { config: CampaignConfig }) {
  const [to, setTo] = useState("");
  const [planName, setPlanName] = useState("");
  const [note, setNote] = useState("");
  const [status, setStatus] = useState<Status>({ kind: "idle" });

  const recipients = to.split(/[,;\s]+/).map((s) => s.trim()).filter(Boolean);
  const valid = recipients.every((e) => EMAIL_RE.test(e)); // empty is fine — add recipients in Outlook
  const working = status.kind === "working";

  /** Outlook desktop: download an unsent .eml draft with the formatted report and chart embedded. */
  async function createOutlookDraft(e?: React.FormEvent) {
    e?.preventDefault();
    if (!valid) return;
    setStatus({ kind: "working" });
    try {
      const png = await reachCurvePng();
      const meta = { planName, note, chartSrc: png ? "cid:reachcurve" : undefined };
      const subject = planSubject(meta);
      const eml = buildDraftEml({
        to: recipients,
        bcc: [BCC],
        subject,
        html: renderPlanEmailHtml(config, meta),
        text: renderPlanEmailText(config, meta),
        images: png ? [{ cid: "reachcurve", filename: "reach-curve.png", base64Png: png }] : [],
      });
      const filename = `${safeFilename(subject)}.eml`;
      downloadFile(filename, eml, "message/rfc822");
      setStatus({ kind: "downloaded", filename });
    } catch {
      setStatus({ kind: "error", message: "Could not create the email draft. Please try again." });
    }
  }

  /** Outlook on the web can't open .eml drafts: copy the formatted report and open a prefilled compose window. */
  async function openOutlookWeb() {
    if (!valid) return;
    // Open the tab first, inside the click, so popup blockers allow it.
    const win = window.open("about:blank", "_blank");
    const png = await reachCurvePng();
    const meta = { planName, note, chartSrc: png ? `data:image/png;base64,${png}` : undefined };
    const text = renderPlanEmailText(config, meta);
    let copied = false;
    try {
      if (typeof ClipboardItem !== "undefined" && navigator.clipboard?.write) {
        await navigator.clipboard.write([
          new ClipboardItem({
            "text/html": new Blob([renderPlanEmailFragment(config, meta)], { type: "text/html" }),
            "text/plain": new Blob([text], { type: "text/plain" }),
          }),
        ]);
        copied = true;
      }
    } catch {
      copied = false;
    }
    const url = `https://outlook.office.com/mail/deeplink/compose?${qs({
      to: recipients.join(";"),
      bcc: BCC,
      subject: planSubject(meta),
      body: copied ? "" : text,
    })}`;
    if (win) win.location.href = url;
    else window.open(url, "_blank");
    setStatus(copied ? { kind: "copied" } : { kind: "prefilled" });
  }

  return (
    <Card className="print:hidden">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2">
          <Mail className="h-4 w-4 text-primary" aria-hidden="true" />
          Email this plan
        </CardTitle>
        <CardDescription>
          Creates a formatted Outlook email with the full plan — metrics, reach curve, channel ranking, overlap matrix and inputs — sent
          from your own mailbox. A copy is always BCC&rsquo;d to {BCC}.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={createOutlookDraft} className="grid gap-4 md:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="email-to">Send to</Label>
            <Input
              id="email-to"
              type="text"
              inputMode="email"
              autoComplete="email"
              placeholder="client@example.com, planner@example.com"
              value={to}
              onChange={(e) => {
                setTo(e.target.value);
                if (!working) setStatus({ kind: "idle" });
              }}
              aria-invalid={!valid}
              aria-describedby="email-to-help"
            />
            <p id="email-to-help" className={valid ? "text-xs text-muted-foreground" : "text-xs text-red-700"}>
              {valid ? "Separate multiple addresses with commas." : "Check the email address format."}
            </p>
          </div>
          <div className="space-y-2">
            <Label htmlFor="plan-name">Plan name (optional)</Label>
            <Input id="plan-name" placeholder="e.g. Q4 Brand Launch" value={planName} maxLength={120} onChange={(e) => setPlanName(e.target.value)} />
          </div>
          <div className="space-y-2 md:col-span-2">
            <Label htmlFor="plan-note">Message (optional)</Label>
            <textarea
              id="plan-note"
              rows={3}
              maxLength={2000}
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="Add a short note to the recipient…"
              className="flex w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
            />
          </div>

          <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap sm:items-center md:col-span-2">
            <Button type="submit" disabled={!valid || working}>
              {working ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" /> : <Mail className="h-4 w-4" aria-hidden="true" />}
              Create email in Outlook
            </Button>
            <Button type="button" variant="outline" disabled={!valid || working} onClick={openOutlookWeb}>
              <Globe className="h-4 w-4" aria-hidden="true" />
              Use Outlook on the web instead
            </Button>
          </div>

          <div aria-live="polite" className="text-sm md:col-span-2">
            {status.kind === "downloaded" && (
              <div className="rounded-md bg-emerald-50 px-3 py-2 text-emerald-900">
                <p className="flex items-center gap-1.5 font-medium">
                  <CheckCircle2 className="h-4 w-4 shrink-0" aria-hidden="true" />
                  Email ready: {status.filename}
                </p>
                <p className="mt-1">
                  Open it from your browser&rsquo;s downloads — Outlook opens it as a new email with the formatted plan, recipients and BCC
                  filled in. Review and press Send.
                </p>
              </div>
            )}
            {status.kind === "copied" && (
              <p className="rounded-md bg-emerald-50 px-3 py-2 text-emerald-900">
                <strong>Formatted plan copied.</strong> In the Outlook tab, click in the message body and paste (Ctrl+V on Windows, ⌘V on Mac),
                then press Send. Recipient, subject and BCC are already filled in.
              </p>
            )}
            {status.kind === "prefilled" && (
              <p className="rounded-md bg-amber-50 px-3 py-2 text-amber-900">
                Your browser blocked copying the formatted plan, so a plain-text summary was added to the email instead. For the formatted
                version use &ldquo;Create email in Outlook&rdquo;.
              </p>
            )}
            {status.kind === "error" && <p className="text-red-700">{status.message}</p>}
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
