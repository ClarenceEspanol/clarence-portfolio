"use client";

import { useState, useEffect, useRef } from "react";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Plus, RefreshCw, Trash2, Upload, X, Images } from "lucide-react";
import { toast } from "./toast";
import { BUCKET } from "./utils";
import type { GalleryImage } from "./types";

export function GalleryManager() {
  const supabase = createClient();
  const [images, setImages] = useState<GalleryImage[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [editingCaption, setEditingCaption] = useState<{ id: string; value: string } | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => { loadImages(); }, []); // eslint-disable-line react-hooks/exhaustive-deps

  async function loadImages() {
    setLoading(true);
    const { data } = await supabase.from("gallery_images").select("*").order("sort_order", { ascending: true });
    if (data) setImages(data);
    setLoading(false);
  }

  async function handleUpload(files: FileList | null) {
    if (!files || files.length === 0) return;
    setUploading(true);
    for (const file of Array.from(files)) {
      if (!file.type.startsWith("image/")) continue;
      const ext = file.name.split(".").pop();
      const path = `gallery/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;
      const { error } = await supabase.storage.from(BUCKET).upload(path, file, { upsert: true });
      if (error) { console.error(error); continue; }
      const { data: urlData } = supabase.storage.from(BUCKET).getPublicUrl(path);
      const maxOrder = images.length > 0 ? Math.max(...images.map((i) => i.sort_order)) : 0;
      await supabase.from("gallery_images").insert({ url: urlData.publicUrl, caption: null, sort_order: maxOrder + 1 });
    }
    toast("Gallery images uploaded!", "success");
    await loadImages();
    setUploading(false);
  }

  async function deleteImage(img: GalleryImage) {
    setDeletingId(img.id);
    const urlParts = img.url.split(`/${BUCKET}/`);
    if (urlParts.length > 1) await supabase.storage.from(BUCKET).remove([urlParts[1]]);
    await supabase.from("gallery_images").delete().eq("id", img.id);
    setImages((prev) => prev.filter((i) => i.id !== img.id));
    toast("Image deleted.", "info");
    setDeletingId(null);
  }

  async function saveCaption(id: string, caption: string) {
    await supabase.from("gallery_images").update({ caption: caption || null }).eq("id", id);
    setImages((prev) => prev.map((i) => i.id === id ? { ...i, caption: caption || null } : i));
    setEditingCaption(null);
    toast("Caption saved.", "success");
  }

  async function moveImage(index: number, direction: "up" | "down") {
    const newImages = [...images];
    const swapIndex = direction === "up" ? index - 1 : index + 1;
    if (swapIndex < 0 || swapIndex >= newImages.length) return;
    [newImages[index], newImages[swapIndex]] = [newImages[swapIndex], newImages[index]];
    setImages(newImages.map((img, i) => ({ ...img, sort_order: i + 1 })));
    for (let i = 0; i < newImages.length; i++) {
      await supabase.from("gallery_images").update({ sort_order: i + 1 }).eq("id", newImages[i].id);
    }
  }

  if (loading) return <div className="flex items-center justify-center py-16"><RefreshCw className="w-6 h-6 animate-spin text-muted-foreground" /></div>;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h2 className="text-2xl font-bold flex items-center gap-2"><Images className="w-6 h-6 text-cyan-500" />Gallery</h2>
          <p className="text-muted-foreground text-sm mt-0.5">{images.length} image{images.length !== 1 ? "s" : ""} · auto-sliding strip in About section (grayscale → color on hover)</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={loadImages}><RefreshCw className="w-4 h-4 mr-2" />Refresh</Button>
          <Button size="sm" onClick={() => fileRef.current?.click()} disabled={uploading} className="bg-cyan-500 hover:bg-cyan-600 text-white">
            {uploading ? <><RefreshCw className="w-4 h-4 mr-2 animate-spin" />Uploading…</> : <><Plus className="w-4 h-4 mr-2" />Add Images</>}
          </Button>
          <input ref={fileRef} type="file" accept="image/*" multiple className="hidden" onChange={(e) => handleUpload(e.target.files)} />
        </div>
      </div>

      {images.length === 0 ? (
        <Card className="border-dashed border-2 border-cyan-500/30 bg-cyan-500/5 cursor-pointer hover:border-cyan-500/60 transition-colors" onClick={() => fileRef.current?.click()}>
          <CardContent className="text-center py-16">
            <Upload className="w-10 h-10 mx-auto mb-3 text-cyan-500/50" />
            <p className="font-medium text-muted-foreground">Click to upload gallery images</p>
            <p className="text-sm text-muted-foreground/60 mt-1">JPG, PNG, WebP — multiple files supported</p>
          </CardContent>
        </Card>
      ) : (
        <>
          <div className="border border-dashed border-border rounded-xl p-4 flex items-center gap-3 cursor-pointer hover:border-cyan-500/50 hover:bg-cyan-500/5 transition-all" onClick={() => fileRef.current?.click()}>
            <div className="w-9 h-9 rounded-lg bg-cyan-500/10 flex items-center justify-center shrink-0"><Upload className="w-4 h-4 text-cyan-500" /></div>
            <div><p className="text-sm font-medium">Upload more images</p><p className="text-xs text-muted-foreground">Click to add more photos to your gallery</p></div>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
            {images.map((img, index) => (
              <Card key={img.id} className="bg-card/50 border-border group overflow-hidden">
                <div className="relative aspect-4/3">
                  <img src={img.url} alt={img.caption ?? "Gallery"} className="w-full h-full object-cover grayscale group-hover:grayscale-0 transition-all duration-500" />
                  <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                    <Button variant="ghost" size="icon" className="h-8 w-8 bg-white/10 hover:bg-white/20 text-white disabled:opacity-30" onClick={() => moveImage(index, "up")} disabled={index === 0} title="Move left">←</Button>
                    <Button variant="ghost" size="icon" className="h-8 w-8 bg-red-500/80 hover:bg-red-500 text-white" onClick={() => deleteImage(img)} disabled={deletingId === img.id} title="Delete">
                      {deletingId === img.id ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Trash2 className="w-3.5 h-3.5" />}
                    </Button>
                    <Button variant="ghost" size="icon" className="h-8 w-8 bg-white/10 hover:bg-white/20 text-white disabled:opacity-30" onClick={() => moveImage(index, "down")} disabled={index === images.length - 1} title="Move right">→</Button>
                  </div>
                  <div className="absolute top-1.5 left-1.5 w-5 h-5 rounded-full bg-black/60 flex items-center justify-center">
                    <span className="text-[9px] text-white font-mono">{index + 1}</span>
                  </div>
                </div>
                <CardContent className="p-2">
                  {editingCaption?.id === img.id ? (
                    <div className="flex gap-1">
                      <Input value={editingCaption.value} onChange={(e) => setEditingCaption({ id: img.id, value: e.target.value })} onKeyDown={(e) => { if (e.key === "Enter") saveCaption(img.id, editingCaption.value); if (e.key === "Escape") setEditingCaption(null); }} placeholder="Caption…" className="h-7 text-xs" autoFocus />
                      <Button size="icon" className="h-7 w-7 shrink-0" onClick={() => saveCaption(img.id, editingCaption.value)}>✓</Button>
                      <Button size="icon" variant="ghost" className="h-7 w-7 shrink-0" onClick={() => setEditingCaption(null)}><X className="w-3 h-3" /></Button>
                    </div>
                  ) : (
                    <button className="w-full text-left text-xs text-muted-foreground hover:text-foreground transition-colors truncate" onClick={() => setEditingCaption({ id: img.id, value: img.caption ?? "" })}>
                      {img.caption ?? <span className="italic opacity-50">Add caption…</span>}
                    </button>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        </>
      )}

      <Card className="bg-muted/30 border-dashed">
        <CardContent className="p-4">
          <p className="text-xs text-muted-foreground font-mono">
            💡 Requires a <strong>gallery_images</strong> table in Supabase with columns:
            <code className="ml-1 bg-background/60 px-1 rounded">id uuid, url text, caption text, sort_order int</code>
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
