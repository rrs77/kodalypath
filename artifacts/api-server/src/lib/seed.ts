import { db, pathwayItemsTable, activitiesTable, curriculumLinksTable } from "@workspace/db";
import { sql } from "drizzle-orm";
import { logger } from "./logger";

export async function seedIfEmpty(): Promise<void> {
  const [{ count: pathwayCount }] = await db
    .select({ count: sql<number>`count(*)::int` })
    .from(pathwayItemsTable);

  if (pathwayCount === 0) {
    await db.insert(pathwayItemsTable).values(DEFAULT_PATHWAY_ITEMS);
    logger.info({ inserted: DEFAULT_PATHWAY_ITEMS.length }, "Seeded pathway items");
  }

  const [{ count: actCount }] = await db
    .select({ count: sql<number>`count(*)::int` })
    .from(activitiesTable);
  if (actCount === 0) {
    await db.insert(activitiesTable).values(DEFAULT_ACTIVITIES);
    logger.info({ inserted: DEFAULT_ACTIVITIES.length }, "Seeded activities");
  }

  const [{ count: curCount }] = await db
    .select({ count: sql<number>`count(*)::int` })
    .from(curriculumLinksTable);
  if (curCount === 0) {
    await db.insert(curriculumLinksTable).values(DEFAULT_CURRICULUM_LINKS);
    logger.info({ inserted: DEFAULT_CURRICULUM_LINKS.length }, "Seeded curriculum links");
  }
}

const KEY_STAGES = ["EYFS", "KS1", "KS2", "KS3", "KS4"] as const;

const STRAND_PROGRESSIONS: Record<string, Record<string, string[]>> = {
  Rhythm: {
    EYFS: ["Steady pulse through clapping and movement", "Fast vs slow contrast", "Long and short sounds"],
    KS1: ["Beat vs rhythm", "ta and ti-ti", "Simple 4-beat patterns", "Rest (z)"],
    KS2: ["tika-tika (semiquavers)", "syncopa", "dotted crotchet patterns", "6/8 compound time intro"],
    KS3: ["Dotted rhythms in context", "Compound time 6/8 and 9/8", "Cross-rhythms", "Rhythm dictation 8 beats"],
    KS4: ["Irregular metres 5/4 and 7/8", "Complex polyrhythms", "Notational fluency for composition"],
  },
  Solfa: {
    EYFS: ["Two-note chants (so-mi)", "Echo singing", "High vs low pitch awareness"],
    KS1: ["so-mi-la patterns", "Adding do (low)", "Pentatonic do-re-mi-so-la"],
    KS2: ["Adding fa and ti (full diatonic)", "Major scale singing", "Simple two-part rounds"],
    KS3: ["Modes (Dorian, Mixolydian)", "Chromatic passing notes", "Minor scales (natural, harmonic)"],
    KS4: ["Modulation by ear", "Chromaticism in melody", "Tonic solfa for analysis"],
  },
  "Inner Hearing": {
    EYFS: ["Silent verses in songs", "Hidden words games"],
    KS1: ["Sing in head, out loud alternation"],
    KS2: ["Inner hearing of pitch patterns"],
    KS3: ["Silent reading of melodic phrases"],
    KS4: ["Audiation of full phrases for composition"],
  },
  "Aural Skills": {
    EYFS: ["Recognise loud/quiet, fast/slow"],
    KS1: ["Identify high/low, same/different"],
    KS2: ["Identify rhythmic and melodic patterns"],
    KS3: ["Identify intervals (3rd, 5th, octave)"],
    KS4: ["Identify chords I, IV, V; cadences"],
  },
  "Singing Games": {
    EYFS: ["Bee Bee Bumblebee", "Bow Wow Wow", "Ring around the rosy"],
    KS1: ["Bounce High Bounce Low", "Lucy Locket", "Apple Tree"],
    KS2: ["Old Brass Wagon", "Frog in the Meadow", "Cumberland Gap"],
    KS3: ["Folk songs as part-singing material"],
    KS4: ["Folk repertoire for analysis"],
  },
  "Hand Signs": {
    EYFS: ["so-mi gestures"],
    KS1: ["do, re, mi, so, la"],
    KS2: ["Full diatonic hand signs"],
    KS3: ["Hand signs with chromatic alterations"],
    KS4: ["Hand signs supporting modulation"],
  },
  "Rhythm Dictation": {
    EYFS: ["Echo clap 2-beat"],
    KS1: ["Notate 4-beat ta/ti-ti"],
    KS2: ["Notate 8-beat with rests and tika-tika"],
    KS3: ["Notate 8-beat with syncopa and dotted"],
    KS4: ["Notate 16-beat with compound time"],
  },
  "Melodic Dictation": {
    EYFS: ["High/low matching"],
    KS1: ["so-mi-la dictation"],
    KS2: ["Pentatonic dictation"],
    KS3: ["Diatonic dictation"],
    KS4: ["Modulation and chromatic dictation"],
  },
  "Improvisation": {
    EYFS: ["Make up sounds on classroom instruments"],
    KS1: ["so-mi question and answer"],
    KS2: ["Pentatonic improvisation"],
    KS3: ["Diatonic and modal improvisation"],
    KS4: ["Improvise over chord changes"],
  },
  "Composition": {
    EYFS: ["Sound stories"],
    KS1: ["Compose 4-beat rhythms"],
    KS2: ["Compose pentatonic melodies"],
    KS3: ["Compose two-part textures"],
    KS4: ["Compose with form: ABA, theme and variation"],
  },
  "Part Work": {
    EYFS: ["Group call-and-response"],
    KS1: ["Ostinato accompaniment"],
    KS2: ["Two-part rounds and canons"],
    KS3: ["Three-part part-singing"],
    KS4: ["Four-part part-singing and SATB analysis"],
  },
};

