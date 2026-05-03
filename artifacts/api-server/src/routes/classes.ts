import { Router, type IRouter } from "express";
import { and, eq } from "drizzle-orm";
import { db, classesTable } from "@workspace/db";
import { requireAuth } from "../lib/auth";

const router: IRouter = Router();

router.get("/classes", async (req, res): Promise<void> => {
  const teacher = requireAuth(req, res);
  if (!teacher) return;
  const rows = await db
    .select()
    .from(classesTable)
    .where(eq(classesTable.teacherId, teacher.id))
    .orderBy(classesTable.name);
  res.json(rows);
});

router.post("/classes", async (req, res): Promise<void> => {
  const teacher = requireAuth(req, res);
  if (!teacher) return;
  const b = req.body ?? {};
  if (!b.name) {
    res.status(400).json({ error: "name required" });
    return;
  }
  const [row] = await db
    .insert(classesTable)
    .values({
      teacherId: teacher.id,
      name: String(b.name),
      yearGroup: String(b.yearGroup ?? ""),
      keyStage: String(b.keyStage ?? ""),
      notes: String(b.notes ?? ""),
    })
    .returning();
  res.json(row);
});

router.patch("/classes/:id", async (req, res): Promise<void> => {
  const teacher = requireAuth(req, res);
  if (!teacher) return;
  const id = parseInt(String(req.params.id), 10);
  const b = req.body ?? {};
  const update: Record<string, unknown> = {};
  for (const k of ["name", "yearGroup", "keyStage", "notes"] as const) {
    if (typeof b[k] === "string") update[k] = b[k];
  }
  const [row] = await db
    .update(classesTable)
    .set(update)
    .where(and(eq(classesTable.id, id), eq(classesTable.teacherId, teacher.id)))
    .returning();
  if (!row) {
    res.status(404).json({ error: "Not found" });
    return;
  }
  res.json(row);
});

router.delete("/classes/:id", async (req, res): Promise<void> => {
  const teacher = requireAuth(req, res);
  if (!teacher) return;
  const id = parseInt(String(req.params.id), 10);
  const rows = await db
    .delete(classesTable)
    .where(and(eq(classesTable.id, id), eq(classesTable.teacherId, teacher.id)))
    .returning();
  if (rows.length === 0) {
    res.status(404).json({ error: "Not found" });
    return;
  }
  res.json({ success: true });
});

export default router;
