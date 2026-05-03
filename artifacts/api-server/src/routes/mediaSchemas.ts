// Re-export the generated zod body schemas under shorter names. Keeps the
// route file readable since orval names every body `RegisterMediaBody`,
// `UpdateMediaBody`, etc.
import { RegisterMediaBody, UpdateMediaBody } from "@workspace/api-zod";

export const MediaCreateBody = RegisterMediaBody;
export const MediaUpdateBody = UpdateMediaBody;
