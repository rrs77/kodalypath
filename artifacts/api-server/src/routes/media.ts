import { Router, type IRouter } from "express";
import { eq, desc } from "drizzle-orm";
import { db, mediaTable } from "@workspace/db";
import { MediaCreateBody, MediaUpdateBody } from "./mediaSchemas";
import { requireAdmin, requireAuth } from "../lib/auth";

const router: IRouter = Router();

function shape(row: typeof mediaTable.$inferSelect) {
  return {
    id: row.id,
    objectPath: row.objectPath,
    url: row.url,
    fileName: row.fileName,
    mimeType: row.mimeType,
    sizeBytes: row.sizeBytes,
    alt: row.alt,
    createdAt: row.createdAt.toISOString(),
  };
}

router.get("/admin/media", requireAdmin, async (_req, res): Promise<void> => {
  const rows = await db.select().from(mediaTable).orderBy(desc(mediaTable.createdAt));
  res.json(rows.map(shape));
});

// Register an uploaded object as a media library entry.
// Client first PUTs file bytes to the presigned URL from /storage/uploads/request-url,
// then calls this with the returned objectPath plus metadata.
router.post("/admin/media", requireAdmin, async (req, res): Promise<void> => {
  const parsed = MediaCreateBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }
  const teacher = requireAuth(req, res);
  if (!teacher) return;
  const d = parsed.data;
  // objectPath comes back as `/objects/uploads/<uuid>`; the public URL is the
  // API-served path (the server streams through /api/storage/objects/...).
  const url = `/api${d.objectPath.startsWith("/") ? "" : "/"}${d.objectPath.replace(/^\/objects\//, "storage/objects/")}`;
  const [row] = await db
    .insert(mediaTable)
    .values({
      objectPath: d.objectPath,
      url,
      fileName: d.fileName ?? "",
      mimeType: d.mimeType ?? "",
      sizeBytes: d.sizeBytes ?? 0,
      alt: d.alt ?? "",
      uploadedBy: teacher.id,
    })
    .returning();
  res.json(shape(row));
});

router.put("/admin/media/:id", requireAdmin, async (req, res): Promise<void> => {
  const id = Number(req.params.id);
  if (!Number.isInteger(id)) {
    res.status(400).json({ error: "Invalid id" });
    return;
  }
  const parsed = MediaUpdateBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }
  const patch: Record<string, unknown> = {};
  if (parsed.data.alt !== undefined) patch.alt = parsed.data.alt;
  if (parsed.data.fileName !== undefined) patch.fileName = parsed.data.fileName;
  const [row] = await db
    .update(mediaTable)
    .set(patch)
    .where(eq(mediaTable.id, id))
    .returning();
  if (!row) {
    res.status(404).json({ error: "Not found" });
    return;
  }
  res.json(shape(row));
});

router.delete("/admin/media/:id", requireAdmin, async (req, res): Promise<void> => {
  const id = Number(req.params.id);
  if (!Number.isInteger(id)) {
    res.status(400).json({ error: "Invalid id" });
    return;
  }
  await db.delete(mediaTable).where(eq(mediaTable.id, id));
  res.json({ success: true });
});

export default router;
