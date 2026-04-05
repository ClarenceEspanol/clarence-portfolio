"use client";

import { useState, useEffect, useRef } from "react";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter, DialogClose } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import {
  Plus, Pencil, Trash2, RefreshCw, Star, ExternalLink, Github,
  Upload, X, Image, ChevronUp, ChevronDown, ArrowUpDown,
} from "lucide-react";
import { toast } from "./toast";
import { uploadFile } from "./utils";
import type { Project } from "./types";

const MAX_FEATURED = 5;

// Common preset tags — click to instantly add without typing

// ── ProjectForm is defined OUTSIDE ProjectsManager so React never remounts it
// on state changes inside the parent — this is what was causing the scroll-to-top
// bug whenever you typed, pasted, uploaded, or added a tag.
interface ProjectFormProps {
  project: Omit<Project, "id" | "sort_order"> & Partial<Pick<Project, "id" | "sort_order">>;
  setProject: (p: any) => void;
  imageInputRef: React.RefObject<HTMLInputElement | null>;
  uploadImage: (file: File) => Promise<string | null>;
}

function ProjectForm({ project, setProject, imageInputRef, uploadImage }: ProjectFormProps) {
  const galleryInputRef = useRef<HTMLInputElement | null>(null);
  const galleryImages: string[] = project.gallery_images ?? [];
  const remainingSlots = 5 - galleryImages.length;
  const [uploadingGallery, setUploadingGallery] = useState(false);
  const [tagInput, setTagInput] = useState("");

  const addTags = (input: string) => {
    const incoming = input.split(",").map((t) => t.trim()).filter(Boolean);
    const existing: string[] = project.tags || [];
    const merged = [...existing, ...incoming.filter((t) => !existing.includes(t))];
    if (incoming.length) setProject({ ...project, tags: merged });
    setTagInput("");
  };

  const removeTag = (tag: string) =>
    setProject({ ...project, tags: (project.tags || []).filter((t: string) => t !== tag) });

  const addGalleryImages = async (files: File[]) => {
    const toUpload = files.slice(0, remainingSlots);
    if (toUpload.length === 0) return;
    setUploadingGallery(true);
    toast(`Uploading ${toUpload.length} image${toUpload.length > 1 ? "s" : ""}…`, "upload");
    const urls: string[] = [];
    for (const file of toUpload) {
      const url = await uploadImage(file);
      if (url) urls.push(url);
    }
    setProject({ ...project, gallery_images: [...galleryImages, ...urls] });
    setUploadingGallery(false);
    if (urls.length > 0) toast(`${urls.length} image${urls.length > 1 ? "s" : ""} uploaded!`, "success");
  };

  const removeGalleryImage = (idx: number) =>
    setProject({ ...project, gallery_images: galleryImages.filter((_: string, i: number) => i !== idx) });

  return (
    <div className="space-y-4 max-h-[60vh] overflow-y-auto pr-2">
      <div className="space-y-2">
        <label className="text-sm font-medium">Title *</label>
        <Input value={project.title} onChange={(e) => setProject({ ...project, title: e.target.value })} placeholder="Project title" />
      </div>
      <div className="space-y-2">
        <label className="text-sm font-medium">Type</label>
        <Input value={project.type || ""} onChange={(e) => setProject({ ...project, type: e.target.value })} placeholder="e.g., Full-Stack Development" />
      </div>
      <div className="space-y-2">
        <label className="text-sm font-medium">Short Description</label>
        <Textarea value={project.description || ""} onChange={(e) => setProject({ ...project, description: e.target.value })} rows={2} placeholder="Brief summary shown on the card" />
      </div>
      <div className="space-y-2">
        <label className="text-sm font-medium">Full Description <span className="text-xs text-muted-foreground">(shown in modal)</span></label>
        <Textarea value={project.long_description || ""} onChange={(e) => setProject({ ...project, long_description: e.target.value })} rows={5} placeholder="Detailed project write-up, features, challenges, etc." />
      </div>
      <div className="space-y-2">
        <label className="text-sm font-medium">Live URL</label>
        <Input value={project.live_url || ""} onChange={(e) => setProject({ ...project, live_url: e.target.value })} placeholder="https://..." />
      </div>
      <div className="space-y-2">
        <label className="text-sm font-medium flex items-center gap-1"><Github className="w-3.5 h-3.5" />GitHub URL</label>
        <Input value={project.github_url || ""} onChange={(e) => setProject({ ...project, github_url: e.target.value })} placeholder="https://github.com/..." />
      </div>

      {/* Cover Image */}
      <div className="space-y-2">
        <label className="text-sm font-medium flex items-center gap-1"><Image className="w-3.5 h-3.5" />Cover Image</label>
        <Input value={project.image_url || ""} onChange={(e) => setProject({ ...project, image_url: e.target.value })} placeholder="https://... or upload below" />
        <div className="flex items-center gap-2">
          <input ref={imageInputRef} type="file" accept="image/*" className="hidden" onChange={async (e) => {
            const file = e.target.files?.[0]; if (!file) return;
            toast("Uploading cover image…", "upload");
            const url = await uploadImage(file);
            if (url) { setProject({ ...project, image_url: url }); toast("Cover image uploaded!", "success"); }
          }} />
          <Button type="button" variant="outline" size="sm" onClick={() => imageInputRef.current?.click()}>
            <Upload className="w-3.5 h-3.5 mr-1" />Upload Cover
          </Button>
        </div>
        {project.image_url && <img src={project.image_url} alt="cover preview" className="w-full h-28 object-cover rounded-lg border" />}
      </div>

      {/* Gallery Images */}
      <div className="space-y-2">
        <label className="text-sm font-medium flex items-center gap-1">
          <Image className="w-3.5 h-3.5" />Gallery Images
          <span className="text-xs text-muted-foreground ml-1">({galleryImages.length}/5 — shown only in modal)</span>
        </label>
        {galleryImages.length > 0 && (
          <div className="grid grid-cols-3 gap-2">
            {galleryImages.map((url: string, idx: number) => (
              <div key={idx} className="relative group rounded-lg overflow-hidden border h-20">
                <img src={url} alt={`gallery ${idx + 1}`} className="w-full h-full object-cover" />
                <button type="button" onClick={() => removeGalleryImage(idx)}
                  className="absolute top-1 right-1 w-5 h-5 rounded-full bg-destructive text-destructive-foreground flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                  <X className="w-3 h-3" />
                </button>
                <div className="absolute bottom-1 left-1 text-[10px] bg-black/50 text-white px-1 rounded">{idx + 1}</div>
              </div>
            ))}
          </div>
        )}
        {remainingSlots > 0 && (
          <div>
            <input type="file" accept="image/*" multiple className="hidden" ref={galleryInputRef}
              onChange={async (e) => { const files = Array.from(e.target.files ?? []); await addGalleryImages(files); if (e.target) e.target.value = ""; }} />
            <Button type="button" variant="outline" size="sm" onClick={() => galleryInputRef.current?.click()} disabled={remainingSlots === 0 || uploadingGallery}>
              {uploadingGallery
                ? <><RefreshCw className="w-3.5 h-3.5 mr-1 animate-spin" />Uploading…</>
                : <><Upload className="w-3.5 h-3.5 mr-1" />Add Gallery Images ({remainingSlots} slot{remainingSlots !== 1 ? "s" : ""} left)</>}
            </Button>
          </div>
        )}
      </div>

      {/* Tags */}
      <div className="space-y-2">
        <label className="text-sm font-medium">Tags</label>
        <p className="text-xs text-muted-foreground">Separate multiple tags with commas, e.g. <span className="font-mono">Next.js, TypeScript, Supabase</span></p>
        <div className="flex gap-2">
          <Input
            value={tagInput}
            onChange={(e) => setTagInput(e.target.value)}
            placeholder="Next.js, TypeScript, Supabase..."
            onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); addTags(tagInput); } }}
          />
          <Button type="button" variant="outline" onClick={() => addTags(tagInput)}>Add</Button>
        </div>
        <div className="flex flex-wrap gap-2">
          {(project.tags || []).map((tag: string) => (
            <Badge key={tag} variant="secondary" className="cursor-pointer gap-1" onClick={() => removeTag(tag)}>
              {tag}<X className="w-3 h-3" />
            </Badge>
          ))}
        </div>
      </div>

      <div className="flex items-center justify-between">
        <label className="text-sm font-medium">Featured</label>
        <Switch checked={project.featured} onCheckedChange={(v) => setProject({ ...project, featured: v })} />
      </div>
    </div>
  );
}

