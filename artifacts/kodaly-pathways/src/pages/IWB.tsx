import { useEffect, useRef, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Monitor, Play, Square } from "lucide-react";

const RHYTHM_CARDS = [
  { name: "ta", visual: "♩" },
  { name: "ti-ti", visual: "♫" },
  { name: "rest", visual: "𝄽" },
  { name: "tika-tika", visual: "♬♬" },
  { name: "syncopa", visual: "♪♩♪" },
  { name: "dotted ta", visual: "♩." },
];
const SOLFA = ["do", "re", "mi", "fa", "so", "la", "ti", "do'"];
const SOLFA_FREQ: Record<string, number> = { "do": 261.63, "re": 293.66, "mi": 329.63, "fa": 349.23, "so": 392.00, "la": 440.00, "ti": 493.88, "do'": 523.25 };

export default function IWBPage() {
  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-semibold flex items-center gap-2"><Monitor className="w-6 h-6 text-primary" /> IWB Classroom Mode</h1>
      <Tabs defaultValue="rhythm">
        <TabsList>
          <TabsTrigger value="rhythm">Rhythm flashcards</TabsTrigger>
          <TabsTrigger value="solfa">Solfa flashcards</TabsTrigger>
          <TabsTrigger value="grid">Beat grid</TabsTrigger>
        </TabsList>
        <TabsContent value="rhythm" className="mt-4"><RhythmFlash /></TabsContent>
        <TabsContent value="solfa" className="mt-4"><SolfaFlash /></TabsContent>
        <TabsContent value="grid" className="mt-4"><BeatGrid /></TabsContent>
      </Tabs>
    </div>
  );
}

function RhythmFlash() {
  const [i, setI] = useState(0);
  const card = RHYTHM_CARDS[i];
  return (
    <Card><CardContent className="p-8 flex flex-col items-center gap-6">
      <div className="text-[12rem] leading-none font-serif">{card.visual}</div>
      <div className="text-3xl">{card.name}</div>
      <div className="flex gap-2">
        <Button variant="outline" onClick={() => setI((i - 1 + RHYTHM_CARDS.length) % RHYTHM_CARDS.length)}>Prev</Button>
        <Button onClick={() => setI((i + 1) % RHYTHM_CARDS.length)}>Next</Button>
      </div>
    </CardContent></Card>
  );
}

function SolfaFlash() {
  const [i, setI] = useState(0);
  const note = SOLFA[i];
  function play() {
    const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
    const o = ctx.createOscillator();
    const g = ctx.createGain();
    o.frequency.value = SOLFA_FREQ[note];
    o.connect(g); g.connect(ctx.destination);
    g.gain.setValueAtTime(0.3, ctx.currentTime);
    g.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.7);
    o.start(); o.stop(ctx.currentTime + 0.7);
  }
  return (
    <Card><CardContent className="p-8 flex flex-col items-center gap-6">
      <div className="text-[12rem] leading-none font-bold text-primary">{note}</div>
      <div className="flex gap-2">
        <Button variant="outline" onClick={() => setI((i - 1 + SOLFA.length) % SOLFA.length)}>Prev</Button>
        <Button onClick={play}><Play className="w-4 h-4 mr-1" /> Play</Button>
        <Button onClick={() => setI((i + 1) % SOLFA.length)}>Next</Button>
      </div>
    </CardContent></Card>
  );
}

function BeatGrid() {
  const [grid, setGrid] = useState<boolean[]>(() => Array(16).fill(false));
  const [playing, setPlaying] = useState(false);
  const [step, setStep] = useState(0);
  const ctxRef = useRef<AudioContext | null>(null);
  const interval = useRef<number | null>(null);

  useEffect(() => {
    if (!playing) {
      if (interval.current) { clearInterval(interval.current); interval.current = null; }
      setStep(0);
      return;
    }
    if (!ctxRef.current) ctxRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
    const tickInterval = 350;
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
  }, [playing, grid]);

  return (
    <Card><CardContent className="p-6 space-y-4">
      <div className="flex justify-center gap-2">
        <Button onClick={() => setPlaying(!playing)} size="lg" data-testid="button-play">
          {playing ? <><Square className="w-5 h-5 mr-1" /> Stop</> : <><Play className="w-5 h-5 mr-1" /> Play</>}
        </Button>
        <Button variant="outline" onClick={() => setGrid(Array(16).fill(false))}>Clear</Button>
      </div>
      <div className="grid grid-cols-16 gap-2 max-w-3xl mx-auto" style={{ gridTemplateColumns: "repeat(16, minmax(0,1fr))" }}>
        {grid.map((on, i) => (
          <button
            key={i}
            onClick={() => setGrid(grid.map((v, j) => j === i ? !v : v))}
            className={`aspect-square rounded-md border-2 transition-colors ${on ? "bg-primary border-primary" : "bg-card border-border"} ${playing && step === i ? "ring-4 ring-accent" : ""}`}
            data-testid={`beat-${i}`}
          />
        ))}
      </div>
      <p className="text-center text-xs text-muted-foreground">Tap cells to add a 'ta'. Empty = rest. Beats 1, 5, 9, 13 are downbeats (higher pitch).</p>
    </CardContent></Card>
  );
}
