import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Trash2, ChevronUp, ChevronDown, Plus } from "lucide-react";
import type { Block } from "@workspace/api-client-react";

const BLOCK_KINDS: { type: Block["type"]; label: string }[] = [
  { type: "hero", label: "Hero" },
  { type: "heading", label: "Heading" },
  { type: "richText", label: "Rich text" },
  { type: "image", label: "Image" },
  { type: "columns", label: "Columns / steps" },
  { type: "cta", label: "Call to action" },
  { type: "featureGrid", label: "Feature grid" },
  { type: "videoEmbed", label: "Video embed" },
  { type: "spacer", label: "Spacer" },
];

function nid() { return Math.random().toString(36).slice(2, 9); }

function defaultProps(type: Block["type"]): Record<string, unknown> {
  switch (type) {
    case "hero": return { title: "Heading", subtitle: "Subtitle", ctaLabel: "Get started", ctaHref: "/login", theme: "dark" };
    case "heading": return { text: "Section title", level: 2 };
    case "richText": return { html: "<p>Some text…</p>" };
    case "image": return { src: "", alt: "" };
    case "columns": return { columns: 3, items: [] };
    case "cta": return { title: "Ready?", ctaLabel: "Sign in", ctaHref: "/login" };
    case "featureGrid": return { items: [] };
    case "videoEmbed": return { src: "", title: "Video" };
    case "spacer": return { height: 48 };
  }
}

export function BlockListEditor({
  blocks,
  onChange,
}: {
  blocks: Block[];
  onChange: (next: Block[]) => void;
}) {
  function patch(i: number, props: Record<string, unknown>) {
    const next = blocks.slice();
    next[i] = { ...next[i], props };
    onChange(next);
  }
  function remove(i: number) {
    const next = blocks.slice();
    next.splice(i, 1);
    onChange(next);
  }
  function move(i: number, dir: -1 | 1) {
    const j = i + dir;
    if (j < 0 || j >= blocks.length) return;
    const next = blocks.slice();
    [next[i], next[j]] = [next[j], next[i]];
    onChange(next);
  }
  function add(type: Block["type"]) {
    onChange([...blocks, { id: nid(), type, props: defaultProps(type) }]);
  }

  return (
    <div className="space-y-3">
      {blocks.map((b, i) => (
        <Card key={b.id} data-testid={`block-card-${b.type}`}>
          <CardHeader className="flex flex-row items-center justify-between gap-2 py-3">
            <CardTitle className="text-sm font-medium uppercase tracking-wide">{b.type}</CardTitle>
            <div className="flex items-center gap-1">
              <Button type="button" size="icon" variant="ghost" onClick={() => move(i, -1)} disabled={i === 0} aria-label="Move up">
                <ChevronUp className="w-4 h-4" />
              </Button>
              <Button type="button" size="icon" variant="ghost" onClick={() => move(i, 1)} disabled={i === blocks.length - 1} aria-label="Move down">
                <ChevronDown className="w-4 h-4" />
              </Button>
              <Button type="button" size="icon" variant="ghost" onClick={() => remove(i)} aria-label="Remove block" data-testid={`block-remove-${i}`}>
                <Trash2 className="w-4 h-4 text-destructive" />
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <BlockPropsEditor type={b.type} props={(b.props ?? {}) as Record<string, unknown>} onChange={(p) => patch(i, p)} />
          </CardContent>
        </Card>
      ))}

      <div className="border-t pt-4">
        <Label className="text-xs text-muted-foreground">Add block</Label>
        <div className="mt-2 flex flex-wrap gap-2">
          {BLOCK_KINDS.map((k) => (
            <Button key={k.type} type="button" size="sm" variant="outline" onClick={() => add(k.type)} data-testid={`block-add-${k.type}`}>
              <Plus className="w-3.5 h-3.5 mr-1" /> {k.label}
            </Button>
          ))}
        </div>
      </div>
    </div>
  );
}

function S({ id, label, value, onChange, ...rest }: {
  id: string; label: string; value: string; onChange: (v: string) => void;
} & Omit<React.ComponentProps<typeof Input>, "value" | "onChange" | "id">) {
  return (
    <div className="space-y-1.5">
      <Label htmlFor={id}>{label}</Label>
      <Input id={id} value={value} onChange={(e) => onChange(e.target.value)} {...rest} />
    </div>
  );
}

