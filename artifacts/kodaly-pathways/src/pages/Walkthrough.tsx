import { useState } from "react";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { VideoExplainer } from "@/components/VideoExplainer";
import {
  Music, ArrowLeft, ArrowRight, LayoutDashboard, GraduationCap, Map, Library,
  Hammer, CalendarDays, FolderOpen, Presentation, Youtube, ShieldCheck, Sparkles, PlayCircle,
} from "lucide-react";

const FEATURES = [
  {
    icon: LayoutDashboard,
    title: "Dashboard",
    blurb: "Your week at a glance — upcoming lessons, recent classes and quick links to everything you need to teach today.",
    tag: "Start here",
  },
  {
    icon: GraduationCap,
    title: "Classes",
    blurb: "Manage every class you teach: year group, key stage, school and notes — all in one place.",
    tag: "Roster",
  },
  {
    icon: Map,
    title: "Kodály Pathway",
    blurb: "A built-in EYFS → KS4 progression for rhythm, solfa, hand signs, part work and more. Customise the sequence to match your scheme of work.",
    tag: "Curriculum",
  },
  {
    icon: Library,
    title: "Activities Library",
    blurb: "40+ ready-made Kodály activities — including 28 traditional singing games linked to Mr. Meehl's Music YouTube tutorials. Filter by key stage, type and term.",
    tag: "With videos",
    highlight: true,
  },
  {
    icon: Hammer,
    title: "Lesson Builder",
    blurb: "Drag-and-drop lesson components, reorder by pulse of the lesson, set durations, and pull straight from your activities library.",
    tag: "Plan fast",
  },
  {
    icon: CalendarDays,
    title: "Calendar",
    blurb: "Schedule lessons against your classes and see the term laid out at a glance.",
    tag: "Timetable",
  },
  {
    icon: FolderOpen,
    title: "Resources",
    blurb: "Upload songsheets, scores and audio. Import from a URL — safely sandboxed against unsafe redirects.",
    tag: "Files",
  },
  {
    icon: Presentation,
    title: "Interactive Whiteboard",
    blurb: "Project songs, rhythms and slides directly in lessons — built for the classroom screen.",
    tag: "Teach mode",
  },
  {
    icon: Youtube,
    title: "Video-linked Activities",
    blurb: "Singing games carry their YouTube tutorial through to your lesson plan, so you (or a cover teacher) always have the song to hand.",
    tag: "New",
    highlight: true,
  },
];

const STEPS = [
  { n: 1, title: "Add a class", body: "Tell the app who you teach — year group and key stage drives the right activities to surface." },
  { n: 2, title: "Pick a pathway step", body: "Open the Kodály Pathway and choose the next step in your sequence — rhythm, solfa, part work…" },
  { n: 3, title: "Build a lesson", body: "Drag activities from the library onto your lesson. Add durations, notes, and freeform components as needed." },
  { n: 4, title: "Teach with the IWB", body: "Open the lesson on your classroom screen. Linked YouTube videos play in a single click." },
];

