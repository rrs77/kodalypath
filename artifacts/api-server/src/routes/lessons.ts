import { Router, type IRouter } from "express";
import { and, eq, desc } from "drizzle-orm";
import { db, lessonsTable } from "@workspace/db";
import { requireAuth } from "../lib/auth";
import { generateLessonPlan } from "../lib/lesson-generator";
import { streamLessonPdf } from "../lib/pdf";
import { serializeLesson } from "./dashboard";
import { ownsClass, parseIntParam } from "../lib/ownership";
import { encrypt } from "../lib/crypto";

const ENCRYPTED_LESSON_FIELDS = new Set(["notes", "differentiation", "sendAdaptations", "ealAdaptations"]);

const router: IRouter = Router();

router.get("/lessons", async (req, res): Promise<void> => {
  const teacher = requireAuth(req, res);
  if (!teacher) return;
  const conditions = [eq(lessonsTable.teacherId, teacher.id)];
  const classIdQ = parseIntParam(req.query.classId);
  if (classIdQ !== null) {
    if (!(await ownsClass(teacher.id, classIdQ))) {
      res.status(403).json({ error: "Invalid classId" });
      return;
    }
    conditions.push(eq(lessonsTable.classId, classIdQ));
  }
  if (typeof req.query.term === "string") conditions.push(eq(lessonsTable.term, req.query.term));
  const rows = await db
    .select()
    .from(lessonsTable)
    .where(and(...conditions))
    .orderBy(desc(lessonsTable.updatedAt));
  res.json(rows.map(serializeLesson));
});

router.post("/lessons", async (req, res): Promise<void> => {
  const teacher = requireAuth(req, res);
  if (!teacher) return;
  const b = req.body ?? {};
  if (!b.title) {
    res.status(400).json({ error: "title required" });
    return;
  }
  if (!(await ownsClass(teacher.id, b.classId ?? null))) {
    res.status(403).json({ error: "Invalid classId" });
    return;
  }
  const [row] = await db
    .insert(lessonsTable)
    .values(buildLessonValues(teacher.id, b))
    .returning();
  res.json(serializeLesson(row));
});

router.post("/lessons/generate", async (req, res): Promise<void> => {
  const teacher = requireAuth(req, res);
  if (!teacher) return;
  const b = req.body ?? {};
  if (!b.yearGroup || !b.keyStage) {
    res.status(400).json({ error: "yearGroup, keyStage required" });
    return;
  }
  if (!(await ownsClass(teacher.id, b.classId ?? null))) {
    res.status(403).json({ error: "Invalid classId" });
    return;
  }
  const generated = generateLessonPlan(b) as Record<string, unknown>;
  // Encrypt PII fields produced by the generator before persisting.
  for (const f of ENCRYPTED_LESSON_FIELDS) {
    if (typeof generated[f] === "string") generated[f] = encrypt(generated[f] as string);
  }
  const [row] = await db
    .insert(lessonsTable)
    .values({
      ...(generated as any),
      teacherId: teacher.id,
      classId: typeof b.classId === "number" ? b.classId : null,
    })
    .returning();
  res.json(serializeLesson(row));
});

router.get("/lessons/:id", async (req, res): Promise<void> => {
  const teacher = requireAuth(req, res);
  if (!teacher) return;
  const id = parseInt(String(req.params.id), 10);
  const [row] = await db
    .select()
    .from(lessonsTable)
    .where(and(eq(lessonsTable.id, id), eq(lessonsTable.teacherId, teacher.id)))
    .limit(1);
  if (!row) {
    res.status(404).json({ error: "Not found" });
    return;
  }
  res.json(serializeLesson(row));
});

