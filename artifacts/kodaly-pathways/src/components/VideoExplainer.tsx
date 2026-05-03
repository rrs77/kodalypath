import { useEffect, useState, type ReactNode } from "react";
import { Link } from "wouter";
import { AnimatePresence, motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Music, ChevronLeft, ChevronRight, Pause, Play, X, ArrowRight,
  LayoutDashboard, GraduationCap, Map, Library, Hammer, CalendarDays,
  Presentation, FileDown, Youtube, Sparkles, Clock, GripVertical,
} from "lucide-react";

const PALETTE = "linear-gradient(135deg, hsl(180 35% 18%) 0%, hsl(170 40% 14%) 100%)";
const PALETTE_RADIAL =
  "radial-gradient(circle at 20% 20%, hsl(174 50% 30%) 0%, transparent 50%), radial-gradient(circle at 80% 80%, hsl(160 45% 22%) 0%, transparent 55%), " + PALETTE;

const SLIDE_MS = 6500;

type Slide = {
  kind: "title" | "feature" | "outro";
  eyebrow?: string;
  title: string;
  blurb: string;
  Mockup?: () => ReactNode;
};

const SLIDES: Slide[] = [
  {
    kind: "title",
    title: "Kodály Pathways",
    blurb: "Plan, sequence and teach — the Kodály way.",
  },
  {
    kind: "feature",
    eyebrow: "Lesson Builder",
    title: "Build a full lesson in minutes",
    blurb: "Drag-and-drop components — warm-up, rhythm, solfa, singing game, plenary — with durations that snap to your lesson length.",
    Mockup: LessonBuilderMockup,
  },
  {
    kind: "feature",
    eyebrow: "Activities Library",
    title: "40+ activities, 28 with YouTube videos",
    blurb: "Includes Mr. Meehl's traditional singing-game tutorials, linked straight from the activity card to your lesson plan.",
    Mockup: ActivitiesMockup,
  },
  {
    kind: "feature",
    eyebrow: "Kodály Pathway",
    title: "EYFS → KS4 progression, ready to teach",
    blurb: "A built-in sequence for rhythm, solfa, hand signs, inner hearing and part work. Customise the order to match your scheme of work.",
    Mockup: PathwayMockup,
  },
  {
    kind: "feature",
    eyebrow: "Classes",
    title: "All your classes in one place",
    blurb: "Year group, key stage, school and SEND/EAL notes — everything you need at a glance, encrypted at rest.",
    Mockup: ClassesMockup,
  },
  {
    kind: "feature",
    eyebrow: "Calendar",
    title: "See your term at a glance",
    blurb: "Schedule lessons against classes, copy a term to the next, and never lose track of what's coming up.",
    Mockup: CalendarMockup,
  },
  {
    kind: "feature",
    eyebrow: "Teach mode",
    title: "Project lessons on the classroom screen",
    blurb: "The Interactive Whiteboard view shows songs, rhythms and slides full-screen — built for the projector at the front of the room.",
    Mockup: IWBMockup,
  },
  {
    kind: "feature",
    eyebrow: "PDF export",
    title: "One click, printable lesson plans",
    blurb: "Export any lesson as a tidy PDF for cover teachers, observation files or your own ring binder.",
    Mockup: PDFMockup,
  },
  {
    kind: "feature",
    eyebrow: "Dashboard",
    title: "Your week at a glance",
    blurb: "Recent lessons, upcoming calendar entries and term breakdown — the moment you sign in.",
    Mockup: DashboardMockup,
  },
  {
    kind: "outro",
    title: "Ready to plan smarter?",
    blurb: "Sign in to start, or try the demo — no password needed.",
  },
];

