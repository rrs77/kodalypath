import { useEffect, useMemo, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import {
  useListPages, useGetPage, useCreatePage, useUpdatePage, useDeletePage,
  getListPagesQueryKey, getGetPageQueryKey, getGetPageBySlugQueryKey,
  type Block, type PageSummary,
} from "@workspace/api-client-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Plus, ExternalLink, Trash2, ArrowLeft } from "lucide-react";
import { BlockListEditor } from "./BlockEditor";
import { Link } from "wouter";

export function PagesPanel() {
  const [editingId, setEditingId] = useState<number | null>(null);
  if (editingId !== null) return <PageEditor id={editingId} onBack={() => setEditingId(null)} />;
  return <PagesList onEdit={setEditingId} />;
}

function PagesList({ onEdit }: { onEdit: (id: number) => void }) {
  const { data: pages, isLoading } = useListPages();
  const qc = useQueryClient();
  const [showNew, setShowNew] = useState(false);
  const [slug, setSlug] = useState("");
  const [title, setTitle] = useState("");
  const create = useCreatePage({
    mutation: {
      onSuccess: (page) => {
        qc.invalidateQueries({ queryKey: getListPagesQueryKey() });
        toast.success(`Created “${page.title}”`);
        setShowNew(false); setSlug(""); setTitle("");
        onEdit(page.id);
      },
      onError: (e: unknown) => toast.error(e instanceof Error ? e.message : "Could not create page"),
    },
  });
  const del = useDeletePage({
    mutation: {
      onSuccess: () => {
        qc.invalidateQueries({ queryKey: getListPagesQueryKey() });
        toast.success("Page deleted");
      },
    },
  });

  return (
    <div className="space-y-6" data-testid="admin-pages-panel">
      <div className="flex items-end justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-2xl font-semibold">Pages</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Public pages built from content blocks. Edit a page to rearrange blocks; the live site uses /[slug].
          </p>
        </div>
        <Button onClick={() => setShowNew((s) => !s)} data-testid="button-new-page">
          <Plus className="w-4 h-4 mr-1" /> New page
        </Button>
      </div>

      {showNew && (
        <Card>
          <CardHeader><CardTitle className="text-base">New page</CardTitle></CardHeader>
          <CardContent>
            <form
              className="grid sm:grid-cols-2 gap-4"
              onSubmit={(e) => {
                e.preventDefault();
                if (!slug || !title) return;
                create.mutate({ data: { slug: slug.trim().toLowerCase().replace(/[^a-z0-9-]/g, "-"), title: title.trim(), blocks: [], published: true } });
              }}
            >
              <div className="space-y-1.5"><Label>Slug</Label><Input value={slug} onChange={(e) => setSlug(e.target.value)} placeholder="about" required /></div>
              <div className="space-y-1.5"><Label>Title</Label><Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="About us" required /></div>
              <div className="sm:col-span-2 flex justify-end gap-2">
                <Button type="button" variant="ghost" onClick={() => setShowNew(false)}>Cancel</Button>
                <Button type="submit" disabled={create.isPending}>{create.isPending ? "Creating…" : "Create"}</Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      {isLoading && <div className="text-muted-foreground">Loading…</div>}
      <div className="grid sm:grid-cols-2 gap-3">
        {(pages ?? []).map((p: PageSummary) => (
          <Card key={p.id} data-testid={`page-card-${p.slug}`}>
            <CardContent className="p-4">
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <div className="font-semibold truncate">{p.title}</div>
                  <div className="text-xs text-muted-foreground mt-0.5">/{p.slug} · {p.blockCount} block{p.blockCount === 1 ? "" : "s"}</div>
                </div>
                <Badge variant={p.published ? "default" : "secondary"}>{p.published ? "Live" : "Draft"}</Badge>
              </div>
              <div className="mt-3 flex items-center gap-2">
                <Button size="sm" onClick={() => onEdit(p.id)} data-testid={`button-edit-page-${p.slug}`}>Edit</Button>
                <Button asChild size="sm" variant="outline">
                  <Link href={p.slug === "walkthrough" ? "/walkthrough" : `/p/${p.slug}`}><ExternalLink className="w-3.5 h-3.5 mr-1" /> View</Link>
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => {
                    if (confirm(`Delete “${p.title}”? This cannot be undone.`)) del.mutate({ id: p.id });
                  }}
                  className="ml-auto text-destructive"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
        {!isLoading && (pages ?? []).length === 0 && (
          <Card><CardContent className="p-6 text-sm text-muted-foreground">No pages yet — create one to get started.</CardContent></Card>
        )}
      </div>
    </div>
  );
}

function PageEditor({ id, onBack }: { id: number; onBack: () => void }) {
  const { data: page, isLoading } = useGetPage(id);
  const qc = useQueryClient();
  const update = useUpdatePage({
    mutation: {
      onSuccess: (saved) => {
        qc.invalidateQueries({ queryKey: getGetPageQueryKey(id) });
        qc.invalidateQueries({ queryKey: getListPagesQueryKey() });
        qc.invalidateQueries({ queryKey: getGetPageBySlugQueryKey(saved.slug) });
        toast.success("Page saved");
      },
      onError: (e: unknown) => toast.error(e instanceof Error ? e.message : "Save failed"),
    },
  });

  const [title, setTitle] = useState("");
  const [slug, setSlug] = useState("");
  const [published, setPublished] = useState(true);
  const [blocks, setBlocks] = useState<Block[]>([]);

  useEffect(() => {
    if (!page || update.isPending) return;
    setTitle(page.title);
    setSlug(page.slug);
    setPublished(page.published);
    setBlocks(page.blocks);
  }, [page, update.isPending]);

  const dirty = useMemo(() => {
    if (!page) return false;
    return (
      title !== page.title ||
      slug !== page.slug ||
      published !== page.published ||
      JSON.stringify(blocks) !== JSON.stringify(page.blocks)
    );
  }, [page, title, slug, published, blocks]);

  if (isLoading || !page) return <div className="text-muted-foreground">Loading…</div>;

  return (
    <div className="space-y-6" data-testid="page-editor">
      <div className="flex items-center justify-between gap-3">
        <Button variant="ghost" onClick={onBack}><ArrowLeft className="w-4 h-4 mr-1" /> All pages</Button>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 text-sm">
            <Switch checked={published} onCheckedChange={setPublished} id="published" data-testid="switch-published" />
            <Label htmlFor="published">{published ? "Published" : "Draft"}</Label>
          </div>
          <Button
            disabled={!dirty || update.isPending}
            onClick={() => update.mutate({ id, data: { title, slug, published, blocks } })}
            data-testid="button-save-page"
          >
            {update.isPending ? "Saving…" : "Save"}
          </Button>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Settings</CardTitle>
          <CardDescription>Slug determines the URL. Titles aren't shown — they're for admins.</CardDescription>
        </CardHeader>
        <CardContent className="grid sm:grid-cols-2 gap-4">
          <div className="space-y-1.5"><Label htmlFor="ptitle">Title</Label><Input id="ptitle" value={title} onChange={(e) => setTitle(e.target.value)} /></div>
          <div className="space-y-1.5"><Label htmlFor="pslug">Slug</Label><Input id="pslug" value={slug} onChange={(e) => setSlug(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, "-"))} /></div>
        </CardContent>
      </Card>

      <div>
        <h2 className="text-lg font-semibold mb-3">Blocks</h2>
        <BlockListEditor blocks={blocks} onChange={setBlocks} />
      </div>
    </div>
  );
}
