"use client";

import { useEffect, useState } from "react";
import { CheckCircle2, Globe, Loader2, Mail, Monitor, Send } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { DEFAULT_AUTH_EMAIL } from "@/lib/auth";
import { planSubject, renderPlanEmailFragment, renderPlanEmailText } from "@/lib/report";
import type { CampaignConfig } from "@/lib/types";

const EMAIL_RE = /^[^\s@<>,;]+@[^\s@<>,;]+\.[^\s@<>,;]+$/;
const BCC = DEFAULT_AUTH_EMAIL;

type Status =
  | { kind: "idle" }
  | { kind: "sending" }
  | { kind: "sent"; to: string[] }
  | { kind: "copied" }
  | { kind: "prefilled" }
  | { kind: "error"; message: string };

/** Encode for mailto/deeplink query strings (spaces as %20 — mail clients show "+" literally). */
const qs = (params: Record<string, string>) =>
  Object.entries(params)
    .filter(([, v]) => v)
    .map(([k, v]) => `${k}=${encodeURIComponent(v)}`)
    .join("&");

async function copyRichReport(html: string, text: string): Promise<boolean> {
  try {
    if (typeof ClipboardItem === "undefined" || !navigator.clipboard?.write) return false;
    await navigator.clipboard.write([
      new ClipboardItem({
        "text/html": new Blob([html], { type: "text/html" }),
        "text/plain": new Blob([text], { type: "text/plain" }),
      }),
    ]);
    return true;
  } catch {
    return false;
  }
}

export function EmailPlan({ config }: { config: CampaignConfig }) {
  const [to, setTo] = useState("");
  const [planName, setPlanName] = useState("");
  const [note, setNote] = useState("");
  const [status, setStatus] = useState<Status>({ kind: "idle" });
  const [canSend, setCanSend] = useState(false);

  useEffect(() => {
    fetch("/api/send-plan")
      .then((r) => (r.ok ? r.json() : { configured: false }))
      .then((d) => setCanSend(Boolean(d.configured)))
      .catch(() => setCanSend(false));
  }, []);

  const recipients = to.split(/[,;\s]+/).map((s) => s.trim()).filter(Boolean);
  const valid = recipients.length > 0 && recipients.every((e) => EMAIL_RE.test(e));
  // Outlook buttons work with no recipient too (fill it in Outlook), but not with a malformed one.
  const outlookOk = recipients.length === 0 || valid;
  const busy = status.kind === "sending";

  async function openInOutlook(target: "app" | "web") {
    const meta = { planName, note };
    const subject = planSubject(meta);
    const text = renderPlanEmailText(config, meta);
    const copied = await copyRichReport(renderPlanEmailFragment(config, meta), text);
    // If the formatted copy worked the body stays empty for pasting; otherwise prefill plain text.
    const body = copied ? "" : text;
    const toList = recipients.join(target === "app" ? "," : ";");

    if (target === "app") {
      window.location.href = `mailto:${toList}?${qs({ bcc: BCC, subject, body })}`;
    } else {
      const url = `https://outlook.office.com/mail/deeplink/compose?${qs({ to: toList, bcc: BCC, subject, body })}`;
      window.open(url, "_blank", "noopener");
    }
    setStatus(copied ? { kind: "copied" } : { kind: "prefilled" });
  }

  async function send(e: React.FormEvent) {
    e.preventDefault();
    if (!valid || !canSend) return;
    setStatus({ kind: "sending" });
    try {
      const res = await fetch("/api/send-plan", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ to: recipients.join(","), planName, note, config }),
      });
      const data = await res.json().catch(() => ({}));
      if (res.ok) setStatus({ kind: "sent", to: data.sentTo ?? recipients });
      else if (res.status === 401) setStatus({ kind: "error", message: "Your session has expired — please sign in again." });
      else setStatus({ kind: "error", message: data.error || "Could not send the email. Try the Outlook option instead." });
    } catch {
      setStatus({ kind: "error", message: "Network error — the email was not sent. Try the Outlook option instead." });
    }
  }

  return (
    <Card className="print:hidden">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2">
          <Mail className="h-4 w-4 text-primary" aria-hidden="true" />
          Email this plan
        </CardTitle>
        <CardDescription>
          A formatted report of the current plan — metrics, channel ranking, overlap matrix and inputs. A copy is always BCC&rsquo;d to {BCC}.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={send} className="grid gap-4 md:grid-cols-2">
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
                if (!busy) setStatus({ kind: "idle" });
              }}
              aria-invalid={to.length > 0 && !valid}
              aria-describedby="email-to-help"
            />
            <p id="email-to-help" className="text-xs text-muted-foreground">
              Separate multiple addresses with commas.
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

          <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap md:col-span-2">
            {canSend && (
              <Button type="submit" disabled={!valid || busy}>
                {busy ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" /> : <Send className="h-4 w-4" aria-hidden="true" />}
                Send email
              </Button>
            )}
            <Button type="button" variant={canSend ? "outline" : "default"} disabled={!outlookOk || busy} onClick={() => openInOutlook("app")}>
              <Monitor className="h-4 w-4" aria-hidden="true" />
              Open in Outlook app
            </Button>
            <Button type="button" variant="outline" disabled={!outlookOk || busy} onClick={() => openInOutlook("web")}>
              <Globe className="h-4 w-4" aria-hidden="true" />
              Open in Outlook on the web
            </Button>
          </div>

          <div aria-live="polite" className="text-sm md:col-span-2">
            {status.kind === "sent" && (
              <p className="flex items-center gap-1.5 text-emerald-700">
                <CheckCircle2 className="h-4 w-4 shrink-0" aria-hidden="true" />
                Sent to {status.to.join(", ")}
              </p>
            )}
            {status.kind === "copied" && (
              <p className="rounded-md bg-emerald-50 px-3 py-2 text-emerald-800">
                <strong>Report copied.</strong> In the new Outlook email, click in the message body and paste (Ctrl+V on Windows, ⌘V on Mac), then
                press Send. Recipient, subject and BCC are already filled in.
              </p>
            )}
            {status.kind === "prefilled" && (
              <p className="rounded-md bg-amber-50 px-3 py-2 text-amber-900">
                Your browser blocked copying the formatted report, so a plain-text summary was added to the email instead. Check the
                email and press Send.
              </p>
            )}
            {status.kind === "error" && <p className="text-red-700">{status.message}</p>}
            {status.kind === "idle" && !canSend && (
              <p className="text-xs text-muted-foreground">
                Opens a new email in Outlook with the formatted report ready to paste — it&rsquo;s sent from your own mailbox.
              </p>
            )}
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
