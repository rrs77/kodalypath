import { randomUUID } from "node:crypto";

export interface LessonComponent {
  id: string;
  type: string;
  title: string;
  content: string;
  durationMinutes: number;
  notes: string;
  activityId?: number | null;
}

export interface GenerateInput {
  yearGroup: string;
  keyStage: string;
  term?: string;
  lengthMinutes?: number;
  kodalyFocus?: string;
  rhythmFocus?: string;
  solfaFocus?: string;
  curriculumObjective?: string;
  resources?: string;
  classNotes?: string;
}

export function generateLessonPlan(input: GenerateInput) {
  const length = input.lengthMinutes && input.lengthMinutes > 0 ? input.lengthMinutes : 45;
  const ks = input.keyStage || "KS2";
  const yg = input.yearGroup || "";
  const focus = input.kodalyFocus || "Steady pulse and pitch awareness";
  const rhythm = input.rhythmFocus || defaultRhythm(ks);
  const solfa = input.solfaFocus || defaultSolfa(ks);
  const term = input.term || "Autumn 1";

  const components: LessonComponent[] = [
    comp("Warm-up", `${focus} warm-up`,
      `Greeting song with body percussion on the steady pulse. Pupils echo the teacher in 4-beat phrases on '${rhythm}'.`,
      Math.max(5, Math.round(length * 0.12))),
    comp("Rhythm", `Rhythm focus: ${rhythm}`,
      `Reveal a 4-beat rhythm flashcard featuring '${rhythm}'. Class claps and reads. Inner-hearing version: clap one beat, think the next.`,
      Math.max(7, Math.round(length * 0.18))),
    comp("Solfa", `Solfa focus: ${solfa}`,
      `Hand-sign warm-up on '${solfa}'. Sing a known song using these notes. Echo melodic patterns of 4 notes.`,
      Math.max(7, Math.round(length * 0.18))),
    comp("Singing Game", `Core repertoire`,
      `Teach or revisit a singing game appropriate for ${yg || ks} that uses '${solfa}' and '${rhythm}'. Move to the pulse.`,
      Math.max(8, Math.round(length * 0.22))),
    comp("Notation", `Reading and writing`,
      `Pupils notate a 4-beat rhythm or 4-note melody using stick notation or solfa ladder.`,
      Math.max(5, Math.round(length * 0.12))),
    comp("Creative", `Improvise / compose`,
      `In pairs, improvise a 4-beat answer to a 4-beat question using '${rhythm}' and '${solfa}'. Share with the class.`,
      Math.max(6, Math.round(length * 0.13))),
    comp("Plenary", `Reflection`,
      `Recap focus question. One pupil demonstrates the new learning. Sing the closing song.`,
      Math.max(3, Math.round(length * 0.05))),
  ];

  // normalise total to length
  const total = components.reduce((s, c) => s + c.durationMinutes, 0);
  if (total !== length && total > 0) {
    const factor = length / total;
    components.forEach((c) => {
      c.durationMinutes = Math.max(2, Math.round(c.durationMinutes * factor));
    });
  }

  const learningObjective = `Pupils will develop confidence with ${focus.toLowerCase()} through singing, movement and notation.`;

  return {
    title: `${ks} ${yg} ${focus}`.trim().replace(/\s+/g, " "),
    yearGroup: yg,
    keyStage: ks,
    term,
    lengthMinutes: length,
    kodalyFocus: focus,
    rhythmFocus: rhythm,
    solfaFocus: solfa,
    curriculumObjective: input.curriculumObjective || defaultCurriculum(ks),
    learningObjective,
    canStatements: [
      `I can keep a steady pulse while singing.`,
      `I can read and clap '${rhythm}'.`,
      `I can sing using '${solfa}' with hand signs.`,
      `I can improvise a short musical answer.`,
    ],
    vocabulary: [rhythm, solfa, "pulse", "rhythm", "phrase", "ostinato"].filter(Boolean),
    priorLearning: `Previous lessons covered foundational pulse and pitch work appropriate for ${yg || ks}.`,
    newLearning: `Today introduces deeper work on ${focus.toLowerCase()}.`,
    assessment: `Teacher observation of singing accuracy, rhythm reading, hand signs and improvisation. Note pupils confident enough to demonstrate.`,
    differentiation: `Support: simplified 2-beat patterns, partner work. Challenge: extend to 8-beat patterns, add a second part.`,
    sendAdaptations: `Visual rhythm cards, larger hand-sign chart, predictable seating, sensory breaks as needed.`,
    ealAdaptations: `Pre-teach key musical vocabulary in pupil's first language where possible. Use gesture and modelling.`,
    teacherQuestions: [
      `Where is the steady beat?`,
      `Which note is highest in the phrase?`,
      `Can you clap that rhythm using '${rhythm}'?`,
      `What does our hand sign for so look like?`,
    ],
    pupilResponses: [
      `Pupils tap pulse on knees while singing.`,
      `Pupils demonstrate rhythm with body percussion.`,
      `Pupils sing back the pattern using solfa.`,
    ],
    extension: `Pupils compose a 4-beat rhythm or short melody and notate it. Share in pairs.`,
    plenary: `Group recall: sing the focus pattern, then a quiet closing song. Self-assess with thumbs up/down on today's objective.`,
    resources: (input.resources || "Hand-sign chart\nRhythm flashcards\nTuned percussion (pentatonic)").split(/\n+/).filter(Boolean),
    components,
    notes: input.classNotes || "",
  };
}

function comp(type: string, title: string, content: string, durationMinutes: number): LessonComponent {
  return { id: randomUUID(), type, title, content, durationMinutes, notes: "" };
}

function defaultRhythm(ks: string): string {
  switch (ks) {
    case "EYFS": return "long and short sounds";
    case "KS1": return "ta and ti-ti";
    case "KS2": return "ta, ti-ti and tika-tika";
    case "KS3": return "syncopa and dotted patterns";
    case "KS4": return "complex compound metres";
    default: return "ta and ti-ti";
  }
}

function defaultSolfa(ks: string): string {
  switch (ks) {
    case "EYFS": return "so-mi";
    case "KS1": return "so-mi-la";
    case "KS2": return "do-re-mi-so-la (pentatonic)";
    case "KS3": return "full diatonic do to do'";
    case "KS4": return "modal and chromatic patterns";
    default: return "so-mi-la";
  }
}

function defaultCurriculum(ks: string): string {
  switch (ks) {
    case "EYFS": return "EYFS EAD: Sing a range of well-known nursery rhymes and songs.";
    case "KS1": return "NC Music KS1: Use voices expressively; play tuned and untuned instruments musically.";
    case "KS2": return "NC Music KS2: Improvise and compose; use and understand staff notations.";
    case "KS3": return "NC Music KS3: Use staff notations and develop musical structure.";
    case "KS4": return "GCSE-style: Compose music using elements, devices and conventions.";
    default: return "";
  }
}
