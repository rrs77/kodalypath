import { useMemo, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import {
  useListPathwayItems, useCreatePathwayItem, useUpdatePathwayItem, useDeletePathwayItem,
  getListPathwayItemsQueryKey, type PathwayItem,
} from "@workspace/api-client-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Plus, Pencil, Trash2, Map } from "lucide-react";
import { KEY_STAGES, STRANDS } from "@/lib/api";
import { toast } from "sonner";

export default function PathwayPage() {
  const qc = useQueryClient();
  const { data: items = [], isLoading } = useListPathwayItems();
  const [activeKs, setActiveKs] = useState<string>("KS1");
  const [editing, setEditing] = useState<PathwayItem | null>(null);
  const [open, setOpen] = useState(false);

  const create = useCreatePathwayItem();
  const update = useUpdatePathwayItem();
  const del = useDeletePathwayItem();
  function refresh() { qc.invalidateQueries({ queryKey: getListPathwayItemsQueryKey() }); }

  const groups = useMemo(() => {
    const out: Record<string, Record<string, PathwayItem[]>> = {};
    for (const it of items) {
      out[it.keyStage] ??= {};
      out[it.keyStage][it.strand] ??= [];
      out[it.keyStage][it.strand].push(it);
    }
    return out;
  }, [items]);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold flex items-center gap-2"><Map className="w-6 h-6 text-primary" /> Kodály pathway</h1>
        <Dialog open={open} onOpenChange={(o) => { setOpen(o); if (!o) setEditing(null); }}>
          <DialogTrigger asChild>
            <Button onClick={() => { setEditing(null); setOpen(true); }} data-testid="button-add-pathway"><Plus className="w-4 h-4 mr-1" /> Add custom step</Button>
          </DialogTrigger>
          <PathwayDialog
            initial={editing}
            defaultKs={activeKs}
            onSubmit={(values) => {
              if (editing) {
                update.mutate({ id: editing.id, data: values }, { onSuccess: () => { refresh(); setOpen(false); toast.success("Saved"); } });
              } else {
                create.mutate({ data: values }, { onSuccess: () => { refresh(); setOpen(false); toast.success("Added"); } });
              }
            }}
            pending={create.isPending || update.isPending}
          />
        </Dialog>
      </div>

      {isLoading ? <p className="text-muted-foreground">Loading…</p> : null}

      <Tabs value={activeKs} onValueChange={setActiveKs}>
        <TabsList>
          {KEY_STAGES.map((k) => <TabsTrigger key={k} value={k} data-testid={`tab-ks-${k}`}>{k}</TabsTrigger>)}
        </TabsList>
        {KEY_STAGES.map((ks) => (
          <TabsContent key={ks} value={ks} className="mt-4 space-y-4">
            {STRANDS.filter((s) => groups[ks]?.[s]?.length).map((strand) => (
              <Card key={strand}>
                <CardContent className="p-4">
                  <div className="font-semibold mb-2">{strand}</div>
                  <ol className="space-y-1.5">
                    {groups[ks][strand].sort((a, b) => a.sequenceOrder - b.sequenceOrder).map((it) => (
                      <li key={it.id} className="flex items-start gap-2 group" data-testid={`pathway-item-${it.id}`}>
                        <div className="w-6 h-6 rounded-full bg-secondary flex items-center justify-center text-xs shrink-0">{it.sequenceOrder + 1}</div>
                        <div className="flex-1">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="font-medium">{it.title}</span>
                            {it.isCustom && <Badge variant="secondary">custom</Badge>}
                          </div>
                          <p className="text-xs text-muted-foreground">{it.description}</p>
                        </div>
                        {it.isCustom && (
                          <div className="opacity-0 group-hover:opacity-100 flex gap-1">
                            <Button size="icon" variant="ghost" onClick={() => { setEditing(it); setOpen(true); }}><Pencil className="w-3.5 h-3.5" /></Button>
                            <Button size="icon" variant="ghost" onClick={() => {
                              if (confirm("Delete this step?")) del.mutate({ id: it.id }, { onSuccess: () => { refresh(); toast.success("Deleted"); } });
                            }}><Trash2 className="w-3.5 h-3.5" /></Button>
                          </div>
                        )}
                      </li>
                    ))}
                  </ol>
                </CardContent>
              </Card>
            ))}
          </TabsContent>
        ))}
      </Tabs>
    </div>
  );
}

function PathwayDialog({ initial, defaultKs, onSubmit, pending }: { initial: PathwayItem | null; defaultKs: string; onSubmit: (v: { keyStage: string; yearGroup: string; strand: string; title: string; description: string; sequenceOrder: number }) => void; pending: boolean }) {
  const [ks, setKs] = useState(initial?.keyStage ?? defaultKs);
  const [yg, setYg] = useState(initial?.yearGroup ?? "");
  const [strand, setStrand] = useState(initial?.strand ?? STRANDS[0]);
  const [title, setTitle] = useState(initial?.title ?? "");
  const [description, setDescription] = useState(initial?.description ?? "");
  const [order, setOrder] = useState<number>(initial?.sequenceOrder ?? 99);
  return (
    <DialogContent>
      <DialogHeader><DialogTitle>{initial ? "Edit step" : "Add custom pathway step"}</DialogTitle></DialogHeader>
      <div className="space-y-3">
        <div className="grid grid-cols-2 gap-2">
          <div><Label>Key stage</Label>
            <Select value={ks} onValueChange={setKs}><SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>{KEY_STAGES.map((k) => <SelectItem key={k} value={k}>{k}</SelectItem>)}</SelectContent></Select>
          </div>
          <div><Label>Year group</Label><Input value={yg} onChange={(e) => setYg(e.target.value)} /></div>
        </div>
        <div><Label>Strand</Label>
          <Select value={strand} onValueChange={setStrand}><SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>{STRANDS.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent></Select>
        </div>
        <div><Label>Title</Label><Input value={title} onChange={(e) => setTitle(e.target.value)} data-testid="input-pathway-title" /></div>
        <div><Label>Description</Label><Textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={2} /></div>
        <div><Label>Sequence order</Label><Input type="number" value={order} onChange={(e) => setOrder(Number(e.target.value))} /></div>
      </div>
      <DialogFooter>
        <Button onClick={() => { if (!title.trim()) { toast.error("Title required"); return; } onSubmit({ keyStage: ks, yearGroup: yg, strand, title, description, sequenceOrder: order }); }} disabled={pending}>
          {pending ? "Saving…" : "Save"}
        </Button>
      </DialogFooter>
    </DialogContent>
  );
}
