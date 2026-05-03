import { useMemo, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { DndContext, closestCenter, type DragEndEvent, PointerSensor, useSensor, useSensors, useDraggable, useDroppable } from "@dnd-kit/core";
import {
  useListCalendarEntries, useCreateCalendarEntry, useUpdateCalendarEntry, useDeleteCalendarEntry, useCopyTerm,
  useListLessons, useListClasses,
  getListCalendarEntriesQueryKey, type CalendarEntry,
} from "@workspace/api-client-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, Trash2, CalendarDays, Copy } from "lucide-react";
import { TERMS } from "@/lib/api";
import { toast } from "sonner";

const NONE = "__none__";

export default function CalendarPage() {
  const qc = useQueryClient();
  const { data: entries = [] } = useListCalendarEntries();
  const { data: lessons = [] } = useListLessons();
  const { data: classes = [] } = useListClasses();
  const create = useCreateCalendarEntry();
  const update = useUpdateCalendarEntry();
  const del = useDeleteCalendarEntry();
  const copy = useCopyTerm();
  function refresh() { qc.invalidateQueries({ queryKey: getListCalendarEntriesQueryKey() }); }

  const [activeTerm, setActiveTerm] = useState<string>(TERMS[0]);
  const [open, setOpen] = useState(false);
  const [copyOpen, setCopyOpen] = useState(false);

  const byWeek = useMemo(() => {
    const map: Record<number, CalendarEntry[]> = {};
    for (const e of entries.filter((x) => x.term === activeTerm)) {
      map[e.weekNumber] ??= [];
      map[e.weekNumber].push(e);
    }
    Object.values(map).forEach((arr) => arr.sort((a, b) => a.sortOrder - b.sortOrder));
    return map;
  }, [entries, activeTerm]);

  const weeks = [1, 2, 3, 4, 5, 6, 7, 8];
  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 4 } }));

  function onDragEnd(e: DragEndEvent) {
    const { active, over } = e;
    if (!over) return;
    const id = Number(String(active.id).split(":")[1]);
    const [targetTerm, targetWeekStr] = String(over.id).split("|");
    const targetWeek = Number(targetWeekStr);
    const ent = entries.find((x) => x.id === id);
    if (!ent) return;
    if (ent.term === targetTerm && ent.weekNumber === targetWeek) return;
    update.mutate({ id, data: { term: targetTerm, weekNumber: targetWeek } }, { onSuccess: () => refresh() });
  }

  return (
    <div className="space-y-4">
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div className="flex items-center gap-3">
          <div className="kp-page-icon"><CalendarDays className="w-5 h-5" /></div>
          <div>
            <h1 className="text-2xl font-semibold tracking-tight">Calendar</h1>
            <p className="text-muted-foreground text-sm mt-0.5">Plan your year — drag entries between weeks.</p>
          </div>
        </div>
        <div className="flex gap-2">
          <Dialog open={copyOpen} onOpenChange={setCopyOpen}>
            <DialogTrigger asChild><Button variant="outline"><Copy className="w-4 h-4 mr-1" /> Copy term</Button></DialogTrigger>
            <CopyTermDialog onCopy={(src, tgt) => copy.mutate({ data: { sourceTerm: src, targetTerm: tgt } }, { onSuccess: () => { refresh(); setCopyOpen(false); toast.success("Copied"); } })} pending={copy.isPending} />
          </Dialog>
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild><Button data-testid="button-add-entry"><Plus className="w-4 h-4 mr-1" /> Add entry</Button></DialogTrigger>
            <EntryDialog
              term={activeTerm}
              lessons={lessons}
              classes={classes}
              pending={create.isPending}
              onSubmit={(v) => create.mutate({ data: v }, { onSuccess: () => { refresh(); setOpen(false); toast.success("Added"); } })}
            />
          </Dialog>
        </div>
      </div>

      <Tabs value={activeTerm} onValueChange={setActiveTerm}>
        <TabsList>{TERMS.map((t) => <TabsTrigger key={t} value={t} data-testid={`tab-term-${t.replace(" ", "-")}`}>{t}</TabsTrigger>)}</TabsList>
        {TERMS.map((t) => (
          <TabsContent key={t} value={t} className="mt-4">
            <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={onDragEnd}>
              <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-8 gap-2">
                {weeks.map((w) => (
                  <WeekColumn key={w} term={t} week={w} entries={byWeek[w] || []} onDelete={(id) => del.mutate({ id }, { onSuccess: () => { refresh(); toast.success("Removed"); } })} lessons={lessons} />
                ))}
              </div>
            </DndContext>
          </TabsContent>
        ))}
      </Tabs>
    </div>
  );
}

