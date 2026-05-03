import { Router, type IRouter } from "express";
import { eq, and, asc } from "drizzle-orm";
import { db, navItemsTable } from "@workspace/db";
import {
  CreateNavItemBody,
  UpdateNavItemBody,
  ReorderNavItemsBody,
} from "@workspace/api-zod";
import { requireAdmin } from "../lib/auth";

const router: IRouter = Router();

function shape(row: typeof navItemsTable.$inferSelect) {
  return {
    id: row.id,
    location: row.location,
    label: row.label,
    href: row.href,
    sortOrder: row.sortOrder,
    visible: row.visible === 1,
  };
}

// Public — visible items grouped by location.
router.get("/nav", async (_req, res): Promise<void> => {
  const rows = await db
    .select()
    .from(navItemsTable)
    .where(eq(navItemsTable.visible, 1))
    .orderBy(asc(navItemsTable.location), asc(navItemsTable.sortOrder));
  const groups: Record<string, ReturnType<typeof shape>[]> = {};
  for (const r of rows) {
    const item = shape(r);
    (groups[r.location] ??= []).push(item);
  }
  res.json(groups);
});

// Admin — every item, including hidden.
router.get("/admin/nav", requireAdmin, async (_req, res): Promise<void> => {
  const rows = await db
    .select()
    .from(navItemsTable)
    .orderBy(asc(navItemsTable.location), asc(navItemsTable.sortOrder));
  res.json(rows.map(shape));
});

router.post("/admin/nav", requireAdmin, async (req, res): Promise<void> => {
  const parsed = CreateNavItemBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }
  const d = parsed.data;
  const [row] = await db
    .insert(navItemsTable)
    .values({
      location: d.location,
      label: d.label,
      href: d.href,
      sortOrder: d.sortOrder ?? 0,
      visible: d.visible === false ? 0 : 1,
    })
    .returning();
  res.json(shape(row));
});

router.put("/admin/nav/:id", requireAdmin, async (req, res): Promise<void> => {
  const id = Number(req.params.id);
  if (!Number.isInteger(id)) {
    res.status(400).json({ error: "Invalid id" });
    return;
  }
  const parsed = UpdateNavItemBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }
  const patch: Record<string, unknown> = {};
  const d = parsed.data;
  if (d.location !== undefined) patch.location = d.location;
  if (d.label !== undefined) patch.label = d.label;
  if (d.href !== undefined) patch.href = d.href;
  if (d.sortOrder !== undefined) patch.sortOrder = d.sortOrder;
  if (d.visible !== undefined) patch.visible = d.visible ? 1 : 0;
  const [row] = await db
    .update(navItemsTable)
    .set(patch)
    .where(eq(navItemsTable.id, id))
    .returning();
  if (!row) {
    res.status(404).json({ error: "Not found" });
    return;
  }
  res.json(shape(row));
});

router.delete("/admin/nav/:id", requireAdmin, async (req, res): Promise<void> => {
  const id = Number(req.params.id);
  if (!Number.isInteger(id)) {
    res.status(400).json({ error: "Invalid id" });
    return;
  }
  await db.delete(navItemsTable).where(eq(navItemsTable.id, id));
  res.json({ success: true });
});

router.post("/admin/nav/reorder", requireAdmin, async (req, res): Promise<void> => {
  const parsed = ReorderNavItemsBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }
  for (const item of parsed.data.items) {
    await db
      .update(navItemsTable)
      .set({ sortOrder: item.sortOrder })
      .where(eq(navItemsTable.id, item.id));
  }
  res.json({ success: true });
  // touch unused
  void and;
});

export default router;
