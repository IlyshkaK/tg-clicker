// api/_tg_verify.js
// Telegram WebApp initData verification (server-side).
// Set TELEGRAM_BOT_TOKEN in Vercel environment to enable verification.
// If token not set, functions will accept requests without verification (dev mode).

import crypto from "crypto";

export function parseInitData(initData) {
  const params = new URLSearchParams(initData || "");
  const obj = {};
  for (const [k,v] of params.entries()) obj[k] = v;
  return obj;
}

export function verifyInitData(initData, botToken, maxAgeSeconds = 24*3600) {
  if (!botToken) return { ok: true, mode: "no-token" };
  if (!initData) return { ok: false, error: "Missing initData" };

  const params = new URLSearchParams(initData);
  const hash = params.get("hash");
  if (!hash) return { ok: false, error: "Missing hash" };

  params.delete("hash");

  // check auth_date freshness
  const authDate = Number(params.get("auth_date") || 0);
  const now = Math.floor(Date.now()/1000);
  if (!authDate || Math.abs(now - authDate) > maxAgeSeconds) {
    return { ok: false, error: "auth_date expired" };
  }

  const dataCheckString = [...params.entries()]
    .sort(([a],[b]) => a.localeCompare(b))
    .map(([k,v]) => `${k}=${v}`)
    .join("\n");

  const secretKey = crypto.createHmac("sha256", "WebAppData").update(botToken).digest();
  const expected = crypto.createHmac("sha256", secretKey).update(dataCheckString).digest("hex");

  const ok = crypto.timingSafeEqual(Buffer.from(expected), Buffer.from(hash));
  return ok ? { ok: true, mode: "verified" } : { ok: false, error: "Bad hash" };
}
