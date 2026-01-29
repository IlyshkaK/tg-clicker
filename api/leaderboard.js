// api/leaderboard.js
// Leaderboard API for Vercel.
// Stores top scores. Best-effort memory, or Supabase if configured.
// Optional anti-cheat: verifies initData (set TELEGRAM_BOT_TOKEN env var).

import { verifyInitData } from "./_tg_verify.js";

let memory = globalThis.__LEADER__ ?? (globalThis.__LEADER__ = []);

function clampInt(x, min, max) {
  const n = Number(x);
  if (!Number.isFinite(n)) return min;
  return Math.max(min, Math.min(max, Math.floor(n)));
}
function cleanName(s) {
  const t = String(s ?? "Player").trim().slice(0, 24);
  return t || "Player";
}
function cleanUserId(x) {
  const s = String(x ?? "").trim();
  if (!s || s.length > 32) return null;
  if (s !== "local" && !/^\d+$/.test(s)) return null;
  return s;
}

async function trySupabase() {
  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) return null;
  const { createClient } = await import("@supabase/supabase-js");
  return createClient(url, key, { auth: { persistSession: false } });
}

export default async function handler(req, res) {
  try {
    if (req.method === "GET") {
      const limit = clampInt(req.query.limit ?? 10, 1, 50);

      const supa = await trySupabase();
      if (supa) {
        const { data, error } = await supa
          .from("leaderboard")
          .select("name,score,created_at")
          .order("score", { ascending: false })
          .order("created_at", { ascending: true })
          .limit(limit);
        if (error) throw error;
        return res.status(200).json({ ok:true, items: data.map(x => ({ name:x.name, score:x.score })), mode:"supabase" });
      }

      const items = [...memory]
        .sort((a,b)=> b.score - a.score || a.ts - b.ts)
        .slice(0, limit)
        .map(x=>({ name:x.name, score:x.score }));
      return res.status(200).json({ ok:true, items, mode:"memory" });
    }

    if (req.method === "POST") {
      const body = req.body ?? {};
      const userId = cleanUserId(body.userId);
      if (!userId) return res.status(400).json({ ok:false, error:"Bad userId" });

      const botToken = process.env.TELEGRAM_BOT_TOKEN;
      const v = verifyInitData(body.initData || "", botToken);
      if (!v.ok) return res.status(401).json({ ok:false, error: v.error });

      const name = cleanName(body.name);
      const score = clampInt(body.score, 0, 1_000_000_000_000);

      const supa = await trySupabase();
      if (supa) {
        const { error } = await supa.from("leaderboard").insert({ user_id: userId, name, score });
        if (error) throw error;
        return res.status(200).json({ ok:true, stored:true, mode:"supabase", verify:v.mode });
      }

      memory.push({ userId, name, score, ts: Date.now() });
      if (memory.length > 5000) memory = memory.slice(-2000);
      return res.status(200).json({ ok:true, stored:true, mode:"memory", verify:v.mode });
    }

    res.setHeader("Allow", "GET, POST");
    return res.status(405).json({ ok:false, error:"Method not allowed" });
  } catch (e) {
    return res.status(500).json({ ok:false, error: String(e?.message ?? e) });
  }
}