const DEFAULT_PATHWAY_ITEMS = (() => {
  const items: Array<{
    keyStage: string;
    yearGroup: string;
    strand: string;
    title: string;
    description: string;
    sequenceOrder: number;
    isCustom: number;
  }> = [];
  let order = 0;
  for (const ks of KEY_STAGES) {
    for (const [strand, byKs] of Object.entries(STRAND_PROGRESSIONS)) {
      const titles = byKs[ks];
      if (!titles) continue;
      for (const title of titles) {
        items.push({
          keyStage: ks,
          yearGroup: defaultYearGroup(ks),
          strand,
          title,
          description: `Default Kodály progression step for ${strand} at ${ks}.`,
          sequenceOrder: order++,
          isCustom: 0,
        });
      }
    }
  }
  return items;
})();

function defaultYearGroup(ks: string): string {
  switch (ks) {
    case "EYFS": return "Reception";
    case "KS1": return "Year 1-2";
    case "KS2": return "Year 3-6";
    case "KS3": return "Year 7-9";
    case "KS4": return "Year 10-11";
    default: return "";
  }
}

const DEFAULT_ACTIVITIES = [
  {
    title: "Bee Bee Bumblebee",
    ageRange: "4-6",
    keyStage: "EYFS",
    kodalyFocus: "Steady pulse, so-mi",
    rhythmElement: "ta, ti-ti",
    solfaElement: "so-mi",
    curriculumLink: "EYFS EAD: Being Imaginative and Expressive",
    description: "Classic singing game introducing steady pulse and the so-mi interval.",
    instructions: "Sit in a circle. Sing 'Bee bee bumblebee, sting a person on the knee, sting a pig upon the snout, you are out!' Tap pulse on knees. On 'out', the child pointed to leaves the circle.",
    questions: "Where is the steady beat? Are these notes high or low?",
    assessmentFocus: "Pulse keeping; pitch matching of so and mi.",
    requiredResources: "None — singing game only.",
    youtubeLink: "",
    externalLink: "",
    activityType: "Singing Game",
    difficulty: "Beginner",
    term: "Autumn 1",
    tags: ["pulse", "so-mi", "circle game"],
  },
  {
    title: "Apple Tree (so-mi-la)",
    ageRange: "5-7",
    keyStage: "KS1",
    kodalyFocus: "so-mi-la",
    rhythmElement: "ta, ti-ti",
    solfaElement: "so-mi-la",
    curriculumLink: "NC Music KS1: Use voices expressively, sing songs and chants",
    description: "Singing game adding la above so for new pitch contrast.",
    instructions: "Two children form an arch. Class walks under singing. Whoever is caught at 'OUT' joins the arch.",
    questions: "Which note is highest? Can you show me with hand signs?",
    assessmentFocus: "Three-note pitch matching; hand sign accuracy.",
    requiredResources: "Open space.",
    youtubeLink: "",
    externalLink: "",
    activityType: "Singing Game",
    difficulty: "Beginner",
    term: "Autumn 2",
    tags: ["so-mi-la", "hand signs"],
  },
  {
    title: "Rhythm Flashcard Round",
    ageRange: "6-8",
    keyStage: "KS1",
    kodalyFocus: "ta and ti-ti",
    rhythmElement: "ta, ti-ti, rest",
    solfaElement: "",
    curriculumLink: "NC Music KS1: Play tuned and untuned instruments musically",
    description: "Show 4-beat flashcards; class claps and says rhythm names.",
    instructions: "Hold up a 4-beat card. Class claps in pulse and says 'ta, ti-ti, ta, rest'. Rotate cards. Add new patterns each lesson.",
    questions: "How many sounds on beat 2? What is the rhythm name?",
    assessmentFocus: "Rhythm reading and accurate clapping.",
    requiredResources: "Set of rhythm flashcards (printable).",
    youtubeLink: "",
    externalLink: "",
    activityType: "Rhythm",
    difficulty: "Beginner",
    term: "Autumn 1",
    tags: ["rhythm reading", "ta", "ti-ti"],
  },
  {
    title: "Pentatonic Improvisation Circle",
    ageRange: "8-11",
    keyStage: "KS2",
    kodalyFocus: "Pentatonic improvisation",
    rhythmElement: "ta, ti-ti, tika-tika",
    solfaElement: "do, re, mi, so, la",
    curriculumLink: "NC Music KS2: Improvise and compose music",
    description: "Children take turns improvising a 4-beat melody on pentatonic tuned percussion.",
    instructions: "Set up pentatonic xylophones (remove F and B). One child plays a 4-beat answer to a teacher question. Class echoes if desired.",
    questions: "Did your phrase end on do? Which notes felt restful?",
    assessmentFocus: "Confidence in improvisation; phrase shape.",
    requiredResources: "Pentatonic-set tuned percussion.",
    youtubeLink: "",
    externalLink: "",
    activityType: "Composition",
    difficulty: "Intermediate",
    term: "Spring 1",
    tags: ["pentatonic", "improvisation"],
  },
  {
    title: "Tika-tika Dictation",
    ageRange: "8-10",
    keyStage: "KS2",
    kodalyFocus: "Semiquavers (tika-tika)",
    rhythmElement: "tika-tika, ta, ti-ti",
    solfaElement: "",
    curriculumLink: "NC Music KS2: Use and understand staff and other musical notations",
    description: "Teacher claps 4-beat patterns including tika-tika; pupils notate.",
    instructions: "Clap a 4-beat pattern twice. Pupils notate using stick notation. Reveal the answer and discuss.",
    questions: "How many sounds on beat 1? Where did the four-sound pattern fall?",
    assessmentFocus: "Rhythm dictation accuracy.",
    requiredResources: "Whiteboards or rhythm grids.",
    youtubeLink: "",
    externalLink: "",
    activityType: "Dictation",
    difficulty: "Intermediate",
    term: "Spring 2",
    tags: ["dictation", "tika-tika"],
  },
  {
    title: "Two-part Round: 'Frère Jacques'",
    ageRange: "8-11",
    keyStage: "KS2",
    kodalyFocus: "Part work in canon",
    rhythmElement: "ta, ti-ti",
    solfaElement: "do-re-mi-fa-so",
    curriculumLink: "NC Music KS2: Sing in solo and in ensemble contexts",
    description: "Sing in two parts as a canon, entering at bar 3.",
    instructions: "Teach the song unison first. Split into two groups; group B starts when group A reaches bar 3. Listen for tuning at the unison points.",
    questions: "Can you stay on your part when the other group enters?",
    assessmentFocus: "Independence in part-singing; tuning.",
    requiredResources: "None.",
    youtubeLink: "",
    externalLink: "",
    activityType: "Singing",
    difficulty: "Intermediate",
    term: "Summer 1",
    tags: ["canon", "part work"],
  },
  {
    title: "Compound Time Body Percussion",
    ageRange: "11-14",
    keyStage: "KS3",
    kodalyFocus: "6/8 compound time",
    rhythmElement: "Compound time",
    solfaElement: "",
    curriculumLink: "NC Music KS3: Develop a deepening understanding of musical elements",
    description: "Layered body percussion ostinati in 6/8.",
    instructions: "Group A: stomp dotted crotchets. Group B: clap quavers. Group C: pat 'long-short' patterns. Layer in turns.",
    questions: "How many quavers per beat? How does compound feel different from simple?",
    assessmentFocus: "Maintaining independent parts in compound time.",
    requiredResources: "None.",
    youtubeLink: "",
    externalLink: "",
    activityType: "Rhythm",
    difficulty: "Intermediate",
    term: "Autumn 2",
    tags: ["6/8", "body percussion"],
  },
  {
    title: "Modal Improvisation: Dorian",
    ageRange: "13-16",
    keyStage: "KS4",
    kodalyFocus: "Modal improvisation",
    rhythmElement: "Free",
    solfaElement: "Dorian (re-based)",
    curriculumLink: "GCSE-style: Composing in different styles and traditions",
    description: "Improvise melodies over a D-Dorian drone.",
    instructions: "Hold a D drone (D + A). Pupils improvise on D-E-F-G-A-B-C-D scale, focusing on the raised 6th (B natural) as the modal colour.",
    questions: "Which note gives the Dorian flavour? How does ending on D feel?",
    assessmentFocus: "Modal awareness; phrase construction.",
    requiredResources: "Keyboard or drone track.",
    youtubeLink: "",
    externalLink: "",
    activityType: "Composition",
    difficulty: "Advanced",
    term: "Spring 1",
    tags: ["modes", "dorian"],
  },
  {
    title: "Listening: 'In the Hall of the Mountain King'",
    ageRange: "7-11",
    keyStage: "KS2",
    kodalyFocus: "Tempo, dynamics, ostinato",
    rhythmElement: "Steady ostinato",
    solfaElement: "",
    curriculumLink: "NC Music KS2: Appreciate and understand a wide range of high-quality live and recorded music",
    description: "Active listening to Grieg's piece, tracking the ostinato.",
    instructions: "Children walk in pulse on the ostinato, speed up with the music, freeze on accents. Discuss tempo and dynamics afterwards.",
    questions: "What happens to the speed? How loud does it get?",
    assessmentFocus: "Active listening; describing musical change.",
    requiredResources: "Audio of 'In the Hall of the Mountain King'.",
    youtubeLink: "",
    externalLink: "",
    activityType: "Listening",
    difficulty: "Beginner",
    term: "Spring 2",
    tags: ["listening", "tempo", "ostinato"],
  },
  {
    title: "Beat Grid: Compose a 4-beat Pattern",
    ageRange: "6-9",
    keyStage: "KS1",
    kodalyFocus: "Rhythm composition",
    rhythmElement: "ta, ti-ti, rest",
    solfaElement: "",
    curriculumLink: "NC Music KS1: Experiment with, create, select and combine sounds",
    description: "Pupils compose a 4-beat rhythm by filling a grid.",
    instructions: "Provide a 4-cell grid. Pupils choose ta, ti-ti or rest for each cell. They clap their pattern; partner echoes.",
    questions: "Which beat has two sounds? Can you teach your partner?",
    assessmentFocus: "Rhythm composition and notation.",
    requiredResources: "Beat grid worksheets.",
    youtubeLink: "",
    externalLink: "",
    activityType: "Composition",
    difficulty: "Beginner",
    term: "Spring 1",
    tags: ["beat grid", "composition"],
  },
  {
    title: "Hand Sign Echo",
    ageRange: "5-9",
    keyStage: "KS1",
    kodalyFocus: "Hand signs",
    rhythmElement: "",
    solfaElement: "do, mi, so, la",
    curriculumLink: "NC Music KS1: Listen with concentration and understanding",
    description: "Teacher shows hand signs; pupils sing back the pattern.",
    instructions: "Stand in a circle. Teacher shows a 4-note pattern with hand signs. Pupils sing back using solfa. Increase length each turn.",
    questions: "Can you remember 6 notes? Which note is so?",
    assessmentFocus: "Pitch memory and hand sign recognition.",
    requiredResources: "None.",
    youtubeLink: "",
    externalLink: "",
    activityType: "Solfa",
    difficulty: "Beginner",
    term: "Autumn 2",
    tags: ["hand signs", "echo"],
  },
  {
    title: "EYFS: Sound Story 'The Storm'",
    ageRange: "3-5",
    keyStage: "EYFS",
    kodalyFocus: "Sound exploration, dynamics",
    rhythmElement: "Free",
    solfaElement: "",
    curriculumLink: "EYFS EAD: Explore, use and refine a variety of artistic effects",
    description: "Children create a soundscape of a storm using bodies and instruments.",
    instructions: "Tell a storm story. At each stage, children make matching sounds: rain (finger taps), thunder (drums), wind (whoosh voices). End with calm.",
    questions: "How will we make the rain sound? Loud or quiet at the start?",
    assessmentFocus: "Sound choice and dynamic control.",
    requiredResources: "Untuned percussion.",
    youtubeLink: "",
    externalLink: "",
    activityType: "Composition",
    difficulty: "Beginner",
    term: "Autumn 2",
    tags: ["soundscape", "EYFS"],
  },
];

