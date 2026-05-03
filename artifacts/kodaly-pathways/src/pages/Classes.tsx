import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import {
  useListClasses, useCreateClass, useUpdateClass, useDeleteClass,
  getListClassesQueryKey, type ClassRecord,
} from "@workspace/api-client-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, Pencil, Trash2, GraduationCap } from "lucide-react";
import { KEY_STAGES } from "@/lib/api";
import { toast } from "sonner";

export default function ClassesPage() {
  const qc = useQueryClient();
  const { data: classes = [], isLoading } = useListClasses();
  const [editing, setEditing] = useState<ClassRecord | null>(null);
  const [open, setOpen] = useState(false);

  const create = useCreateClass();
  const update = useUpdateClass();
  const del = useDeleteClass();

  function refresh() { qc.invalidateQueries({ queryKey: getListClassesQueryKey() }); }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold flex items-center gap-2"><GraduationCap className="w-6 h-6 text-primary" /> Classes</h1>
        <Dialog open={open} onOpenChange={(o) => { setOpen(o); if (!o) setEditing(null); }}>
          <DialogTrigger asChild>
            <Button onClick={() => { setEditing(null); setOpen(true); }} data-testid="button-add-class"><Plus className="w-4 h-4 mr-1" /> Add class</Button>
          </DialogTrigger>
          <ClassDialog
            initial={editing}
            onSubmit={(values) => {
              if (editing) {
                update.mutate({ id: editing.id, data: values }, { onSuccess: () => { refresh(); setOpen(false); toast.success("Class updated"); } });
              } else {
                create.mutate({ data: values }, { onSuccess: () => { refresh(); setOpen(false); toast.success("Class created"); } });
              }
            }}
            pending={create.isPending || update.isPending}
          />
        </Dialog>
      </div>

      {isLoading ? <p className="text-muted-foreground">Loading…</p> : null}
      {!isLoading && classes.length === 0 && <p className="text-muted-foreground">No classes yet — add your first one.</p>}

      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-3">
        {classes.map((c) => (
          <Card key={c.id} data-testid={`card-class-${c.id}`}>
            <CardContent className="p-4 space-y-2">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <div className="font-semibold">{c.name}</div>
                  <div className="text-xs text-muted-foreground">{c.keyStage} · {c.yearGroup}</div>
                </div>
                <div className="flex gap-1">
                  <Button size="icon" variant="ghost" onClick={() => { setEditing(c); setOpen(true); }} data-testid={`button-edit-class-${c.id}`}><Pencil className="w-4 h-4" /></Button>
                  <Button size="icon" variant="ghost" onClick={() => {
                    if (confirm(`Delete ${c.name}?`)) {
                      del.mutate({ id: c.id }, { onSuccess: () => { refresh(); toast.success("Class deleted"); } });
                    }
                  }} data-testid={`button-delete-class-${c.id}`}><Trash2 className="w-4 h-4" /></Button>
                </div>
              </div>
              {c.notes && <p className="text-sm text-muted-foreground whitespace-pre-wrap">{c.notes}</p>}
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}

function ClassDialog({ initial, onSubmit, pending }: { initial: ClassRecord | null; onSubmit: (v: { name: string; yearGroup: string; keyStage: string; notes: string }) => void; pending: boolean }) {
  const [name, setName] = useState(initial?.name ?? "");
  const [yearGroup, setYearGroup] = useState(initial?.yearGroup ?? "");
  const [keyStage, setKeyStage] = useState(initial?.keyStage ?? "KS2");
  const [notes, setNotes] = useState(initial?.notes ?? "");
  return (
    <DialogContent>
      <DialogHeader><DialogTitle>{initial ? "Edit class" : "Add class"}</DialogTitle></DialogHeader>
      <div className="space-y-3">
        <div><Label>Name</Label><Input value={name} onChange={(e) => setName(e.target.value)} data-testid="input-class-name" /></div>
        <div className="grid grid-cols-2 gap-2">
          <div><Label>Year group</Label><Input value={yearGroup} onChange={(e) => setYearGroup(e.target.value)} placeholder="Year 4" data-testid="input-class-year" /></div>
          <div><Label>Key stage</Label>
            <Select value={keyStage} onValueChange={setKeyStage}>
              <SelectTrigger data-testid="select-class-keystage"><SelectValue /></SelectTrigger>
              <SelectContent>{KEY_STAGES.map((k) => <SelectItem key={k} value={k}>{k}</SelectItem>)}</SelectContent>
            </Select>
          </div>
        </div>
        <div><Label>Notes</Label><Textarea value={notes} onChange={(e) => setNotes(e.target.value)} rows={3} data-testid="input-class-notes" /></div>
      </div>
      <DialogFooter>
        <Button onClick={() => { if (!name.trim()) { toast.error("Name required"); return; } onSubmit({ name, yearGroup, keyStage, notes }); }} disabled={pending} data-testid="button-save-class">
          {pending ? "Saving…" : "Save"}
        </Button>
      </DialogFooter>
    </DialogContent>
  );
}
