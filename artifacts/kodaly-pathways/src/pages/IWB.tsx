import { useEffect, useMemo, useRef, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import {
  Monitor, Play, Square, ChevronLeft, ChevronRight, Maximize2, Minimize2,
  Pause, RotateCcw, Music, Hand, Youtube, Clock, ListMusic, BookOpen, Volume2, Sparkles,
} from "lucide-react";
import { useListLessons, useGetLesson, type Lesson, type LessonComponent } from "@workspace/api-client-react";
import { RhythmGlyphSvg, RHYTHM_FLASHCARDS, type RhythmGlyph } from "@/components/MusicNotation";

/* ============================================================
 * IWB — Interactive Whiteboard / Classroom Mode
 * The teacher front-of-class surface. The Lesson Player is the
 * core of this page: pick any saved lesson, then walk through
 * its components on the projector with a per-step timer,
 * embedded videos, large notation, and quick-launch tools.
 * ============================================================ */
export default function IWBPage() {
  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-semibold flex items-center gap-2">
        <Monitor className="w-6 h-6 text-primary" /> IWB Classroom Mode
        <Badge variant="outline" className="ml-2">Project to your classroom display</Badge>
      </h1>
      <Tabs defaultValue="player">
        <TabsList className="flex-wrap h-auto">
          <TabsTrigger value="player"><ListMusic className="w-4 h-4 mr-1.5" /> Lesson Player</TabsTrigger>
          <TabsTrigger value="rhythm"><Music className="w-4 h-4 mr-1.5" /> Rhythm cards</TabsTrigger>
          <TabsTrigger value="solfa">Solfa & hand signs</TabsTrigger>
          <TabsTrigger value="grid">Beat grid</TabsTrigger>
          <TabsTrigger value="repertoire"><BookOpen className="w-4 h-4 mr-1.5" /> Repertoire</TabsTrigger>
        </TabsList>
        <TabsContent value="player" className="mt-4"><LessonPlayer /></TabsContent>
        <TabsContent value="rhythm" className="mt-4"><RhythmFlash /></TabsContent>
        <TabsContent value="solfa" className="mt-4"><SolfaAndHandSigns /></TabsContent>
        <TabsContent value="grid" className="mt-4"><BeatGrid /></TabsContent>
        <TabsContent value="repertoire" className="mt-4"><Repertoire /></TabsContent>
      </Tabs>
    </div>
  );
}

/* ----------------------------------------------------------
 * Lesson Player — pick a lesson, deliver it on the projector
 * ---------------------------------------------------------- */