export function VideoExplainer({ open, onClose }: { open: boolean; onClose: () => void }) {
  const [i, setI] = useState(0);
  const [playing, setPlaying] = useState(true);

  useEffect(() => {
    if (!open) return;
    setI(0);
    setPlaying(true);
  }, [open]);

  useEffect(() => {
    if (!open || !playing) return;
    const t = setTimeout(() => {
      setI((cur) => (cur + 1 < SLIDES.length ? cur + 1 : cur));
      if (i + 1 >= SLIDES.length - 1) setPlaying(false);
    }, SLIDE_MS);
    return () => clearTimeout(t);
  }, [open, playing, i]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
      if (e.key === "ArrowRight") setI((c) => Math.min(c + 1, SLIDES.length - 1));
      if (e.key === "ArrowLeft") setI((c) => Math.max(c - 1, 0));
      if (e.key === " ") { e.preventDefault(); setPlaying((p) => !p); }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  if (!open) return null;
  const slide = SLIDES[i];

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 md:p-8">
      <div className="relative w-full max-w-6xl aspect-video rounded-xl overflow-hidden shadow-2xl"
           style={{ background: PALETTE_RADIAL }}>
        <div className="absolute inset-0 opacity-[0.08] pointer-events-none" style={{
          backgroundImage: "radial-gradient(white 1px, transparent 1px)",
          backgroundSize: "24px 24px",
        }} />

        {/* Top bar */}
        <div className="absolute top-0 left-0 right-0 z-20 flex items-center justify-between px-5 py-3.5">
          <div className="flex items-center gap-2 text-white/90">
            <div className="w-7 h-7 rounded-md bg-white/10 backdrop-blur flex items-center justify-center">
              <Music className="w-3.5 h-3.5" />
            </div>
            <span className="text-sm font-medium">Kodály Pathways · Feature tour</span>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-md text-white/80 hover:bg-white/10" data-testid="button-close-explainer" aria-label="Close">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Slide stage */}
        <div className="absolute inset-0 flex items-center justify-center px-8 md:px-16 pt-14 pb-20">
          <AnimatePresence mode="wait">
            <motion.div key={i}
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -16 }}
              transition={{ duration: 0.45, ease: "easeOut" }}
              className="w-full h-full">
              {slide.kind === "title" ? (
                <TitleSlide title={slide.title} blurb={slide.blurb} />
              ) : slide.kind === "outro" ? (
                <OutroSlide title={slide.title} blurb={slide.blurb} onClose={onClose} />
              ) : (
                <FeatureSlide
                  eyebrow={slide.eyebrow!}
                  title={slide.title}
                  blurb={slide.blurb}
                  Mockup={slide.Mockup!}
                />
              )}
            </motion.div>
          </AnimatePresence>
        </div>

        {/* Bottom controls */}
        <div className="absolute bottom-0 left-0 right-0 z-20 px-5 pb-4 pt-2 flex flex-col gap-2.5">
          {/* Progress bar */}
          <div className="h-1 rounded-full bg-white/10 overflow-hidden">
            <motion.div
              key={`bar-${i}-${playing ? "p" : "s"}`}
              className="h-full bg-gradient-to-r from-emerald-300 to-teal-200"
              initial={{ width: "0%" }}
              animate={{ width: playing ? "100%" : `${((i + 1) / SLIDES.length) * 100}%` }}
              transition={{ duration: playing ? SLIDE_MS / 1000 : 0.3, ease: "linear" }}
            />
          </div>
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-1.5">
              <button onClick={() => setI((c) => Math.max(c - 1, 0))} disabled={i === 0}
                className="p-1.5 rounded-md text-white/85 hover:bg-white/10 disabled:opacity-30" aria-label="Previous">
                <ChevronLeft className="w-5 h-5" />
              </button>
              <button onClick={() => setPlaying((p) => !p)}
                className="p-1.5 rounded-md text-white/85 hover:bg-white/10" aria-label={playing ? "Pause" : "Play"}>
                {playing ? <Pause className="w-5 h-5" /> : <Play className="w-5 h-5" />}
              </button>
              <button onClick={() => setI((c) => Math.min(c + 1, SLIDES.length - 1))} disabled={i === SLIDES.length - 1}
                className="p-1.5 rounded-md text-white/85 hover:bg-white/10 disabled:opacity-30" aria-label="Next">
                <ChevronRight className="w-5 h-5" />
              </button>
              <span className="ml-2 text-xs text-white/60 tabular-nums">{i + 1} / {SLIDES.length}</span>
            </div>
            <div className="flex items-center gap-1">
              {SLIDES.map((_, idx) => (
                <button key={idx} onClick={() => setI(idx)} aria-label={`Slide ${idx + 1}`}
                  className={`h-1.5 rounded-full transition-all ${
                    idx === i ? "w-6 bg-white" : "w-1.5 bg-white/30 hover:bg-white/50"
                  }`} />
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ------- Slide layouts ------- */

function TitleSlide({ title, blurb }: { title: string; blurb: string }) {
  return (
    <div className="h-full flex flex-col items-center justify-center text-center text-white">
      <motion.div initial={{ scale: 0.6, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
        transition={{ type: "spring", stiffness: 110, damping: 14 }}
        className="w-20 h-20 rounded-2xl bg-white/10 backdrop-blur flex items-center justify-center mb-6 ring-1 ring-white/20">
        <Music className="w-9 h-9" />
      </motion.div>
      <motion.h1 initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.15, duration: 0.5 }}
        className="text-5xl md:text-6xl font-bold tracking-tight">
        Kodály <span className="italic bg-gradient-to-r from-emerald-200 to-teal-100 bg-clip-text text-transparent">Pathways</span>
      </motion.h1>
      <motion.p initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.35, duration: 0.5 }}
        className="mt-4 text-lg md:text-xl text-white/80 max-w-xl">
        {blurb}
      </motion.p>
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.7 }}
        className="mt-8 inline-flex items-center gap-1.5 text-xs text-white/60">
        <Sparkles className="w-3.5 h-3.5" /> A 60-second tour
      </motion.div>
    </div>
  );
}