export default function WalkthroughPage() {
  const [explainerOpen, setExplainerOpen] = useState(false);
  return (
    <div className="min-h-screen bg-background">
      {/* Top bar */}
      <header className="border-b bg-white/70 dark:bg-background/70 backdrop-blur sticky top-0 z-10">
        <div className="max-w-6xl mx-auto px-6 py-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-md bg-primary text-primary-foreground flex items-center justify-center">
              <Music className="w-4 h-4" />
            </div>
            <span className="font-semibold">
              Kodály<span className="italic text-primary"> Pathways</span>
            </span>
          </div>
          <Link href="/login">
            <Button variant="ghost" size="sm" data-testid="link-back-login">
              <ArrowLeft className="w-4 h-4 mr-1" /> Back to sign in
            </Button>
          </Link>
        </div>
      </header>

      {/* Hero */}
      <section className="relative overflow-hidden text-white"
        style={{
          background:
            "radial-gradient(circle at 20% 20%, hsl(174 50% 30%) 0%, transparent 50%), radial-gradient(circle at 80% 80%, hsl(160 45% 22%) 0%, transparent 55%), linear-gradient(135deg, hsl(180 35% 18%) 0%, hsl(170 40% 14%) 100%)",
        }}>
        <div className="absolute inset-0 opacity-[0.08]" style={{
          backgroundImage: "radial-gradient(white 1px, transparent 1px)",
          backgroundSize: "24px 24px",
        }} />
        <div className="relative max-w-6xl mx-auto px-6 py-16 md:py-20">
          <Badge variant="secondary" className="bg-white/15 text-white border-0 mb-4">
            <Sparkles className="w-3.5 h-3.5 mr-1" /> Feature walkthrough
          </Badge>
          <h1 className="text-4xl md:text-5xl font-bold tracking-tight max-w-3xl">
            Plan, sequence and teach the <span className="italic bg-gradient-to-r from-emerald-200 to-teal-100 bg-clip-text text-transparent">Kodály way</span>.
          </h1>
          <p className="mt-4 max-w-2xl text-white/80 text-lg">
            A complete planner for UK music teachers — EYFS through KS4. Built around the Kodály method, with a ready-made activity library and YouTube-linked singing games.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Link href="/login">
              <Button size="lg" className="bg-white text-slate-900 hover:bg-white/90 border-0" data-testid="button-cta-signin">
                Sign in to get started <ArrowRight className="w-4 h-4 ml-1" />
              </Button>
            </Link>
            <Button
              size="lg"
              variant="outline"
              onClick={() => setExplainerOpen(true)}
              className="bg-white/10 text-white border-white/30 hover:bg-white/20 hover:text-white"
              data-testid="button-video-explainer"
            >
              <PlayCircle className="w-4 h-4 mr-2" /> Video explainer
            </Button>
          </div>
        </div>
      </section>

      {/* Features grid */}
      <section id="features" className="max-w-6xl mx-auto px-6 py-14">
        <h2 className="text-2xl md:text-3xl font-bold tracking-tight">Everything you get</h2>
        <p className="text-muted-foreground mt-2">Nine integrated tools, designed to work together for a working music classroom.</p>
        <div className="mt-8 grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {FEATURES.map((f) => (
            <Card key={f.title} className={f.highlight ? "border-primary/40 bg-primary/[0.03]" : ""} data-testid={`card-feature-${f.title.toLowerCase().replace(/\s+/g, "-")}`}>
              <CardContent className="p-5 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="w-10 h-10 rounded-md bg-primary/10 text-primary flex items-center justify-center">
                    <f.icon className="w-5 h-5" />
                  </div>
                  <Badge variant={f.highlight ? "default" : "secondary"}>{f.tag}</Badge>
                </div>
                <h3 className="font-semibold text-lg">{f.title}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">{f.blurb}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      {/* Steps */}
      <section className="bg-muted/40 border-y">
        <div className="max-w-6xl mx-auto px-6 py-14">
          <h2 className="text-2xl md:text-3xl font-bold tracking-tight">How it works</h2>
          <p className="text-muted-foreground mt-2">From empty calendar to lesson on the board in four steps.</p>
          <div className="mt-8 grid md:grid-cols-2 lg:grid-cols-4 gap-4">
            {STEPS.map((s) => (
              <Card key={s.n}>
                <CardContent className="p-5">
                  <div className="w-9 h-9 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-semibold mb-3">
                    {s.n}
                  </div>
                  <h3 className="font-semibold">{s.title}</h3>
                  <p className="text-sm text-muted-foreground mt-1.5 leading-relaxed">{s.body}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="max-w-3xl mx-auto px-6 py-16 text-center">
        <h2 className="text-3xl font-bold tracking-tight">Ready to plan your next lesson?</h2>
        <p className="text-muted-foreground mt-3">No password to remember — your account is created on first sign in.</p>
        <div className="mt-6 flex flex-wrap justify-center gap-3">
          <Link href="/login">
            <Button
              size="lg"
              className="text-white border-0"
              style={{ background: "linear-gradient(90deg, hsl(174 55% 35%), hsl(160 50% 40%))" }}
              data-testid="button-cta-final"
            >
              Sign in <ArrowRight className="w-4 h-4 ml-1" />
            </Button>
          </Link>
        </div>
        <p className="mt-6 text-xs text-muted-foreground inline-flex items-center gap-1.5">
          <ShieldCheck className="w-3.5 h-3.5 text-primary" /> Secure cookie session, GDPR-friendly · all PII encrypted at rest
        </p>
      </section>

      <VideoExplainer open={explainerOpen} onClose={() => setExplainerOpen(false)} />
    </div>
  );
}
