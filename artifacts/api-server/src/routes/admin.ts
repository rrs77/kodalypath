import { Router, type IRouter } from "express";
import { eq } from "drizzle-orm";
import { db, siteSettingsTable } from "@workspace/db";
import { UpdateSiteSettingsBody } from "@workspace/api-zod";
import { requireAdmin } from "../lib/auth";

const router: IRouter = Router();

const DEFAULTS = {
  id: 1,
  siteName: "Kodály Pathways",
  tagline: "Music lesson planner",
  logoUrl: "",
  primaryColorHsl: "174 55% 35%",
  footerText: "",
  social: {} as { twitter?: string; youtube?: string; website?: string },
};

async function loadOrSeed() {
  // Race-safe: insert-if-missing then re-select. Avoids two concurrent first
  // requests both attempting INSERT and one failing on PK conflict.
  await db.insert(siteSettingsTable).values(DEFAULTS).onConflictDoNothing({ target: siteSettingsTable.id });
  const [row] = await db.select().from(siteSettingsTable).where(eq(siteSettingsTable.id, 1)).limit(1);
  if (!row) throw new Error("site_settings row missing after upsert");
  return row;
}

function shape(row: Awaited<ReturnType<typeof loadOrSeed>>) {
  return {
    siteName: row.siteName,
    tagline: row.tagline,
    logoUrl: row.logoUrl,
    primaryColorHsl: row.primaryColorHsl,
    footerText: row.footerText,
    social: row.social ?? {},
  };
}

// Public — every visitor needs branding to render the page.
router.get("/site-settings", async (_req, res): Promise<void> => {
  const row = await loadOrSeed();
  res.json(shape(row));
});

// Admin only — branding updates.
router.put("/admin/site-settings", requireAdmin, async (req, res): Promise<void> => {
  const parsed = UpdateSiteSettingsBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }
  const current = await loadOrSeed();
  const next = { ...current, ...parsed.data, social: { ...(current.social ?? {}), ...(parsed.data.social ?? {}) }, updatedAt: new Date() };
  const [updated] = await db
    .update(siteSettingsTable)
    .set(next)
    .where(eq(siteSettingsTable.id, 1))
    .returning();
  req.log?.info({ teacherId: req.teacher?.id }, "site_settings updated");
  res.json(shape(updated));
});

export default router;