function LessonPlayer() {
  const { data: lessons = [], isLoading } = useListLessons();
  const [lessonId, setLessonId] = useState<number | null>(null);
  const [presenting, setPresenting] = useState(false);

  // Default to the most recent lesson once they load
  useEffect(() => {
    if (lessonId == null && lessons.length > 0) {
      const sorted = [...lessons].sort((a, b) => (b.id ?? 0) - (a.id ?? 0));
      setLessonId(sorted[0].id!);
    }
  }, [lessons, lessonId]);

  if (isLoading) return <div className="p-6 text-sm text-muted-foreground">Loading lessons…</div>;
  if (lessons.length === 0) {
    return (
      <Card><CardContent className="p-8 text-center space-y-2">
        <Sparkles className="w-8 h-8 mx-auto text-primary" />
        <h3 className="text-lg font-semibold">No lessons yet</h3>
        <p className="text-sm text-muted-foreground">Build a lesson in the Lesson Builder to deliver it here on the classroom screen.</p>
      </CardContent></Card>
    );
  }

  return (
    <div className="space-y-4">
      <Card><CardContent className="p-4 flex flex-wrap items-center gap-3">
        <span className="text-sm font-medium">Lesson:</span>
        <Select value={lessonId ? String(lessonId) : ""} onValueChange={(v) => setLessonId(Number(v))}>
          <SelectTrigger className="w-[360px]" data-testid="select-iwb-lesson"><SelectValue /></SelectTrigger>
          <SelectContent>
            {lessons.map((l) => (
              <SelectItem key={l.id} value={String(l.id)}>
                {l.title} {l.yearGroup ? `· ${l.yearGroup}` : ""}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Button onClick={() => setPresenting(true)} disabled={!lessonId} className="ml-auto" data-testid="button-present">
          <Play className="w-4 h-4 mr-1.5" /> Present full-screen
        </Button>
      </CardContent></Card>
      {lessonId != null && <LessonOverview lessonId={lessonId} onStart={() => setPresenting(true)} />}
      {presenting && lessonId != null && (
        <PresentationOverlay lessonId={lessonId} onClose={() => setPresenting(false)} />
      )}
    </div>
  );
}

function LessonOverview({ lessonId, onStart }: { lessonId: number; onStart: () => void }) {
  const { data: lesson } = useGetLesson(lessonId);
  if (!lesson) return null;
  const total = (lesson.components ?? []).reduce((s: number, c: LessonComponent) => s + (c.durationMinutes || 0), 0);
  return (
    <Card><CardContent className="p-5 space-y-4">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h2 className="text-xl font-semibold">{lesson.title}</h2>
          <p className="text-sm text-muted-foreground mt-0.5">
            {[lesson.yearGroup, lesson.keyStage, lesson.term].filter(Boolean).join(" · ")} · {total || lesson.lengthMinutes} min
          </p>
        </div>
        <Button onClick={onStart}><Play className="w-4 h-4 mr-1.5" /> Start lesson</Button>
      </div>
      {(lesson.components ?? []).length === 0 ? (
        <p className="text-sm text-muted-foreground">This lesson has no components yet — open the Lesson Builder to add some.</p>
      ) : (
        <ol className="space-y-1.5">
          {lesson.components.map((c: LessonComponent, i: number) => (
            <li key={c.id} className="flex items-center gap-3 px-3 py-2 rounded-md border bg-card">
              <span className="text-xs font-mono text-muted-foreground tabular-nums">{String(i + 1).padStart(2, "0")}</span>
              <Badge variant="secondary" className="text-[10px]">{c.type}</Badge>
              <span className="text-sm flex-1 truncate">{c.title}</span>
              {extractYouTubeId(c.content) && <Youtube className="w-4 h-4 text-rose-500" />}
              <span className="text-xs text-muted-foreground inline-flex items-center gap-1 tabular-nums">
                <Clock className="w-3 h-3" /> {c.durationMinutes}m
              </span>
            </li>
          ))}
        </ol>
      )}
    </CardContent></Card>
  );
}

function PresentationOverlay({ lessonId, onClose }: { lessonId: number; onClose: () => void }) {
  const { data: lesson } = useGetLesson(lessonId);
  const components = lesson?.components ?? [];
  const [step, setStep] = useState(-1); // -1 = title slide, 0..n-1 = components, n = closing
  const [paused, setPaused] = useState(false);
  const [secondsLeft, setSecondsLeft] = useState(0);
  const containerRef = useRef<HTMLDivElement | null>(null);

  // Per-step countdown
  useEffect(() => {
    if (step < 0 || step >= components.length) return;
    const mins = components[step]?.durationMinutes || 5;
    setSecondsLeft(mins * 60);
    setPaused(false);
  }, [step, components]);

  useEffect(() => {
    if (paused || step < 0 || step >= components.length) return;
    const t = setInterval(() => setSecondsLeft((s) => Math.max(s - 1, 0)), 1000);
    return () => clearInterval(t);
  }, [paused, step, components.length]);

  // Try fullscreen on open
  useEffect(() => {
    const el = containerRef.current;
    if (el?.requestFullscreen && !document.fullscreenElement) {
      el.requestFullscreen().catch(() => {});
    }
    const onFs = () => { if (!document.fullscreenElement) onClose(); };
    document.addEventListener("fullscreenchange", onFs);
    return () => document.removeEventListener("fullscreenchange", onFs);
  }, [onClose]);

  // Keyboard nav
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
      if (e.key === "ArrowRight" || e.key === " ") { e.preventDefault(); setStep((s) => Math.min(s + 1, components.length)); }
      if (e.key === "ArrowLeft") setStep((s) => Math.max(s - 1, -1));
      if (e.key.toLowerCase() === "p") setPaused((p) => !p);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [components.length, onClose]);

  if (!lesson) return null;
  const totalSteps = components.length;

  return (
    <div ref={containerRef} className="fixed inset-0 z-50 bg-slate-950 text-white flex flex-col">
      {/* Top bar */}
      <div className="flex items-center justify-between px-6 py-3 border-b border-white/10">
        <div className="flex items-center gap-3 min-w-0">
          <span className="text-sm text-white/60 font-mono">{step < 0 ? "Intro" : step >= totalSteps ? "End" : `${step + 1} / ${totalSteps}`}</span>
          <span className="text-sm font-medium truncate">{lesson.title}</span>
        </div>
        <div className="flex items-center gap-2">
          {step >= 0 && step < totalSteps && (
            <>
              <button onClick={() => setPaused((p) => !p)} className="p-1.5 rounded hover:bg-white/10" aria-label="Pause/Play">
                {paused ? <Play className="w-5 h-5" /> : <Pause className="w-5 h-5" />}
              </button>
              <button onClick={() => setSecondsLeft((components[step]?.durationMinutes || 5) * 60)} className="p-1.5 rounded hover:bg-white/10" aria-label="Reset timer">
                <RotateCcw className="w-5 h-5" />
              </button>
              <span className="text-3xl font-bold tabular-nums text-emerald-300 px-2">{fmt(secondsLeft)}</span>
            </>
          )}
          <button onClick={() => { document.exitFullscreen?.().catch(() => {}); onClose(); }} className="p-1.5 rounded hover:bg-white/10" aria-label="Exit">
            <Minimize2 className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Slide */}
      <div className="flex-1 overflow-auto">
        {step < 0 && <PresIntro lesson={lesson} />}
        {step >= 0 && step < totalSteps && <PresComponent index={step} component={components[step]} />}
        {step >= totalSteps && <PresEnd lesson={lesson} onRestart={() => setStep(-1)} onClose={() => { document.exitFullscreen?.().catch(() => {}); onClose(); }} />}
      </div>

      {/* Bottom bar */}
      <div className="border-t border-white/10 px-6 py-3 flex items-center gap-2">
        <Button variant="ghost" onClick={() => setStep((s) => Math.max(s - 1, -1))} disabled={step <= -1} className="text-white hover:bg-white/10">
          <ChevronLeft className="w-5 h-5 mr-1" /> Prev
        </Button>
        <div className="flex-1 mx-3 flex gap-1 items-center">
          {Array.from({ length: totalSteps + 1 }).map((_, i) => (
            <button key={i} onClick={() => setStep(i - 1)}
              className={`h-1.5 flex-1 rounded transition-colors ${
                (i - 1) <= step ? "bg-emerald-400" : "bg-white/15 hover:bg-white/30"
              }`} aria-label={`Go to slide ${i}`} />
          ))}
        </div>
        <Button onClick={() => setStep((s) => Math.min(s + 1, totalSteps))} disabled={step >= totalSteps} className="bg-emerald-500 text-emerald-950 hover:bg-emerald-400">
          Next <ChevronRight className="w-5 h-5 ml-1" />
        </Button>
      </div>
    </div>
  );
}

function PresIntro({ lesson }: { lesson: Lesson }) {
  const total = (lesson.components ?? []).reduce((s: number, c: LessonComponent) => s + (c.durationMinutes || 0), 0);
  return (
    <div className="h-full min-h-[60vh] flex items-center justify-center px-12 py-16">
      <div className="text-center max-w-3xl">
        <div className="inline-flex items-center gap-2 text-xs uppercase tracking-widest text-emerald-300/80">
          <Music className="w-4 h-4" /> Today's lesson
        </div>
        <h1 className="text-5xl md:text-6xl font-bold mt-3 leading-tight">{lesson.title}</h1>
        <p className="text-xl text-white/70 mt-4">
          {[lesson.yearGroup, lesson.keyStage, lesson.term].filter(Boolean).join(" · ")}
        </p>
        {lesson.learningObjective && (
          <div className="mt-10 mx-auto max-w-2xl text-left bg-white/5 rounded-xl p-6 ring-1 ring-white/10">
            <div className="text-[11px] uppercase tracking-widest text-emerald-300/80 mb-2">Learning objective</div>
            <p className="text-lg leading-relaxed text-white/90">{lesson.learningObjective}</p>
          </div>
        )}
        {lesson.canStatements?.length > 0 && (
          <div className="mt-5 mx-auto max-w-2xl text-left">
            <div className="text-[11px] uppercase tracking-widest text-emerald-300/80 mb-2">By the end of the lesson, I can…</div>
            <ul className="space-y-1.5">
              {lesson.canStatements.slice(0, 4).map((s, i) => (
                <li key={i} className="flex gap-2 text-base text-white/85">
                  <span className="text-emerald-400">✓</span> {s}
                </li>
              ))}
            </ul>
          </div>
        )}
        <div className="mt-10 text-sm text-white/50">{total || lesson.lengthMinutes} minutes · {(lesson.components ?? []).length} parts · press → to begin</div>
      </div>
    </div>
  );
}

function PresEnd({ lesson, onRestart, onClose }: { lesson: Lesson; onRestart: () => void; onClose: () => void }) {
  return (
    <div className="h-full min-h-[60vh] flex items-center justify-center px-12 py-16">
      <div className="text-center max-w-2xl">
        <div className="inline-flex items-center gap-2 text-xs uppercase tracking-widest text-emerald-300/80">
          <Sparkles className="w-4 h-4" /> Plenary
        </div>
        <h1 className="text-5xl font-bold mt-3">Well done!</h1>
        {lesson.plenary && <p className="mt-6 text-xl text-white/85 leading-relaxed">{lesson.plenary}</p>}
        {lesson.assessment && (
          <div className="mt-8 mx-auto bg-white/5 rounded-xl p-6 ring-1 ring-white/10 text-left">
            <div className="text-[11px] uppercase tracking-widest text-emerald-300/80 mb-2">Today we assessed</div>
            <p className="text-base text-white/85">{lesson.assessment}</p>
          </div>
        )}
        <div className="mt-10 flex justify-center gap-3">
          <Button variant="outline" onClick={onRestart} className="bg-white/5 text-white border-white/30 hover:bg-white/10 hover:text-white">
            <RotateCcw className="w-4 h-4 mr-1.5" /> Restart
          </Button>
          <Button onClick={onClose} className="bg-emerald-500 text-emerald-950 hover:bg-emerald-400">Finish</Button>
        </div>
      </div>
    </div>
  );
}

function PresComponent({ index, component }: { index: number; component: LessonComponent }) {
  const ytId = extractYouTubeId(component.content);
  const cleanContent = component.content.replace(/Video:\s*https?:\/\/\S+/g, "").trim();
  const rhythmKind = inferRhythmGlyph(component);
  return (
    <div className="h-full grid md:grid-cols-[1fr,1.4fr] gap-8 px-10 py-10">
      <div className="flex flex-col">
        <div className="text-xs uppercase tracking-widest text-emerald-300/80">Part {index + 1} · {component.type}</div>
        <h2 className="text-4xl md:text-5xl font-bold mt-2 leading-tight">{component.title}</h2>
        <div className="mt-4 inline-flex items-center gap-1.5 text-sm text-white/60">
          <Clock className="w-4 h-4" /> {component.durationMinutes} minutes
        </div>
        {cleanContent && (
          <div className="mt-6 text-lg text-white/85 whitespace-pre-wrap leading-relaxed flex-1 overflow-auto">
            {cleanContent}
          </div>
        )}
        {component.notes && (
          <div className="mt-4 text-sm text-white/55 italic border-l-2 border-emerald-400/40 pl-3">
            Teacher note: {component.notes}
          </div>
        )}
      </div>
      <div className="flex items-center justify-center">
        {ytId ? (
          <div className="w-full aspect-video rounded-xl overflow-hidden ring-1 ring-white/10 shadow-2xl">
            <iframe className="w-full h-full" src={`https://www.youtube.com/embed/${ytId}?rel=0`} title={component.title}
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen />
          </div>
        ) : rhythmKind ? (
          <div className="text-emerald-200">
            <RhythmGlyphSvg kind={rhythmKind} className="w-[28rem] max-w-full h-auto" />
            <div className="mt-4 text-center text-2xl text-white/80">
              {RHYTHM_FLASHCARDS.find((r) => r.kind === rhythmKind)?.syllable}
            </div>
          </div>
        ) : (
          <ComponentDecor type={component.type} />
        )}
      </div>
    </div>
  );
}

function ComponentDecor({ type }: { type: string }) {
  const t = type.toLowerCase();
  if (t.includes("warm")) return <DecorBlock label="Warm-up" tint="from-amber-500/30 to-amber-300/10" icon={<Volume2 className="w-16 h-16" />} />;
  if (t.includes("solfa")) return <DecorBlock label="Solfa" tint="from-teal-500/30 to-emerald-300/10" icon={<Hand className="w-16 h-16" />} />;
  if (t.includes("plenary") || t.includes("reflection")) return <DecorBlock label="Plenary" tint="from-emerald-500/30 to-teal-300/10" icon={<Sparkles className="w-16 h-16" />} />;
  if (t.includes("singing") || t.includes("song") || t.includes("game")) return <DecorBlock label="Singing" tint="from-violet-500/30 to-fuchsia-300/10" icon={<Music className="w-16 h-16" />} />;
  return <DecorBlock label={type} tint="from-slate-500/30 to-slate-300/10" icon={<Music className="w-16 h-16" />} />;
}

function DecorBlock({ label, tint, icon }: { label: string; tint: string; icon: React.ReactNode }) {
  return (
    <div className={`w-full aspect-video rounded-2xl ring-1 ring-white/10 bg-gradient-to-br ${tint} flex flex-col items-center justify-center`}>
      <div className="text-emerald-200/90">{icon}</div>
      <div className="mt-4 text-2xl text-white/85 font-semibold">{label}</div>
    </div>
  );
}

/* ----------------------------------------------------------
 * Rhythm flashcards — proper SVG notation
 * ---------------------------------------------------------- */
function RhythmFlash() {
  const [i, setI] = useState(0);
  const card = RHYTHM_FLASHCARDS[i];
  const ctxRef = useRef<AudioContext | null>(null);

  function clap() {
    const ctx = ctxRef.current ??= new (window.AudioContext || (window as any).webkitAudioContext)();
    const pattern = patternForCard(card.kind);
    const start = ctx.currentTime + 0.05;
    pattern.forEach(({ at, type }) => {
      if (type === "rest") return;
      const o = ctx.createOscillator();
      const g = ctx.createGain();
      o.type = "triangle";
      o.frequency.value = 800;
      o.connect(g); g.connect(ctx.destination);
      g.gain.setValueAtTime(0.0001, start + at);
      g.gain.exponentialRampToValueAtTime(0.4, start + at + 0.005);
      g.gain.exponentialRampToValueAtTime(0.001, start + at + 0.18);
      o.start(start + at); o.stop(start + at + 0.2);
    });
  }

  return (
    <Card><CardContent className="p-8 flex flex-col items-center gap-6">
      <div className="text-emerald-700 dark:text-emerald-300">
        <RhythmGlyphSvg kind={card.kind} className="w-72 md:w-96 h-auto" />
      </div>
      <div className="text-center">
        <div className="text-3xl font-semibold">{card.syllable}</div>
        <div className="text-sm text-muted-foreground mt-1">{card.name} · {card.beats}</div>
      </div>
      <p className="text-sm text-center max-w-md text-muted-foreground italic">{card.teach}</p>
      <div className="flex gap-2">
        <Button variant="outline" onClick={() => setI((i - 1 + RHYTHM_FLASHCARDS.length) % RHYTHM_FLASHCARDS.length)} data-testid="button-rhythm-prev">
          <ChevronLeft className="w-4 h-4 mr-1" /> Prev
        </Button>
        <Button variant="secondary" onClick={clap}><Volume2 className="w-4 h-4 mr-1" /> Hear it</Button>
        <Button onClick={() => setI((i + 1) % RHYTHM_FLASHCARDS.length)} data-testid="button-rhythm-next">
          Next <ChevronRight className="w-4 h-4 ml-1" />
        </Button>
      </div>
      <div className="text-xs text-muted-foreground">{i + 1} / {RHYTHM_FLASHCARDS.length}</div>
    </CardContent></Card>
  );
}

function patternForCard(kind: RhythmGlyph): Array<{ at: number; type: "hit" | "rest" }> {
  const beat = 0.5;
  switch (kind) {
    case "quarter": return [{ at: 0, type: "hit" }];
    case "eighth-pair": return [{ at: 0, type: "hit" }, { at: beat / 2, type: "hit" }];
    case "sixteenth-quad": return [0, 1, 2, 3].map((i) => ({ at: (i * beat) / 4, type: "hit" }));
    case "dotted-quarter": return [{ at: 0, type: "hit" }];
    case "syncopa": return [{ at: 0, type: "hit" }, { at: beat / 2, type: "hit" }, { at: beat * 1.5, type: "hit" }];
    case "quarter-rest": return [{ at: 0, type: "rest" }];
    case "half-rest": return [{ at: 0, type: "rest" }];
    case "whole-rest": return [{ at: 0, type: "rest" }];
    case "eighth-rest": return [{ at: 0, type: "rest" }];
    case "sixteenth-rest": return [{ at: 0, type: "rest" }];
  }
}

/* ----------------------------------------------------------
 * Solfa & hand signs
 * ---------------------------------------------------------- */

const SOLFA = ["do", "re", "mi", "fa", "so", "la", "ti", "do'"];
const SOLFA_FREQ: Record<string, number> = { "do": 261.63, "re": 293.66, "mi": 329.63, "fa": 349.23, "so": 392.00, "la": 440.00, "ti": 493.88, "do'": 523.25 };
const HAND_SIGN_DESCRIPTION: Record<string, string> = {
  "do": "Closed fist, palm down — strong and grounded.",
  "re": "Flat hand, fingers angled upward — pointing forward.",
  "mi": "Flat hand, palm down, parallel to floor.",
  "fa": "Thumb pointing down — leaning toward mi.",
  "so": "Flat hand, palm facing the body — open and stable.",
  "la": "Drooping hand, fingers down — soft and gentle.",
  "ti": "Index finger pointing up — leaning toward do.",
  "do'": "Closed fist raised high — return home, octave above.",
};

function SolfaAndHandSigns() {
  const [i, setI] = useState(0);
  const note = SOLFA[i];
  function play() {
    const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
    const o = ctx.createOscillator();
    const g = ctx.createGain();
    o.type = "sine";
    o.frequency.value = SOLFA_FREQ[note];
    o.connect(g); g.connect(ctx.destination);
    g.gain.setValueAtTime(0.0001, ctx.currentTime);
    g.gain.exponentialRampToValueAtTime(0.35, ctx.currentTime + 0.02);
    g.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.9);
    o.start(); o.stop(ctx.currentTime + 0.95);
  }
  return (
    <div className="grid md:grid-cols-2 gap-4">
      <Card><CardContent className="p-8 flex flex-col items-center gap-6">
        <div className="text-[10rem] leading-none font-bold text-primary">{note}</div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => setI((i - 1 + SOLFA.length) % SOLFA.length)}>
            <ChevronLeft className="w-4 h-4 mr-1" /> Prev
          </Button>
          <Button onClick={play}><Volume2 className="w-4 h-4 mr-1" /> Play</Button>
          <Button variant="outline" onClick={() => setI((i + 1) % SOLFA.length)}>
            Next <ChevronRight className="w-4 h-4 ml-1" />
          </Button>
        </div>
        <div className="text-xs text-muted-foreground">{i + 1} / {SOLFA.length} · pitch in C major</div>
      </CardContent></Card>
      <Card><CardContent className="p-6 space-y-3">
        <h3 className="font-semibold flex items-center gap-2"><Hand className="w-5 h-5 text-primary" /> Curwen hand signs</h3>
        <p className="text-sm text-muted-foreground">Tap a syllable to highlight its sign description.</p>
        <ul className="space-y-1.5">
          {SOLFA.map((s, idx) => (
            <li key={s}>
              <button onClick={() => setI(idx)}
                className={`w-full flex items-start gap-3 px-3 py-2 rounded-md border text-left transition-colors ${
                  idx === i ? "bg-primary/10 border-primary/40" : "bg-card hover:bg-accent"
                }`}>
                <span className="font-semibold w-12 text-primary">{s}</span>
                <span className="text-sm text-muted-foreground">{HAND_SIGN_DESCRIPTION[s]}</span>
              </button>
            </li>
          ))}
        </ul>
      </CardContent></Card>
    </div>
  );
}

