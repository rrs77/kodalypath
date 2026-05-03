import { eq, and } from "drizzle-orm";
import { db, teachersTable, classesTable, lessonsTable, calendarEntriesTable } from "@workspace/db";
import { encrypt, emailHash } from "./crypto";
import { generateLessonPlan } from "./lesson-generator";
import { logger } from "./logger";

export const DEMO_EMAIL = "demo@school.uk";
export const DEMO_NAME = "Demo Teacher";

const DEMO_CLASSES = [
  { name: "Reception Robins", yearGroup: "Reception", keyStage: "EYFS", notes: "Mixed-ability circle group. Two children with EAL — focus on echo singing and gestures." },
  { name: "Year 2 Larks", yearGroup: "Year 2", keyStage: "KS1", notes: "Confident singers ready to introduce ti-ti and so-mi-la." },
  { name: "Year 4 Nightingales", yearGroup: "Year 4", keyStage: "KS2", notes: "One pupil with hearing aid (Pupil A): seat near front-left of carpet." },
  { name: "Year 6 Choir", yearGroup: "Year 6", keyStage: "KS2", notes: "Lunchtime choir, prepping for Christmas concert two-part work." },
] as const;

const DEMO_LESSON_SPECS = [
  // Autumn 1
  { classIdx: 0, title: "EYFS — pulse & pitch awareness", yearGroup: "Reception", keyStage: "EYFS", term: "Autumn 1" },
  { classIdx: 1, title: "KS1 — introducing ta and ti-ti", yearGroup: "Year 2", keyStage: "KS1", term: "Autumn 1" },
  { classIdx: 2, title: "KS2 — pentatonic singing games", yearGroup: "Year 4", keyStage: "KS2", term: "Autumn 1" },
  { classIdx: 3, title: "Choir — two-part round prep", yearGroup: "Year 6", keyStage: "KS2", term: "Autumn 1" },
  // Autumn 2
  { classIdx: 0, title: "EYFS — long & short sounds", yearGroup: "Reception", keyStage: "EYFS", term: "Autumn 2" },
  { classIdx: 1, title: "KS1 — rest and 4-beat patterns", yearGroup: "Year 2", keyStage: "KS1", term: "Autumn 2" },
  { classIdx: 2, title: "KS2 — rhythm dictation 8-beat", yearGroup: "Year 4", keyStage: "KS2", term: "Autumn 2" },
  { classIdx: 3, title: "Choir — Christmas concert prep", yearGroup: "Year 6", keyStage: "KS2", term: "Autumn 2" },
  // Spring 1
  { classIdx: 0, title: "EYFS — echo singing on so-mi", yearGroup: "Reception", keyStage: "EYFS", term: "Spring 1" },
  { classIdx: 1, title: "KS1 — adding la (so-mi-la)", yearGroup: "Year 2", keyStage: "KS1", term: "Spring 1" },
  { classIdx: 2, title: "KS2 — tika-tika introduction", yearGroup: "Year 4", keyStage: "KS2", term: "Spring 1" },
  { classIdx: 3, title: "Choir — folk-song arrangements", yearGroup: "Year 6", keyStage: "KS2", term: "Spring 1" },
  // Spring 2
  { classIdx: 1, title: "KS1 — staff notation intro", yearGroup: "Year 2", keyStage: "KS1", term: "Spring 2" },
  { classIdx: 2, title: "KS2 — pentatonic improvisation", yearGroup: "Year 4", keyStage: "KS2", term: "Spring 2" },
  { classIdx: 3, title: "Choir — two-part canon work", yearGroup: "Year 6", keyStage: "KS2", term: "Spring 2" },
  // Summer 1
  { classIdx: 0, title: "EYFS — circle games & spiral", yearGroup: "Reception", keyStage: "EYFS", term: "Summer 1" },
  { classIdx: 2, title: "KS2 — listening: Grieg", yearGroup: "Year 4", keyStage: "KS2", term: "Summer 1" },
  { classIdx: 3, title: "Choir — summer concert rehearsal", yearGroup: "Year 6", keyStage: "KS2", term: "Summer 1" },
  // Summer 2
  { classIdx: 1, title: "KS1 — composing 4-beat rhythms", yearGroup: "Year 2", keyStage: "KS1", term: "Summer 2" },
  { classIdx: 2, title: "KS2 — composition: ABA pentatonic", yearGroup: "Year 4", keyStage: "KS2", term: "Summer 2" },
] as const;

