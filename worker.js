// ============================================================
// فخر المملكة — Cloudflare Worker API
// يحتاج: ربط D1 (DB) + متغيّر سرّي ADMIN_PASSWORD + متغيّر
// سرّي TOKEN_SECRET (أي نص عشوائي طويل تختاره أنت، لتوقيع الجلسات)
// ============================================================

// ⚠️ مُحدَّث للدومين النهائي — كان لا يزال يشير لرابط GitHub Pages
// القديم، وهذا بالضبط سبب فشل CORS على /api/ads و /api/reviews.
const ALLOWED_ORIGIN = "https://mizalat-jeddah-fakhr-almamlaka.com";
const REVIEW_COOLDOWN_MS = 2 * 60 * 1000;
const TOKEN_TTL_MS = 12 * 60 * 60 * 1000;

const BANNED_WORDS = ["كلب", "حيوان", "غبي", "حقير", "نصاب", "سيء جدا نصب"];

function corsHeaders() {
  return {
    "Access-Control-Allow-Origin": ALLOWED_ORIGIN,
    "Access-Control-Allow-Methods": "GET,POST,PUT,DELETE,OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, Authorization",
    "Access-Control-Max-Age": "86400",
    "Vary": "Origin",
  };
}

function json(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { "Content-Type": "application/json; charset=utf-8", ...corsHeaders() },
  });
}

function normalizeArabic(text) {
  return (text || "")
    .replace(/[\u064B-\u0652\u0640]/g, "")
    .replace(/[\s._\-*]/g, "")
    .toLowerCase();
}
function containsBannedWord(text) {
  const norm = normalizeArabic(text);
  return BANNED_WORDS.some((w) => norm.indexOf(normalizeArabic(w)) !== -1);
}

async function hmacSign(payloadStr, secret) {
  const key = await crypto.subtle.importKey(
    "raw", new TextEncoder().encode(secret),
    { name: "HMAC", hash: "SHA-256" }, false, ["sign"]
  );
  const sig = await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(payloadStr));
  return btoa(String.fromCharCode(...new Uint8Array(sig)));
}
async function makeToken(secret) {
  const payload = JSON.stringify({ exp: Date.now() + TOKEN_TTL_MS });
  const payloadB64 = btoa(payload);
  const sig = await hmacSign(payloadB64, secret);
  return `${payloadB64}.${sig}`;
}
async function verifyToken(token, secret) {
  if (!token) return false;
  const parts = token.split(".");
  if (parts.length !== 2) return false;
  const [payloadB64, sig] = parts;
  const expectedSig = await hmacSign(payloadB64, secret);
  if (sig !== expectedSig) return false;
  try {
    const payload = JSON.parse(atob(payloadB64));
    return payload.exp > Date.now();
  } catch (e) {
    return false;
  }
}
function getBearerToken(request) {
  const h = request.headers.get("Authorization") || "";
  return h.startsWith("Bearer ") ? h.slice(7) : null;
}
async function requireAdmin(request, env) {
  const token = getBearerToken(request);
  return await verifyToken(token, env.TOKEN_SECRET);
}

async function hashIp(ip, secret) {
  const sig = await hmacSign(ip, secret);
  return sig.slice(0, 32);
}
async function checkRateLimit(env, ip) {
  const ipHash = await hashIp(ip, env.TOKEN_SECRET);
  const row = await env.DB.prepare("SELECT last_ts FROM rate_limits WHERE ip_hash = ?")
    .bind(ipHash).first();
  const now = Date.now();
  if (row && now - row.last_ts < REVIEW_COOLDOWN_MS) {
    return false;
  }
  await env.DB.prepare(
    "INSERT INTO rate_limits (ip_hash, last_ts) VALUES (?, ?) ON CONFLICT(ip_hash) DO UPDATE SET last_ts = ?"
  ).bind(ipHash, now, now).run();
  return true;
}

async function handleGetReviews(env) {
  const { results } = await env.DB.prepare(
    "SELECT id, rating, name, text, ts, seeded FROM reviews ORDER BY ts DESC"
  ).all();
  return json({ reviews: results });
}

async function handlePostReview(request, env) {
  const ip = request.headers.get("CF-Connecting-IP") || "unknown";
  const okRate = await checkRateLimit(env, ip);
  if (!okRate) {
    return json({ error: "rate_limited", message: "يمكنك نشر تقييم واحد كل دقيقتين تقريباً — حاول بعد قليل." }, 429);
  }

  let body;
  try { body = await request.json(); } catch (e) { return json({ error: "bad_request" }, 400); }

  const rating = parseInt(body.rating, 10);
  const name = (body.name || "زائر").toString().trim().slice(0, 40);
  const text = (body.text || "").toString().trim().slice(0, 300);

  if (!Number.isInteger(rating) || rating < 1 || rating > 5) {
    return json({ error: "invalid_rating", message: "الرجاء اختيار عدد النجوم أولاً." }, 400);
  }
  if (text.length < 3) {
    return json({ error: "invalid_text", message: "الرجاء كتابة تعليق أوضح." }, 400);
  }
  if (containsBannedWord(text) || containsBannedWord(name)) {
    return json({ error: "banned_word", message: "تعذر نشر التعليق لاحتوائه على كلمات غير لائقة." }, 400);
  }

  const id = crypto.randomUUID();
  const ts = Date.now();
  await env.DB.prepare(
    "INSERT INTO reviews (id, rating, name, text, ts, seeded) VALUES (?, ?, ?, ?, ?, 0)"
  ).bind(id, rating, name, text, ts).run();

  return json({ ok: true, id, ts });
}

