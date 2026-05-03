/**
 * SVG-based music notation primitives.
 *
 * Reliable across all browsers/fonts (Unicode SMuFL glyphs like 𝄽 only render
 * correctly when Bravura or a similar music font is installed). All shapes are
 * drawn explicitly so rests, stems, beams and flags are always correct.
 *
 * All glyphs render in a 100×120 viewBox; the staff baseline is y=70.
 */

type GlyphProps = { className?: string };

const STROKE = "currentColor";

function Frame({ children, vbW = 100, vbH = 120, className }: { children: React.ReactNode; vbW?: number; vbH?: number; className?: string }) {
  return (
    <svg viewBox={`0 0 ${vbW} ${vbH}`} className={className} fill={STROKE} stroke={STROKE} xmlns="http://www.w3.org/2000/svg">
      {children}
    </svg>
  );
}

/* ---------------- Notes ---------------- */

// Quarter note (crotchet) = "ta"
export function QuarterNote({ className }: GlyphProps) {
  return (
    <Frame className={className}>
      <ellipse cx="38" cy="78" rx="14" ry="10" transform="rotate(-22 38 78)" />
      <line x1="51" y1="74" x2="51" y2="14" strokeWidth="3" />
    </Frame>
  );
}

// Two beamed eighth notes = "ti-ti"
export function EighthPair({ className }: GlyphProps) {
  return (
    <Frame className={className} vbW={140}>
      <ellipse cx="28" cy="82" rx="13" ry="9" transform="rotate(-22 28 82)" />
      <line x1="40" y1="78" x2="40" y2="20" strokeWidth="3" />
      <ellipse cx="92" cy="82" rx="13" ry="9" transform="rotate(-22 92 82)" />
      <line x1="104" y1="78" x2="104" y2="20" strokeWidth="3" />
      {/* Beam */}
      <rect x="40" y="14" width="64" height="9" />
    </Frame>
  );
}

// Four beamed sixteenth notes = "tika-tika"
export function SixteenthQuad({ className }: GlyphProps) {
  return (
    <Frame className={className} vbW={200}>
      {[20, 70, 120, 170].map((cx, i) => (
        <g key={i}>
          <ellipse cx={cx} cy="82" rx="11" ry="8" transform={`rotate(-22 ${cx} 82)`} />
          <line x1={cx + 10} y1="78" x2={cx + 10} y2="20" strokeWidth="3" />
        </g>
      ))}
      {/* Two beams */}
      <rect x="30" y="14" width="150" height="7" />
      <rect x="30" y="26" width="150" height="7" />
    </Frame>
  );
}

// Dotted quarter note = "ta-a" / dotted ta
export function DottedQuarter({ className }: GlyphProps) {
  return (
    <Frame className={className} vbW={120}>
      <ellipse cx="38" cy="78" rx="14" ry="10" transform="rotate(-22 38 78)" />
      <line x1="51" y1="74" x2="51" y2="14" strokeWidth="3" />
      <circle cx="64" cy="76" r="4" />
    </Frame>
  );
}

// Syncopated pattern: eighth + quarter + eighth (ti-ta-ti / "syn-co-pa")
export function Syncopa({ className }: GlyphProps) {
  return (
    <Frame className={className} vbW={220}>
      {/* eighth (with flag) */}
      <ellipse cx="20" cy="82" rx="11" ry="8" transform="rotate(-22 20 82)" />
      <line x1="30" y1="78" x2="30" y2="20" strokeWidth="3" />
      <path d="M30 20 C 50 28, 50 48, 38 56 L 30 50 Z" />
      {/* quarter */}
      <ellipse cx="100" cy="82" rx="13" ry="9" transform="rotate(-22 100 82)" />
      <line x1="112" y1="78" x2="112" y2="20" strokeWidth="3" />
      {/* eighth (with flag) */}
      <ellipse cx="180" cy="82" rx="11" ry="8" transform="rotate(-22 180 82)" />
      <line x1="190" y1="78" x2="190" y2="20" strokeWidth="3" />
      <path d="M190 20 C 210 28, 210 48, 198 56 L 190 50 Z" />
    </Frame>
  );
}

/* ---------------- Rests ---------------- */

/**
 * Whole rest — a small filled rectangle hanging from the 4th line.
 * Rests are the most commonly mis-drawn music symbols, so each is built
 * explicitly here rather than relying on font glyphs.
 */
