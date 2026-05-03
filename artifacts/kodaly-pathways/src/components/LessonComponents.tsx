import { useState } from "react";
import { DndContext, closestCenter, type DragEndEvent, PointerSensor, useSensor, useSensors } from "@dnd-kit/core";
import { SortableContext, useSortable, verticalListSortingStrategy, arrayMove } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { GripVertical, Pencil, Copy, Trash2, Plus, Library, Youtube } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useListActivities, type LessonComponent, type Activity } from "@workspace/api-client-react";
import { COMPONENT_TYPES, newId } from "@/lib/api";

export function LessonComponentList({ components, onChange }: { components: LessonComponent[]; onChange: (c: LessonComponent[]) => void }) {
  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 4 } }));
  const [adding, setAdding] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  function onDragEnd(e: DragEndEvent) {
    const { active, over } = e;
    if (!over || active.id === over.id) return;
    const oldIdx = components.findIndex((c) => c.id === active.id);
    const newIdx = components.findIndex((c) => c.id === over.id);
    onChange(arrayMove(components, oldIdx, newIdx));
  }

  function update(idx: number, patch: Partial<LessonComponent>) {
    const next = components.slice();
    next[idx] = { ...next[idx], ...patch };
    onChange(next);
  }

  function remove(idx: number) {
    const next = components.slice();
    next.splice(idx, 1);
    onChange(next);
  }

  function duplicate(idx: number) {
    const next = components.slice();
    next.splice(idx + 1, 0, { ...components[idx], id: newId() });
    onChange(next);
  }

  function addFreeform() {
    onChange([...components, { id: newId(), type: "Other", title: "New component", content: "", durationMinutes: 5, notes: "" }]);
  }

  function addFromActivity(a: Activity) {
    const contentParts = [a.description, a.instructions].filter(Boolean);
    if (a.youtubeLink) contentParts.push(`Video: ${a.youtubeLink}`);
    onChange([...components, {
      id: newId(),
      type: a.activityType || "Other",
      title: a.title,
      content: contentParts.join("\n\n"),
      durationMinutes: 8,
      notes: a.assessmentFocus || "",
      activityId: a.id,
    }]);
    setAdding(false);
  }

  function extractYouTube(text: string | undefined): string | null {
    if (!text) return null;
    const m = text.match(/https?:\/\/(?:www\.)?(?:youtube\.com\/watch\?v=[\w-]+|youtu\.be\/[\w-]+)[^\s)]*/);
    return m ? m[0] : null;
  }

  const editing = components.find((c) => c.id === editingId) ?? null;

  return (
    <div className="space-y-2">
      <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={onDragEnd}>
        <SortableContext items={components.map((c) => c.id)} strategy={verticalListSortingStrategy}>
          {components.map((c, i) => (
            <SortableRow key={c.id} c={c}
              videoUrl={extractYouTube(c.content)}
              onEdit={() => setEditingId(c.id)}
              onDuplicate={() => duplicate(i)}
              onRemove={() => remove(i)}
              onDurationChange={(n) => update(i, { durationMinutes: n })}
            />
          ))}
        </SortableContext>
      </DndContext>
      <div className="flex gap-2">
        <Button variant="outline" onClick={addFreeform} data-testid="button-add-component"><Plus className="w-4 h-4 mr-1" /> Add component</Button>
        <Button variant="outline" onClick={() => setAdding(true)} data-testid="button-add-from-activity"><Library className="w-4 h-4 mr-1" /> Add from activity database</Button>
      </div>

      <Dialog open={adding} onOpenChange={setAdding}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader><DialogTitle>Add from activity database</DialogTitle></DialogHeader>
          <ActivityPicker onPick={addFromActivity} />
        </DialogContent>
      </Dialog>

      <Dialog open={!!editing} onOpenChange={(o) => !o && setEditingId(null)}>
        {editing && (
          <DialogContent className="max-w-xl">
            <DialogHeader><DialogTitle>Edit component</DialogTitle></DialogHeader>
            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-2">
                <div><Label>Type</Label>
                  <Select value={editing.type} onValueChange={(v) => update(components.findIndex((c) => c.id === editing.id), { type: v })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>{COMPONENT_TYPES.map((t) => <SelectItem key={t} value={t}>{t}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
                <div><Label>Duration (min)</Label><Input type="number" value={editing.durationMinutes} onChange={(e) => update(components.findIndex((c) => c.id === editing.id), { durationMinutes: Number(e.target.value) })} /></div>
              </div>
              <div><Label>Title</Label><Input value={editing.title} onChange={(e) => update(components.findIndex((c) => c.id === editing.id), { title: e.target.value })} /></div>
              <div><Label>Content</Label><Textarea rows={5} value={editing.content} onChange={(e) => update(components.findIndex((c) => c.id === editing.id), { content: e.target.value })} /></div>
              <div><Label>Notes</Label><Textarea rows={2} value={editing.notes} onChange={(e) => update(components.findIndex((c) => c.id === editing.id), { notes: e.target.value })} /></div>
            </div>
            <DialogFooter><Button onClick={() => setEditingId(null)}>Done</Button></DialogFooter>
          </DialogContent>
        )}
      </Dialog>
    </div>
  );
}

function SortableRow({ c, videoUrl, onEdit, onDuplicate, onRemove, onDurationChange }: { c: LessonComponent; videoUrl: string | null; onEdit: () => void; onDuplicate: () => void; onRemove: () => void; onDurationChange: (n: number) => void }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: c.id });
  const style = { transform: CSS.Transform.toString(transform), transition, opacity: isDragging ? 0.5 : 1 };
  return (
    <div ref={setNodeRef} style={style}>
      <Card data-testid={`component-${c.id}`}>
        <CardContent className="p-3 flex items-start gap-2">
          <button {...attributes} {...listeners} className="mt-1 cursor-grab text-muted-foreground"><GripVertical className="w-4 h-4" /></button>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <Badge variant="secondary">{c.type}</Badge>
              <span className="font-medium truncate">{c.title}</span>
              {videoUrl && (
                <a
                  href={videoUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={(e) => e.stopPropagation()}
                  className="inline-flex items-center gap-1 text-xs text-primary hover:underline"
                  data-testid={`link-component-video-${c.id}`}
                >
                  <Youtube className="w-3.5 h-3.5" /> Watch
                </a>
              )}
            </div>
            {c.content && <p className="text-xs text-muted-foreground line-clamp-2 mt-1 whitespace-pre-wrap">{c.content}</p>}
          </div>
          <div className="flex items-center gap-1 shrink-0">
            <Input type="number" className="w-16 h-8" value={c.durationMinutes} onChange={(e) => onDurationChange(Number(e.target.value))} />
            <span className="text-xs text-muted-foreground">min</span>
            <Button size="icon" variant="ghost" onClick={onEdit}><Pencil className="w-4 h-4" /></Button>
            <Button size="icon" variant="ghost" onClick={onDuplicate}><Copy className="w-4 h-4" /></Button>
            <Button size="icon" variant="ghost" onClick={onRemove}><Trash2 className="w-4 h-4" /></Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function ActivityPicker({ onPick }: { onPick: (a: Activity) => void }) {
  const [search, setSearch] = useState("");
  const [videoOnly, setVideoOnly] = useState(false);
  const { data: activities = [] } = useListActivities(search ? { search } : undefined);
  const filtered = videoOnly ? activities.filter((a) => !!a.youtubeLink) : activities;
  return (
    <Tabs defaultValue="all">
      <TabsList>
        <TabsTrigger value="all" onClick={() => setVideoOnly(false)}>All</TabsTrigger>
        <TabsTrigger value="video" onClick={() => setVideoOnly(true)}>With video</TabsTrigger>
      </TabsList>
      <TabsContent value="all" className="mt-3">
        <Input placeholder="Search…" value={search} onChange={(e) => setSearch(e.target.value)} className="mb-2" />
        <ActivityList activities={filtered} onPick={onPick} />
      </TabsContent>
      <TabsContent value="video" className="mt-3">
        <Input placeholder="Search…" value={search} onChange={(e) => setSearch(e.target.value)} className="mb-2" />
        <ActivityList activities={filtered} onPick={onPick} />
      </TabsContent>
    </Tabs>
  );
}

function ActivityList({ activities, onPick }: { activities: Activity[]; onPick: (a: Activity) => void }) {
  if (activities.length === 0) return <p className="text-sm text-muted-foreground">No matching activities.</p>;
  return (
    <div className="space-y-1.5 max-h-[55vh] overflow-y-auto">
      {activities.map((a) => (
        <Card key={a.id} className="hover-elevate cursor-pointer" onClick={() => onPick(a)} data-testid={`picker-activity-${a.id}`}>
          <CardContent className="p-3">
            <div className="flex items-center justify-between gap-2">
              <div className="font-medium truncate">{a.title}</div>
              <div className="flex items-center gap-1 shrink-0">
                {a.youtubeLink && <Youtube className="w-4 h-4 text-red-600" />}
                <Badge variant="secondary">{a.keyStage}</Badge>
              </div>
            </div>
            <div className="text-xs text-muted-foreground">{a.kodalyFocus}</div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