async function handleDeleteReview(request, env, id) {
  const isAdmin = await requireAdmin(request, env);
  if (!isAdmin) return json({ error: "unauthorized" }, 401);
  await env.DB.prepare("DELETE FROM reviews WHERE id = ?").bind(id).run();
  return json({ ok: true });
}

async function handleGetAds(env) {
  const nowStr = new Date().toISOString().slice(0, 10);
  const { results } = await env.DB.prepare(
    `SELECT id, badge, title, desc, price, image, active, expires_at, sort_order
     FROM ads
     WHERE active = 1 AND (expires_at IS NULL OR expires_at = '' OR expires_at >= ?)
     ORDER BY (CASE WHEN sort_order IS NULL THEN 999 ELSE sort_order END), id`
  ).bind(nowStr).all();
  return json({ ads: results });
}

async function handleGetAllAds(request, env) {
  const isAdmin = await requireAdmin(request, env);
  if (!isAdmin) return json({ error: "unauthorized" }, 401);
  const { results } = await env.DB.prepare(
    `SELECT id, badge, title, desc, price, image, active, expires_at, sort_order FROM ads
     ORDER BY (CASE WHEN sort_order IS NULL THEN 999 ELSE sort_order END), id`
  ).all();
  return json({ ads: results });
}

async function handlePutAds(request, env) {
  const isAdmin = await requireAdmin(request, env);
  if (!isAdmin) return json({ error: "unauthorized" }, 401);

  let body;
  try { body = await request.json(); } catch (e) { return json({ error: "bad_request" }, 400); }
  const items = Array.isArray(body.items) ? body.items : [];

  for (const item of items) {
    if (!item.title || !item.title.toString().trim()) {
      return json({ error: "missing_title", message: "كل بطاقة لازم يكون لها عنوان قبل الحفظ." }, 400);
    }
  }

  const now = Date.now();
  const stmts = [env.DB.prepare("DELETE FROM ads")];
  items.forEach((item, idx) => {
    stmts.push(
      env.DB.prepare(
        `INSERT INTO ads (id, badge, title, desc, price, image, active, expires_at, sort_order, updated_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
      ).bind(
        item.id || crypto.randomUUID(),
        (item.badge || "").toString().trim(),
        (item.title || "").toString().trim(),
        (item.desc || "").toString().trim(),
        (item.price || "").toString().trim(),
        (item.image || "").toString().trim(),
        item.active === false ? 0 : 1,
        (item.expiresAt || "").toString().trim() || null,
        typeof item.order === "number" ? item.order : idx,
        now
      )
    );
  });
  await env.DB.batch(stmts);

  return json({ ok: true, count: items.length });
}

async function handleLogin(request, env) {
  let body;
  try { body = await request.json(); } catch (e) { return json({ error: "bad_request" }, 400); }
  const password = (body.password || "").toString();

  if (!env.ADMIN_PASSWORD || password !== env.ADMIN_PASSWORD) {
    await new Promise((r) => setTimeout(r, 400));
    return json({ error: "invalid_credentials", message: "كلمة المرور غير صحيحة." }, 401);
  }

  const token = await makeToken(env.TOKEN_SECRET);
  return json({ ok: true, token, expiresInMs: TOKEN_TTL_MS });
}

export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    const path = url.pathname;
    const method = request.method;

    if (method === "OPTIONS") {
      return new Response(null, { headers: corsHeaders() });
    }

    try {
      if (path === "/api/reviews" && method === "GET") return await handleGetReviews(env);
      if (path === "/api/reviews" && method === "POST") return await handlePostReview(request, env);

      const reviewDeleteMatch = path.match(/^\/api\/reviews\/([a-zA-Z0-9-]+)$/);
      if (reviewDeleteMatch && method === "DELETE") {
        return await handleDeleteReview(request, env, reviewDeleteMatch[1]);
      }

      if (path === "/api/ads" && method === "GET") return await handleGetAds(env);
      if (path === "/api/ads/all" && method === "GET") return await handleGetAllAds(request, env);
      if (path === "/api/ads" && method === "PUT") return await handlePutAds(request, env);

      if (path === "/api/admin/login" && method === "POST") return await handleLogin(request, env);

      return json({ error: "not_found" }, 404);
    } catch (err) {
      return json({ error: "server_error", message: String(err && err.message || err) }, 500);
    }
  },
};