/* ----------------------------------------------------------
 * Beat grid
 * ---------------------------------------------------------- */
function BeatGrid() {
  const [grid, setGrid] = useState<boolean[]>(() => Array(16).fill(false));
  const [playing, setPlaying] = useState(false);
  const [step, setStep] = useState(0);
  const [tempo, setTempo] = useState(110);
  const ctxRef = useRef<AudioContext | null>(null);
  const interval = useRef<number | null>(null);

  useEffect(() => {
    if (!playing) {
      if (interval.current) { clearInterval(interval.current); interval.current = null; }
      setStep(0);
      return;
    }
    if (!ctxRef.current) ctxRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
    const tickInterval = (60_000 / tempo) / 2; // 16th notes
    interval.current = window.setInterval(() => {
      setStep((s) => {
        const next = (s + 1) % 16;
        if (grid[next]) {
          const ctx = ctxRef.current!;
          const o = ctx.createOscillator();
          const g = ctx.createGain();
          o.frequency.value = next % 4 === 0 ? 880 : 660;
          o.connect(g); g.connect(ctx.destination);
          g.gain.setValueAtTime(0.25, ctx.currentTime);
          g.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.15);
          o.start(); o.stop(ctx.currentTime + 0.15);
        }
        return next;
      });
    }, tickInterval);
    return () => { if (interval.current) clearInterval(interval.current); };
  }, [playing, grid, tempo]);

  return (
    <Card><CardContent className="p-6 space-y-4">
      <div className="flex flex-wrap justify-center items-center gap-3">
        <Button onClick={() => setPlaying(!playing)} size="lg" data-testid="button-play">
          {playing ? <><Square className="w-5 h-5 mr-1" /> Stop</> : <><Play className="w-5 h-5 mr-1" /> Play</>}
        </Button>
        <Button variant="outline" onClick={() => setGrid(Array(16).fill(false))}>Clear</Button>
        <label className="text-sm flex items-center gap-2">
          Tempo
          <input type="range" min={60} max={180} value={tempo} onChange={(e) => setTempo(Number(e.target.value))} />
          <span className="text-xs tabular-nums w-10">{tempo}</span>
        </label>
      </div>
      <div className="grid gap-2 max-w-3xl mx-auto" style={{ gridTemplateColumns: "repeat(16, minmax(0,1fr))" }}>
        {grid.map((on, i) => (
          <button
            key={i}
            onClick={() => setGrid(grid.map((v, j) => j === i ? !v : v))}
            className={`aspect-square rounded-md border-2 transition-colors ${on ? "bg-primary border-primary" : "bg-card border-border"} ${playing && step === i ? "ring-4 ring-accent" : ""} ${i % 4 === 0 ? "border-primary/50" : ""}`}
            data-testid={`beat-${i}`}
          />
        ))}
      </div>
      <p className="text-center text-xs text-muted-foreground">Tap cells to add a 'ta'. Empty cells = rests. Beats 1, 5, 9, 13 are downbeats (higher pitch).</p>
    </CardContent></Card>
  );
}

