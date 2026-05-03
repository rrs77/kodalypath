import { and, eq } from "drizzle-orm";
import { db, classesTable, lessonsTable } from "@workspace/db";

export async function ownsClass(teacherId: number, classId: number | null | undefined): Promise<boolean> {
  if (classId == null) return true;
  if (!Number.isInteger(classId)) return false;
  const [row] = await db
    .select({ id: classesTable.id })
    .from(classesTable)
    .where(and(eq(classesTable.id, classId), eq(classesTable.teacherId, teacherId)))
    .limit(1);
  return !!row;
}

export async function ownsLesson(teacherId: number, lessonId: number | null | undefined): Promise<boolean> {
  if (lessonId == null) return true;
  if (!Number.isInteger(lessonId)) return false;
  const [row] = await db
    .select({ id: lessonsTable.id })
    .from(lessonsTable)
    .where(and(eq(lessonsTable.id, lessonId), eq(lessonsTable.teacherId, teacherId)))
    .limit(1);
  return !!row;
}

export function parseIntParam(v: unknown): number | null {
  if (typeof v === "number" && Number.isInteger(v)) return v;
  if (typeof v === "string") {
    const n = parseInt(v, 10);
    if (Number.isInteger(n) && String(n) === v.trim()) return n;
  }
  return null;
}
