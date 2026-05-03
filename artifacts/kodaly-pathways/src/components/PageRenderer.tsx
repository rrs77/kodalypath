import { Link } from "wouter";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  ArrowRight, ShieldCheck, Sparkles,
  LayoutDashboard, GraduationCap, Map, Library, Hammer, CalendarDays,
  FolderOpen, Presentation, Youtube, Music,
} from "lucide-react";
import { createElement, type ComponentType } from "react";
import type { Block, Page } from "@workspace/api-client-react";

const ICONS: Record<string, ComponentType<{ className?: string }>> = {
  LayoutDashboard, GraduationCap, Map, Library, Hammer, CalendarDays,
  FolderOpen, Presentation, Youtube, Music,
};

function pickIcon(name?: string) {
  if (!name) return Music;
  return ICONS[name] ?? Music;
}

// Discriminated render — unknown block kinds are silently skipped so the
// renderer never crashes a page if the editor saves something we don't know.
function BlockView({ block }: { block: Block }) {
  const props = (block.props ?? {}) as Record<string, unknown>;
  const s = (k: string, d = "") => (typeof props[k] === "string" ? (props[k] as string) : d);
  const n = (k: string, d = 0) => (typeof props[k] === "number" ? (props[k] as number) : d);

  switch (block.type) {
    case "hero": {
      const dark = s("theme") === "dark";
      const eyebrow = s("eyebrow");
      return (
        <section
          className={dark ? "relative overflow-hidden text-white" : "relative overflow-hidden bg-muted/30"}
          style={dark ? {
            background:
              "radial-gradient(circle at 20% 20%, hsl(174 50% 30%) 0%, transparent 50%), radial-gradient(circle at 80% 80%, hsl(160 45% 22%) 0%, transparent 55%), linear-gradient(135deg, hsl(180 35% 18%) 0%, hsl(170 40% 14%) 100%)",
          } : undefined}
        >
          {dark && <div className="absolute inset-0 opacity-[0.08]" style={{
            backgroundImage: "radial-gradient(white 1px, transparent 1px)",
            backgroundSize: "24px 24px",
          }} />}
          <div className="relative max-w-6xl mx-auto px-6 py-16 md:py-20">
            {eyebrow && (
              <Badge variant="secondary" className={dark ? "bg-white/15 text-white border-0 mb-4" : "mb-4"}>
                <Sparkles className="w-3.5 h-3.5 mr-1" /> {eyebrow}
              </Badge>
            )}
            <h1 className="text-4xl md:text-5xl font-bold tracking-tight max-w-3xl">{s("title")}</h1>
            {s("subtitle") && (
              <p className={dark ? "mt-4 max-w-2xl text-white/80 text-lg" : "mt-4 max-w-2xl text-muted-foreground text-lg"}>
                {s("subtitle")}
              </p>
            )}
            <div className="mt-8 flex flex-wrap gap-3">
              {s("ctaLabel") && (
                <Button asChild size="lg" className={dark ? "bg-white text-slate-900 hover:bg-white/90 border-0" : ""} data-testid="block-hero-cta">
                  <Link href={s("ctaHref", "/login")}>
                    {s("ctaLabel")} <ArrowRight className="w-4 h-4 ml-1" />
                  </Link>
                </Button>
              )}
              {s("secondaryLabel") && (
                <Button asChild size="lg" variant="outline" className={dark ? "bg-white/10 text-white border-white/30 hover:bg-white/20 hover:text-white" : ""}>
                  <Link href={s("secondaryHref", "#")}>{s("secondaryLabel")}</Link>
                </Button>
              )}
            </div>
          </div>
        </section>
      );
    }

    case "heading": {
      const level = Math.min(Math.max(n("level", 2), 1), 6);
      return (
        <section className={s("muted") ? "bg-muted/40 border-y" : ""}>
          <div className="max-w-6xl mx-auto px-6 py-10">
            {createElement(`h${level}`, { className: "text-2xl md:text-3xl font-bold tracking-tight" }, s("text"))}
            {s("subtitle") && <p className="text-muted-foreground mt-2">{s("subtitle")}</p>}
          </div>
        </section>
      );
    }

    case "richText":
      return (
        <section className="max-w-3xl mx-auto px-6 py-8 prose dark:prose-invert">
          <div dangerouslySetInnerHTML={{ __html: s("html") }} />
        </section>
      );

    case "image":
      return (
        <section className="max-w-6xl mx-auto px-6 py-8">
          <img src={s("src")} alt={s("alt")} className="rounded-lg w-full object-cover" />
          {s("caption") && <p className="text-xs text-muted-foreground mt-2 text-center">{s("caption")}</p>}
        </section>
      );

    case "columns": {
      const items = Array.isArray(props.items) ? (props.items as Record<string, unknown>[]) : [];
      const cols = n("columns", 3);
      const gridClass = cols === 4
        ? "grid md:grid-cols-2 lg:grid-cols-4 gap-4"
        : cols === 2
          ? "grid md:grid-cols-2 gap-4"
          : "grid sm:grid-cols-2 lg:grid-cols-3 gap-4";
      return (
        <section className={s("muted") ? "bg-muted/40 border-y" : ""}>
          <div className="max-w-6xl mx-auto px-6 py-10">
            <div className={gridClass}>
              {items.map((it, i) => (
                <Card key={i}>
                  <CardContent className="p-5">
                    {typeof it.step === "number" && (
                      <div className="w-9 h-9 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-semibold mb-3">
                        {it.step}
                      </div>
                    )}
                    <h3 className="font-semibold">{String(it.title ?? "")}</h3>
                    <p className="text-sm text-muted-foreground mt-1.5 leading-relaxed">{String(it.body ?? "")}</p>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </section>
      );
    }

    case "cta":
      return (
        <section className="max-w-3xl mx-auto px-6 py-16 text-center">
          <h2 className="text-3xl font-bold tracking-tight">{s("title")}</h2>
          {s("subtitle") && <p className="text-muted-foreground mt-3">{s("subtitle")}</p>}
          <div className="mt-6 flex flex-wrap justify-center gap-3">
            <Button asChild size="lg" className="text-white border-0" style={{ background: "linear-gradient(90deg, hsl(174 55% 35%), hsl(160 50% 40%))" }} data-testid="block-cta-button">
              <Link href={s("ctaHref", "/login")}>{s("ctaLabel", "Get started")} <ArrowRight className="w-4 h-4 ml-1" /></Link>
            </Button>
          </div>
          {s("footnote") && (
            <p className="mt-6 text-xs text-muted-foreground inline-flex items-center gap-1.5">
              <ShieldCheck className="w-3.5 h-3.5 text-primary" /> {s("footnote")}
            </p>
          )}
        </section>
      );

    case "featureGrid": {
      const items = Array.isArray(props.items) ? (props.items as Record<string, unknown>[]) : [];
      return (
        <section className="max-w-6xl mx-auto px-6 py-10">
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {items.map((f, i) => {
              const Icon = pickIcon(typeof f.icon === "string" ? f.icon : undefined);
              const highlight = Boolean(f.highlight);
              return (
                <Card key={i} className={highlight ? "border-primary/40 bg-primary/[0.03]" : ""}>
                  <CardContent className="p-5 space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="w-10 h-10 rounded-md bg-primary/10 text-primary flex items-center justify-center">
                        <Icon className="w-5 h-5" />
                      </div>
                      {f.tag ? <Badge variant={highlight ? "default" : "secondary"}>{String(f.tag)}</Badge> : null}
                    </div>
                    <h3 className="font-semibold text-lg">{String(f.title ?? "")}</h3>
                    <p className="text-sm text-muted-foreground leading-relaxed">{String(f.blurb ?? "")}</p>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </section>
      );
    }

    case "videoEmbed":
      return (
        <section className="max-w-4xl mx-auto px-6 py-8">
          <div className="aspect-video w-full">
            <iframe
              src={s("src")}
              title={s("title", "Video")}
              className="w-full h-full rounded-lg border"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
            />
          </div>
        </section>
      );

    case "spacer":
      return <div style={{ height: `${n("height", 32)}px` }} />;

    default:
      return null;
  }
}

export function PageRenderer({ page }: { page: Page }) {
  return (
    <div className="min-h-screen bg-background">
      {page.blocks.map((b) => (
        <BlockView key={b.id} block={b} />
      ))}
    </div>
  );
}
