import { resolveMx } from "node:dns/promises";

const RE = /^[^\s@]+@([^\s@]+\.[^\s@]+)$/;

// Vérifie la syntaxe et que le domaine peut recevoir du courrier (MX).
export async function checkEmail(email) {
  const m = RE.exec(email.trim());
  if (!m) return null;
  const domain = m[1].toLowerCase();
  try {
    const mx = await resolveMx(domain);
    return { email: email.trim().toLowerCase(), domain, mxOk: mx.length > 0 };
  } catch {
    return { email: email.trim().toLowerCase(), domain, mxOk: false };
  }
}
