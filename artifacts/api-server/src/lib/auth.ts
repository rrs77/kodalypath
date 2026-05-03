import type { Request, Response, NextFunction } from "express";
import { randomBytes } from "node:crypto";
import { eq } from "drizzle-orm";
import { db, teachersTable, sessionsTable } from "@workspace/db";

declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace Express {
    interface Request {
      teacher?: { id: number; email: string; name: string };
    }
  }
}

const COOKIE_NAME = "kp_session";
const ONE_YEAR_MS = 365 * 24 * 60 * 60 * 1000;

export async function authMiddleware(req: Request, _res: Response, next: NextFunction): Promise<void> {
  const sid = req.cookies?.[COOKIE_NAME];
  if (!sid) return next();
  const [row] = await db
    .select({
      id: teachersTable.id,
      email: teachersTable.email,
      name: teachersTable.name,
    })
    .from(sessionsTable)
    .innerJoin(teachersTable, eq(sessionsTable.teacherId, teachersTable.id))
    .where(eq(sessionsTable.id, sid))
    .limit(1);
  if (row) {
    req.teacher = row;
  }
  next();
}

export async function loginAndSetCookie(
  res: Response,
  email: string,
  name: string,
): Promise<{ id: number; email: string; name: string }> {
  const cleanEmail = email.trim().toLowerCase();
  const cleanName = (name ?? "").trim() || cleanEmail.split("@")[0];

  let [teacher] = await db
    .select()
    .from(teachersTable)
    .where(eq(teachersTable.email, cleanEmail))
    .limit(1);

  if (!teacher) {
    [teacher] = await db
      .insert(teachersTable)
      .values({ email: cleanEmail, name: cleanName })
      .returning();
  } else if (teacher.name !== cleanName && cleanName) {
    [teacher] = await db
      .update(teachersTable)
      .set({ name: cleanName })
      .where(eq(teachersTable.id, teacher.id))
      .returning();
  }

  const sid = randomBytes(32).toString("hex");
  await db.insert(sessionsTable).values({ id: sid, teacherId: teacher.id });

  res.cookie(COOKIE_NAME, sid, {
    httpOnly: true,
    secure: true,
    sameSite: "lax",
    maxAge: ONE_YEAR_MS,
    path: "/",
  });

  return { id: teacher.id, email: teacher.email, name: teacher.name };
}

export async function logoutAndClearCookie(req: Request, res: Response): Promise<void> {
  const sid = req.cookies?.[COOKIE_NAME];
  if (sid) {
    await db.delete(sessionsTable).where(eq(sessionsTable.id, sid));
  }
  res.clearCookie(COOKIE_NAME, { path: "/" });
}

export function requireAuth(req: Request, res: Response): { id: number; email: string; name: string } | null {
  if (!req.teacher) {
    res.status(401).json({ error: "Unauthorized" });
    return null;
  }
  return req.teacher;
}
