import { Router, type IRouter } from "express";
import { and, eq } from "drizzle-orm";
import { db, calendarEntriesTable } from "@workspace/db";
import { requireAuth } from "../lib/auth";
import { serializeCalendarEntry } from "./dashboard";
import { ownsClass, ownsLesson, parseIntParam } from "../lib/ownership";

const router: IRouter = Router();

router.get("/calendar", async (req, res): Promise<void> => {
  const teacher = requireAuth(req, res);
  if (!teacher) return;
  const conditions = [eq(calendarEntriesTable.teacherId, teacher.id)];
  if (typeof req.query.term === "string") conditions.push(eq(calendarEntriesTable.term, req.query.term));
  const classIdQ = parseIntParam(req.query.classId);
  if (classIdQ !== null) conditions.push(eq(calendarEntriesTable.classId, classIdQ));
  const rows = await db
    .select()
    .from(calendarEntriesTable)
    .where(and(...conditions))
    .orderBy(calendarEntriesTable.term, calendarEntriesTable.weekNumber, calendarEntriesTable.sortOrder);
  res.json(rows.map(serializeCalendarEntry));
});

router.post("/calendar", async (req, res): Promise<void> => {
  const teacher = requireAuth(req, res);
  if (!teacher) return;
  const b = req.body ?? {};
  if (!b.term) {
    res.status(400).json({ error: "term required" });
    return;
  }
  if (!(await ownsClass(teacher.id, b.classId ?? null)) || !(await ownsLesson(teacher.id, b.lessonId ?? null))) {
    res.status(403).json({ error: "Invalid classId or lessonId" });
    return;
  }
  const [row] = await db
    .insert(calendarEntriesTable)
    .values({
      teacherId: teacher.id,
      term: String(b.term),
      weekNumber: typeof b.weekNumber === "number" ? b.weekNumber : 1,
      dayLabel: String(b.dayLabel ?? ""),
      sortOrder: typeof b.sortOrder === "number" ? b.sortOrder : 0,
      lessonId: typeof b.lessonId === "number" ? b.lessonId : null,
      classId: typeof b.classId === "number" ? b.classId : null,
      title: String(b.title ?? ""),
      notes: String(b.notes ?? ""),
    })
    .returning();
  res.json(serializeCalendarEntry(row));
});

router.patch("/calendar/:id", async (req, res): Promise<void> => {
  const teacher = requireAuth(req, res);
  if (!teacher) return;
  const id = parseInt(String(req.params.id), 10);
  const b = req.body ?? {};
  if (b.classId !== undefined && !(await ownsClass(teacher.id, b.classId))) {
    res.status(403).json({ error: "Invalid classId" });
    return;
  }
  if (b.lessonId !== undefined && !(await ownsLesson(teacher.id, b.lessonId))) {
    res.status(403).json({ error: "Invalid lessonId" });
    return;
  }
  const update: Record<string, unknown> = {};
  for (const k of ["term", "dayLabel", "title", "notes"] as const) {
    if (typeof b[k] === "string") update[k] = b[k];
  }
  if (typeof b.weekNumber === "number") update.weekNumber = b.weekNumber;
  if (typeof b.sortOrder === "number") update.sortOrder = b.sortOrder;
  if (b.lessonId === null || typeof b.lessonId === "number") update.lessonId = b.lessonId;
  if (b.classId === null || typeof b.classId === "number") update.classId = b.classId;
  const [row] = await db
    .update(calendarEntriesTable)
    .set(update)
    .where(and(eq(calendarEntriesTable.id, id), eq(calendarEntriesTable.teacherId, teacher.id)))
    .returning();
  if (!row) {
    res.status(404).json({ error: "Not found" });
    return;
  }
  res.json(serializeCalendarEntry(row));
});

router.delete("/calendar/:id", async (req, res): Promise<void> => {
  const teacher = requireAuth(req, res);
  if (!teacher) return;
  const id = parseInt(String(req.params.id), 10);
  const rows = await db
    .delete(calendarEntriesTable)
    .where(and(eq(calendarEntriesTable.id, id), eq(calendarEntriesTable.teacherId, teacher.id)))
    .returning();
  if (rows.length === 0) {
    res.status(404).json({ error: "Not found" });
    return;
  }
  res.json({ success: true });
});

router.post("/calendar/copy-term", async (req, res): Promise<void> => {
  const teacher = requireAuth(req, res);
  if (!teacher) return;
  const b = req.body ?? {};
  if (!b.sourceTerm || !b.targetTerm) {
    res.status(400).json({ error: "sourceTerm and targetTerm required" });
    return;
  }
  if (b.targetClassId !== undefined && !(await ownsClass(teacher.id, b.targetClassId))) {
    res.status(403).json({ error: "Invalid targetClassId" });
    return;
  }
  const src = await db
    .select()
    .from(calendarEntriesTable)
    .where(and(
      eq(calendarEntriesTable.teacherId, teacher.id),
      eq(calendarEntriesTable.term, String(b.sourceTerm)),
    ));
  if (src.length === 0) {
    res.json({ success: true });
    return;
  }
  await db.insert(calendarEntriesTable).values(
    src.map((e) => ({
      teacherId: teacher.id,
      term: String(b.targetTerm),
      weekNumber: e.weekNumber,
      dayLabel: e.dayLabel,
      sortOrder: e.sortOrder,
      lessonId: e.lessonId,
      classId: typeof b.targetClassId === "number" ? b.targetClassId : e.classId,
      title: e.title,
      notes: e.notes,
    })),
  );
  res.json({ success: true });
});

export default router;