// 5 lessons per term across the 4 demo classes — gives ~30 entries across 6 terms.
// Lesson indices reference DEMO_LESSON_SPECS above (0-based).
const DEMO_CALENDAR = [
  // -------- Autumn 1 --------
  { term: "Autumn 1", weekNumber: 1, dayLabel: "Mon", title: "Reception circle time", classIdx: 0, lessonIdx: 0, notes: "Bring scarves for movement warm-up" },
  { term: "Autumn 1", weekNumber: 1, dayLabel: "Tue", title: "Year 2 hall slot", classIdx: 1, lessonIdx: 1, notes: "" },
  { term: "Autumn 1", weekNumber: 1, dayLabel: "Wed", title: "Year 4 music room", classIdx: 2, lessonIdx: 2, notes: "Hand-sign poster on board" },
  { term: "Autumn 1", weekNumber: 1, dayLabel: "Thu", title: "Choir lunchtime", classIdx: 3, lessonIdx: 3, notes: "" },
  { term: "Autumn 1", weekNumber: 2, dayLabel: "Mon", title: "Reception — pulse walk", classIdx: 0, lessonIdx: 0, notes: "Use frame drum" },
  { term: "Autumn 1", weekNumber: 2, dayLabel: "Wed", title: "Year 4 — review pentatonic songs", classIdx: 2, lessonIdx: 2, notes: "" },
  { term: "Autumn 1", weekNumber: 3, dayLabel: "Tue", title: "Year 2 — ta and ti-ti consolidation", classIdx: 1, lessonIdx: 1, notes: "Print rhythm cards" },
  { term: "Autumn 1", weekNumber: 3, dayLabel: "Thu", title: "Choir — round preparation", classIdx: 3, lessonIdx: 3, notes: "" },
  { term: "Autumn 1", weekNumber: 4, dayLabel: "Wed", title: "Year 4 — pentatonic singing games", classIdx: 2, lessonIdx: 2, notes: "" },
  { term: "Autumn 1", weekNumber: 5, dayLabel: "Mon", title: "Reception — Bee Bee Bumblebee", classIdx: 0, lessonIdx: 0, notes: "" },
  { term: "Autumn 1", weekNumber: 6, dayLabel: "Thu", title: "Choir — assembly performance", classIdx: 3, lessonIdx: 3, notes: "Hall booked p4" },
  // -------- Autumn 2 --------
  { term: "Autumn 2", weekNumber: 1, dayLabel: "Mon", title: "Reception — long/short sorting", classIdx: 0, lessonIdx: 4, notes: "" },
  { term: "Autumn 2", weekNumber: 1, dayLabel: "Tue", title: "Year 2 — rest patterns", classIdx: 1, lessonIdx: 5, notes: "" },
  { term: "Autumn 2", weekNumber: 2, dayLabel: "Wed", title: "Year 4 — dictation lesson", classIdx: 2, lessonIdx: 6, notes: "Print rhythm cards" },
  { term: "Autumn 2", weekNumber: 2, dayLabel: "Thu", title: "Choir — Christmas pieces", classIdx: 3, lessonIdx: 7, notes: "Two-part Carol arrangement" },
  { term: "Autumn 2", weekNumber: 3, dayLabel: "Mon", title: "Reception — listening map", classIdx: 0, lessonIdx: 4, notes: "" },
  { term: "Autumn 2", weekNumber: 4, dayLabel: "Wed", title: "Year 4 — 8-beat dictation continued", classIdx: 2, lessonIdx: 6, notes: "" },
  { term: "Autumn 2", weekNumber: 5, dayLabel: "Thu", title: "Choir — concert dress rehearsal", classIdx: 3, lessonIdx: 7, notes: "Full hall, 1pm" },
  // -------- Spring 1 --------
  { term: "Spring 1", weekNumber: 1, dayLabel: "Mon", title: "Reception — echo singing", classIdx: 0, lessonIdx: 8, notes: "" },
  { term: "Spring 1", weekNumber: 1, dayLabel: "Tue", title: "Year 2 — adding la", classIdx: 1, lessonIdx: 9, notes: "Hand sign chart" },
  { term: "Spring 1", weekNumber: 1, dayLabel: "Wed", title: "Year 4 — tika-tika intro", classIdx: 2, lessonIdx: 10, notes: "" },
  { term: "Spring 1", weekNumber: 2, dayLabel: "Thu", title: "Choir — folk-song arrangement", classIdx: 3, lessonIdx: 11, notes: "" },
  { term: "Spring 1", weekNumber: 3, dayLabel: "Wed", title: "Year 4 — tika-tika dictation", classIdx: 2, lessonIdx: 10, notes: "Whiteboards" },
  { term: "Spring 1", weekNumber: 4, dayLabel: "Tue", title: "Year 2 — Snail Snail game", classIdx: 1, lessonIdx: 9, notes: "Open space" },
  // -------- Spring 2 --------
  { term: "Spring 2", weekNumber: 1, dayLabel: "Tue", title: "Year 2 — staff notation intro", classIdx: 1, lessonIdx: 12, notes: "Manuscript paper" },
  { term: "Spring 2", weekNumber: 1, dayLabel: "Wed", title: "Year 4 — improvisation circle", classIdx: 2, lessonIdx: 13, notes: "Pentatonic glockenspiels" },
  { term: "Spring 2", weekNumber: 2, dayLabel: "Thu", title: "Choir — canon work", classIdx: 3, lessonIdx: 14, notes: "" },
  { term: "Spring 2", weekNumber: 3, dayLabel: "Wed", title: "Year 4 — listening: Grieg", classIdx: 2, lessonIdx: 13, notes: "Hall of the Mountain King clip" },
  // -------- Summer 1 --------
  { term: "Summer 1", weekNumber: 1, dayLabel: "Mon", title: "Reception — spiral game", classIdx: 0, lessonIdx: 15, notes: "Hall booked" },
  { term: "Summer 1", weekNumber: 1, dayLabel: "Wed", title: "Year 4 — listening map", classIdx: 2, lessonIdx: 16, notes: "" },
  { term: "Summer 1", weekNumber: 2, dayLabel: "Thu", title: "Choir — summer concert rehearsal", classIdx: 3, lessonIdx: 17, notes: "" },
  { term: "Summer 1", weekNumber: 3, dayLabel: "Mon", title: "Reception — Pass the Beanbag", classIdx: 0, lessonIdx: 15, notes: "" },
  // -------- Summer 2 --------
  { term: "Summer 2", weekNumber: 1, dayLabel: "Tue", title: "Year 2 — composing 4-beat rhythms", classIdx: 1, lessonIdx: 18, notes: "" },
  { term: "Summer 2", weekNumber: 1, dayLabel: "Wed", title: "Year 4 — ABA pentatonic composition", classIdx: 2, lessonIdx: 19, notes: "" },
  { term: "Summer 2", weekNumber: 2, dayLabel: "Thu", title: "Choir — end of year showcase", classIdx: 3, lessonIdx: 17, notes: "Parents invited" },
] as const;