function T({ id, label, value, onChange, rows = 4 }: { id: string; label: string; value: string; onChange: (v: string) => void; rows?: number }) {
  return (
    <div className="space-y-1.5">
      <Label htmlFor={id}>{label}</Label>
      <Textarea id={id} rows={rows} value={value} onChange={(e) => onChange(e.target.value)} />
    </div>
  );
}

function BlockPropsEditor({ type, props, onChange }: { type: Block["type"]; props: Record<string, unknown>; onChange: (p: Record<string, unknown>) => void }) {
  function set(key: string, value: unknown) { onChange({ ...props, [key]: value }); }
  const sv = (k: string) => (typeof props[k] === "string" ? (props[k] as string) : "");
  const nv = (k: string) => (typeof props[k] === "number" ? (props[k] as number) : 0);

  switch (type) {
    case "hero":
      return (
        <div className="grid sm:grid-cols-2 gap-4">
          <S id="eyebrow" label="Eyebrow" value={sv("eyebrow")} onChange={(v) => set("eyebrow", v)} />
          <S id="theme" label="Theme (light|dark)" value={sv("theme")} onChange={(v) => set("theme", v)} />
          <div className="sm:col-span-2"><S id="title" label="Title" value={sv("title")} onChange={(v) => set("title", v)} /></div>
          <div className="sm:col-span-2"><T id="subtitle" label="Subtitle" value={sv("subtitle")} onChange={(v) => set("subtitle", v)} rows={2} /></div>
          <S id="ctaLabel" label="Primary button label" value={sv("ctaLabel")} onChange={(v) => set("ctaLabel", v)} />
          <S id="ctaHref" label="Primary button link" value={sv("ctaHref")} onChange={(v) => set("ctaHref", v)} />
          <S id="secondaryLabel" label="Secondary button label" value={sv("secondaryLabel")} onChange={(v) => set("secondaryLabel", v)} />
          <S id="secondaryHref" label="Secondary button link" value={sv("secondaryHref")} onChange={(v) => set("secondaryHref", v)} />
        </div>
      );
    case "heading":
      return (
        <div className="grid sm:grid-cols-2 gap-4">
          <div className="sm:col-span-2"><S id="text" label="Heading text" value={sv("text")} onChange={(v) => set("text", v)} /></div>
          <S id="level" label="Level (1–6)" type="number" min={1} max={6} value={String(nv("level") || 2)} onChange={(v) => set("level", Number(v) || 2)} />
          <S id="muted" label="Muted background? (true/false)" value={String(props.muted ?? "")} onChange={(v) => set("muted", v === "true")} />
          <div className="sm:col-span-2"><T id="hsubtitle" label="Subtitle" value={sv("subtitle")} onChange={(v) => set("subtitle", v)} rows={2} /></div>
        </div>
      );
    case "richText":
      return <T id="html" label="HTML" value={sv("html")} onChange={(v) => set("html", v)} rows={8} />;
    case "image":
      return (
        <div className="grid sm:grid-cols-2 gap-4">
          <div className="sm:col-span-2"><S id="src" label="Image URL" value={sv("src")} onChange={(v) => set("src", v)} /></div>
          <S id="alt" label="Alt text" value={sv("alt")} onChange={(v) => set("alt", v)} />
          <S id="caption" label="Caption" value={sv("caption")} onChange={(v) => set("caption", v)} />
        </div>
      );
    case "columns":
      return <ItemsEditor label="Step / column items" props={props} onChange={onChange} fields={[
        { key: "step", label: "Step #", type: "number" },
        { key: "title", label: "Title", type: "text" },
        { key: "body", label: "Body", type: "textarea" },
      ]} extra={
        <S id="cols" label="Columns (2|3|4)" type="number" min={2} max={4} value={String(nv("columns") || 3)} onChange={(v) => set("columns", Number(v) || 3)} />
      } />;
    case "cta":
      return (
        <div className="grid sm:grid-cols-2 gap-4">
          <div className="sm:col-span-2"><S id="ctaTitle" label="Title" value={sv("title")} onChange={(v) => set("title", v)} /></div>
          <div className="sm:col-span-2"><T id="ctaSubtitle" label="Subtitle" value={sv("subtitle")} onChange={(v) => set("subtitle", v)} rows={2} /></div>
          <S id="ctaLbl" label="Button label" value={sv("ctaLabel")} onChange={(v) => set("ctaLabel", v)} />
          <S id="ctaHref" label="Button link" value={sv("ctaHref")} onChange={(v) => set("ctaHref", v)} />
          <div className="sm:col-span-2"><S id="ctaFootnote" label="Footnote" value={sv("footnote")} onChange={(v) => set("footnote", v)} /></div>
        </div>
      );
    case "featureGrid":
      return <ItemsEditor label="Feature items" props={props} onChange={onChange} fields={[
        { key: "icon", label: "Icon name", type: "text" },
        { key: "title", label: "Title", type: "text" },
        { key: "blurb", label: "Blurb", type: "textarea" },
        { key: "tag", label: "Tag", type: "text" },
        { key: "highlight", label: "Highlight (true/false)", type: "text" },
      ]} />;
    case "videoEmbed":
      return (
        <div className="grid sm:grid-cols-2 gap-4">
          <div className="sm:col-span-2"><S id="vsrc" label="Embed URL" value={sv("src")} onChange={(v) => set("src", v)} /></div>
          <S id="vtitle" label="Title" value={sv("title")} onChange={(v) => set("title", v)} />
        </div>
      );
    case "spacer":
      return <S id="height" label="Height (px)" type="number" min={4} max={400} value={String(nv("height") || 32)} onChange={(v) => set("height", Number(v) || 32)} />;
  }
}

