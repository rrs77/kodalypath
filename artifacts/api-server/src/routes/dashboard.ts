import { Router, type IRouter } from "express";
import { sql, eq, desc, and } from "drizzle-orm";
import {
  db,
  classesTable,
  lessonsTable,
  activitiesTable,
  resourcesTable,
  calendarEntriesTable,
} from "@workspace/db";
import { requireAuth } from "../lib/auth";

const router: IRouter = Router();

router.get("/dashboard/summary", async (req, res): Promise<void> => {
  const teacher = requireAuth(req, res);
  if (!teacher) return;

  const [classCount] = await db
    .select({ c: sql<number>`count(*)::int` })
    .from(classesTable)
    .where(eq(classesTable.teacherId, teacher.id));
  const [lessonCount] = await db
    .select({ c: sql<number>`count(*)::int` })
    .from(lessonsTable)
    .where(eq(lessonsTable.teacherId, teacher.id));
  const [activityCount] = await db
    .select({ c: sql<number>`count(*)::int` })
    .from(activitiesTable);
  const [resourceCount] = await db
    .select({ c: sql<number>`count(*)::int` })
    .from(resourcesTable);
  const [calCount] = await db
    .select({ c: sql<number>`count(*)::int` })
    .from(calendarEntriesTable)
    .where(eq(calendarEntriesTable.teacherId, teacher.id));

  const recentLessons = await db
    .select()
    .from(lessonsTable)
    .where(eq(lessonsTable.teacherId, teacher.id))
    .orderBy(desc(lessonsTable.updatedAt))
    .limit(5);

  const upcoming = await db
    .select()
    .from(calendarEntriesTable)
    .where(eq(calendarEntriesTable.teacherId, teacher.id))
    .orderBy(calendarEntriesTable.term, calendarEntriesTable.weekNumber, calendarEntriesTable.sortOrder)
    .limit(8);

  const termRows = await db
    .select({
      term: lessonsTable.term,
      c: sql<number>`count(*)::int`,
    })
    .from(lessonsTable)
    .where(eq(lessonsTable.teacherId, teacher.id))
    .groupBy(lessonsTable.term);

  res.json({
    teacher,
    totals: {
      classes: classCount.c,
      lessons: lessonCount.c,
      activities: activityCount.c,
      resources: resourceCount.c,
      calendarEntries: calCount.c,
    },
    recentLessons: recentLessons.map(serializeLesson),
    upcoming: upcoming.map(serializeCalendarEntry),
    termBreakdown: termRows.map((r) => ({ term: r.term || "Unscheduled", count: r.c })),
  });
});

function serializeLesson(l: typeof lessonsTable.$inferSelect) {
  return {
    ...l,
    classId: l.classId ?? null,
    createdAt: l.createdAt.toISOString(),
    updatedAt: l.updatedAt.toISOString(),
  };
}

function serializeCalendarEntry(e: typeof calendarEntriesTable.$inferSelect) {
  return { ...e, lessonId: e.lessonId ?? null, classId: e.classId ?? null };
}

export default router;
export { serializeLesson, serializeCalendarEntry };
