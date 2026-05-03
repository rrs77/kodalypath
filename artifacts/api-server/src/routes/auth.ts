import { Router, type IRouter } from "express";
import { randomBytes } from "node:crypto";
import { db, sessionsTable } from "@workspace/db";
import { LoginBody } from "@workspace/api-zod";
import { loginAndSetCookie, logoutAndClearCookie } from "../lib/auth";
import { ensureDemoTeacher } from "../lib/demo";

const router: IRouter = Router();
const COOKIE_NAME = "kp_session";
const ONE_YEAR_MS = 365 * 24 * 60 * 60 * 1000;

router.get("/auth/me", async (req, res): Promise<void> => {
  res.json({ user: req.teacher ?? null });
});

router.post("/auth/login", async (req, res): Promise<void> => {
  const parsed = LoginBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }
  const teacher = await loginAndSetCookie(res, parsed.data.email, parsed.data.name ?? "");
  res.json(teacher);
});

router.post("/auth/demo", async (_req, res): Promise<void> => {
  const teacher = await ensureDemoTeacher();
  const sid = randomBytes(32).toString("hex");
  await db.insert(sessionsTable).values({ id: sid, teacherId: teacher.id });
  res.cookie(COOKIE_NAME, sid, {
    httpOnly: true,
    secure: true,
    sameSite: "lax",
    maxAge: ONE_YEAR_MS,
    path: "/",
  });
  res.json(teacher);
});

router.post("/auth/logout", async (req, res): Promise<void> => {
  await logoutAndClearCookie(req, res);
  res.json({ success: true });
});

export default router;