/* ----------------------------------------------------------
 * Repertoire — quick song bank for at-the-board lookups
 * ---------------------------------------------------------- */
const REPERTOIRE = [
  { ks: "EYFS", title: "Bee Bee Bumblebee", solfa: "so-mi", focus: "pulse, so-mi" },
  { ks: "EYFS", title: "Bow Wow Wow", solfa: "so-mi-la", focus: "pulse, so-mi-la" },
  { ks: "EYFS", title: "Ring Around the Rosy", solfa: "so-mi", focus: "circle game, pulse" },
  { ks: "KS1", title: "Apple Tree", solfa: "so-mi-la", focus: "hand signs, ta/ti-ti" },
  { ks: "KS1", title: "Lucy Locket", solfa: "so-mi-la", focus: "so-mi-la, beat" },
  { ks: "KS1", title: "Bounce High Bounce Low", solfa: "so-mi-la", focus: "ti-ti, pitch matching" },
  { ks: "KS2", title: "Frog in the Meadow", solfa: "do-re-mi-so-la", focus: "pentatonic" },
  { ks: "KS2", title: "Old Brass Wagon", solfa: "do-re-mi-so-la", focus: "circle / partner work" },
  { ks: "KS2", title: "Cumberland Gap", solfa: "do-re-mi-so-la", focus: "syncopa, pentatonic" },
  { ks: "KS2", title: "Frère Jacques", solfa: "do-re-mi-fa-so", focus: "two-part round" },
  { ks: "KS3", title: "Scarborough Fair", solfa: "Dorian mode", focus: "modal melody, phrasing" },
  { ks: "KS3", title: "Drunken Sailor", solfa: "Dorian mode", focus: "compound time, two-part" },
];