// ── Main component ────────────────────────────────────────────────────────────

export function ProjectsManager() {
  const supabase = createClient();
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingProject, setEditingProject] = useState<Project | null>(null);
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const imageInputRef = useRef<HTMLInputElement>(null);
  const [newProject, setNewProject] = useState<Omit<Project, "id" | "sort_order">>({
    title: "", description: null, long_description: null, tags: [], live_url: null, github_url: null, image_url: null, gallery_images: [], type: null, featured: false,
  });

  useEffect(() => {
    supabase.from("projects").select("*").order("sort_order").then(({ data }) => { setProjects(data || []); setLoading(false); });
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const uploadImage = async (file: File) => uploadFile(supabase, file, "projects");

  const handleAdd = async () => {
    if (!newProject.title) return;
    setSaving(true);
    const { data, error } = await supabase.from("projects").insert([{ ...newProject, sort_order: projects.length }]).select().single();
    if (error) { toast("Failed to add project.", "error"); setSaving(false); return; }
    if (data) setProjects([...projects, data]);
    setNewProject({ title: "", description: null, long_description: null, tags: [], live_url: null, github_url: null, image_url: null, gallery_images: [], type: null, featured: false });
    setIsAddOpen(false); setSaving(false);
    toast("Project added successfully!", "success");
  };

  const handleUpdate = async () => {
    if (!editingProject) return;
    setSaving(true);
    const { error } = await supabase.from("projects").update(editingProject).eq("id", editingProject.id);
    if (error) { toast("Failed to save changes.", "error"); setSaving(false); return; }
    setProjects(projects.map((p) => (p.id === editingProject.id ? editingProject : p)));
    setEditingProject(null); setSaving(false);
    toast("Project saved successfully!", "success");
  };

  const handleDelete = async (id: string) => {
    await supabase.from("projects").delete().eq("id", id);
    setProjects(projects.filter((p) => p.id !== id));
    toast("Project deleted.", "info");
  };

  const toggleFeatured = async (project: Project) => {
    const featuredCount = projects.filter((p) => p.featured).length;
    if (!project.featured && featuredCount >= MAX_FEATURED) {
      toast(`Max ${MAX_FEATURED} featured projects allowed. Remove one first.`, "error");
      return;
    }
    const updated = { ...project, featured: !project.featured };
    await supabase.from("projects").update({ featured: updated.featured }).eq("id", project.id);
    setProjects(projects.map((p) => (p.id === project.id ? updated : p)));
    toast(updated.featured ? "Marked as featured!" : "Removed from featured.", "success");
  };

  const handleMoveProject = async (id: string, direction: "up" | "down") => {
    const idx = projects.findIndex((p) => p.id === id);
    if (direction === "up" && idx === 0) return;
    if (direction === "down" && idx === projects.length - 1) return;
    const swapIdx = direction === "up" ? idx - 1 : idx + 1;
    const updated = [...projects];
    [updated[idx], updated[swapIdx]] = [updated[swapIdx], updated[idx]];
    const reordered = updated.map((p, i) => ({ ...p, sort_order: i }));
    setProjects(reordered);
    await Promise.all([reordered[idx], reordered[swapIdx]].map((p) => supabase.from("projects").update({ sort_order: p.sort_order }).eq("id", p.id)));
    toast("Order updated!", "success");
  };

  const handleMoveToPosition = async (id: string, newPos: number) => {
    const idx = projects.findIndex((p) => p.id === id);
    if (idx === newPos) return;
    const updated = [...projects];
    const [moved] = updated.splice(idx, 1);
    updated.splice(newPos, 0, moved);
    const reordered = updated.map((p, i) => ({ ...p, sort_order: i }));
    setProjects(reordered);
    await Promise.all(reordered.map((p) => supabase.from("projects").update({ sort_order: p.sort_order }).eq("id", p.id)));
    toast("Order updated!", "success");
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Projects</h2>
          <p className="text-muted-foreground">
            {projects.length} projects ({projects.filter((p) => p.featured).length}/{MAX_FEATURED} featured — shown on homepage)
          </p>
        </div>
        <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
          <DialogTrigger asChild><Button><Plus className="w-4 h-4 mr-2" />Add Project</Button></DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader><DialogTitle>Add New Project</DialogTitle></DialogHeader>
            <ProjectForm project={newProject} setProject={setNewProject} imageInputRef={imageInputRef} uploadImage={uploadImage} />
            <DialogFooter>
              <DialogClose asChild><Button variant="outline">Cancel</Button></DialogClose>
              <Button onClick={handleAdd} disabled={saving || !newProject.title}>{saving ? "Saving..." : "Add Project"}</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {loading ? <div className="flex justify-center py-16"><RefreshCw className="w-6 h-6 animate-spin text-muted-foreground" /></div> : (
        <div className="grid gap-4">
          {projects.map((project, idx) => (
            <Card key={project.id} className="bg-card/50">
              <CardContent className="p-4">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex flex-col items-center gap-1 shrink-0 pt-0.5">
                    <Button variant="ghost" size="icon" className="h-6 w-6 text-muted-foreground hover:text-foreground disabled:opacity-20" onClick={() => handleMoveProject(project.id, "up")} disabled={idx === 0} title="Move up"><ChevronUp className="w-3.5 h-3.5" /></Button>
                    <span className="text-xs font-mono font-bold text-muted-foreground leading-none">{idx + 1}</span>
                    <Button variant="ghost" size="icon" className="h-6 w-6 text-muted-foreground hover:text-foreground disabled:opacity-20" onClick={() => handleMoveProject(project.id, "down")} disabled={idx === projects.length - 1} title="Move down"><ChevronDown className="w-3.5 h-3.5" /></Button>
                  </div>
                  <div className="flex items-start gap-3 flex-1 min-w-0">
                    {project.image_url && <img src={project.image_url} alt={project.title} className="w-16 h-12 object-cover rounded-lg border shrink-0" />}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="font-semibold truncate">{project.title}</h3>
                        {project.type && <Badge variant="outline" className="text-xs">{project.type}</Badge>}
                        {project.featured && <Star className="w-3.5 h-3.5 text-primary fill-primary" />}
                      </div>
                      <p className="text-sm text-muted-foreground line-clamp-2 mb-2">{project.description}</p>
                      <div className="flex flex-wrap gap-1 items-center">
                        {(project.tags || []).map((tag) => <Badge key={tag} variant="secondary" className="text-xs">{tag}</Badge>)}
                        {projects.length > 1 && (
                          <div className="flex items-center gap-1 ml-auto">
                            <ArrowUpDown className="w-3 h-3 text-muted-foreground" />
                            <Select value={String(idx)} onValueChange={(val) => handleMoveToPosition(project.id, Number(val))}>
                              <SelectTrigger className="h-6 text-[11px] w-22.5 px-2 border-dashed"><SelectValue placeholder="Move to…" /></SelectTrigger>
                              <SelectContent>{projects.map((_, i) => <SelectItem key={i} value={String(i)} className="text-xs">Position {i + 1}{i === idx ? " (current)" : ""}</SelectItem>)}</SelectContent>
                            </Select>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-1">
                    <Button
                      variant="ghost" size="icon"
                      title={project.featured ? "Remove from featured" : projects.filter((p) => p.featured).length >= MAX_FEATURED ? `Max ${MAX_FEATURED} featured reached` : "Mark as featured"}
                      onClick={() => toggleFeatured(project)}
                      className={project.featured ? "text-primary" : "text-muted-foreground hover:text-primary"}
                    >
                      <Star className={`w-4 h-4 ${project.featured ? "fill-primary" : ""}`} />
                    </Button>
                    {project.live_url && <Button variant="ghost" size="icon" asChild><a href={project.live_url} target="_blank" rel="noopener noreferrer"><ExternalLink className="w-4 h-4" /></a></Button>}
                    {project.github_url && <Button variant="ghost" size="icon" asChild><a href={project.github_url} target="_blank" rel="noopener noreferrer"><Github className="w-4 h-4" /></a></Button>}
                    <Dialog>
                      <DialogTrigger asChild><Button variant="ghost" size="icon" onClick={() => setEditingProject(project)}><Pencil className="w-4 h-4" /></Button></DialogTrigger>
                      <DialogContent className="max-w-2xl">
                        <DialogHeader><DialogTitle>Edit Project</DialogTitle></DialogHeader>
                        {editingProject && <ProjectForm project={editingProject} setProject={setEditingProject} imageInputRef={imageInputRef} uploadImage={uploadImage} />}
                        <DialogFooter>
                          <DialogClose asChild><Button variant="outline">Cancel</Button></DialogClose>
                          <DialogClose asChild><Button onClick={handleUpdate} disabled={saving}>{saving ? "Saving..." : "Save Changes"}</Button></DialogClose>
                        </DialogFooter>
                      </DialogContent>
                    </Dialog>
                    <Button variant="ghost" size="icon" className="text-destructive hover:text-destructive" onClick={() => handleDelete(project.id)}><Trash2 className="w-4 h-4" /></Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
          {projects.length === 0 && <Card className="bg-card/50 border-dashed"><CardContent className="p-8 text-center"><p className="text-muted-foreground">No projects yet. Add your first project!</p></CardContent></Card>}
        </div>
      )}
    </div>
  );
}