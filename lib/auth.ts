// Edge- and Node-compatible session helpers (Web Crypto only).

export const SESSION_COOKIE = "irc_session";
export const SESSION_TTL_SECONDS = 60 * 60 * 12; // 12 hours
export const DEFAULT_AUTH_EMAIL = "zaki.hussein@paramountcarat.com";

const enc = new TextEncoder();

export function authEmail(): string {
  return (process.env.AUTH_EMAIL || DEFAULT_AUTH_EMAIL).trim().toLowerCase();
}

function secret(): string | null {
  const s = process.env.AUTH_SECRET;
  return s && s.length >= 16 ? s : null;
}

function toHex(buf: ArrayBuffer): string {
  return Array.from(new Uint8Array(buf))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

async function hmac(data: string, key: string): Promise<string> {
  const k = await crypto.subtle.importKey("raw", enc.encode(key), { name: "HMAC", hash: "SHA-256" }, false, ["sign"]);
  return toHex(await crypto.subtle.sign("HMAC", k, enc.encode(data)));
}

/** Constant-time string comparison. */
export function safeEqual(a: string, b: string): boolean {
  const len = Math.max(a.length, b.length);
  let diff = a.length ^ b.length;
  for (let i = 0; i < len; i++) diff |= (a.charCodeAt(i) || 0) ^ (b.charCodeAt(i) || 0);
  return diff === 0;
}

export function isAuthConfigured(): boolean {
  return Boolean(secret() && process.env.AUTH_PASSWORD);
}

export async function checkCredentials(email: string, password: string): Promise<boolean> {
  const expected = process.env.AUTH_PASSWORD;
  if (!expected || !secret()) return false;
  // Compare HMACs so both comparisons are fixed-length and constant-time.
  const s = secret()!;
  const [pa, pb] = await Promise.all([hmac(password, s), hmac(expected, s)]);
  const emailOk = safeEqual(email.trim().toLowerCase(), authEmail());
  const passOk = safeEqual(pa, pb);
  return emailOk && passOk;
}

export async function createSessionToken(email: string): Promise<string> {
  const s = secret();
  if (!s) throw new Error("AUTH_SECRET is not configured");
  const exp = Math.floor(Date.now() / 1000) + SESSION_TTL_SECONDS;
  const payload = `${encodeURIComponent(email)}.${exp}`;
  return `${payload}.${await hmac(payload, s)}`;
}

export async function verifySessionToken(token: string | undefined): Promise<string | null> {
  const s = secret();
  if (!token || !s) return null;
  // Format: <email>.<exp>.<sig> — parse from the right because the email itself contains dots.
  const sigAt = token.lastIndexOf(".");
  const expAt = token.lastIndexOf(".", sigAt - 1);
  if (sigAt <= 0 || expAt <= 0) return null;
  const emailEnc = token.slice(0, expAt);
  const expStr = token.slice(expAt + 1, sigAt);
  const sig = token.slice(sigAt + 1);
  const expected = await hmac(`${emailEnc}.${expStr}`, s);
  if (!safeEqual(sig, expected)) return null;
  if (Number(expStr) < Math.floor(Date.now() / 1000)) return null;
  const email = decodeURIComponent(emailEnc);
  return email === authEmail() ? email : null;
}
