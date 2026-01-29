// api/progress.js
// Progress API for Vercel.
// Memory mode works instantly (may reset). Enable Supabase for persistence.

let memory = globalThis.__PROGRESS__ ?? (globalThis.__PROGRESS__ = new Map());

function cleanUserId(x) {
  const s = String(x ?? "").trim();
  if (!s || s.length > 32) return null;
  if (s !== "local" && !/^\d+$/.test(s)) return null;
  return s;
}
function clampInt(x, min, max) {
  const n = Number(x);
  if (!Number.isFinite(n)) return min;
  return Math.max(min, Math.min(max, Math.floor(n)));
}
function sanitizeState(s) {
  s = s || {};
  return {
    coins: clampInt(s.coins, 0, 1_000_000_000_000),
    clickPower: clampInt(s.clickPower, 1, 1_000_000),
    autos: clampInt(s.autos, 0, 1_000_000),
    mult: clampInt(s.mult, 1, 1_000_000_000),
    totalClicks: clampInt(s.totalClicks, 0, 1_000_000_000_000),
    totalEarned: clampInt(s.totalEarned, 0, 1_000_000_000_000),
    lastTs: clampInt(s.lastTs, 0, 9_999_999_999_999),
  };
}

async function trySupabase() {
  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY; // server-side only
  if (!url || !key) return null;
  const { createClient } = await import("@supabase/supabase-js");
  return createClient(url, key, { auth: { persistSession: false } });
}

export default async function handler(req, res) {
  try {
    if (req.method === "GET") {
      const userId = cleanUserId(req.query.userId);
      if (!userId) return res.status(400).json({ ok:false, error:"Bad userId" });

      const supa = await trySupabase();
      if (supa) {
        const { data, error } = await supa
          .from("progress")
          .select("state,updated_at")
          .eq("user_id", userId)
          .maybeSingle();
        if (error) throw error;
        return res.status(200).json({ ok:true, state: data?.state ?? null, mode:"supabase" });
      }

      return res.status(200).json({ ok:true, state: memory.get(userId) ?? null, mode:"memory" });
    }

    if (req.method === "POST") {
      const body = req.body ?? {};
      const userId = cleanUserId(body.userId);
      if (!userId) return res.status(400).json({ ok:false, error:"Bad userId" });

      const state = sanitizeState(body.state);

      const supa = await trySupabase();
      if (supa) {
        const { error } = await supa
          .from("progress")
          .upsert({ user_id: userId, state }, { onConflict: "user_id" });
        if (error) throw error;
        return res.status(200).json({ ok:true, stored:true, mode:"supabase" });
      }

      memory.set(userId, state);
      return res.status(200).json({ ok:true, stored:true, mode:"memory" });
    }

    res.setHeader("Allow", "GET, POST");
    return res.status(405).json({ ok:false, error:"Method not allowed" });
  } catch (e) {
    return res.status(500).json({ ok:false, error: String(e?.message ?? e) });
  }
}
