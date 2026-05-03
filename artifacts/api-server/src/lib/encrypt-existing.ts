import { eq, sql } from "drizzle-orm";
import { db, teachersTable, classesTable, lessonsTable, calendarEntriesTable } from "@workspace/db";
import { encrypt, decrypt, isEncrypted, emailHash } from "./crypto";
import { logger } from "./logger";

/**
 * One-shot, idempotent boot migration: encrypts any plaintext PII rows in
 * place and populates the deterministic emailHash column on teachers. Safe
 * to run on every boot — only rows missing the `enc:v1:` prefix or an
 * empty email_hash are touched.
 */
export async function encryptExistingPII(): Promise<void> {
  // Teachers: backfill emailHash + encrypt email/name where still plaintext.
  const teachers = await db.select().from(teachersTable);
  let teachersFixed = 0;
  for (const t of teachers) {
    const needsHash = !t.emailHash && t.email !== "";
    const needsEmailEnc = !isEncrypted(t.email) && t.email !== "";
    const needsNameEnc = !isEncrypted(t.name) && t.name !== "";
    if (!needsHash && !needsEmailEnc && !needsNameEnc) continue;
    // Resolve plaintext email regardless of whether the column is already
    // encrypted, so we can always backfill the lookup hash.
    const plainEmail = isEncrypted(t.email) ? decrypt(t.email) : t.email;
    const update: Record<string, unknown> = {};
    if (needsHash && plainEmail) update.emailHash = emailHash(plainEmail);
    if (needsEmailEnc) update.email = encrypt(t.email);
    if (needsNameEnc) update.name = encrypt(t.name);
    if (Object.keys(update).length === 0) continue;
    await db.update(teachersTable).set(update).where(eq(teachersTable.id, t.id));
    teachersFixed++;
  }
  if (teachersFixed > 0) logger.info({ rows: teachersFixed }, "Encrypted teacher PII at rest");

  // Classes: name + notes
  const classes = await db.select().from(classesTable);
  let classFixed = 0;
  for (const c of classes) {
    const update: Record<string, unknown> = {};
    if (c.name && !isEncrypted(c.name)) update.name = encrypt(c.name);
    if (c.notes && !isEncrypted(c.notes)) update.notes = encrypt(c.notes);
    if (Object.keys(update).length === 0) continue;
    await db.update(classesTable).set(update).where(eq(classesTable.id, c.id));
    classFixed++;
  }
  if (classFixed > 0) logger.info({ rows: classFixed }, "Encrypted class PII at rest");

  // Lessons: notes, differentiation, sendAdaptations, ealAdaptations
  const lessons = await db.select().from(lessonsTable);
  let lessonFixed = 0;
  for (const l of lessons) {
    const update: Record<string, unknown> = {};
    for (const f of ["notes", "differentiation", "sendAdaptations", "ealAdaptations"] as const) {
      const v = l[f];
      if (v && !isEncrypted(v)) update[f] = encrypt(v);
    }
    if (Object.keys(update).length === 0) continue;
    await db.update(lessonsTable).set(update).where(eq(lessonsTable.id, l.id));
    lessonFixed++;
  }
  if (lessonFixed > 0) logger.info({ rows: lessonFixed }, "Encrypted lesson PII at rest");

  // Calendar entries: notes
  const entries = await db.select().from(calendarEntriesTable);
  let calFixed = 0;
  for (const e of entries) {
    if (!e.notes || isEncrypted(e.notes)) continue;
    await db.update(calendarEntriesTable).set({ notes: encrypt(e.notes) }).where(eq(calendarEntriesTable.id, e.id));
    calFixed++;
  }
  if (calFixed > 0) logger.info({ rows: calFixed }, "Encrypted calendar PII at rest");

  // Sanity log: count remaining unencrypted rows for ops visibility.
  const [{ c: plainTeachers }] = await db
    .select({ c: sql<number>`count(*)::int` })
    .from(teachersTable)
    .where(sql`email <> '' AND email NOT LIKE 'enc:v1:%'`);
  if (plainTeachers > 0) {
    logger.warn({ rows: plainTeachers }, "Some teacher emails remain unencrypted after migration");
  }
}