router.patch("/lessons/:id", async (req, res): Promise<void> => {
  const teacher = requireAuth(req, res);
  if (!teacher) return;
  const id = parseInt(String(req.params.id), 10);
  const b = req.body ?? {};
  if (b.classId !== undefined && !(await ownsClass(teacher.id, b.classId))) {
    res.status(403).json({ error: "Invalid classId" });
    return;
  }
  const update = buildLessonValues(teacher.id, b, true);
  update.updatedAt = new Date();
  delete (update as any).teacherId;
  const [row] = await db
    .update(lessonsTable)
    .set(update)
    .where(and(eq(lessonsTable.id, id), eq(lessonsTable.teacherId, teacher.id)))
    .returning();
  if (!row) {
    res.status(404).json({ error: "Not found" });
    return;
  }
  res.json(serializeLesson(row));
});

router.delete("/lessons/:id", async (req, res): Promise<void> => {
  const teacher = requireAuth(req, res);
  if (!teacher) return;
  const id = parseInt(String(req.params.id), 10);
  const rows = await db
    .delete(lessonsTable)
    .where(and(eq(lessonsTable.id, id), eq(lessonsTable.teacherId, teacher.id)))
    .returning();
  if (rows.length === 0) {
    res.status(404).json({ error: "Not found" });
    return;
  }
  res.json({ success: true });
});

router.post("/lessons/:id/duplicate", async (req, res): Promise<void> => {
  const teacher = requireAuth(req, res);
  if (!teacher) return;
  const id = parseInt(String(req.params.id), 10);
  const [src] = await db
    .select()
    .from(lessonsTable)
    .where(and(eq(lessonsTable.id, id), eq(lessonsTable.teacherId, teacher.id)))
    .limit(1);
  if (!src) {
    res.status(404).json({ error: "Not found" });
    return;
  }
  const b = req.body ?? {};
  if (b.classId !== undefined && !(await ownsClass(teacher.id, b.classId))) {
    res.status(403).json({ error: "Invalid classId" });
    return;
  }
  const { id: _id, createdAt, updatedAt, ...rest } = src;
  const [copy] = await db
    .insert(lessonsTable)
    .values({
      ...rest,
      title: typeof b.title === "string" && b.title ? b.title : `${src.title} (copy)`,
      term: typeof b.term === "string" ? b.term : src.term,
      classId: typeof b.classId === "number" ? b.classId : src.classId,
      teacherId: teacher.id,
    })
    .returning();
  res.json(serializeLesson(copy));
});

router.get("/lessons/:id/pdf", async (req, res): Promise<void> => {
  const teacher = requireAuth(req, res);
  if (!teacher) return;
  const id = parseInt(String(req.params.id), 10);
  const [row] = await db
    .select()
    .from(lessonsTable)
    .where(and(eq(lessonsTable.id, id), eq(lessonsTable.teacherId, teacher.id)))
    .limit(1);
  if (!row) {
    res.status(404).json({ error: "Not found" });
    return;
  }
  streamLessonPdf(res, row);
});

function buildLessonValues(teacherId: number, b: any, partial = false): any {
  const v: any = { teacherId };
  const stringFields = [
    "title","yearGroup","keyStage","term","kodalyFocus","rhythmFocus","solfaFocus",
    "curriculumObjective","learningObjective","priorLearning","newLearning","assessment",
    "differentiation","sendAdaptations","ealAdaptations","extension","plenary","notes",
  ];
  for (const k of stringFields) {
    if (typeof b[k] === "string") {
      v[k] = ENCRYPTED_LESSON_FIELDS.has(k) ? encrypt(b[k]) : b[k];
    } else if (!partial) {
      v[k] = "";
    }
  }
  if (typeof b.lengthMinutes === "number") v.lengthMinutes = b.lengthMinutes;
  else if (!partial) v.lengthMinutes = 45;
  for (const k of ["canStatements","vocabulary","teacherQuestions","pupilResponses","resources"]) {
    if (Array.isArray(b[k])) v[k] = b[k].map(String);
    else if (!partial) v[k] = [];
  }
  if (Array.isArray(b.components)) v.components = b.components;
  else if (!partial) v.components = [];
  if (b.classId === null || typeof b.classId === "number") v.classId = b.classId;
  return v;
}

export default router;
