import PDFDocument from "pdfkit";
import type { Response } from "express";
import type { lessonsTable } from "@workspace/db";

type Lesson = typeof lessonsTable.$inferSelect;

export function streamLessonPdf(res: Response, lesson: Lesson): void {
  const doc = new PDFDocument({ size: "A4", margin: 48 });
  res.setHeader("Content-Type", "application/pdf");
  res.setHeader("Content-Disposition", `attachment; filename="lesson-${lesson.id}.pdf"`);
  doc.pipe(res);

  doc.fontSize(20).font("Helvetica-Bold").text(lesson.title || "Untitled lesson");
  doc.moveDown(0.3);
  doc.fontSize(10).font("Helvetica").fillColor("#555")
    .text(`${lesson.keyStage || ""}  ${lesson.yearGroup || ""}  ${lesson.term || ""}  ${lesson.lengthMinutes} mins`);
  doc.fillColor("black");
  doc.moveDown();

  field(doc, "Kodály focus", lesson.kodalyFocus);
  field(doc, "Rhythm focus", lesson.rhythmFocus);
  field(doc, "Solfa focus", lesson.solfaFocus);
  field(doc, "Curriculum objective", lesson.curriculumObjective);
  field(doc, "Learning objective", lesson.learningObjective);
  list(doc, "Can statements", lesson.canStatements);
  list(doc, "Vocabulary", lesson.vocabulary);
  field(doc, "Prior learning", lesson.priorLearning);
  field(doc, "New learning", lesson.newLearning);
  list(doc, "Teacher questions", lesson.teacherQuestions);
  list(doc, "Expected pupil responses", lesson.pupilResponses);
  field(doc, "Assessment", lesson.assessment);
  field(doc, "Differentiation", lesson.differentiation);
  field(doc, "SEND adaptations", lesson.sendAdaptations);
  field(doc, "EAL adaptations", lesson.ealAdaptations);
  field(doc, "Extension", lesson.extension);
  field(doc, "Plenary", lesson.plenary);
  list(doc, "Resources", lesson.resources);

  doc.addPage();
  doc.fontSize(16).font("Helvetica-Bold").text("Lesson sequence");
  doc.moveDown(0.5);
  for (const c of lesson.components || []) {
    doc.fontSize(12).font("Helvetica-Bold").text(`${c.title} (${c.type}) — ${c.durationMinutes} min`);
    if (c.content) doc.fontSize(10).font("Helvetica").text(c.content);
    if (c.notes) doc.fontSize(9).font("Helvetica-Oblique").fillColor("#444").text(`Notes: ${c.notes}`).fillColor("black");
    doc.moveDown(0.5);
  }

  if (lesson.notes) {
    doc.addPage();
    doc.fontSize(14).font("Helvetica-Bold").text("Teacher notes");
    doc.moveDown(0.3);
    doc.fontSize(10).font("Helvetica").text(lesson.notes);
  }

  doc.end();
}

function field(doc: PDFKit.PDFDocument, label: string, value: string | null | undefined): void {
  if (!value) return;
  doc.fontSize(10).font("Helvetica-Bold").text(`${label}: `, { continued: true });
  doc.font("Helvetica").text(String(value));
  doc.moveDown(0.3);
}

function list(doc: PDFKit.PDFDocument, label: string, items: string[] | null | undefined): void {
  if (!items || items.length === 0) return;
  doc.fontSize(10).font("Helvetica-Bold").text(`${label}:`);
  for (const item of items) {
    doc.font("Helvetica").text(`  • ${item}`);
  }
  doc.moveDown(0.3);
}
