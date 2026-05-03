import type { Request, Response, NextFunction } from "express";
import { randomBytes } from "node:crypto";
import { eq } from "drizzle-orm";
import { db, teachersTable, sessionsTable } from "@workspace/db";
import { encrypt, decrypt, emailHash } from "./crypto";
import { getAuth, clerkClient } from "@clerk/express";

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

/**
 * Resolve the request's teacher from either:
 *   1) Clerk session (real users — password / Google / etc.), or
 *   2) Cookie session `kp_session` (demo accounts and any legacy users).
 *
 * Clerk wins when both are present. Real Clerk users are upserted into
 * `teachers` keyed by `clerkUserId` on first authenticated request.
 */
export async function authMiddleware(req: Request, _res: Response, next: NextFunction): Promise<void> {
  // ---- 1) Try Clerk first ----------------------------------------------
  try {
    const auth = getAuth(req);
    const clerkUserId = auth?.userId;
    if (clerkUserId) {
      let [teacher] = await db
        .select({
          id: teachersTable.id,
          email: teachersTable.email,
          name: teachersTable.name,
        })
        .from(teachersTable)
        .where(eq(teachersTable.clerkUserId, clerkUserId))
        .limit(1);

      if (!teacher) {
        // First request — pull profile from Clerk and create our row.
        const user = await clerkClient.users.getUser(clerkUserId);
        const cleanEmail = (user.primaryEmailAddress?.emailAddress ?? user.emailAddresses?.[0]?.emailAddress ?? "")
          .trim()
          .toLowerCase();
        const cleanName = [user.firstName, user.lastName].filter(Boolean).join(" ").trim() || cleanEmail.split("@")[0];
        const hash = cleanEmail ? emailHash(cleanEmail) : `clerk:${clerkUserId}`;

        // If a row already exists with this email hash, claim it for Clerk.
        const [existing] = cleanEmail
          ? await db.select().from(teachersTable).where(eq(teachersTable.emailHash, hash)).limit(1)
          : [];
        if (existing) {
          [teacher] = await db
            .update(teachersTable)
            .set({ clerkUserId, name: encrypt(cleanName) })
            .where(eq(teachersTable.id, existing.id))
            .returning({ id: teachersTable.id, email: teachersTable.email, name: teachersTable.name });
        } else {
          [teacher] = await db
            .insert(teachersTable)
            .values({
              email: cleanEmail ? encrypt(cleanEmail) : "",
              emailHash: hash,
              clerkUserId,
              name: encrypt(cleanName),
            })
            .returning({ id: teachersTable.id, email: teachersTable.email, name: teachersTable.name });
        }
      }

      if (teacher) {
        req.teacher = {
          id: teacher.id,
          email: teacher.email ? decrypt(teacher.email) : "",
          name: teacher.name ? decrypt(teacher.name) : "",
        };
        return next();
      }
    }
  } catch (err) {
    // Clerk auth not available (e.g. middleware not mounted) — fall through.
    req.log?.debug?.({ err }, "clerk auth resolution skipped");
  }

  // ---- 2) Fall back to cookie session (demo / legacy) ------------------
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
    req.teacher = { id: row.id, email: decrypt(row.email), name: decrypt(row.name) };
  }
  next();
}

/**
 * Cookie-session login. Used by the one-click demo only — real users sign in
 * through Clerk on the client.
 */
export async function loginAndSetCookie(
  res: Response,
  email: string,
  name: string,
): Promise<{ id: number; email: string; name: string }> {
  const cleanEmail = email.trim().toLowerCase();
  const cleanName = (name ?? "").trim() || cleanEmail.split("@")[0];
  const hash = emailHash(cleanEmail);

  let [teacher] = await db
    .select()
    .from(teachersTable)
    .where(eq(teachersTable.emailHash, hash))
    .limit(1);

  if (!teacher) {
    [teacher] = await db
      .insert(teachersTable)
      .values({
        email: encrypt(cleanEmail),
        emailHash: hash,
        name: encrypt(cleanName),
      })
      .returning();
  } else {
    const currentName = decrypt(teacher.name);
    if (currentName !== cleanName && cleanName) {
      [teacher] = await db
        .update(teachersTable)
        .set({ name: encrypt(cleanName) })
        .where(eq(teachersTable.id, teacher.id))
        .returning();
    }
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

  return { id: teacher.id, email: cleanEmail, name: decrypt(teacher.name) };
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