function OutroSlide({ title, blurb, onClose }: { title: string; blurb: string; onClose: () => void }) {
  return (
    <div className="h-full flex flex-col items-center justify-center text-center text-white">
      <motion.div initial={{ scale: 0.6, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
        transition={{ type: "spring", stiffness: 110, damping: 14 }}
        className="w-20 h-20 rounded-2xl bg-white/10 backdrop-blur flex items-center justify-center mb-6 ring-1 ring-white/20">
        <Music className="w-9 h-9" />
      </motion.div>
      <motion.h2 initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.1, duration: 0.5 }}
        className="text-4xl md:text-5xl font-bold tracking-tight">{title}</motion.h2>
      <motion.p initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.25, duration: 0.5 }}
        className="mt-4 text-lg text-white/80 max-w-xl">{blurb}</motion.p>
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.45, duration: 0.5 }}
        className="mt-8 flex flex-wrap justify-center gap-3">
        <Link href="/login">
          <Button size="lg" onClick={onClose} className="bg-white text-slate-900 hover:bg-white/90 border-0">
            Sign in to get started <ArrowRight className="w-4 h-4 ml-1" />
          </Button>
        </Link>
        <Button size="lg" variant="outline" onClick={onClose}
          className="bg-white/10 text-white border-white/30 hover:bg-white/20 hover:text-white">
          Close
        </Button>
      </motion.div>
      <p className="mt-6 text-xs text-white/50">Kodály Pathways · for UK music teachers, EYFS – KS4</p>
    </div>
  );
}

