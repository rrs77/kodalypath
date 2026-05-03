import { useEffect, useMemo, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import {
  useListMicrocopy, useUpsertMicrocopy,
  getListMicrocopyQueryKey, getGetMicrocopyQueryKey,
} from "@workspace/api-client-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Plus, Trash2 } from "lucide-react";

type Row = { key: string; value: string; description: string; _new?: boolean; _removed?: boolean };

export function MicrocopyPanel() {
  const { data, isLoading } = useListMicrocopy();
  const qc = useQueryClient();
  const upsert = useUpsertMicrocopy({
    mutation: {
      onSuccess: () => {
        qc.invalidateQueries({ queryKey: getListMicrocopyQueryKey() });
        qc.invalidateQueries({ queryKey: getGetMicrocopyQueryKey() });
        toast.success("Microcopy saved");
      },
      onError: (e: unknown) => toast.error(e instanceof Error ? e.message : "Save failed"),
    },
  });

  const [rows, setRows] = useState<Row[]>([]);
  useEffect(() => {
    if (!data) return;
    setRows(data.map((r) => ({ key: r.key, value: r.value, description: r.description })));
  }, [data]);

  const dirty = useMemo(() => {
    if (!data) return false;
    if (rows.some((r) => r._removed)) return true;
    if (rows.length !== data.length) return true;
    return rows.some((r) => {
      const orig = data.find((d) => d.key === r.key);
      return !orig || orig.value !== r.value || orig.description !== r.description;
    });
  }, [rows, data]);

  function patch(i: number, p: Partial<Row>) {
    setRows((rs) => rs.map((r, idx) => (idx === i ? { ...r, ...p } : r)));
  }

  function save() {
    const entries = rows.filter((r) => !r._removed && r.key.trim()).map((r) => ({ key: r.key.trim(), value: r.value, description: r.description }));
    const deleteKeys = rows.filter((r) => r._removed && !r._new && r.key.trim()).map((r) => r.key.trim());
    if (entries.length === 0 && deleteKeys.length === 0) return;
    upsert.mutate({ data: { entries, deleteKeys } });
  }

  if (isLoading) return <div className="text-muted-foreground">Loading…</div>;

  return (
    <div className="space-y-6" data-testid="admin-microcopy-panel">
      <div className="flex items-end justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-2xl font-semibold">Microcopy</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Short reusable strings. Reference them by key in templates and components.
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => setRows((r) => [...r, { key: "", value: "", description: "", _new: true }])}>
            <Plus className="w-4 h-4 mr-1" /> Add string
          </Button>
          <Button onClick={save} disabled={!dirty || upsert.isPending} data-testid="button-save-microcopy">
            {upsert.isPending ? "Saving…" : "Save changes"}
          </Button>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Strings</CardTitle>
          <CardDescription>Keys are case-sensitive. Removed strings disappear once you save.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          {rows.length === 0 && <div className="text-sm text-muted-foreground">No strings yet.</div>}
          {rows.map((r, i) => (
            <div
              key={`${r.key}-${i}`}
              className={`grid lg:grid-cols-12 gap-2 items-start ${r._removed ? "opacity-40" : ""}`}
              data-testid={`microcopy-row-${i}`}
            >
              <div className="lg:col-span-3">
                <Label className="text-xs">Key</Label>
                <Input value={r.key} onChange={(e) => patch(i, { key: e.target.value })} disabled={!r._new && !r._removed} />
              </div>
              <div className="lg:col-span-5">
                <Label className="text-xs">Value</Label>
                <Input value={r.value} onChange={(e) => patch(i, { value: e.target.value })} disabled={r._removed} />
              </div>
              <div className="lg:col-span-3">
                <Label className="text-xs">Description</Label>
                <Input value={r.description} onChange={(e) => patch(i, { description: e.target.value })} disabled={r._removed} />
              </div>
              <div className="lg:col-span-1 flex justify-end pt-5">
                <Button type="button" size="icon" variant="ghost" onClick={() => patch(i, { _removed: !r._removed })} aria-label={r._removed ? "Restore" : "Remove"}>
                  <Trash2 className={`w-4 h-4 ${r._removed ? "" : "text-destructive"}`} />
                </Button>
              </div>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}
