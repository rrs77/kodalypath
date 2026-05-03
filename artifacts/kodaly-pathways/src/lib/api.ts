export const API_BASE = (import.meta.env.BASE_URL || "/").replace(/\/$/, "") + "/api";
export const KEY_STAGES = ["EYFS", "KS1", "KS2", "KS3", "KS4"] as const;
export const TERMS = [
  "Autumn 1",
  "Autumn 2",
  "Spring 1",
  "Spring 2",
  "Summer 1",
  "Summer 2",
] as const;
export const STRANDS = [
  "Rhythm",
  "Solfa",
  "Inner Hearing",
  "Aural Skills",
  "Singing Games",
  "Hand Signs",
  "Rhythm Dictation",
  "Melodic Dictation",
  "Improvisation",
  "Composition",
  "Part Work",
] as const;

export const COMPONENT_TYPES = [
  "Warm-up",
  "Rhythm",
  "Solfa",
  "Singing Game",
  "Notation",
  "Listening",
  "Creative",
  "Plenary",
  "Other",
] as const;

export function newId(): string {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }
  return Math.random().toString(36).slice(2);
}