const DEFAULT_CURRICULUM_LINKS = [
  { keyStage: "EYFS", framework: "EYFS EAD", objective: "Sing a range of well-known nursery rhymes and songs", skillArea: "Singing" },
  { keyStage: "EYFS", framework: "EYFS EAD", objective: "Perform songs, rhymes, poems and stories with others", skillArea: "Performing" },
  { keyStage: "EYFS", framework: "EYFS EAD", objective: "Listen attentively, move to and talk about music", skillArea: "Listening" },
  { keyStage: "KS1", framework: "NC Music KS1", objective: "Use their voices expressively and creatively by singing songs and speaking chants and rhymes", skillArea: "Singing" },
  { keyStage: "KS1", framework: "NC Music KS1", objective: "Play tuned and untuned instruments musically", skillArea: "Performing" },
  { keyStage: "KS1", framework: "NC Music KS1", objective: "Listen with concentration and understanding to a range of high-quality live and recorded music", skillArea: "Listening" },
  { keyStage: "KS1", framework: "NC Music KS1", objective: "Experiment with, create, select and combine sounds using the inter-related dimensions of music", skillArea: "Composing" },
  { keyStage: "KS2", framework: "NC Music KS2", objective: "Play and perform in solo and ensemble contexts, using their voices and playing musical instruments with increasing accuracy, fluency, control and expression", skillArea: "Performing" },
  { keyStage: "KS2", framework: "NC Music KS2", objective: "Improvise and compose music for a range of purposes using the inter-related dimensions of music", skillArea: "Composing" },
  { keyStage: "KS2", framework: "NC Music KS2", objective: "Listen with attention to detail and recall sounds with increasing aural memory", skillArea: "Listening" },
  { keyStage: "KS2", framework: "NC Music KS2", objective: "Use and understand staff and other musical notations", skillArea: "Notation" },
  { keyStage: "KS2", framework: "NC Music KS2", objective: "Appreciate and understand a wide range of high-quality live and recorded music drawn from different traditions", skillArea: "Appraising" },
  { keyStage: "KS2", framework: "NC Music KS2", objective: "Develop an understanding of the history of music", skillArea: "Appraising" },
  { keyStage: "KS3", framework: "NC Music KS3", objective: "Play and perform confidently in a range of solo and ensemble contexts using their voice, playing instruments musically, fluently and with accuracy and expression", skillArea: "Performing" },
  { keyStage: "KS3", framework: "NC Music KS3", objective: "Improvise and compose; and extend and develop musical ideas by drawing on a range of musical structures, styles, genres and traditions", skillArea: "Composing" },
  { keyStage: "KS3", framework: "NC Music KS3", objective: "Use staff and other relevant notations appropriately and accurately in a range of musical styles, genres and traditions", skillArea: "Notation" },
  { keyStage: "KS3", framework: "NC Music KS3", objective: "Identify and use the inter-related dimensions of music expressively and with increasing sophistication", skillArea: "Appraising" },
  { keyStage: "KS3", framework: "NC Music KS3", objective: "Listen with increasing discrimination to a wide range of music from great composers and musicians", skillArea: "Listening" },
  { keyStage: "KS4", framework: "GCSE-style", objective: "Perform as a soloist and as part of an ensemble", skillArea: "Performing" },
  { keyStage: "KS4", framework: "GCSE-style", objective: "Compose music that uses musical elements, devices, conventions and structures", skillArea: "Composing" },
  { keyStage: "KS4", framework: "GCSE-style", objective: "Appraise and analyse music using musical vocabulary", skillArea: "Appraising" },
];
