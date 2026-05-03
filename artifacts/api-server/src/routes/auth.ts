import { Router, type IRouter } from "express";
import { LoginBody } from "@workspace/api-zod";
import { loginAndSetCookie, logoutAndClearCookie } from "../lib/auth";

const router: IRouter = Router();

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

router.post("/auth/logout", async (req, res): Promise<void> => {
  await logoutAndClearCookie(req, res);
  res.json({ success: true });
});

export default router;
