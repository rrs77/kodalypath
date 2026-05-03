import { Router, type IRouter } from "express";
import { and, eq, isNull, or, asc } from "drizzle-orm";
import { db, pathwayItemsTable } from "@workspace/db";
import { requireAuth } from "../lib/auth";

const router: IRouter = Router();

router.get("/pathway/items", async (req, res): Promise<void> => {
  const teacher = requireAuth(req, res);
  if (!teacher) return;
  const keyStage = typeof req.query.keyStage === "string" ? req.query.keyStage : undefined;
  const strand = typeof req.query.strand === "string" ? req.query.strand : undefined;

  const conditions = [
    or(isNull(pathwayItemsTable.teacherId), eq(pathwayItemsTable.teacherId, teacher.id)),
  ];
  if (keyStage) conditions.push(eq(pathwayItemsTable.keyStage, keyStage));
  if (strand) conditions.push(eq(pathwayItemsTable.strand, strand));

  const rows = await db
    .select()
    .from(pathwayItemsTable)
    .where(and(...conditions))
    .orderBy(asc(pathwayItemsTable.keyStage), asc(pathwayItemsTable.strand), asc(pathwayItemsTable.sequenceOrder));

  res.json(rows.map((r) => ({ ...r, isCustom: r.isCustom === 1 })));
});

router.post("/pathway/items", async (req, res): Promise<void> => {
  const teacher = requireAuth(req, res);
  if (!teacher) return;
  const b = req.body ?? {};
  if (!b.title || !b.keyStage || !b.strand) {
    res.status(400).json({ error: "title, keyStage, strand required" });
    return;
  }
  const [row] = await db
    .insert(pathwayItemsTable)
    .values({
      teacherId: teacher.id,
      keyStage: String(b.keyStage),
      yearGroup: String(b.yearGroup ?? ""),
      strand: String(b.strand),
      title: String(b.title),
      description: String(b.description ?? ""),
      sequenceOrder: Number(b.sequenceOrder ?? 0),
      isCustom: 1,
    })
    .returning();
  res.json({ ...row, isCustom: true });
});

router.patch("/pathway/items/:id", async (req, res): Promise<void> => {
  const teacher = requireAuth(req, res);
  if (!teacher) return;
  const id = parseInt(String(req.params.id), 10);
  const b = req.body ?? {};
  const update: Record<string, unknown> = {};
  for (const k of ["keyStage", "yearGroup", "strand", "title", "description"] as const) {
    if (typeof b[k] === "string") update[k] = b[k];
  }
  if (typeof b.sequenceOrder === "number") update.sequenceOrder = b.sequenceOrder;
  const [row] = await db
    .update(pathwayItemsTable)
    .set(update)
    .where(and(eq(pathwayItemsTable.id, id), eq(pathwayItemsTable.teacherId, teacher.id)))
    .returning();
  if (!row) {
    res.status(404).json({ error: "Not found or not editable" });
    return;
  }
  res.json({ ...row, isCustom: row.isCustom === 1 });
});

router.delete("/pathway/items/:id", async (req, res): Promise<void> => {
  const teacher = requireAuth(req, res);
  if (!teacher) return;
  const id = parseInt(String(req.params.id), 10);
  const result = await db
    .delete(pathwayItemsTable)
    .where(and(eq(pathwayItemsTable.id, id), eq(pathwayItemsTable.teacherId, teacher.id)))
    .returning();
  if (result.length === 0) {
    res.status(404).json({ error: "Not found" });
    return;
  }
  res.json({ success: true });
});

export default router;
