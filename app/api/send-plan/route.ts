import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import nodemailer from "nodemailer";
import { DEFAULT_AUTH_EMAIL, SESSION_COOKIE, verifySessionToken } from "@/lib/auth";
import { sanitizeConfig } from "@/lib/defaults";
import { planSubject, renderPlanEmailHtml, renderPlanEmailText } from "@/lib/report";

export const runtime = "nodejs";

const EMAIL_RE = /^[^\s@<>,;]+@[^\s@<>,;]+\.[^\s@<>,;]+$/;
const MAX_RECIPIENTS = 10;

function gmailConfig() {
  const user = process.env.GMAIL_USER?.trim();
  // Google shows app passwords in groups of four ("abcd efgh ijkl mnop"); spaces are not part of it.
  const pass = process.env.GMAIL_APP_PASSWORD?.replace(/\s+/g, "");
  return user && pass ? { user, pass } : null;
}

async function currentUser() {
  return verifySessionToken(cookies().get(SESSION_COOKIE)?.value);
}

/** Lets the UI know whether one-click sending is available. */
export async function GET() {
  if (!(await currentUser())) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  return NextResponse.json({ configured: Boolean(gmailConfig()) });
}

export async function POST(req: Request) {
  // Middleware already guards /api/*, but verify again so this route can never become an open relay.
  const user = await currentUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const gmail = gmailConfig();
  if (!gmail) {
    return NextResponse.json(
      { error: "Email sending is not configured (GMAIL_USER / GMAIL_APP_PASSWORD).", code: "not_configured" },
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

  const transport = nodemailer.createTransport({ service: "gmail", auth: gmail });
  try {
    await transport.sendMail({
      from: { name: "Incremental Reach Calculator", address: gmail.user },
      to,
      bcc,
      replyTo: user,
      subject: planSubject(meta),
      html: renderPlanEmailHtml(config, meta),
      text: renderPlanEmailText(config, meta),
    });
  } catch (err) {
    console.error("Gmail send failed", err);
    const auth = (err as { code?: string }).code === "EAUTH";
    return NextResponse.json(
      {
        error: auth
          ? "Gmail rejected the login. Check GMAIL_USER and GMAIL_APP_PASSWORD in Vercel."
          : "The email could not be sent. Try again, or use the Outlook option.",
      },
      { status: 502 }
    );
  }
  return NextResponse.json({ ok: true, sentTo: to });
}
