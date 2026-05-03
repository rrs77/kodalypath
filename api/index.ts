// Vercel Serverless Function entry — wraps the Express app produced by
// `pnpm --filter @workspace/api-server run build` (which emits
// `artifacts/api-server/dist/handler.mjs`). Vercel's @vercel/node runtime
// accepts a Node http request handler as the default export, and Express
// apps are valid request handlers.
//
// All routes (including /api/__clerk/* for the Clerk proxy) are matched
// inside the Express app, so a single catch-all rewrite in vercel.json
// (`/api/(.*) -> /api`) is sufficient.
//
// @ts-expect-error — built artifact, no .d.ts emitted.
import app from "../artifacts/api-server/dist/handler.mjs";

export default app;

export const config = {
  // Express + Drizzle + Clerk all rely on the full Node runtime, not Edge.
  runtime: "nodejs20.x",
};