function Repertoire() {
  const [filter, setFilter] = useState<string>("all");
  const filtered = useMemo(() => filter === "all" ? REPERTOIRE : REPERTOIRE.filter((r) => r.ks === filter), [filter]);
  return (
    <Card><CardContent className="p-5 space-y-4">
      <div className="flex flex-wrap items-center gap-2">
        <h3 className="font-semibold flex items-center gap-2"><BookOpen className="w-5 h-5 text-primary" /> Song repertoire</h3>
        <div className="ml-auto flex gap-1.5">
          {["all", "EYFS", "KS1", "KS2", "KS3"].map((k) => (
            <button key={k} onClick={() => setFilter(k)}
              className={`text-xs px-2.5 py-1 rounded-full border ${filter === k ? "bg-primary text-primary-foreground border-primary" : "bg-card hover:bg-accent"}`}>
              {k === "all" ? "All" : k}
            </button>
          ))}
        </div>
      </div>
      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-2">
        {filtered.map((s) => (
          <div key={s.title} className="p-3 rounded-md border bg-card">
            <div className="flex items-center gap-2">
              <Badge variant="secondary" className="text-[10px]">{s.ks}</Badge>
              <span className="font-medium text-sm truncate">{s.title}</span>
            </div>
            <div className="text-xs text-muted-foreground mt-1">{s.solfa}</div>
            <div className="text-xs text-muted-foreground italic">{s.focus}</div>
          </div>
        ))}
      </div>
    </CardContent></Card>
  );
}

