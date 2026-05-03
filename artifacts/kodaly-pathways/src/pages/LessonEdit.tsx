import { useEffect, useState } from "react";
import { Link, useRoute } from "wouter";
import { useQueryClient } from "@tanstack/react-query";
import {
  useGetLesson, useUpdateLesson, getGetLessonQueryKey, getListLessonsQueryKey, type Lesson, type LessonComponent,
} from "@workspace/api-client-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, FileText, Save } from "lucide-react";
import { LessonComponentList } from "@/components/LessonComponents";
import { AbcSnippet } from "@/components/AbcSnippet";
import { KEY_STAGES, TERMS, API_BASE } from "@/lib/api";
import { toast } from "sonner";

export default function LessonEditPage() {
  const [, params] = useRoute<{ id: string }>("/lessons/:id");
  const id = Number(params?.id);
  const qc = useQueryClient();
  const { data: serverLesson, isLoading } = useGetLesson(id, { query: { enabled: !!id } as any });
  const update = useUpdateLesson();

  const [l, setL] = useState<Lesson | null>(null);
  useEffect(() => { if (serverLesson) setL(serverLesson); }, [serverLesson]);

  if (isLoading || !l) return <p className="text-muted-foreground">Loading lesson…</p>;

  const set = <K extends keyof Lesson>(k: K, v: Lesson[K]) => setL({ ...l, [k]: v });
  const setListField = (k: "canStatements" | "vocabulary" | "teacherQuestions" | "pupilResponses" | "resources") => (text: string) => set(k, text.split("\n").map((s) => s.trim()).filter(Boolean));

  function save() {
    update.mutate(
      { id: l!.id, data: l! as any },
      {
        onSuccess: () => {
          qc.invalidateQueries({ queryKey: getGetLessonQueryKey(l!.id) });
          qc.invalidateQueries({ queryKey: getListLessonsQueryKey() });
          toast.success("Lesson saved");
        },
        onError: (e) => toast.error(e instanceof Error ? e.message : "Save failed"),
      },
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <Link href="/lesson-builder"><Button variant="ghost" size="sm"><ArrowLeft className="w-4 h-4 mr-1" /> Back to lessons</Button></Link>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => window.open(`${API_BASE}/lessons/${l.id}/pdf`, "_blank")} data-testid="button-pdf"><FileText className="w-4 h-4 mr-1" /> Download PDF</Button>
          <Button onClick={save} disabled={update.isPending} data-testid="button-save"><Save className="w-4 h-4 mr-1" /> {update.isPending ? "Saving…" : "Save"}</Button>
        </div>
      </div>

      <Card><CardContent className="p-4 space-y-3">
        <div><Label>Title</Label><Input value={l.title} onChange={(e) => set("title", e.target.value)} className="text-lg font-semibold" data-testid="input-lesson-title" /></div>
        <div className="grid md:grid-cols-4 gap-2">
          <div><Label>Year group</Label><Input value={l.yearGroup} onChange={(e) => set("yearGroup", e.target.value)} /></div>
          <div><Label>Key stage</Label>
            <Select value={l.keyStage} onValueChange={(v) => set("keyStage", v)}>
              <SelectTrigger><SelectValue /></SelectTrigger><SelectContent>{KEY_STAGES.map((k) => <SelectItem key={k} value={k}>{k}</SelectItem>)}</SelectContent>
            </Select>
          </div>
          <div><Label>Term</Label>
            <Select value={l.term || ""} onValueChange={(v) => set("term", v)}>
              <SelectTrigger><SelectValue placeholder="—" /></SelectTrigger>
              <SelectContent>{TERMS.map((t) => <SelectItem key={t} value={t}>{t}</SelectItem>)}</SelectContent>
            </Select>
          </div>
          <div><Label>Length (min)</Label><Input type="number" value={l.lengthMinutes} onChange={(e) => set("lengthMinutes", Number(e.target.value) || 45)} /></div>
        </div>
        <div className="flex flex-wrap gap-2">
          {l.kodalyFocus && <Badge variant="secondary">{l.kodalyFocus}</Badge>}
          {l.rhythmFocus && <Badge variant="outline">Rhythm: {l.rhythmFocus}</Badge>}
          {l.solfaFocus && <Badge variant="outline">Solfa: {l.solfaFocus}</Badge>}
        </div>
      </CardContent></Card>

      <div className="grid lg:grid-cols-2 gap-3">
        <Card><CardContent className="p-4 space-y-3">
          <div><Label>Kodály focus</Label><Input value={l.kodalyFocus} onChange={(e) => set("kodalyFocus", e.target.value)} /></div>
          <div className="grid grid-cols-2 gap-2">
            <div><Label>Rhythm focus</Label><Input value={l.rhythmFocus} onChange={(e) => set("rhythmFocus", e.target.value)} /></div>
            <div><Label>Solfa focus</Label><Input value={l.solfaFocus} onChange={(e) => set("solfaFocus", e.target.value)} /></div>
          </div>
          <div><Label>Curriculum objective</Label><Textarea rows={2} value={l.curriculumObjective} onChange={(e) => set("curriculumObjective", e.target.value)} /></div>
          <div><Label>Learning objective</Label><Textarea rows={2} value={l.learningObjective} onChange={(e) => set("learningObjective", e.target.value)} /></div>
          <div><Label>Can statements (one per line)</Label><Textarea rows={4} value={l.canStatements.join("\n")} onChange={(e) => setListField("canStatements")(e.target.value)} /></div>
          <div><Label>Vocabulary (one per line)</Label><Textarea rows={3} value={l.vocabulary.join("\n")} onChange={(e) => setListField("vocabulary")(e.target.value)} /></div>
        </CardContent></Card>

        <Card><CardContent className="p-4 space-y-3">
          <div><Label>Prior learning</Label><Textarea rows={2} value={l.priorLearning} onChange={(e) => set("priorLearning", e.target.value)} /></div>
          <div><Label>New learning</Label><Textarea rows={2} value={l.newLearning} onChange={(e) => set("newLearning", e.target.value)} /></div>
          <div><Label>Teacher questions (one per line)</Label><Textarea rows={3} value={l.teacherQuestions.join("\n")} onChange={(e) => setListField("teacherQuestions")(e.target.value)} /></div>
          <div><Label>Expected pupil responses (one per line)</Label><Textarea rows={3} value={l.pupilResponses.join("\n")} onChange={(e) => setListField("pupilResponses")(e.target.value)} /></div>
          <div><Label>Resources (one per line)</Label><Textarea rows={3} value={l.resources.join("\n")} onChange={(e) => setListField("resources")(e.target.value)} /></div>
        </CardContent></Card>

        <Card><CardContent className="p-4 space-y-3">
          <div><Label>Assessment</Label><Textarea rows={2} value={l.assessment} onChange={(e) => set("assessment", e.target.value)} /></div>
          <div><Label>Differentiation</Label><Textarea rows={2} value={l.differentiation} onChange={(e) => set("differentiation", e.target.value)} /></div>
          <div><Label>SEND adaptations</Label><Textarea rows={2} value={l.sendAdaptations} onChange={(e) => set("sendAdaptations", e.target.value)} /></div>
          <div><Label>EAL adaptations</Label><Textarea rows={2} value={l.ealAdaptations} onChange={(e) => set("ealAdaptations", e.target.value)} /></div>
        </CardContent></Card>

        <Card><CardContent className="p-4 space-y-3">
          <div><Label>Extension</Label><Textarea rows={2} value={l.extension} onChange={(e) => set("extension", e.target.value)} /></div>
          <div><Label>Plenary</Label><Textarea rows={2} value={l.plenary} onChange={(e) => set("plenary", e.target.value)} /></div>
          <div><Label>Teacher notes</Label><Textarea rows={3} value={l.notes} onChange={(e) => set("notes", e.target.value)} /></div>
          <div>
            <Label>Notation preview</Label>
            <div className="border rounded-md p-2 bg-card">
              <AbcSnippet abc={`X:1\nT:Rhythm preview\nM:4/4\nL:1/4\nK:C clef=perc\nB B B/B/ B/B/ | B z B B |`} />
            </div>
          </div>
        </CardContent></Card>
      </div>

      <Card><CardContent className="p-4">
        <div className="font-semibold mb-2">Lesson sequence</div>
        <p className="text-xs text-muted-foreground mb-2">Drag the handle to reorder. Total: {l.components.reduce((s, c) => s + (c.durationMinutes || 0), 0)} min</p>
        <LessonComponentList components={l.components} onChange={(c: LessonComponent[]) => set("components", c)} />
      </CardContent></Card>
    </div>
  );
}
