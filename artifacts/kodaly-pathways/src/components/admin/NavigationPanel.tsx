import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import {
  useListNavItems, useCreateNavItem, useUpdateNavItem, useDeleteNavItem, useReorderNavItems,
  getListNavItemsQueryKey, getGetNavQueryKey,
  type NavItem,
} from "@workspace/api-client-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Plus, Trash2, ChevronUp, ChevronDown } from "lucide-react";

export function NavigationPanel() {
  const { data: items, isLoading } = useListNavItems();
  const qc = useQueryClient();
  const invalidate = () => {
    qc.invalidateQueries({ queryKey: getListNavItemsQueryKey() });
    qc.invalidateQueries({ queryKey: getGetNavQueryKey() });
  };
  const create = useCreateNavItem({ mutation: { onSuccess: () => { invalidate(); toast.success("Nav item added"); } } });
  const update = useUpdateNavItem({ mutation: { onSuccess: () => invalidate() } });
  const del = useDeleteNavItem({ mutation: { onSuccess: () => { invalidate(); toast.success("Nav item removed"); } } });
  const reorder = useReorderNavItems({ mutation: { onSuccess: () => invalidate() } });

  const [showNew, setShowNew] = useState(false);
  const [draft, setDraft] = useState({ location: "primary", label: "", href: "/", visible: true });

  const grouped = (items ?? []).reduce<Record<string, NavItem[]>>((acc, it) => {
    (acc[it.location] ??= []).push(it);
    return acc;
  }, {});
  for (const k of Object.keys(grouped)) grouped[k].sort((a, b) => a.sortOrder - b.sortOrder);

  function move(loc: string, index: number, dir: -1 | 1) {
    const list = grouped[loc] ?? [];
    const j = index + dir;
    if (j < 0 || j >= list.length) return;
    const next = list.slice();
    [next[index], next[j]] = [next[j], next[index]];
    reorder.mutate({ data: { items: next.map((it, i) => ({ id: it.id, sortOrder: (i + 1) * 10 })) } });
  }

  if (isLoading) return <div className="text-muted-foreground">Loading…</div>;

  return (
    <div className="space-y-6" data-testid="admin-nav-panel">
      <div className="flex items-end justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-2xl font-semibold">Navigation</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Manage links shown in the primary sidebar and other locations. Visibility hides without deleting.
          </p>
        </div>
        <Button onClick={() => setShowNew((s) => !s)}>
          <Plus className="w-4 h-4 mr-1" /> Add link
        </Button>
      </div>

      {showNew && (
        <Card>
          <CardHeader><CardTitle className="text-base">New link</CardTitle></CardHeader>
          <CardContent>
            <form
              className="grid sm:grid-cols-4 gap-3"
              onSubmit={(e) => {
                e.preventDefault();
                if (!draft.label || !draft.href) return;
                create.mutate({ data: { ...draft, sortOrder: 999 } }, { onSuccess: () => { setShowNew(false); setDraft({ location: "primary", label: "", href: "/", visible: true }); } });
              }}
            >
              <div className="space-y-1"><Label className="text-xs">Location</Label><Input value={draft.location} onChange={(e) => setDraft({ ...draft, location: e.target.value })} /></div>
              <div className="space-y-1"><Label className="text-xs">Label</Label><Input value={draft.label} onChange={(e) => setDraft({ ...draft, label: e.target.value })} required /></div>
              <div className="space-y-1"><Label className="text-xs">Href</Label><Input value={draft.href} onChange={(e) => setDraft({ ...draft, href: e.target.value })} required /></div>
              <div className="flex items-end gap-2">
                <Button type="submit" disabled={create.isPending}>Add</Button>
                <Button type="button" variant="ghost" onClick={() => setShowNew(false)}>Cancel</Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      {Object.keys(grouped).length === 0 && (
        <Card><CardContent className="p-6 text-sm text-muted-foreground">No nav items yet.</CardContent></Card>
      )}

      {Object.entries(grouped).map(([location, list]) => (
        <Card key={location}>
          <CardHeader>
            <CardTitle className="text-base capitalize">{location}</CardTitle>
            <CardDescription>{list.length} item{list.length === 1 ? "" : "s"}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-2">
            {list.map((it, i) => (
              <div key={it.id} className="grid lg:grid-cols-12 gap-2 items-center border rounded-md p-2 bg-muted/10" data-testid={`nav-row-${it.id}`}>
                <div className="lg:col-span-3">
                  <Input value={it.label} onChange={(e) => update.mutate({ id: it.id, data: { label: e.target.value } })} />
                </div>
                <div className="lg:col-span-4">
                  <Input value={it.href} onChange={(e) => update.mutate({ id: it.id, data: { href: e.target.value } })} />
                </div>
                <div className="lg:col-span-2 flex items-center gap-2 text-xs text-muted-foreground">
                  <Switch checked={it.visible} onCheckedChange={(v) => update.mutate({ id: it.id, data: { visible: v } })} />
                  {it.visible ? "Visible" : "Hidden"}
                </div>
                <div className="lg:col-span-3 flex items-center justify-end gap-1">
                  <Button size="icon" variant="ghost" onClick={() => move(location, i, -1)} disabled={i === 0}><ChevronUp className="w-4 h-4" /></Button>
                  <Button size="icon" variant="ghost" onClick={() => move(location, i, 1)} disabled={i === list.length - 1}><ChevronDown className="w-4 h-4" /></Button>
                  <Button size="icon" variant="ghost" onClick={() => { if (confirm(`Remove "${it.label}"?`)) del.mutate({ id: it.id }); }}>
                    <Trash2 className="w-4 h-4 text-destructive" />
                  </Button>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
