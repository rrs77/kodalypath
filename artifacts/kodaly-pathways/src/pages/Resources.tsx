import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import {
  useListResources, useCreateResource, useUpdateResource, useDeleteResource, useImportResource,
  getListResourcesQueryKey, type Resource,
} from "@workspace/api-client-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, ExternalLink, Pencil, Trash2, Folder, Search, Download } from "lucide-react";
import { KEY_STAGES } from "@/lib/api";
import { toast } from "sonner";

export default function ResourcesPage() {
  const qc = useQueryClient();
  const [search, setSearch] = useState("");
  const { data: resources = [] } = useListResources(search ? { search } : undefined);
  const create = useCreateResource();
  const update = useUpdateResource();
  const del = useDeleteResource();
  const importR = useImportResource();
  function refresh() { qc.invalidateQueries({ queryKey: getListResourcesQueryKey() }); }

  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Resource | null>(null);
  const [importOpen, setImportOpen] = useState(false);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold flex items-center gap-2"><Folder className="w-6 h-6 text-primary" /> Resources</h1>
        <div className="flex gap-2">
          <Dialog open={importOpen} onOpenChange={setImportOpen}>
            <DialogTrigger asChild><Button variant="outline" data-testid="button-import"><Download className="w-4 h-4 mr-1" /> Import from URL</Button></DialogTrigger>
            <ImportDialog
              pending={importR.isPending}
              onPreview={(url, cb) => importR.mutate({ data: { url } }, { onSuccess: cb, onError: (e) => toast.error(e instanceof Error ? e.message : "Import failed") })}
              onSave={(values) => create.mutate({ data: values }, { onSuccess: () => { refresh(); setImportOpen(false); toast.success("Resource imported"); } })}
            />
          </Dialog>
          <Dialog open={open} onOpenChange={(o) => { setOpen(o); if (!o) setEditing(null); }}>
            <DialogTrigger asChild><Button onClick={() => { setEditing(null); setOpen(true); }} data-testid="button-add-resource"><Plus className="w-4 h-4 mr-1" /> Add resource</Button></DialogTrigger>
            <ResourceDialog initial={editing} pending={create.isPending || update.isPending} onSubmit={(v) => {
              if (editing) update.mutate({ id: editing.id, data: v }, { onSuccess: () => { refresh(); setOpen(false); toast.success("Saved"); } });
              else create.mutate({ data: v }, { onSuccess: () => { refresh(); setOpen(false); toast.success("Added"); } });
            }} />
          </Dialog>
        </div>
      </div>

      <Card><CardContent className="p-3">
        <div className="relative max-w-md">
          <Search className="w-4 h-4 absolute top-2.5 left-2 text-muted-foreground" />
          <Input className="pl-8" placeholder="Search resources…" value={search} onChange={(e) => setSearch(e.target.value)} />
        </div>
      </CardContent></Card>

      {resources.length === 0 && <p className="text-muted-foreground">No resources yet — add one or import a URL.</p>}
      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-3">
        {resources.map((r) => (
          <Card key={r.id} data-testid={`card-resource-${r.id}`}>
            <CardContent className="p-4 space-y-2">
              <div className="flex items-start justify-between gap-2">
                <div className="font-semibold">{r.title}</div>
                <Badge variant="secondary">{r.sourceType || "web"}</Badge>
              </div>
              <a href={r.url} target="_blank" rel="noreferrer" className="text-xs text-primary hover:underline inline-flex items-center gap-1 break-all"><ExternalLink className="w-3 h-3" /> {r.url}</a>
              <div className="flex flex-wrap gap-1">
                {r.keyStage && <Badge variant="outline">{r.keyStage}</Badge>}
                {r.kodalyFocus && <Badge variant="outline">{r.kodalyFocus}</Badge>}
                {(r.tags || []).map((t) => <Badge key={t} variant="outline">{t}</Badge>)}
              </div>
              {r.notes && <p className="text-sm text-muted-foreground whitespace-pre-wrap line-clamp-3">{r.notes}</p>}
              <div className="flex justify-end gap-1">
                <Button size="icon" variant="ghost" onClick={() => { setEditing(r); setOpen(true); }}><Pencil className="w-4 h-4" /></Button>
                <Button size="icon" variant="ghost" onClick={() => { if (confirm(`Delete ${r.title}?`)) del.mutate({ id: r.id }, { onSuccess: () => { refresh(); toast.success("Deleted"); } }); }}><Trash2 className="w-4 h-4" /></Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}

function ResourceDialog({ initial, pending, onSubmit }: { initial: Resource | null; pending: boolean; onSubmit: (v: any) => void }) {
  const [r, setR] = useState({
    title: initial?.title ?? "",
    url: initial?.url ?? "",
    sourceType: initial?.sourceType ?? "",
    kodalyFocus: initial?.kodalyFocus ?? "",
    ageRange: initial?.ageRange ?? "",
    keyStage: initial?.keyStage ?? "",
    progressionStage: initial?.progressionStage ?? "",
    notes: initial?.notes ?? "",
    tags: (initial?.tags || []).join(", "),
  });
  return (
    <DialogContent>
      <DialogHeader><DialogTitle>{initial ? "Edit resource" : "Add resource"}</DialogTitle></DialogHeader>
      <div className="space-y-3">
        <div><Label>Title</Label><Input value={r.title} onChange={(e) => setR({ ...r, title: e.target.value })} data-testid="input-resource-title" /></div>
        <div><Label>URL</Label><Input value={r.url} onChange={(e) => setR({ ...r, url: e.target.value })} data-testid="input-resource-url" /></div>
        <div className="grid grid-cols-2 gap-2">
          <div><Label>Source type</Label><Input value={r.sourceType} onChange={(e) => setR({ ...r, sourceType: e.target.value })} placeholder="video / pdf / web / audio" /></div>
          <div><Label>Key stage</Label>
            <Select value={r.keyStage || "__none__"} onValueChange={(v) => setR({ ...r, keyStage: v === "__none__" ? "" : v })}>
              <SelectTrigger><SelectValue placeholder="—" /></SelectTrigger>
              <SelectContent><SelectItem value="__none__">—</SelectItem>{KEY_STAGES.map((k) => <SelectItem key={k} value={k}>{k}</SelectItem>)}</SelectContent>
            </Select>
          </div>
        </div>
        <div className="grid grid-cols-2 gap-2">
          <div><Label>Kodály focus</Label><Input value={r.kodalyFocus} onChange={(e) => setR({ ...r, kodalyFocus: e.target.value })} /></div>
          <div><Label>Age range</Label><Input value={r.ageRange} onChange={(e) => setR({ ...r, ageRange: e.target.value })} /></div>
        </div>
        <div><Label>Progression stage</Label><Input value={r.progressionStage} onChange={(e) => setR({ ...r, progressionStage: e.target.value })} /></div>
        <div><Label>Tags (comma separated)</Label><Input value={r.tags} onChange={(e) => setR({ ...r, tags: e.target.value })} /></div>
        <div><Label>Notes</Label><Textarea rows={3} value={r.notes} onChange={(e) => setR({ ...r, notes: e.target.value })} /></div>
      </div>
      <DialogFooter>
        <Button onClick={() => {
          if (!r.title.trim() || !r.url.trim()) { toast.error("Title and URL required"); return; }
          onSubmit({ ...r, tags: r.tags.split(",").map((s) => s.trim()).filter(Boolean) });
        }} disabled={pending}>{pending ? "Saving…" : "Save"}</Button>
      </DialogFooter>
    </DialogContent>
  );
}

function ImportDialog({ pending, onPreview, onSave }: { pending: boolean; onPreview: (url: string, cb: (preview: any) => void) => void; onSave: (v: any) => void }) {
  const [url, setUrl] = useState("");
  const [preview, setPreview] = useState<any | null>(null);
  return (
    <DialogContent>
      <DialogHeader><DialogTitle>Import a resource by URL</DialogTitle></DialogHeader>
      {!preview && (
        <div className="space-y-3">
          <Input placeholder="https://…" value={url} onChange={(e) => setUrl(e.target.value)} data-testid="input-import-url" />
          <DialogFooter>
            <Button onClick={() => onPreview(url, setPreview)} disabled={pending || !url.trim()}>{pending ? "Fetching…" : "Fetch preview"}</Button>
          </DialogFooter>
        </div>
      )}
      {preview && (
        <div className="space-y-3">
          <div><Label>Title</Label><Input value={preview.title} onChange={(e) => setPreview({ ...preview, title: e.target.value })} /></div>
          <div><Label>URL</Label><Input value={preview.url} disabled /></div>
          <div className="grid grid-cols-2 gap-2">
            <div><Label>Source type</Label><Input value={preview.sourceType} onChange={(e) => setPreview({ ...preview, sourceType: e.target.value })} /></div>
            <div><Label>Suggested key stage</Label><Input value={preview.suggestedKeyStage} onChange={(e) => setPreview({ ...preview, suggestedKeyStage: e.target.value })} /></div>
          </div>
          <div className="grid grid-cols-2 gap-2">
            <div><Label>Kodály focus</Label><Input value={preview.suggestedKodalyFocus} onChange={(e) => setPreview({ ...preview, suggestedKodalyFocus: e.target.value })} /></div>
            <div><Label>Age range</Label><Input value={preview.suggestedAgeRange} onChange={(e) => setPreview({ ...preview, suggestedAgeRange: e.target.value })} /></div>
          </div>
          <DialogFooter>
            <Button onClick={() => onSave({
              title: preview.title, url: preview.url, sourceType: preview.sourceType,
              kodalyFocus: preview.suggestedKodalyFocus, ageRange: preview.suggestedAgeRange,
              keyStage: preview.suggestedKeyStage, progressionStage: preview.suggestedProgressionStage,
              tags: preview.suggestedTags || [], notes: "",
            })}>Save resource</Button>
          </DialogFooter>
        </div>
      )}
    </DialogContent>
  );
}
