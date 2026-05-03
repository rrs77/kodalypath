import { Router, type IRouter } from "express";
import { and, eq, isNull, or, ilike } from "drizzle-orm";
import { db, resourcesTable } from "@workspace/db";
import { requireAuth } from "../lib/auth";

const router: IRouter = Router();

function serialize(r: typeof resourcesTable.$inferSelect) {
  return { ...r, tags: r.tags ?? [] };
}

router.get("/resources", async (req, res): Promise<void> => {
  const teacher = requireAuth(req, res);
  if (!teacher) return;
  const conditions = [
    or(isNull(resourcesTable.teacherId), eq(resourcesTable.teacherId, teacher.id))!,
  ];
  if (typeof req.query.search === "string" && req.query.search) {
    const s = `%${req.query.search}%`;
    conditions.push(or(
      ilike(resourcesTable.title, s),
      ilike(resourcesTable.notes, s),
      ilike(resourcesTable.kodalyFocus, s),
    )!);
  }
  const rows = await db
    .select()
    .from(resourcesTable)
    .where(and(...conditions))
    .orderBy(resourcesTable.title);
  res.json(rows.map(serialize));
});

router.post("/resources", async (req, res): Promise<void> => {
  const teacher = requireAuth(req, res);
  if (!teacher) return;
  const b = req.body ?? {};
  if (!b.title || !b.url) {
    res.status(400).json({ error: "title and url required" });
    return;
  }
  const [row] = await db
    .insert(resourcesTable)
    .values({
      teacherId: teacher.id,
      title: String(b.title),
      url: String(b.url),
      sourceType: String(b.sourceType ?? inferSourceType(String(b.url))),
      kodalyFocus: String(b.kodalyFocus ?? ""),
      ageRange: String(b.ageRange ?? ""),
      keyStage: String(b.keyStage ?? ""),
      progressionStage: String(b.progressionStage ?? ""),
      notes: String(b.notes ?? ""),
      tags: Array.isArray(b.tags) ? b.tags.map(String) : [],
    })
    .returning();
  res.json(serialize(row));
});

router.post("/resources/import", async (req, res): Promise<void> => {
  const teacher = requireAuth(req, res);
  if (!teacher) return;
  const url = req.body?.url;
  if (typeof url !== "string" || !url) {
    res.status(400).json({ error: "url required" });
    return;
  }
  if (!isSafePublicUrl(url)) {
    res.status(400).json({ error: "URL must be http(s) and not point to a private network" });
    return;
  }
  let title = url;
  try {
    const ctrl = new AbortController();
    const t = setTimeout(() => ctrl.abort(), 6000);
    const r = await fetch(url, {
      signal: ctrl.signal,
      redirect: "manual",
      headers: { "User-Agent": "KodalyPathways/1.0 (+resource-import)" },
    });
    clearTimeout(t);
    if (r.ok) {
      const ct = r.headers.get("content-type") || "";
      if (ct.includes("text/html") || ct.includes("application/xhtml")) {
        const buf = await r.arrayBuffer();
        const text = new TextDecoder("utf-8", { fatal: false }).decode(buf.slice(0, 256 * 1024));
        const m = text.match(/<title[^>]*>([^<]{1,300})<\/title>/i);
        if (m) title = decodeHtml(m[1].trim());
      }
    }
  } catch (err) {
    req.log.warn({ err: String(err) }, "import fetch failed");
  }
  const sourceType = inferSourceType(url);
  res.json({
    title,
    url,
    sourceType,
    suggestedKodalyFocus: "",
    suggestedAgeRange: "",
    suggestedKeyStage: "",
    suggestedProgressionStage: "",
    suggestedTags: sourceType ? [sourceType] : [],
  });
});

router.patch("/resources/:id", async (req, res): Promise<void> => {
  const teacher = requireAuth(req, res);
  if (!teacher) return;
  const id = parseInt(String(req.params.id), 10);
  const b = req.body ?? {};
  const update: Record<string, unknown> = {};
  for (const k of ["title","url","sourceType","kodalyFocus","ageRange","keyStage","progressionStage","notes"] as const) {
    if (typeof b[k] === "string") update[k] = b[k];
  }
  if (Array.isArray(b.tags)) update.tags = b.tags.map(String);
  const [row] = await db
    .update(resourcesTable)
    .set(update)
    .where(and(eq(resourcesTable.id, id), eq(resourcesTable.teacherId, teacher.id)))
    .returning();
  if (!row) {
    res.status(404).json({ error: "Not found" });
    return;
  }
  res.json(serialize(row));
});

router.delete("/resources/:id", async (req, res): Promise<void> => {
  const teacher = requireAuth(req, res);
  if (!teacher) return;
  const id = parseInt(String(req.params.id), 10);
  const rows = await db
    .delete(resourcesTable)
    .where(and(eq(resourcesTable.id, id), eq(resourcesTable.teacherId, teacher.id)))
    .returning();
  if (rows.length === 0) {
    res.status(404).json({ error: "Not found" });
    return;
  }
  res.json({ success: true });
});

function isSafePublicUrl(raw: string): boolean {
  let u: URL;
  try { u = new URL(raw); } catch { return false; }
  if (u.protocol !== "http:" && u.protocol !== "https:") return false;
  const h = u.hostname.toLowerCase();
  if (!h || h === "localhost" || h.endsWith(".localhost") || h.endsWith(".internal")) return false;
  // IPv4 literal
  const ipv4 = /^(\d{1,3})\.(\d{1,3})\.(\d{1,3})\.(\d{1,3})$/.exec(h);
  if (ipv4) {
    const [a, b, c] = ipv4.slice(1).map((x) => parseInt(x, 10));
    if (a === 10 || a === 127 || a === 0) return false;
    if (a === 169 && b === 254) return false;
    if (a === 172 && b >= 16 && b <= 31) return false;
    if (a === 192 && b === 168) return false;
    if (a === 100 && b >= 64 && b <= 127) return false;
    if (a >= 224) return false;
    return true;
  }
  // IPv6 literal — block any literal to be safe
  if (h.includes(":") || (h.startsWith("[") && h.endsWith("]"))) return false;
  return true;
}

function inferSourceType(url: string): string {
  const lower = url.toLowerCase();
  if (lower.includes("youtube.com") || lower.includes("youtu.be")) return "video";
  if (lower.includes("vimeo.com")) return "video";
  if (lower.endsWith(".pdf")) return "pdf";
  if (/\.(mp3|wav|ogg|m4a)(\?|$)/.test(lower)) return "audio";
  if (lower.includes("spotify.com")) return "audio";
  return "web";
}

function decodeHtml(s: string): string {
  return s
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&nbsp;/g, " ");
}

export default router;
