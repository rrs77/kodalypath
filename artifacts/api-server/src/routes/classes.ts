import { Router, type IRouter } from "express";
import { and, eq } from "drizzle-orm";
import { db, classesTable } from "@workspace/db";
import { requireAuth } from "../lib/auth";
import { encrypt, decrypt } from "../lib/crypto";

const router: IRouter = Router();

type ClassRow = typeof classesTable.$inferSelect;

function serializeClass(c: ClassRow): ClassRow {
  return { ...c, name: decrypt(c.name), notes: decrypt(c.notes) };
}

router.get("/classes", async (req, res): Promise<void> => {
  const teacher = requireAuth(req, res);
  if (!teacher) return;
  const rows = await db
    .select()
    .from(classesTable)
    .where(eq(classesTable.teacherId, teacher.id));
  const decrypted = rows.map(serializeClass);
  decrypted.sort((a, b) => a.name.localeCompare(b.name));
  res.json(decrypted);
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
      name: encrypt(String(b.name)),
      yearGroup: String(b.yearGroup ?? ""),
      keyStage: String(b.keyStage ?? ""),
      notes: encrypt(String(b.notes ?? "")),
    })
    .returning();
  res.json(serializeClass(row));
});

router.patch("/classes/:id", async (req, res): Promise<void> => {
  const teacher = requireAuth(req, res);
  if (!teacher) return;
  const id = parseInt(String(req.params.id), 10);
  const b = req.body ?? {};
  const update: Record<string, unknown> = {};
  if (typeof b.name === "string") update.name = encrypt(b.name);
  if (typeof b.notes === "string") update.notes = encrypt(b.notes);
  if (typeof b.yearGroup === "string") update.yearGroup = b.yearGroup;
  if (typeof b.keyStage === "string") update.keyStage = b.keyStage;
  const [row] = await db
    .update(classesTable)
    .set(update)
    .where(and(eq(classesTable.id, id), eq(classesTable.teacherId, teacher.id)))
    .returning();
  if (!row) {
    res.status(404).json({ error: "Not found" });
    return;
  }
  res.json(serializeClass(row));
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
