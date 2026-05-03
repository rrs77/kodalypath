import { Router, type IRouter } from "express";
import { and, eq, isNull, or, ilike, SQL } from "drizzle-orm";
import { db, activitiesTable } from "@workspace/db";
import { requireAuth } from "../lib/auth";

const router: IRouter = Router();

function serialize(a: typeof activitiesTable.$inferSelect) {
  return { ...a, tags: a.tags ?? [] };
}

router.get("/activities", async (req, res): Promise<void> => {
  const teacher = requireAuth(req, res);
  if (!teacher) return;
  const q = req.query as Record<string, string | undefined>;
  const conditions: SQL[] = [
    or(isNull(activitiesTable.teacherId), eq(activitiesTable.teacherId, teacher.id))!,
  ];
  if (q.keyStage) conditions.push(eq(activitiesTable.keyStage, q.keyStage));
  if (q.ageGroup) conditions.push(ilike(activitiesTable.ageRange, `%${q.ageGroup}%`));
  if (q.rhythmFocus) conditions.push(ilike(activitiesTable.rhythmElement, `%${q.rhythmFocus}%`));
  if (q.solfaFocus) conditions.push(ilike(activitiesTable.solfaElement, `%${q.solfaFocus}%`));
  if (q.activityType) conditions.push(eq(activitiesTable.activityType, q.activityType));
  if (q.difficulty) conditions.push(eq(activitiesTable.difficulty, q.difficulty));
  if (q.term) conditions.push(eq(activitiesTable.term, q.term));
  if (q.search) {
    const s = `%${q.search}%`;
    conditions.push(
      or(
        ilike(activitiesTable.title, s),
        ilike(activitiesTable.description, s),
        ilike(activitiesTable.kodalyFocus, s),
        ilike(activitiesTable.instructions, s),
      )!,
    );
  }
  const rows = await db
    .select()
    .from(activitiesTable)
    .where(and(...conditions))
    .orderBy(activitiesTable.title);
  res.json(rows.map(serialize));
});

router.post("/activities", async (req, res): Promise<void> => {
  const teacher = requireAuth(req, res);
  if (!teacher) return;
  const b = req.body ?? {};
  if (!b.title) {
    res.status(400).json({ error: "title required" });
    return;
  }
  const [row] = await db
    .insert(activitiesTable)
    .values({
      teacherId: teacher.id,
      title: String(b.title),
      ageRange: String(b.ageRange ?? ""),
      keyStage: String(b.keyStage ?? ""),
      kodalyFocus: String(b.kodalyFocus ?? ""),
      rhythmElement: String(b.rhythmElement ?? ""),
      solfaElement: String(b.solfaElement ?? ""),
      curriculumLink: String(b.curriculumLink ?? ""),
      description: String(b.description ?? ""),
      instructions: String(b.instructions ?? ""),
      questions: String(b.questions ?? ""),
      assessmentFocus: String(b.assessmentFocus ?? ""),
      requiredResources: String(b.requiredResources ?? ""),
      youtubeLink: String(b.youtubeLink ?? ""),
      externalLink: String(b.externalLink ?? ""),
      activityType: String(b.activityType ?? ""),
      difficulty: String(b.difficulty ?? ""),
      term: String(b.term ?? ""),
      tags: Array.isArray(b.tags) ? b.tags.map(String) : [],
    })
    .returning();
  res.json(serialize(row));
});

router.get("/activities/:id", async (req, res): Promise<void> => {
  const teacher = requireAuth(req, res);
  if (!teacher) return;
  const id = parseInt(String(req.params.id), 10);
  const [row] = await db
    .select()
    .from(activitiesTable)
    .where(
      and(
        eq(activitiesTable.id, id),
        or(isNull(activitiesTable.teacherId), eq(activitiesTable.teacherId, teacher.id))!,
      ),
    )
    .limit(1);
  if (!row) {
    res.status(404).json({ error: "Not found" });
    return;
  }
  res.json(serialize(row));
});

router.patch("/activities/:id", async (req, res): Promise<void> => {
  const teacher = requireAuth(req, res);
  if (!teacher) return;
  const id = parseInt(String(req.params.id), 10);
  const b = req.body ?? {};
  const update: Record<string, unknown> = {};
  for (const k of [
    "title","ageRange","keyStage","kodalyFocus","rhythmElement","solfaElement",
    "curriculumLink","description","instructions","questions","assessmentFocus",
    "requiredResources","youtubeLink","externalLink","activityType","difficulty","term",
  ] as const) {
    if (typeof b[k] === "string") update[k] = b[k];
  }
  if (Array.isArray(b.tags)) update.tags = b.tags.map(String);
  const [row] = await db
    .update(activitiesTable)
    .set(update)
    .where(and(eq(activitiesTable.id, id), eq(activitiesTable.teacherId, teacher.id)))
    .returning();
  if (!row) {
    res.status(404).json({ error: "Not found or not editable" });
    return;
  }
  res.json(serialize(row));
});

router.delete("/activities/:id", async (req, res): Promise<void> => {
  const teacher = requireAuth(req, res);
  if (!teacher) return;
  const id = parseInt(String(req.params.id), 10);
  const rows = await db
    .delete(activitiesTable)
    .where(and(eq(activitiesTable.id, id), eq(activitiesTable.teacherId, teacher.id)))
    .returning();
  if (rows.length === 0) {
    res.status(404).json({ error: "Not found" });
    return;
  }
  res.json({ success: true });
});

export default router;