function WeekColumn({ term, week, entries, onDelete, lessons }: { term: string; week: number; entries: CalendarEntry[]; onDelete: (id: number) => void; lessons: { id: number; title: string }[] }) {
  const { setNodeRef, isOver } = useDroppable({ id: `${term}|${week}` });
  const isEmpty = entries.length === 0;
  return (
    <Card
      ref={setNodeRef as any}
      className={`${isOver ? "ring-2 ring-primary" : ""} ${isEmpty ? "border-dashed bg-muted/30" : ""} transition-colors`}
    >
      <CardContent className="p-2 min-h-[110px] space-y-1.5">
        <div className="flex items-center justify-between">
          <div className="text-xs font-semibold text-muted-foreground">Week {week}</div>
          {!isEmpty && <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-primary/10 text-primary font-medium">{entries.length}</span>}
        </div>
        {isEmpty ? (
          <div className="text-[11px] text-muted-foreground/60 text-center py-3 italic">drop or add</div>
        ) : (
          entries.map((e) => <DraggableEntry key={e.id} entry={e} onDelete={onDelete} lessonTitle={lessons.find((l) => l.id === e.lessonId)?.title} />)
        )}
      </CardContent>
    </Card>
  );
}

function DraggableEntry({ entry, onDelete, lessonTitle }: { entry: CalendarEntry; onDelete: (id: number) => void; lessonTitle?: string }) {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({ id: `entry:${entry.id}` });
  const style = transform ? { transform: `translate3d(${transform.x}px, ${transform.y}px, 0)`, opacity: isDragging ? 0.5 : 1 } : undefined;
  return (
    <div ref={setNodeRef} style={style} {...attributes} {...listeners} className="p-2 rounded-md border bg-card hover-elevate cursor-grab text-xs" data-testid={`entry-${entry.id}`}>
      <div className="flex items-start justify-between gap-1">
        <div className="flex-1">
          <div className="font-medium">{entry.title || lessonTitle || "Untitled"}</div>
          {entry.dayLabel && <div className="opacity-70">{entry.dayLabel}</div>}
        </div>
        <button onClick={(e) => { e.stopPropagation(); onDelete(entry.id); }} className="opacity-60 hover:opacity-100"><Trash2 className="w-3 h-3" /></button>
      </div>
      {entry.notes && <p className="opacity-70 mt-1 line-clamp-2">{entry.notes}</p>}
    </div>
  );
}

function EntryDialog({ term, lessons, classes, pending, onSubmit }: { term: string; lessons: { id: number; title: string }[]; classes: { id: number; name: string }[]; pending: boolean; onSubmit: (v: any) => void }) {
  const [t, setT] = useState(term);
  const [w, setW] = useState(1);
  const [day, setDay] = useState("");
  const [title, setTitle] = useState("");
  const [notes, setNotes] = useState("");
  const [lessonId, setLessonId] = useState<string>(NONE);
  const [classId, setClassId] = useState<string>(NONE);
  return (
    <DialogContent>
      <DialogHeader><DialogTitle>Add calendar entry</DialogTitle></DialogHeader>
      <div className="space-y-3">
        <div className="grid grid-cols-2 gap-2">
          <div><Label>Term</Label>
            <Select value={t} onValueChange={setT}><SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>{TERMS.map((x) => <SelectItem key={x} value={x}>{x}</SelectItem>)}</SelectContent></Select>
          </div>
          <div><Label>Week</Label><Input type="number" value={w} onChange={(e) => setW(Number(e.target.value) || 1)} /></div>
        </div>
        <div><Label>Day label (optional)</Label><Input value={day} onChange={(e) => setDay(e.target.value)} placeholder="Monday p3" /></div>
        <div><Label>Title</Label><Input value={title} onChange={(e) => setTitle(e.target.value)} data-testid="input-entry-title" /></div>
        <div className="grid grid-cols-2 gap-2">
          <div><Label>Lesson</Label>
            <Select value={lessonId} onValueChange={setLessonId}><SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent><SelectItem value={NONE}>None</SelectItem>{lessons.map((l) => <SelectItem key={l.id} value={String(l.id)}>{l.title}</SelectItem>)}</SelectContent></Select>
          </div>
          <div><Label>Class</Label>
            <Select value={classId} onValueChange={setClassId}><SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent><SelectItem value={NONE}>None</SelectItem>{classes.map((c) => <SelectItem key={c.id} value={String(c.id)}>{c.name}</SelectItem>)}</SelectContent></Select>
          </div>
        </div>
        <div><Label>Notes</Label><Textarea value={notes} onChange={(e) => setNotes(e.target.value)} rows={2} /></div>
      </div>
      <DialogFooter>
        <Button onClick={() => onSubmit({ term: t, weekNumber: w, dayLabel: day, title, notes, lessonId: lessonId === NONE ? null : Number(lessonId), classId: classId === NONE ? null : Number(classId) })} disabled={pending}>{pending ? "Saving…" : "Save"}</Button>
      </DialogFooter>
    </DialogContent>
  );
}

function CopyTermDialog({ onCopy, pending }: { onCopy: (src: string, tgt: string) => void; pending: boolean }) {
  const [src, setSrc] = useState(TERMS[0] as string);
  const [tgt, setTgt] = useState(TERMS[1] as string);
  return (
    <DialogContent>
      <DialogHeader><DialogTitle>Copy term entries</DialogTitle></DialogHeader>
      <div className="grid grid-cols-2 gap-2">
        <div><Label>From</Label>
          <Select value={src} onValueChange={setSrc}><SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>{TERMS.map((t) => <SelectItem key={t} value={t}>{t}</SelectItem>)}</SelectContent></Select>
        </div>
        <div><Label>To</Label>
          <Select value={tgt} onValueChange={setTgt}><SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>{TERMS.map((t) => <SelectItem key={t} value={t}>{t}</SelectItem>)}</SelectContent></Select>
        </div>
      </div>
      <DialogFooter><Button onClick={() => onCopy(src, tgt)} disabled={pending}>Copy</Button></DialogFooter>
    </DialogContent>
  );
}