/* ----------------------------------------------------------
 * Helpers
 * ---------------------------------------------------------- */
function fmt(s: number): string {
  const m = Math.floor(s / 60);
  const r = s % 60;
  return `${m}:${String(r).padStart(2, "0")}`;
}

function extractYouTubeId(text: string | undefined): string | null {
  if (!text) return null;
  const m = text.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([\w-]{11})/);
  return m?.[1] ?? null;
}

function inferRhythmGlyph(c: LessonComponent): RhythmGlyph | null {
  const text = `${c.title} ${c.content}`.toLowerCase();
  if (/\btika[- ]?tika\b/.test(text)) return "sixteenth-quad";
  if (/\bsyncopa\b/.test(text)) return "syncopa";
  if (/\bdotted\b/.test(text)) return "dotted-quarter";
  if (/\bquarter rest\b|\bcrotchet rest\b/.test(text)) return "quarter-rest";
  if (/\bhalf rest\b|\bminim rest\b/.test(text)) return "half-rest";
  if (/\bwhole rest\b|\bsemibreve rest\b/.test(text)) return "whole-rest";
  if (/\bti[- ]ti\b|\beighths?\b/.test(text)) return "eighth-pair";
  if (/\bta\b|\bcrotchet\b|\bquarter note\b/.test(text)) return "quarter";
  return null;
}
