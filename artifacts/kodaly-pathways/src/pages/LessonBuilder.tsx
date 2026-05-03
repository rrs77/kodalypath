import { useState } from "react";
import { Link, useLocation } from "wouter";
import { useQueryClient } from "@tanstack/react-query";
import {
  useListLessons, useGenerateLesson, useDuplicateLesson, useDeleteLesson, useListClasses,
  getListLessonsQueryKey,
} from "@workspace/api-client-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Sparkles, Pencil, Copy, Trash2, FileText, NotebookPen } from "lucide-react";
import { KEY_STAGES, TERMS, API_BASE } from "@/lib/api";
import { toast } from "sonner";

const NONE = "__none__";

export default function LessonBuilderPage() {
  const qc = useQueryClient();
  const [, navigate] = useLocation();
  const { data: lessons = [], isLoading } = useListLessons();
  const { data: classes = [] } = useListClasses();
  const generate = useGenerateLesson();
  const dup = useDuplicateLesson();
  const del = useDeleteLesson();
  function refresh() { qc.invalidateQueries({ queryKey: getListLessonsQueryKey() }); }

  const [g, setG] = useState({
    yearGroup: "Year 4",
    keyStage: "KS2",
    term: "Autumn 1",
    lengthMinutes: 45,
    kodalyFocus: "",
    rhythmFocus: "",
    solfaFocus: "",
    curriculumObjective: "",
    resources: "",
    classNotes: "",
    classId: NONE,
  });

  function gen() {
    if (!g.yearGroup || !g.keyStage) { toast.error("Year group and key stage are required"); return; }
    generate.mutate(
      { data: { ...g, classId: g.classId === NONE ? null : Number(g.classId) } },
      {
        onSuccess: (l) => { refresh(); toast.success("Lesson generated"); navigate(`/lessons/${l.id}`); },
        onError: (e) => toast.error(e instanceof Error ? e.message : "Failed"),
      },
    );
  }

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-semibold flex items-center gap-2"><NotebookPen className="w-6 h-6 text-primary" /> Lessons</h1>
      <Tabs defaultValue="generate">
        <TabsList>
          <TabsTrigger value="generate" data-testid="tab-generate"><Sparkles className="w-4 h-4 mr-1" />Generate</TabsTrigger>
          <TabsTrigger value="browse" data-testid="tab-browse">Browse all</TabsTrigger>
        </TabsList>
        <TabsContent value="generate" className="mt-4">
          <Card>
            <CardContent className="p-4 grid md:grid-cols-2 gap-3">
              <div><Label>Year group</Label><Input value={g.yearGroup} onChange={(e) => setG({ ...g, yearGroup: e.target.value })} data-testid="input-year-group" /></div>
              <div><Label>Key stage</Label>
                <Select value={g.keyStage} onValueChange={(v) => setG({ ...g, keyStage: v })}>
                  <SelectTrigger data-testid="select-keystage"><SelectValue /></SelectTrigger>
                  <SelectContent>{KEY_STAGES.map((k) => <SelectItem key={k} value={k}>{k}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div><Label>Term</Label>
                <Select value={g.term} onValueChange={(v) => setG({ ...g, term: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>{TERMS.map((t) => <SelectItem key={t} value={t}>{t}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div><Label>Length (minutes)</Label><Input type="number" value={g.lengthMinutes} onChange={(e) => setG({ ...g, lengthMinutes: Number(e.target.value) || 45 })} /></div>
              <div><Label>Class (optional)</Label>
                <Select value={g.classId} onValueChange={(v) => setG({ ...g, classId: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value={NONE}>None</SelectItem>
                    {classes.map((c) => <SelectItem key={c.id} value={String(c.id)}>{c.name}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div><Label>Kodály focus</Label><Input value={g.kodalyFocus} onChange={(e) => setG({ ...g, kodalyFocus: e.target.value })} placeholder="e.g. Pentatonic improvisation" /></div>
              <div><Label>Rhythm focus</Label><Input value={g.rhythmFocus} onChange={(e) => setG({ ...g, rhythmFocus: e.target.value })} placeholder="e.g. tika-tika" /></div>
              <div><Label>Solfa focus</Label><Input value={g.solfaFocus} onChange={(e) => setG({ ...g, solfaFocus: e.target.value })} placeholder="e.g. do-re-mi-so-la" /></div>
              <div className="md:col-span-2"><Label>Curriculum objective</Label><Input value={g.curriculumObjective} onChange={(e) => setG({ ...g, curriculumObjective: e.target.value })} /></div>
              <div className="md:col-span-2"><Label>Available resources (one per line)</Label><Textarea value={g.resources} onChange={(e) => setG({ ...g, resources: e.target.value })} rows={3} /></div>
              <div className="md:col-span-2"><Label>Class notes</Label><Textarea value={g.classNotes} onChange={(e) => setG({ ...g, classNotes: e.target.value })} rows={2} /></div>
              <div className="md:col-span-2 flex justify-end">
                <Button onClick={gen} disabled={generate.isPending} data-testid="button-generate"><Sparkles className="w-4 h-4 mr-1" /> {generate.isPending ? "Generating…" : "Generate lesson"}</Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        <TabsContent value="browse" className="mt-4 space-y-2">
          {isLoading && <p className="text-muted-foreground">Loading…</p>}
          {!isLoading && lessons.length === 0 && <p className="text-muted-foreground">No lessons yet — try the Generate tab.</p>}
          {lessons.map((l) => (
            <Card key={l.id} data-testid={`card-lesson-${l.id}`}>
              <CardContent className="p-4 flex items-start justify-between gap-3">
                <div className="flex-1">
                  <div className="font-semibold">{l.title}</div>
                  <div className="text-xs text-muted-foreground">{l.keyStage} · {l.yearGroup} · {l.term || "Unscheduled"} · {l.lengthMinutes} min</div>
                  {l.kodalyFocus && <Badge variant="secondary" className="mt-1">{l.kodalyFocus}</Badge>}
                </div>
                <div className="flex gap-1">
                  <Link href={`/lessons/${l.id}`}><Button size="sm" variant="outline"><Pencil className="w-4 h-4 mr-1" /> Edit</Button></Link>
                  <Button size="sm" variant="outline" onClick={() => dup.mutate({ id: l.id, data: {} }, { onSuccess: () => { refresh(); toast.success("Duplicated"); } })}><Copy className="w-4 h-4 mr-1" /> Duplicate</Button>
                  <Button size="sm" variant="outline" onClick={() => window.open(`${API_BASE}/lessons/${l.id}/pdf`, "_blank")}><FileText className="w-4 h-4 mr-1" /> PDF</Button>
                  <Button size="sm" variant="ghost" onClick={() => { if (confirm(`Delete ${l.title}?`)) del.mutate({ id: l.id }, { onSuccess: () => { refresh(); toast.success("Deleted"); } }); }}><Trash2 className="w-4 h-4" /></Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </TabsContent>
      </Tabs>
    </div>
  );
}
