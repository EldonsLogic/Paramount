import { NextResponse } from "next/server";
import { SESSION_COOKIE, SESSION_TTL_SECONDS, checkCredentials, createSessionToken, isAuthConfigured } from "@/lib/auth";

export async function POST(req: Request) {
  if (!isAuthConfigured()) {
    return NextResponse.json(
      { error: "Login is not configured. Set AUTH_PASSWORD and AUTH_SECRET environment variables." },
      { status: 503 }
    );
  }

  let body: { email?: unknown; password?: unknown };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }
  const email = typeof body.email === "string" ? body.email : "";
  const password = typeof body.password === "string" ? body.password : "";

  if (!(await checkCredentials(email, password))) {
    // Small fixed delay to slow brute-force attempts.
    await new Promise((r) => setTimeout(r, 600));
    return NextResponse.json({ error: "Incorrect email or password" }, { status: 401 });
  }

  const res = NextResponse.json({ ok: true });
  res.cookies.set(SESSION_COOKIE, await createSessionToken(email.trim().toLowerCase()), {
    httpOnly: true,
    // Secure on HTTPS (Vercel); allows `npm start` over plain http://localhost.
    secure: new URL(req.url).protocol === "https:" || req.headers.get("x-forwarded-proto") === "https",
    sameSite: "lax",
    path: "/",
    maxAge: SESSION_TTL_SECONDS,
  });
  return res;
}
