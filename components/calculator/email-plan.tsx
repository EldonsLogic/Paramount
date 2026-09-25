"use client";

import { useState } from "react";
import { CheckCircle2, Loader2, Mail, Send } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { DEFAULT_AUTH_EMAIL } from "@/lib/auth";
import { planSubject, renderPlanEmailText } from "@/lib/report";
import type { CampaignConfig } from "@/lib/types";

const EMAIL_RE = /^[^\s@<>,;]+@[^\s@<>,;]+\.[^\s@<>,;]+$/;

type Status = { kind: "idle" } | { kind: "sending" } | { kind: "sent"; to: string[] } | { kind: "error"; message: string; offerMailto?: boolean };

export function EmailPlan({ config }: { config: CampaignConfig }) {
  const [to, setTo] = useState("");
  const [planName, setPlanName] = useState("");
  const [note, setNote] = useState("");
  const [status, setStatus] = useState<Status>({ kind: "idle" });

  const recipients = to.split(/[,;\s]+/).map((s) => s.trim()).filter(Boolean);
  const valid = recipients.length > 0 && recipients.every((e) => EMAIL_RE.test(e));

  function mailtoHref() {
    const meta = { planName, note };
    const q = new URLSearchParams({
      bcc: DEFAULT_AUTH_EMAIL,
      subject: planSubject(meta),
      body: renderPlanEmailText(config, meta),
    });
    // URLSearchParams encodes spaces as "+", which mail clients show literally.
    return `mailto:${recipients.join(",")}?${q.toString().replace(/\+/g, "%20")}`;
  }

  async function send(e: React.FormEvent) {
    e.preventDefault();
    if (!valid) return;
    setStatus({ kind: "sending" });
    try {
      const res = await fetch("/api/send-plan", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ to: recipients.join(","), planName, note, config }),
      });
      const data = await res.json().catch(() => ({}));
      if (res.ok) {
        setStatus({ kind: "sent", to: data.sentTo ?? recipients });
      } else if (res.status === 401) {
        setStatus({ kind: "error", message: "Your session has expired — please sign in again." });
      } else {
        setStatus({ kind: "error", message: data.error || "Could not send the email.", offerMailto: true });
      }
    } catch {
      setStatus({ kind: "error", message: "Network error — the email was not sent.", offerMailto: true });
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
          Sends a formatted report of the current plan — metrics, channel ranking, overlap matrix and inputs. A copy is BCC&rsquo;d to{" "}
          {DEFAULT_AUTH_EMAIL}.
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
                if (status.kind !== "sending") setStatus({ kind: "idle" });
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
          <div className="flex flex-col gap-3 md:col-span-2 sm:flex-row sm:items-center">
            <Button type="submit" disabled={!valid || status.kind === "sending"}>
              {status.kind === "sending" ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" /> : <Send className="h-4 w-4" aria-hidden="true" />}
              Send plan
            </Button>
            <div aria-live="polite" className="text-sm">
              {status.kind === "sent" && (
                <span className="flex items-center gap-1.5 text-emerald-700">
                  <CheckCircle2 className="h-4 w-4" aria-hidden="true" />
                  Sent to {status.to.join(", ")}
                </span>
              )}
              {status.kind === "error" && (
                <span className="text-red-700">
                  {status.message}{" "}
                  {status.offerMailto && valid && (
                    <a href={mailtoHref()} className="font-medium underline underline-offset-2">
                      Open in your email app instead
                    </a>
                  )}
                </span>
              )}
            </div>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
