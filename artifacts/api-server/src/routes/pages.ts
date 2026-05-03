import { Router, type IRouter } from "express";
import { eq, sql } from "drizzle-orm";
import { db, pagesTable } from "@workspace/db";
import {
  CreatePageBody,
  UpdatePageBody,
  type Page,
} from "@workspace/api-zod";
import { requireAdmin } from "../lib/auth";

const router: IRouter = Router();

function shape(row: typeof pagesTable.$inferSelect): Page {
  return {
    id: row.id,
    slug: row.slug,
    title: row.title,
    published: row.published === 1,
    blocks: (row.blocks ?? []) as Page["blocks"],
    updatedAt: row.updatedAt.toISOString(),
  };
}

// Public — render a published page by slug.
router.get("/pages/:slug", async (req, res): Promise<void> => {
  const slug = String(req.params.slug ?? "").trim().toLowerCase();
  if (!slug) {
    res.status(404).json({ error: "Not found" });
    return;
  }
  const [row] = await db
    .select()
    .from(pagesTable)
    .where(eq(pagesTable.slug, slug))
    .limit(1);
  if (!row || row.published !== 1) {
    res.status(404).json({ error: "Not found" });
    return;
  }
  res.json(shape(row));
});

// Admin — list all pages (lightweight summary).
router.get("/admin/pages", requireAdmin, async (_req, res): Promise<void> => {
  const rows = await db
    .select({
      id: pagesTable.id,
      slug: pagesTable.slug,
      title: pagesTable.title,
      published: pagesTable.published,
      updatedAt: pagesTable.updatedAt,
      blockCount: sql<number>`coalesce(jsonb_array_length(${pagesTable.blocks}), 0)`,
    })
    .from(pagesTable)
    .orderBy(pagesTable.slug);
  res.json(
    rows.map((r) => ({
      id: r.id,
      slug: r.slug,
      title: r.title,
      published: r.published === 1,
      blockCount: Number(r.blockCount ?? 0),
      updatedAt: r.updatedAt.toISOString(),
    })),
  );
});

router.get("/admin/pages/:id", requireAdmin, async (req, res): Promise<void> => {
  const id = Number(req.params.id);
  if (!Number.isInteger(id)) {
    res.status(400).json({ error: "Invalid id" });
    return;
  }
  const [row] = await db.select().from(pagesTable).where(eq(pagesTable.id, id)).limit(1);
  if (!row) {
    res.status(404).json({ error: "Not found" });
    return;
  }
  res.json(shape(row));
});

router.post("/admin/pages", requireAdmin, async (req, res): Promise<void> => {
  const parsed = CreatePageBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }
  const { slug, title, published, blocks } = parsed.data;
  try {
    const [row] = await db
      .insert(pagesTable)
      .values({
        slug,
        title,
        published: published === false ? 0 : 1,
        blocks: (blocks ?? []) as unknown[],
      })
      .returning();
    res.json(shape(row));
  } catch (err) {
    req.log?.warn({ err }, "create page failed (likely duplicate slug)");
    res.status(409).json({ error: "Slug already exists" });
  }
});

router.put("/admin/pages/:id", requireAdmin, async (req, res): Promise<void> => {
  const id = Number(req.params.id);
  if (!Number.isInteger(id)) {
    res.status(400).json({ error: "Invalid id" });
    return;
  }
  const parsed = UpdatePageBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }
  const patch: Record<string, unknown> = { updatedAt: new Date() };
  if (parsed.data.slug !== undefined) patch.slug = parsed.data.slug;
  if (parsed.data.title !== undefined) patch.title = parsed.data.title;
  if (parsed.data.published !== undefined) patch.published = parsed.data.published ? 1 : 0;
  if (parsed.data.blocks !== undefined) patch.blocks = parsed.data.blocks;
  try {
    const [row] = await db
      .update(pagesTable)
      .set(patch)
      .where(eq(pagesTable.id, id))
      .returning();
    if (!row) {
      res.status(404).json({ error: "Not found" });
      return;
    }
    res.json(shape(row));
  } catch (err) {
    req.log?.warn({ err }, "update page failed (likely duplicate slug)");
    res.status(409).json({ error: "Slug already exists" });
  }
});

router.delete("/admin/pages/:id", requireAdmin, async (req, res): Promise<void> => {
  const id = Number(req.params.id);
  if (!Number.isInteger(id)) {
    res.status(400).json({ error: "Invalid id" });
    return;
  }
  await db.delete(pagesTable).where(eq(pagesTable.id, id));
  res.json({ success: true });
});

export default router;