export function WholeRest({ className }: GlyphProps) {
  return (
    <Frame className={className}>
      {/* the 4th staff line for context */}
      <line x1="20" y1="58" x2="80" y2="58" strokeWidth="1" opacity="0.25" />
      <rect x="34" y="58" width="32" height="14" />
    </Frame>
  );
}

/** Half rest — small filled rectangle sitting on the middle staff line. */
export function HalfRest({ className }: GlyphProps) {
  return (
    <Frame className={className}>
      <line x1="20" y1="68" x2="80" y2="68" strokeWidth="1" opacity="0.25" />
      <rect x="34" y="54" width="32" height="14" />
    </Frame>
  );
}

/**
 * Quarter rest (crotchet rest, "z" / "sh") — the iconic squiggle.
 * Drawn as: top diagonal → middle zigzag → bottom open hook.
 */
export function QuarterRest({ className }: GlyphProps) {
  return (
    <Frame className={className}>
      <path
        d="M40 22 L 64 44 L 40 64 L 64 86 Q 50 80, 42 92 Q 56 92, 64 102"
        fill="none"
        strokeWidth="6"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Frame>
  );
}

/** Eighth rest — single hook with one dot, on a slanted staff. */
export function EighthRest({ className }: GlyphProps) {
  return (
    <Frame className={className}>
      <line x1="36" y1="98" x2="62" y2="38" strokeWidth="4" strokeLinecap="round" />
      <circle cx="34" cy="50" r="6" />
    </Frame>
  );
}

/** Sixteenth rest — two hooks. */
export function SixteenthRest({ className }: GlyphProps) {
  return (
    <Frame className={className}>
      <line x1="34" y1="104" x2="62" y2="22" strokeWidth="4" strokeLinecap="round" />
      <circle cx="32" cy="60" r="6" />
      <circle cx="40" cy="36" r="6" />
    </Frame>
  );
}

/* ---------------- Lookup ---------------- */

export type RhythmGlyph =
  | "quarter" | "eighth-pair" | "sixteenth-quad" | "dotted-quarter" | "syncopa"
  | "whole-rest" | "half-rest" | "quarter-rest" | "eighth-rest" | "sixteenth-rest";

export function RhythmGlyphSvg({ kind, className }: { kind: RhythmGlyph; className?: string }) {
  switch (kind) {
    case "quarter": return <QuarterNote className={className} />;
    case "eighth-pair": return <EighthPair className={className} />;
    case "sixteenth-quad": return <SixteenthQuad className={className} />;
    case "dotted-quarter": return <DottedQuarter className={className} />;
    case "syncopa": return <Syncopa className={className} />;
    case "whole-rest": return <WholeRest className={className} />;
    case "half-rest": return <HalfRest className={className} />;
    case "quarter-rest": return <QuarterRest className={className} />;
    case "eighth-rest": return <EighthRest className={className} />;
    case "sixteenth-rest": return <SixteenthRest className={className} />;
  }
}

export const RHYTHM_FLASHCARDS: Array<{
  kind: RhythmGlyph; name: string; syllable: string; beats: string; teach: string;
}> = [
  { kind: "quarter", name: "Quarter note", syllable: "ta", beats: "1 beat", teach: "Walking beat. Clap once and hold." },
  { kind: "eighth-pair", name: "Beamed eighths", syllable: "ti-ti", beats: "1 beat (½ + ½)", teach: "Running beat. Two even sounds in one beat." },
  { kind: "sixteenth-quad", name: "Beamed sixteenths", syllable: "tika-tika", beats: "1 beat (¼ × 4)", teach: "Four fast sounds in a single beat." },
  { kind: "dotted-quarter", name: "Dotted quarter", syllable: "ta-a", beats: "1½ beats", teach: "Hold the 'ta' for an extra half beat." },
  { kind: "syncopa", name: "Syncopa", syllable: "ti-ta-ti", beats: "2 beats", teach: "Off-beat feel: short – long – short." },
  { kind: "quarter-rest", name: "Quarter rest", syllable: "shh", beats: "1 silent beat", teach: "Hands open silently. Keep the pulse going inside." },
  { kind: "half-rest", name: "Half rest", syllable: "(silence)", beats: "2 silent beats", teach: "Sits on the line. Two beats of silence." },
  { kind: "whole-rest", name: "Whole rest", syllable: "(silence)", beats: "4 silent beats", teach: "Hangs from the line. A whole bar of silence." },
  { kind: "eighth-rest", name: "Eighth rest", syllable: "(silence)", beats: "½ silent beat", teach: "A short silent gap inside the beat." },
];
