/**
 * Vercel / serverless entry point.
 *
 * Re-exports the Express app from `app.ts` and lazily runs the same one-shot
 * boot tasks that `index.ts` runs in long-lived mode (PII encryption migration
 * + idempotent seed). The promise is memoised so the work happens once per
 * container rather than once per request.
 *
 * The Replit deployment continues to use `index.ts` (which calls `app.listen`).
 * Do not import this file from there.
 */
import app from "./app";
import { logger } from "./lib/logger";
import { seedIfEmpty } from "./lib/seed";
import { encryptExistingPII } from "./lib/encrypt-existing";
import type { Request, Response, NextFunction } from "express";

let bootPromise: Promise<void> | null = null;

function runBootTasks(): Promise<void> {
  if (bootPromise) return bootPromise;
  bootPromise = (async () => {
    try {
      await encryptExistingPII();
    } catch (err) {
      logger.error({ err }, "PII encryption migration failed (serverless boot)");
    }
    try {
      await seedIfEmpty();
    } catch (err) {
      logger.error({ err }, "Seed failed (serverless boot)");
    }
  })();
  return bootPromise;
}

// Mount as the first middleware so every request awaits boot the first time
// the container handles a request.
app.use(async (_req: Request, _res: Response, next: NextFunction) => {
  try {
    await runBootTasks();
    next();
  } catch (err) {
    next(err);
  }
});

export default app;