function FeatureSlide({ eyebrow, title, blurb, Mockup }: {
  eyebrow: string; title: string; blurb: string; Mockup: () => ReactNode;
}) {
  return (
    <div className="h-full grid md:grid-cols-[1fr,1.3fr] gap-6 md:gap-10 items-center">
      <div className="text-white">
        <motion.div initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.1 }}>
          <Badge className="bg-white/15 text-white border-0 mb-4 backdrop-blur">{eyebrow}</Badge>
        </motion.div>
        <motion.h2 initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2, duration: 0.45 }}
          className="text-3xl md:text-4xl font-bold tracking-tight leading-tight">{title}</motion.h2>
        <motion.p initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.35, duration: 0.45 }}
          className="mt-4 text-base md:text-lg text-white/75 leading-relaxed">{blurb}</motion.p>
      </div>
      <motion.div initial={{ opacity: 0, scale: 0.96 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.25, duration: 0.5 }}
        className="relative">
        <div className="absolute -inset-3 rounded-2xl bg-gradient-to-tr from-emerald-300/20 to-teal-200/10 blur-2xl" />
        <div className="relative rounded-xl bg-white shadow-2xl ring-1 ring-black/10 overflow-hidden text-slate-800"
             style={{ aspectRatio: "16/10" }}>
          <Mockup />
        </div>
      </motion.div>
    </div>
  );
}

/* ------- Mockup screens (CSS-only) ------- */

function MockChrome({ title, children }: { title: string; children: ReactNode }) {
  return (
    <div className="h-full flex flex-col">
      <div className="flex items-center gap-1.5 px-3 py-2 border-b bg-slate-50">
        <span className="w-2.5 h-2.5 rounded-full bg-rose-300" />
        <span className="w-2.5 h-2.5 rounded-full bg-amber-300" />
        <span className="w-2.5 h-2.5 rounded-full bg-emerald-300" />
        <span className="ml-2 text-[10px] text-slate-400 font-mono truncate">kodaly-pathways · {title}</span>
      </div>
      <div className="flex-1 overflow-hidden">{children}</div>
    </div>
  );
}

function LessonBuilderMockup() {
  const components = [
    { type: "Warm-up", title: "Echo clap (2-beat)", min: 5, color: "bg-amber-100 text-amber-800" },
    { type: "Rhythm", title: "Ta and ti-ti cards", min: 8, color: "bg-rose-100 text-rose-800" },
    { type: "Solfa", title: "so-mi-la pattern game", min: 10, color: "bg-teal-100 text-teal-800" },
    { type: "Singing game", title: "Bow Wow Wow", min: 12, color: "bg-violet-100 text-violet-800", video: true },
    { type: "Plenary", title: "Inner hearing reflection", min: 5, color: "bg-emerald-100 text-emerald-800" },
  ];
  return (
    <MockChrome title="/lesson-builder">
      <div className="px-4 pt-3 pb-2 border-b flex items-center justify-between">
        <div>
          <div className="text-sm font-semibold">KS1 — introducing ta and ti-ti</div>
          <div className="text-[11px] text-slate-500">Year 2 · Autumn 1 · 40 min</div>
        </div>
        <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-700">Saved</span>
      </div>
      <div className="p-3 space-y-1.5 overflow-hidden">
        {components.map((c, idx) => (
          <motion.div key={c.type}
            initial={{ opacity: 0, x: -16 }} animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.4 + idx * 0.1 }}
            className="flex items-center gap-2 px-2.5 py-1.5 rounded-md border bg-white">
            <GripVertical className="w-3.5 h-3.5 text-slate-300" />
            <span className={`text-[10px] font-semibold px-1.5 py-0.5 rounded ${c.color}`}>{c.type}</span>
            <span className="text-xs flex-1 truncate">{c.title}</span>
            {c.video && <Youtube className="w-3.5 h-3.5 text-rose-500" />}
            <span className="text-[10px] text-slate-500 inline-flex items-center gap-1">
              <Clock className="w-3 h-3" /> {c.min} min
            </span>
          </motion.div>
        ))}
      </div>
    </MockChrome>
  );
}