function ItemsEditor({
  label, props, onChange, fields, extra,
}: {
  label: string;
  props: Record<string, unknown>;
  onChange: (p: Record<string, unknown>) => void;
  fields: { key: string; label: string; type: "text" | "textarea" | "number" }[];
  extra?: React.ReactNode;
}) {
  const items = Array.isArray(props.items) ? (props.items as Record<string, unknown>[]) : [];
  function setItems(next: Record<string, unknown>[]) { onChange({ ...props, items: next }); }
  function patch(i: number, key: string, value: unknown) {
    const next = items.slice();
    next[i] = { ...next[i], [key]: value };
    setItems(next);
  }
  return (
    <div className="space-y-3">
      {extra && <div>{extra}</div>}
      <div className="text-sm font-medium">{label}</div>
      {items.map((it, i) => (
        <div key={i} className="border rounded-md p-3 space-y-2 bg-muted/20">
          <div className="flex items-center justify-between">
            <div className="text-xs text-muted-foreground">Item #{i + 1}</div>
            <Button type="button" size="sm" variant="ghost" onClick={() => { const n = items.slice(); n.splice(i, 1); setItems(n); }}>
              <Trash2 className="w-3.5 h-3.5" />
            </Button>
          </div>
          <div className="grid sm:grid-cols-2 gap-2">
            {fields.map((f) => {
              const v = it[f.key];
              if (f.type === "textarea") {
                return (
                  <div key={f.key} className="sm:col-span-2 space-y-1">
                    <Label className="text-xs">{f.label}</Label>
                    <Textarea rows={2} value={typeof v === "string" ? v : ""} onChange={(e) => patch(i, f.key, e.target.value)} />
                  </div>
                );
              }
              return (
                <div key={f.key} className="space-y-1">
                  <Label className="text-xs">{f.label}</Label>
                  <Input
                    type={f.type === "number" ? "number" : "text"}
                    value={f.type === "number" ? String(typeof v === "number" ? v : "") : (typeof v === "string" ? v : (typeof v === "boolean" ? String(v) : ""))}
                    onChange={(e) => {
                      const raw = e.target.value;
                      if (f.type === "number") return patch(i, f.key, raw === "" ? undefined : Number(raw));
                      if (raw === "true" || raw === "false") return patch(i, f.key, raw === "true");
                      patch(i, f.key, raw);
                    }}
                  />
                </div>
              );
            })}
          </div>
        </div>
      ))}
      <Button type="button" size="sm" variant="outline" onClick={() => setItems([...items, {}])}>
        <Plus className="w-3.5 h-3.5 mr-1" /> Add item
      </Button>
    </div>
  );
}
