import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { DEFAULT_AUTH_EMAIL, SESSION_COOKIE, verifySessionToken } from "@/lib/auth";
import { sanitizeConfig } from "@/lib/defaults";
import { planSubject, renderPlanEmailHtml, renderPlanEmailText } from "@/lib/report";

const EMAIL_RE = /^[^\s@<>,;]+@[^\s@<>,;]+\.[^\s@<>,;]+$/;
const MAX_RECIPIENTS = 10;

export async function POST(req: Request) {
  // Middleware already guards /api/*, but verify again so this route can never become an open relay.
  const user = await verifySessionToken(cookies().get(SESSION_COOKIE)?.value);
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const apiKey = process.env.RESEND_API_KEY;
  const from = process.env.EMAIL_FROM;
  if (!apiKey || !from) {
    return NextResponse.json(
      { error: "Email sending is not configured (RESEND_API_KEY / EMAIL_FROM).", code: "not_configured" },
      { status: 503 }
    );
  }

  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }

  const to = (typeof body.to === "string" ? body.to : "")
    .split(/[,;\s]+/)
    .map((s) => s.trim())
    .filter(Boolean);
  if (to.length === 0 || to.length > MAX_RECIPIENTS || !to.every((e) => EMAIL_RE.test(e))) {
    return NextResponse.json({ error: `Enter 1–${MAX_RECIPIENTS} valid email addresses` }, { status: 400 });
  }

  const config = sanitizeConfig(body.config);
  if (!config) return NextResponse.json({ error: "Invalid plan data" }, { status: 400 });

  const meta = {
    planName: typeof body.planName === "string" ? body.planName.slice(0, 120).trim() : "",
    note: typeof body.note === "string" ? body.note.slice(0, 2000).trim() : "",
    sender: user,
  };

  const bcc = (process.env.EMAIL_BCC || DEFAULT_AUTH_EMAIL).split(",").map((s) => s.trim()).filter(Boolean);

  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      from,
      to,
      bcc,
      reply_to: user,
      subject: planSubject(meta),
      html: renderPlanEmailHtml(config, meta),
      text: renderPlanEmailText(config, meta),
    }),
  });

  if (!res.ok) {
    const detail = await res.text().catch(() => "");
    console.error("Resend error", res.status, detail);
    return NextResponse.json({ error: "The email service rejected the message. Check the sender domain and API key." }, { status: 502 });
  }
  return NextResponse.json({ ok: true, sentTo: to });
}
