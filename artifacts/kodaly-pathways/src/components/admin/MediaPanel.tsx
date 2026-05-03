import { useRef, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import {
  useListMedia, useDeleteMedia, useUpdateMedia, useRequestUploadUrl, useRegisterMedia,
  getListMediaQueryKey,
  type MediaItem,
} from "@workspace/api-client-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Trash2, Upload, Copy, Image as ImageIcon } from "lucide-react";

export function MediaPanel() {
  const { data: items, isLoading } = useListMedia();
  const qc = useQueryClient();
  const invalidate = () => qc.invalidateQueries({ queryKey: getListMediaQueryKey() });
  const requestUrl = useRequestUploadUrl();
  const register = useRegisterMedia({ mutation: { onSuccess: () => { invalidate(); toast.success("File uploaded"); } } });
  const update = useUpdateMedia({ mutation: { onSuccess: () => invalidate() } });
  const del = useDeleteMedia({ mutation: { onSuccess: () => { invalidate(); toast.success("Removed"); } } });
  const fileInput = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);

  async function handleFile(file: File) {
    setUploading(true);
    try {
      const presigned = await requestUrl.mutateAsync({ data: { name: file.name, size: file.size, contentType: file.type || "application/octet-stream" } });
      const put = await fetch(presigned.uploadURL, { method: "PUT", headers: { "Content-Type": file.type || "application/octet-stream" }, body: file });
      if (!put.ok) throw new Error(`Upload failed: ${put.status}`);
      await register.mutateAsync({ data: { objectPath: presigned.objectPath, fileName: file.name, mimeType: file.type, sizeBytes: file.size, alt: "" } });
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Upload failed");
    } finally {
      setUploading(false);
      if (fileInput.current) fileInput.current.value = "";
    }
  }

  return (
    <div className="space-y-6" data-testid="admin-media-panel">
      <div className="flex items-end justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-2xl font-semibold">Media library</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Upload images and other files used across the site. Copy a file's URL to paste into a page block.
          </p>
        </div>
        <div>
          <input
            ref={fileInput}
            type="file"
            className="hidden"
            onChange={(e) => { const f = e.target.files?.[0]; if (f) void handleFile(f); }}
            data-testid="media-file-input"
          />
          <Button onClick={() => fileInput.current?.click()} disabled={uploading} data-testid="button-upload-media">
            <Upload className="w-4 h-4 mr-1" /> {uploading ? "Uploading…" : "Upload file"}
          </Button>
        </div>
      </div>

      {isLoading && <div className="text-muted-foreground">Loading…</div>}
      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
        {(items ?? []).map((m: MediaItem) => (
          <MediaCard
            key={m.id}
            item={m}
            onSaveAlt={(alt) => update.mutate({ id: m.id, data: { alt } })}
            onDelete={() => { if (confirm(`Delete ${m.fileName || "this file"}?`)) del.mutate({ id: m.id }); }}
          />
        ))}
        {!isLoading && (items ?? []).length === 0 && (
          <Card className="sm:col-span-2 lg:col-span-3"><CardContent className="p-8 text-sm text-muted-foreground text-center">
            No media yet — upload an image to get started.
          </CardContent></Card>
        )}
      </div>
    </div>
  );
}

function MediaCard({ item, onSaveAlt, onDelete }: { item: MediaItem; onSaveAlt: (alt: string) => void; onDelete: () => void }) {
  const [alt, setAlt] = useState(item.alt);
  const isImage = item.mimeType.startsWith("image/");
  return (
    <Card data-testid={`media-card-${item.id}`}>
      <CardHeader className="p-3">
        <div className="aspect-video w-full rounded-md bg-muted overflow-hidden flex items-center justify-center">
          {isImage ? (
            <img src={item.url} alt={item.alt || item.fileName} className="w-full h-full object-cover" />
          ) : (
            <ImageIcon className="w-8 h-8 text-muted-foreground" />
          )}
        </div>
      </CardHeader>
      <CardContent className="p-3 pt-0 space-y-2">
        <div className="text-xs text-muted-foreground truncate" title={item.fileName}>{item.fileName || "(unnamed)"}</div>
        <Input value={alt} onChange={(e) => setAlt(e.target.value)} onBlur={() => alt !== item.alt && onSaveAlt(alt)} placeholder="Alt text" />
        <div className="flex items-center gap-1">
          <Button
            size="sm"
            variant="outline"
            className="flex-1"
            onClick={() => { void navigator.clipboard.writeText(item.url); toast.success("URL copied"); }}
            data-testid={`button-copy-url-${item.id}`}
          >
            <Copy className="w-3.5 h-3.5 mr-1" /> Copy URL
          </Button>
          <Button size="icon" variant="ghost" onClick={onDelete} aria-label="Delete">
            <Trash2 className="w-4 h-4 text-destructive" />
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
