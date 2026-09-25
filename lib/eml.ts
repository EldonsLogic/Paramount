// Builds an unsent draft (.eml). With "X-Unsent: 1", Outlook opens it as a new message
// ready to send — formatted HTML body, recipients, BCC and subject already filled in.

const CRLF = "\r\n";

function utf8Base64(text: string): string {
  const bytes = new TextEncoder().encode(text);
  let bin = "";
  for (let i = 0; i < bytes.length; i += 0x8000) bin += String.fromCharCode(...bytes.subarray(i, i + 0x8000));
  return btoa(bin);
}

const wrap76 = (b64: string) => b64.match(/.{1,76}/g)?.join(CRLF) ?? "";

/** RFC 2047 encoded-word so non-ASCII subjects (em dashes, Arabic plan names) survive. */
const encodeHeader = (v: string) => (/^[\x20-\x7e]*$/.test(v) ? v : `=?UTF-8?B?${utf8Base64(v)}?=`);

export interface InlineImage {
  cid: string;
  filename: string;
  base64Png: string;
}

export function buildDraftEml(opts: {
  to: string[];
  bcc: string[];
  subject: string;
  html: string;
  text: string;
  images?: InlineImage[];
}): string {
  const rel = `rel_${Math.random().toString(36).slice(2)}`;
  const alt = `alt_${Math.random().toString(36).slice(2)}`;
  const headers = [
    ...(opts.to.length ? [`To: ${opts.to.join(", ")}`] : []),
    ...(opts.bcc.length ? [`Bcc: ${opts.bcc.join(", ")}`] : []),
    `Subject: ${encodeHeader(opts.subject)}`,
    "X-Unsent: 1",
    "MIME-Version: 1.0",
    `Content-Type: multipart/related; boundary="${rel}"; type="multipart/alternative"`,
  ];

  const parts = [
    `--${rel}`,
    `Content-Type: multipart/alternative; boundary="${alt}"`,
    "",
    `--${alt}`,
    "Content-Type: text/plain; charset=UTF-8",
    "Content-Transfer-Encoding: base64",
    "",
    wrap76(utf8Base64(opts.text)),
    `--${alt}`,
    "Content-Type: text/html; charset=UTF-8",
    "Content-Transfer-Encoding: base64",
    "",
    wrap76(utf8Base64(opts.html)),
    `--${alt}--`,
    ...(opts.images ?? []).flatMap((img) => [
      `--${rel}`,
      `Content-Type: image/png; name="${img.filename}"`,
      "Content-Transfer-Encoding: base64",
      `Content-ID: <${img.cid}>`,
      `Content-Disposition: inline; filename="${img.filename}"`,
      "",
      wrap76(img.base64Png),
    ]),
    `--${rel}--`,
    "",
  ];

  return [...headers, "", ...parts].join(CRLF);
}

export function downloadFile(filename: string, content: string, type: string) {
  const url = URL.createObjectURL(new Blob([content], { type }));
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 10_000);
}

/** Rasterise an on-page SVG (e.g. a Recharts chart) to a base64 PNG. Returns null on failure. */
export async function svgToPngBase64(svg: SVGSVGElement, width: number, height: number, scale = 2): Promise<string | null> {
  try {
    const clone = svg.cloneNode(true) as SVGSVGElement;
    clone.setAttribute("xmlns", "http://www.w3.org/2000/svg");
    clone.setAttribute("width", String(width));
    clone.setAttribute("height", String(height));
    clone.setAttribute("style", "font-family:Segoe UI,Helvetica,Arial,sans-serif;background:#fff");
    const src = URL.createObjectURL(new Blob([new XMLSerializer().serializeToString(clone)], { type: "image/svg+xml" }));
    const img = new Image();
    await new Promise<void>((resolve, reject) => {
      img.onload = () => resolve();
      img.onerror = () => reject(new Error("svg load failed"));
      img.src = src;
    });
    const canvas = document.createElement("canvas");
    canvas.width = width * scale;
    canvas.height = height * scale;
    const ctx = canvas.getContext("2d");
    if (!ctx) return null;
    ctx.fillStyle = "#fff";
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
    URL.revokeObjectURL(src);
    return canvas.toDataURL("image/png").split(",")[1] ?? null;
  } catch {
    return null;
  }
}
