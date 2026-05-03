import { pgTable, serial, text, integer, timestamp, jsonb, varchar } from "drizzle-orm/pg-core";

export const teachersTable = pgTable("teachers", {
  id: serial("id").primaryKey(),
  // PII: encrypted at rest (AES-256-GCM). Use `emailHash` for lookups.
  email: text("email").notNull().default(""),
  emailHash: varchar("email_hash", { length: 64 }).notNull().default("").unique(),
  // PII: encrypted at rest.
  name: text("name").notNull().default(""),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const sessionsTable = pgTable("user_sessions", {
  id: text("id").primaryKey(),
  teacherId: integer("teacher_id").notNull().references(() => teachersTable.id, { onDelete: "cascade" }),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const classesTable = pgTable("classes", {
  id: serial("id").primaryKey(),
  teacherId: integer("teacher_id").notNull().references(() => teachersTable.id, { onDelete: "cascade" }),
  name: text("name").notNull(),
  yearGroup: text("year_group").notNull().default(""),
  keyStage: text("key_stage").notNull().default(""),
  notes: text("notes").notNull().default(""),
});

export const pathwayItemsTable = pgTable("pathway_items", {
  id: serial("id").primaryKey(),
  teacherId: integer("teacher_id").references(() => teachersTable.id, { onDelete: "cascade" }),
  keyStage: text("key_stage").notNull(),
  yearGroup: text("year_group").notNull().default(""),
  strand: text("strand").notNull(),
  title: text("title").notNull(),
  description: text("description").notNull().default(""),
  sequenceOrder: integer("sequence_order").notNull().default(0),
  isCustom: integer("is_custom").notNull().default(0),
});

export const activitiesTable = pgTable("activities", {
  id: serial("id").primaryKey(),
  teacherId: integer("teacher_id").references(() => teachersTable.id, { onDelete: "cascade" }),
  title: text("title").notNull(),
  ageRange: text("age_range").notNull().default(""),
  keyStage: text("key_stage").notNull().default(""),
  kodalyFocus: text("kodaly_focus").notNull().default(""),
  rhythmElement: text("rhythm_element").notNull().default(""),
  solfaElement: text("solfa_element").notNull().default(""),
  curriculumLink: text("curriculum_link").notNull().default(""),
  description: text("description").notNull().default(""),
  instructions: text("instructions").notNull().default(""),
  questions: text("questions").notNull().default(""),
  assessmentFocus: text("assessment_focus").notNull().default(""),
  requiredResources: text("required_resources").notNull().default(""),
  youtubeLink: text("youtube_link").notNull().default(""),
  externalLink: text("external_link").notNull().default(""),
  activityType: text("activity_type").notNull().default(""),
  difficulty: text("difficulty").notNull().default(""),
  term: text("term").notNull().default(""),
  tags: jsonb("tags").$type<string[]>().notNull().default([]),
});

export const lessonsTable = pgTable("lessons", {
  id: serial("id").primaryKey(),
  teacherId: integer("teacher_id").notNull().references(() => teachersTable.id, { onDelete: "cascade" }),
  classId: integer("class_id").references(() => classesTable.id, { onDelete: "set null" }),
  title: text("title").notNull(),
  yearGroup: text("year_group").notNull().default(""),
  keyStage: text("key_stage").notNull().default(""),
  term: text("term").notNull().default(""),
  lengthMinutes: integer("length_minutes").notNull().default(45),
  kodalyFocus: text("kodaly_focus").notNull().default(""),
  rhythmFocus: text("rhythm_focus").notNull().default(""),
  solfaFocus: text("solfa_focus").notNull().default(""),
  curriculumObjective: text("curriculum_objective").notNull().default(""),
  learningObjective: text("learning_objective").notNull().default(""),
  canStatements: jsonb("can_statements").$type<string[]>().notNull().default([]),
  vocabulary: jsonb("vocabulary").$type<string[]>().notNull().default([]),
  priorLearning: text("prior_learning").notNull().default(""),
  newLearning: text("new_learning").notNull().default(""),
  assessment: text("assessment").notNull().default(""),
  differentiation: text("differentiation").notNull().default(""),
  sendAdaptations: text("send_adaptations").notNull().default(""),
  ealAdaptations: text("eal_adaptations").notNull().default(""),
  teacherQuestions: jsonb("teacher_questions").$type<string[]>().notNull().default([]),
  pupilResponses: jsonb("pupil_responses").$type<string[]>().notNull().default([]),
  extension: text("extension").notNull().default(""),
  plenary: text("plenary").notNull().default(""),
  resources: jsonb("resources").$type<string[]>().notNull().default([]),
  components: jsonb("components").$type<Array<{
    id: string;
    type: string;
    title: string;
    content: string;
    durationMinutes: number;
    notes: string;
    activityId?: number | null;
  }>>().notNull().default([]),
  notes: text("notes").notNull().default(""),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

export const calendarEntriesTable = pgTable("calendar_entries", {
  id: serial("id").primaryKey(),
  teacherId: integer("teacher_id").notNull().references(() => teachersTable.id, { onDelete: "cascade" }),
  term: text("term").notNull(),
  weekNumber: integer("week_number").notNull().default(1),
  dayLabel: text("day_label").notNull().default(""),
  sortOrder: integer("sort_order").notNull().default(0),
  lessonId: integer("lesson_id").references(() => lessonsTable.id, { onDelete: "set null" }),
  classId: integer("class_id").references(() => classesTable.id, { onDelete: "set null" }),
  title: text("title").notNull().default(""),
  notes: text("notes").notNull().default(""),
});

export const resourcesTable = pgTable("resources", {
  id: serial("id").primaryKey(),
  teacherId: integer("teacher_id").references(() => teachersTable.id, { onDelete: "cascade" }),
  title: text("title").notNull(),
  url: text("url").notNull(),
  sourceType: text("source_type").notNull().default(""),
  kodalyFocus: text("kodaly_focus").notNull().default(""),
  ageRange: text("age_range").notNull().default(""),
  keyStage: text("key_stage").notNull().default(""),
  progressionStage: text("progression_stage").notNull().default(""),
  notes: text("notes").notNull().default(""),
  tags: jsonb("tags").$type<string[]>().notNull().default([]),
});

export const curriculumLinksTable = pgTable("curriculum_links", {
  id: serial("id").primaryKey(),
  keyStage: text("key_stage").notNull(),
  framework: text("framework").notNull(),
  objective: text("objective").notNull(),
  skillArea: text("skill_area").notNull(),
});
