import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import {
  useListActivities, useCreateActivity, useUpdateActivity, useDeleteActivity,
  getListActivitiesQueryKey, type Activity,
} from "@workspace/api-client-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, Pencil, Trash2, Library, Search, ExternalLink, Youtube } from "lucide-react";
import { KEY_STAGES, TERMS } from "@/lib/api";
import { toast } from "sonner";

const ANY = "__any__";

export default function ActivitiesPage() {
  const qc = useQueryClient();
  const [keyStage, setKeyStage] = useState<string>(ANY);
  const [activityType, setActivityType] = useState<string>(ANY);
  const [difficulty, setDifficulty] = useState<string>(ANY);
  const [term, setTerm] = useState<string>(ANY);
  const [search, setSearch] = useState<string>("");
  const params = {
    ...(keyStage !== ANY && { keyStage }),
    ...(activityType !== ANY && { activityType }),
    ...(difficulty !== ANY && { difficulty }),
    ...(term !== ANY && { term }),
    ...(search && { search }),
  };
  const { data: activities = [], isLoading } = useListActivities(params);

  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Activity | null>(null);
  const [viewing, setViewing] = useState<Activity | null>(null);

  const create = useCreateActivity();
  const update = useUpdateActivity();
  const del = useDeleteActivity();
  function refresh() { qc.invalidateQueries({ queryKey: getListActivitiesQueryKey() }); }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold flex items-center gap-2"><Library className="w-6 h-6 text-primary" /> Activities</h1>
        <Dialog open={open} onOpenChange={(o) => { setOpen(o); if (!o) setEditing(null); }}>
          <DialogTrigger asChild>
            <Button onClick={() => { setEditing(null); setOpen(true); }} data-testid="button-add-activity"><Plus className="w-4 h-4 mr-1" /> Add activity</Button>
          </DialogTrigger>
          <ActivityForm initial={editing} pending={create.isPending || update.isPending} onSubmit={(v) => {
            if (editing) update.mutate({ id: editing.id, data: v }, { onSuccess: () => { refresh(); setOpen(false); toast.success("Saved"); } });
            else create.mutate({ data: v }, { onSuccess: () => { refresh(); setOpen(false); toast.success("Created"); } });
          }} />
        </Dialog>
      </div>

      <Card>
        <CardContent className="p-4 grid md:grid-cols-5 gap-2">
          <div className="md:col-span-2">
            <Label className="text-xs">Search</Label>
            <div className="relative">
              <Search className="w-4 h-4 absolute top-2.5 left-2 text-muted-foreground" />
              <Input className="pl-8" value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search title, focus, instructions" data-testid="input-search" />
            </div>
          </div>
          <FilterSelect label="Key stage" value={keyStage} onChange={setKeyStage} options={KEY_STAGES} />
          <FilterSelect label="Type" value={activityType} onChange={setActivityType} options={["Singing Game", "Rhythm", "Solfa", "Composition", "Listening", "Singing", "Dictation"]} />
          <FilterSelect label="Difficulty" value={difficulty} onChange={setDifficulty} options={["Beginner", "Intermediate", "Advanced"]} />
          <FilterSelect label="Term" value={term} onChange={setTerm} options={TERMS} />
        </CardContent>
      </Card>

      {isLoading ? <p className="text-muted-foreground">Loading…</p> : null}
      {!isLoading && activities.length === 0 && <p className="text-muted-foreground">No activities match these filters.</p>}

      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-3">
        {activities.map((a) => (
          <Card key={a.id} className="hover-elevate cursor-pointer" onClick={() => setViewing(a)} data-testid={`card-activity-${a.id}`}>
            <CardContent className="p-4 space-y-2">
              <div className="flex items-start justify-between">
                <div className="font-semibold">{a.title}</div>
                <Badge variant="secondary">{a.keyStage}</Badge>
              </div>
              <div className="text-xs text-muted-foreground">{a.kodalyFocus}</div>
              <div className="flex flex-wrap gap-1">
                {a.activityType && <Badge variant="outline">{a.activityType}</Badge>}
                {a.difficulty && <Badge variant="outline">{a.difficulty}</Badge>}
                {a.term && <Badge variant="outline">{a.term}</Badge>}
              </div>
              <p className="text-sm line-clamp-2">{a.description}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <Dialog open={!!viewing} onOpenChange={(o) => !o && setViewing(null)}>
        {viewing && (
          <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">{viewing.title}
                <Badge variant="secondary">{viewing.keyStage}</Badge>
              </DialogTitle>
            </DialogHeader>
            <div className="space-y-3 text-sm">
              <Row label="Kodály focus" value={viewing.kodalyFocus} />
              <Row label="Rhythm" value={viewing.rhythmElement} />
              <Row label="Solfa" value={viewing.solfaElement} />
              <Row label="Curriculum link" value={viewing.curriculumLink} />
              <Row label="Description" value={viewing.description} />
              <Row label="Instructions" value={viewing.instructions} />
              <Row label="Questions" value={viewing.questions} />
              <Row label="Assessment" value={viewing.assessmentFocus} />
              <Row label="Resources" value={viewing.requiredResources} />
              {(viewing.youtubeLink || viewing.externalLink) && (
                <div className="flex gap-2">
                  {viewing.youtubeLink && <a href={viewing.youtubeLink} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 text-primary hover:underline"><Youtube className="w-4 h-4" /> Video</a>}
                  {viewing.externalLink && <a href={viewing.externalLink} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 text-primary hover:underline"><ExternalLink className="w-4 h-4" /> Link</a>}
                </div>
              )}
            </div>
            <DialogFooter className="gap-2">
              <Button variant="outline" onClick={() => { setEditing(viewing); setViewing(null); setOpen(true); }}><Pencil className="w-4 h-4 mr-1" /> Edit</Button>
              <Button variant="destructive" onClick={() => {
                if (confirm("Delete this activity?")) del.mutate({ id: viewing.id }, { onSuccess: () => { refresh(); setViewing(null); toast.success("Deleted"); }, onError: (e) => toast.error(e instanceof Error ? e.message : "Cannot delete (default activity)") });
              }}><Trash2 className="w-4 h-4 mr-1" /> Delete</Button>
            </DialogFooter>
          </DialogContent>
        )}
      </Dialog>
    </div>
  );
}

function FilterSelect({ label, value, onChange, options }: { label: string; value: string; onChange: (v: string) => void; options: readonly string[] }) {
  return (
    <div>
      <Label className="text-xs">{label}</Label>
      <Select value={value} onValueChange={onChange}>
        <SelectTrigger data-testid={`select-${label.toLowerCase().replace(" ","-")}`}><SelectValue /></SelectTrigger>
        <SelectContent>
          <SelectItem value={ANY}>Any</SelectItem>
          {options.map((o) => <SelectItem key={o} value={o}>{o}</SelectItem>)}
        </SelectContent>
      </Select>
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  if (!value) return null;
  return (
    <div>
      <div className="text-xs uppercase tracking-wide text-muted-foreground">{label}</div>
      <div className="whitespace-pre-wrap">{value}</div>
    </div>
  );
}

function ActivityForm({ initial, pending, onSubmit }: { initial: Activity | null; pending: boolean; onSubmit: (v: any) => void }) {
  const [a, setA] = useState({
    title: initial?.title ?? "",
    keyStage: initial?.keyStage ?? "KS2",
    ageRange: initial?.ageRange ?? "",
    kodalyFocus: initial?.kodalyFocus ?? "",
    rhythmElement: initial?.rhythmElement ?? "",
    solfaElement: initial?.solfaElement ?? "",
    curriculumLink: initial?.curriculumLink ?? "",
    description: initial?.description ?? "",
    instructions: initial?.instructions ?? "",
    questions: initial?.questions ?? "",
    assessmentFocus: initial?.assessmentFocus ?? "",
    requiredResources: initial?.requiredResources ?? "",
    youtubeLink: initial?.youtubeLink ?? "",
    externalLink: initial?.externalLink ?? "",
    activityType: initial?.activityType ?? "",
    difficulty: initial?.difficulty ?? "",
    term: initial?.term ?? "",
  });
  const set = (k: keyof typeof a) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => setA({ ...a, [k]: e.target.value });
  return (
    <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
      <DialogHeader><DialogTitle>{initial ? "Edit activity" : "Add activity"}</DialogTitle></DialogHeader>
      <div className="space-y-3">
        <div><Label>Title</Label><Input value={a.title} onChange={set("title")} data-testid="input-act-title" /></div>
        <div className="grid grid-cols-2 gap-2">
          <div><Label>Key stage</Label>
            <Select value={a.keyStage} onValueChange={(v) => setA({ ...a, keyStage: v })}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>{KEY_STAGES.map((k) => <SelectItem key={k} value={k}>{k}</SelectItem>)}</SelectContent>
            </Select>
          </div>
          <div><Label>Age range</Label><Input value={a.ageRange} onChange={set("ageRange")} placeholder="6-8" /></div>
        </div>
        <div><Label>Kodály focus</Label><Input value={a.kodalyFocus} onChange={set("kodalyFocus")} /></div>
        <div className="grid grid-cols-2 gap-2">
          <div><Label>Rhythm</Label><Input value={a.rhythmElement} onChange={set("rhythmElement")} /></div>
          <div><Label>Solfa</Label><Input value={a.solfaElement} onChange={set("solfaElement")} /></div>
        </div>
        <div><Label>Curriculum link</Label><Input value={a.curriculumLink} onChange={set("curriculumLink")} /></div>
        <div><Label>Description</Label><Textarea value={a.description} onChange={set("description")} rows={2} /></div>
        <div><Label>Instructions</Label><Textarea value={a.instructions} onChange={set("instructions")} rows={3} /></div>
        <div><Label>Teacher questions</Label><Textarea value={a.questions} onChange={set("questions")} rows={2} /></div>
        <div><Label>Assessment focus</Label><Input value={a.assessmentFocus} onChange={set("assessmentFocus")} /></div>
        <div><Label>Required resources</Label><Input value={a.requiredResources} onChange={set("requiredResources")} /></div>
        <div className="grid grid-cols-3 gap-2">
          <div><Label>Type</Label><Input value={a.activityType} onChange={set("activityType")} /></div>
          <div><Label>Difficulty</Label><Input value={a.difficulty} onChange={set("difficulty")} /></div>
          <div><Label>Term</Label><Input value={a.term} onChange={set("term")} /></div>
        </div>
        <div className="grid grid-cols-2 gap-2">
          <div><Label>YouTube link</Label><Input value={a.youtubeLink} onChange={set("youtubeLink")} /></div>
          <div><Label>External link</Label><Input value={a.externalLink} onChange={set("externalLink")} /></div>
        </div>
      </div>
      <DialogFooter>
        <Button onClick={() => { if (!a.title.trim()) { toast.error("Title required"); return; } onSubmit({ ...a, tags: [] }); }} disabled={pending}>{pending ? "Saving…" : "Save"}</Button>
      </DialogFooter>
    </DialogContent>
  );
}