/**
 * Idempotent: ensures a "Demo Teacher" account exists, populated with a small
 * set of classes, lessons and calendar entries so the dashboard, planner and
 * calendar pages immediately have something to show. Safe to call on every
 * "Try a demo" click — only fills in what's missing.
 */
export async function ensureDemoTeacher(): Promise<{ id: number; email: string; name: string }> {
  const hash = emailHash(DEMO_EMAIL);
  let [teacher] = await db.select().from(teachersTable).where(eq(teachersTable.emailHash, hash)).limit(1);
  if (!teacher) {
    [teacher] = await db
      .insert(teachersTable)
      .values({ email: encrypt(DEMO_EMAIL), emailHash: hash, name: encrypt(DEMO_NAME) })
      .returning();
    logger.info({ teacherId: teacher.id }, "Created demo teacher");
  }

  // Classes — insert any missing by yearGroup (yearGroup stays plaintext, so it's a stable key).
  const existingClasses = await db.select().from(classesTable).where(eq(classesTable.teacherId, teacher.id));
  const existingByYear = new Map(existingClasses.map((c) => [c.yearGroup, c]));
  for (const c of DEMO_CLASSES) {
    if (existingByYear.has(c.yearGroup)) continue;
    const [row] = await db
      .insert(classesTable)
      .values({
        teacherId: teacher.id,
        name: encrypt(c.name),
        yearGroup: c.yearGroup,
        keyStage: c.keyStage,
        notes: encrypt(c.notes),
      })
      .returning();
    existingByYear.set(c.yearGroup, row);
  }
  const classes = DEMO_CLASSES.map((c) => existingByYear.get(c.yearGroup)!);

  // Lessons — match by (title, term) to stay idempotent.
  const existingLessons = await db.select().from(lessonsTable).where(eq(lessonsTable.teacherId, teacher.id));
  const lessonKey = (t: string, term: string) => `${t}|${term}`;
  const lessonByKey = new Map(existingLessons.map((l) => [lessonKey(l.title, l.term), l]));
  const builtLessons: Array<typeof lessonsTable.$inferSelect> = [];
  for (const spec of DEMO_LESSON_SPECS) {
    const k = lessonKey(spec.title, spec.term);
    let row = lessonByKey.get(k);
    if (!row) {
      const generated = generateLessonPlan({ ...spec }) as Record<string, unknown>;
      for (const f of ["notes", "differentiation", "sendAdaptations", "ealAdaptations"] as const) {
        if (typeof generated[f] === "string") generated[f] = encrypt(generated[f] as string);
      }
      [row] = await db
        .insert(lessonsTable)
        .values({
          ...(generated as any),
          title: spec.title,
          term: spec.term,
          teacherId: teacher.id,
          classId: classes[spec.classIdx]?.id ?? null,
        })
        .returning();
      lessonByKey.set(k, row);
    }
    builtLessons.push(row);
  }

  // Calendar — match by (term, weekNumber, classId, dayLabel) to stay idempotent.
  const existingEntries = await db.select().from(calendarEntriesTable).where(eq(calendarEntriesTable.teacherId, teacher.id));
  const entrySig = (term: string, week: number, classId: number | null, day: string) =>
    `${term}|${week}|${classId ?? "null"}|${day}`;
  const present = new Set(existingEntries.map((e) => entrySig(e.term, e.weekNumber, e.classId ?? null, e.dayLabel)));
  for (const e of DEMO_CALENDAR) {
    const cls = classes[e.classIdx];
    const lsn = builtLessons[e.lessonIdx];
    const sig = entrySig(e.term, e.weekNumber, cls?.id ?? null, e.dayLabel);
    if (present.has(sig)) continue;
    await db.insert(calendarEntriesTable).values({
      teacherId: teacher.id,
      term: e.term,
      weekNumber: e.weekNumber,
      dayLabel: e.dayLabel,
      sortOrder: 0,
      lessonId: lsn?.id ?? null,
      classId: cls?.id ?? null,
      title: e.title,
      notes: encrypt(e.notes),
    });
    present.add(sig);
  }

  return { id: teacher.id, email: DEMO_EMAIL, name: DEMO_NAME };
}
