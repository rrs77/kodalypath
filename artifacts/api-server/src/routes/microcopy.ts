import { Router, type IRouter } from "express";
import { sql, inArray } from "drizzle-orm";
import { db, microcopyTable } from "@workspace/db";
import { UpsertMicrocopyBody } from "@workspace/api-zod";
import { requireAdmin } from "../lib/auth";

const router: IRouter = Router();

// Public — flat key/value map for the client.
router.get("/microcopy", async (_req, res): Promise<void> => {
  const rows = await db.select().from(microcopyTable);
  const out: Record<string, string> = {};
  for (const r of rows) out[r.key] = r.value;
  res.json(out);
});

// Admin — full entries with metadata.
router.get("/admin/microcopy", requireAdmin, async (_req, res): Promise<void> => {
  const rows = await db.select().from(microcopyTable).orderBy(microcopyTable.key);
  res.json(
    rows.map((r) => ({
      key: r.key,
      value: r.value,
      description: r.description,
      updatedAt: r.updatedAt.toISOString(),
    })),
  );
});

// Admin — bulk upsert.
router.put("/admin/microcopy", requireAdmin, async (req, res): Promise<void> => {
  const parsed = UpsertMicrocopyBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }
  const now = new Date();
  const deleteKeys = parsed.data.deleteKeys ?? [];
  if (deleteKeys.length > 0) {
    await db.delete(microcopyTable).where(inArray(microcopyTable.key, deleteKeys));
  }
  for (const e of parsed.data.entries) {
    await db
      .insert(microcopyTable)
      .values({ key: e.key, value: e.value, description: e.description ?? "", updatedAt: now })
      .onConflictDoUpdate({
        target: microcopyTable.key,
        set: {
          value: sql`excluded.value`,
          description: sql`excluded.description`,
          updatedAt: now,
        },
      });
  }
  res.json({ success: true });
});

export default router;