function ActivitiesMockup() {
  const cards = [
    { t: "Bow Wow Wow", ks: "KS1", focus: "Pulse + so-mi", video: true },
    { t: "Frog in the Meadow", ks: "KS2", focus: "Pentatonic", video: true },
    { t: "Cumberland Gap", ks: "KS2", focus: "do-re-mi-so-la", video: true },
    { t: "Rhythm cards: ta/ti-ti", ks: "KS1", focus: "Rhythm", video: false },
    { t: "Bee Bee Bumblebee", ks: "EYFS", focus: "Steady pulse", video: true },
    { t: "Lucy Locket", ks: "KS1", focus: "so-mi", video: true },
  ];
  return (
    <MockChrome title="/activities">
      <div className="px-4 py-2 border-b flex items-center gap-2">
        <Library className="w-4 h-4 text-teal-600" />
        <span className="text-sm font-semibold">Activities Library</span>
        <div className="ml-auto flex gap-1.5 text-[10px]">
          <span className="px-2 py-0.5 rounded-full bg-slate-100">All</span>
          <span className="px-2 py-0.5 rounded-full bg-teal-600 text-white">With video</span>
        </div>
      </div>
      <div className="p-2.5 grid grid-cols-3 gap-2 overflow-hidden">
        {cards.map((c, i) => (
          <motion.div key={c.t}
            initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.35 + i * 0.06 }}
            className="rounded-md border p-2 bg-white">
            <div className="flex items-center justify-between">
              <span className="text-[9px] font-semibold text-slate-500">{c.ks}</span>
              {c.video && (
                <span className="text-[9px] inline-flex items-center gap-0.5 px-1 py-0.5 bg-rose-50 text-rose-600 rounded">
                  <Youtube className="w-2.5 h-2.5" /> Video
                </span>
              )}
            </div>
            <div className="text-[11px] font-semibold mt-1 leading-tight truncate">{c.t}</div>
            <div className="text-[9px] text-slate-500 mt-0.5">{c.focus}</div>
          </motion.div>
        ))}
      </div>
    </MockChrome>
  );
}

