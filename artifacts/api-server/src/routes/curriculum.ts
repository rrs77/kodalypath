import { Router, type IRouter } from "express";
import { eq } from "drizzle-orm";
import { db, curriculumLinksTable } from "@workspace/db";
import { requireAuth } from "../lib/auth";

const router: IRouter = Router();

router.get("/curriculum/links", async (req, res): Promise<void> => {
  const teacher = requireAuth(req, res);
  if (!teacher) return;
  const ks = typeof req.query.keyStage === "string" ? req.query.keyStage : undefined;
  const rows = ks
    ? await db.select().from(curriculumLinksTable).where(eq(curriculumLinksTable.keyStage, ks))
    : await db.select().from(curriculumLinksTable);
  res.json(rows);
});

export default router;