function PathwayMockup() {
  const steps = [
    { ks: "EYFS", t: "Steady pulse · so-mi" },
    { ks: "KS1", t: "ta + ti-ti · so-mi-la" },
    { ks: "KS2", t: "tika-tika · pentatonic" },
    { ks: "KS3", t: "Compound time · modes" },
    { ks: "KS4", t: "Irregular metres · chromatic" },
  ];
  return (
    <MockChrome title="/pathway">
      <div className="px-4 py-2 border-b flex items-center gap-2">
        <Map className="w-4 h-4 text-teal-600" />
        <span className="text-sm font-semibold">Kodály Pathway · Rhythm + Solfa</span>
      </div>
      <div className="p-4">
        <div className="relative">
          <div className="absolute left-0 right-0 top-4 h-0.5 bg-slate-200" />
          <div className="relative grid grid-cols-5 gap-1">
            {steps.map((s, i) => (
              <motion.div key={s.ks} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 + i * 0.1 }} className="flex flex-col items-center text-center">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-[10px] font-bold ${
                  i < 3 ? "bg-teal-600 text-white" : "bg-white border-2 border-slate-300 text-slate-500"
                }`}>{s.ks}</div>
                <div className="mt-2 text-[10px] leading-tight text-slate-700 px-1">{s.t}</div>
              </motion.div>
            ))}
          </div>
        </div>
        <div className="mt-5 rounded-md bg-slate-50 p-2.5 border">
          <div className="text-[10px] font-semibold text-slate-500">CURRENT STEP</div>
          <div className="text-xs font-semibold mt-0.5">KS2 — tika-tika (semiquavers)</div>
          <div className="text-[10px] text-slate-500 mt-1">3 activities mapped · 2 lessons planned</div>
        </div>
      </div>
    </MockChrome>
  );
}

function ClassesMockup() {
  const rows = [
    { n: "Reception Robins", yg: "Reception · EYFS", note: "EAL focus" },
    { n: "Year 2 Larks", yg: "Year 2 · KS1", note: "Confident singers" },
    { n: "Year 4 Nightingales", yg: "Year 4 · KS2", note: "1 SEND (hearing)" },
    { n: "Year 6 Choir", yg: "Year 6 · KS2", note: "Christmas concert" },
  ];
  return (
    <MockChrome title="/classes">
      <div className="px-4 py-2 border-b flex items-center gap-2">
        <GraduationCap className="w-4 h-4 text-teal-600" />
        <span className="text-sm font-semibold">Classes</span>
        <span className="ml-auto text-[10px] px-1.5 py-0.5 rounded bg-emerald-50 text-emerald-700">PII encrypted</span>
      </div>
      <div className="p-3 space-y-1.5">
        {rows.map((r, i) => (
          <motion.div key={r.n} initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.3 + i * 0.08 }}
            className="flex items-center gap-3 px-3 py-2 rounded-md border bg-white">
            <div className="w-8 h-8 rounded-md bg-teal-50 text-teal-700 flex items-center justify-center text-xs font-bold">
              {r.n.split(" ").map((w) => w[0]).slice(0, 2).join("")}
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-xs font-semibold truncate">{r.n}</div>
              <div className="text-[10px] text-slate-500">{r.yg}</div>
            </div>
            <span className="text-[10px] px-1.5 py-0.5 rounded bg-slate-100 text-slate-600">{r.note}</span>
          </motion.div>
        ))}
      </div>
    </MockChrome>
  );
}

function CalendarMockup() {
  const days = ["Mon", "Tue", "Wed", "Thu", "Fri"];
  const items: Record<string, { t: string; c: string }[]> = {
    Mon: [{ t: "Reception circle", c: "bg-amber-100 text-amber-800" }],
    Tue: [{ t: "Year 2 hall", c: "bg-rose-100 text-rose-800" }],
    Wed: [{ t: "Year 4 music room", c: "bg-teal-100 text-teal-800" }, { t: "Year 5", c: "bg-violet-100 text-violet-800" }],
    Thu: [{ t: "Choir lunch", c: "bg-emerald-100 text-emerald-800" }],
    Fri: [],
  };
  return (
    <MockChrome title="/calendar">
      <div className="px-4 py-2 border-b flex items-center gap-2">
        <CalendarDays className="w-4 h-4 text-teal-600" />
        <span className="text-sm font-semibold">Autumn 1 · Week 1</span>
        <span className="ml-auto text-[10px] text-slate-500">Copy term →</span>
      </div>
      <div className="p-3 grid grid-cols-5 gap-1.5">
        {days.map((d, i) => (
          <motion.div key={d} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 + i * 0.06 }}
            className="rounded-md border bg-slate-50/40 p-1.5 min-h-[110px]">
            <div className="text-[10px] font-semibold text-slate-500 mb-1.5">{d}</div>
            <div className="space-y-1">
              {items[d].map((it, j) => (
                <div key={j} className={`text-[9px] px-1.5 py-1 rounded ${it.c} leading-tight`}>{it.t}</div>
              ))}
            </div>
          </motion.div>
        ))}
      </div>
    </MockChrome>
  );
}

function IWBMockup() {
  return (
    <MockChrome title="/iwb · Teach mode">
      <div className="h-full bg-gradient-to-br from-slate-900 via-teal-900 to-slate-900 text-white p-6 flex flex-col items-center justify-center text-center">
        <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ delay: 0.3 }}
          className="text-[10px] uppercase tracking-widest text-emerald-200/80">Now teaching</motion.div>
        <motion.div initial={{ y: 10, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.45 }}
          className="text-2xl font-bold mt-1.5">Bow Wow Wow</motion.div>
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.6 }}
          className="mt-4 font-mono text-3xl tracking-[0.3em] text-emerald-200">
          ta &nbsp; ta &nbsp; ti-ti &nbsp; ta
        </motion.div>
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.75 }}
          className="mt-4 text-xs text-white/60">so &nbsp;·&nbsp; mi &nbsp;·&nbsp; la &nbsp;·&nbsp; so</motion.div>
        <motion.div initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.9 }}
          className="mt-5 inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/10 backdrop-blur text-xs">
          <Presentation className="w-3.5 h-3.5" /> Full-screen on classroom display
        </motion.div>
      </div>
    </MockChrome>
  );
}

function PDFMockup() {
  return (
    <MockChrome title="lesson-plan.pdf">
      <div className="h-full bg-slate-100 p-4 flex items-center justify-center">
        <motion.div initial={{ y: 16, opacity: 0, rotate: -2 }} animate={{ y: 0, opacity: 1, rotate: 0 }}
          transition={{ delay: 0.25, type: "spring", stiffness: 100 }}
          className="bg-white shadow-lg rounded-sm w-[78%] aspect-[1/1.18] p-4 text-slate-800 ring-1 ring-slate-200">
          <div className="border-b pb-1.5">
            <div className="text-[8px] text-slate-400">Kodály Pathways · Lesson plan</div>
            <div className="text-sm font-bold mt-0.5">KS1 — introducing ta and ti-ti</div>
            <div className="text-[8px] text-slate-500">Year 2 · Autumn 1 · 40 minutes</div>
          </div>
          <div className="mt-2 grid grid-cols-2 gap-2 text-[8px]">
            <div><div className="font-semibold text-slate-600">Learning objective</div><div className="text-slate-500">Distinguish ta and ti-ti by ear and notation.</div></div>
            <div><div className="font-semibold text-slate-600">Vocabulary</div><div className="text-slate-500">pulse, ta, ti-ti, beat</div></div>
          </div>
          <div className="mt-2 space-y-0.5">
            {["Warm-up — echo clap (5m)", "Rhythm — ta/ti-ti cards (8m)", "Solfa — so-mi-la (10m)", "Singing game — Bow Wow Wow (12m)", "Plenary — inner hearing (5m)"].map((l, i) => (
              <div key={i} className="text-[8px] flex justify-between border-b border-dashed border-slate-200 py-0.5">
                <span>{l}</span><span className="text-slate-400">✓</span>
              </div>
            ))}
          </div>
        </motion.div>
        <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.6 }}
          className="absolute right-8 bottom-8 inline-flex items-center gap-1.5 text-xs text-slate-700 bg-white rounded-md px-2.5 py-1.5 shadow ring-1 ring-slate-200">
          <FileDown className="w-3.5 h-3.5 text-teal-600" /> Export PDF
        </motion.div>
      </div>
    </MockChrome>
  );
}

function DashboardMockup() {
  const stats = [
    { l: "Classes", v: 4 }, { l: "Lessons", v: 12 }, { l: "Activities", v: 40 }, { l: "Resources", v: 8 },
  ];
  return (
    <MockChrome title="/dashboard">
      <div className="px-4 py-2 border-b flex items-center gap-2">
        <LayoutDashboard className="w-4 h-4 text-teal-600" />
        <span className="text-sm font-semibold">Dashboard</span>
        <span className="ml-auto text-[10px] text-slate-500">Welcome back, Demo Teacher</span>
      </div>
      <div className="p-3 space-y-2">
        <div className="grid grid-cols-4 gap-1.5">
          {stats.map((s, i) => (
            <motion.div key={s.l} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 + i * 0.08 }} className="rounded-md border bg-white p-2">
              <div className="text-lg font-bold text-teal-700 tabular-nums">{s.v}</div>
              <div className="text-[9px] text-slate-500">{s.l}</div>
            </motion.div>
          ))}
        </div>
        <div className="grid grid-cols-2 gap-2">
          <div className="rounded-md border bg-white p-2">
            <div className="text-[10px] font-semibold text-slate-500 mb-1">RECENT LESSONS</div>
            {["KS1 — ta and ti-ti", "EYFS — pulse & pitch", "Choir — round prep"].map((l, i) => (
              <div key={l} className="text-[10px] py-0.5 border-b border-slate-100 last:border-0 truncate">{l}</div>
            ))}
          </div>
          <div className="rounded-md border bg-white p-2">
            <div className="text-[10px] font-semibold text-slate-500 mb-1">UPCOMING</div>
            {["Mon · Reception circle", "Wed · Year 4 music", "Thu · Choir"].map((l) => (
              <div key={l} className="text-[10px] py-0.5 border-b border-slate-100 last:border-0 truncate">{l}</div>
            ))}
          </div>
        </div>
      </div>
    </MockChrome>
  );
}
