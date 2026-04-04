"use client";

import { useState, useEffect, useRef } from "react";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger, DialogFooter, DialogClose } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  User, Upload, Save, ExternalLink, MapPin, Linkedin, Github,
  Briefcase, GraduationCap, Plus, Trash2, GripVertical, RefreshCw, Mail,
} from "lucide-react";
import { toast } from "./toast";
import { uploadFile, BUCKET } from "./utils";
import type { Profile, WorkExperience } from "./types";

export function ProfileManager() {
  const supabase = createClient();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [workExperience, setWorkExperience] = useState<WorkExperience[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [imgKey, setImgKey] = useState(0);
  const [isExpModalOpen, setIsExpModalOpen] = useState(false);
  const [newExp, setNewExp] = useState<Omit<WorkExperience, "id" | "sort_order">>({ title: "", role: "", period: "", description: "" });
  const avatarRef = useRef<HTMLInputElement>(null);
  const resumeRef = useRef<HTMLInputElement>(null);
  const cvRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    Promise.all([
      supabase.from("profile").select("*").limit(1).single(),
      supabase.from("work_experience").select("*").order("sort_order"),
    ]).then(([{ data: p }, { data: w }]) => { setProfile(p); setWorkExperience(w || []); setLoading(false); });
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const handleSave = async () => {
    if (!profile) return;
    setSaving(true);
    const { id, ...rest } = profile;
    await supabase.from("profile").update(rest).eq("id", id);
    for (let i = 0; i < workExperience.length; i++) {
      const exp = workExperience[i];
      const isNew = exp.id.startsWith("new-");
      if (isNew) {
        await supabase.from("work_experience").insert({ title: exp.title, role: exp.role || null, period: exp.period || null, description: exp.description || null, sort_order: i });
      } else {
        await supabase.from("work_experience").update({ title: exp.title, role: exp.role || null, period: exp.period || null, description: exp.description || null, sort_order: i }).eq("id", exp.id);
      }
    }
    const { data: existingInDb } = await supabase.from("work_experience").select("id");
    const currentRealIds = new Set(workExperience.filter((e) => !e.id.startsWith("new-")).map((e) => e.id));
    for (const row of (existingInDb || [])) { if (!currentRealIds.has(row.id)) await supabase.from("work_experience").delete().eq("id", row.id); }
    const { data: freshWork } = await supabase.from("work_experience").select("*").order("sort_order");
    setWorkExperience(freshWork || []);
    setSaved(true); setTimeout(() => setSaved(false), 2000); setSaving(false);
    toast("Profile saved successfully!", "success");
  };

  const confirmAddEntry = () => {
    if (!newExp.title) return;
    setWorkExperience((prev) => [...prev, { ...newExp, id: `new-${Date.now()}`, sort_order: prev.length }]);
    setNewExp({ title: "", role: "", period: "", description: "" });
    setIsExpModalOpen(false);
  };

  const removeEntry = (index: number) => setWorkExperience((prev) => prev.filter((_, i) => i !== index));

  const updateEntry = (index: number, field: keyof WorkExperience, value: string) => {
    setWorkExperience((prev) => prev.map((exp, i) => (i === index ? { ...exp, [field]: value } : exp)));
  };

  const uploadProfileFile = async (file: File, field: keyof Profile, folder: string) => {
    if (!profile) return;
    toast("Uploading file…", "upload");
    const oldUrl = profile[field] as string | null;
    if (oldUrl) {
      try {
        const marker = `/object/public/${BUCKET}/`;
        const idx = oldUrl.indexOf(marker);
        if (idx !== -1) { const oldPath = decodeURIComponent(oldUrl.slice(idx + marker.length).split("?")[0]); await supabase.storage.from(BUCKET).remove([oldPath]); }
      } catch (e) { console.warn("Could not delete old file:", e); }
    }
    const url = await uploadFile(supabase, file, folder);
    if (!url) { toast("Upload failed.", "error"); return; }
    const updatedProfile = { ...profile, [field]: url };
    const { data: upserted, error: upsertErr } = await supabase.from("profile").upsert(updatedProfile, { onConflict: "id" }).select().single();
    if (upsertErr) { toast(`DB error: ${upsertErr.message}`, "error"); return; }
    if (upserted) setProfile(upserted);
    setImgKey((k) => k + 1);
    toast("Photo updated successfully!", "success");
  };

  if (loading) return <div className="flex justify-center py-16"><RefreshCw className="w-6 h-6 animate-spin text-muted-foreground" /></div>;
  if (!profile) return <div className="text-center py-16 text-muted-foreground">No profile found in database.</div>;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div><h2 className="text-2xl font-bold">Profile</h2><p className="text-muted-foreground">Update your personal information</p></div>
        <Button onClick={handleSave} disabled={saving || saved}><Save className="w-4 h-4 mr-2" />{saved ? "Saved!" : saving ? "Saving..." : "Save Changes"}</Button>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Avatar & Files */}
        <Card className="bg-card/50">
          <CardHeader><CardTitle className="text-base">Profile Photo & Files</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <div className="flex flex-col items-center gap-3">
              <div className="w-24 h-24 rounded-full border-4 border-primary/20 overflow-hidden bg-primary/10 flex items-center justify-center">
                {profile.profile_picture_url ? <img key={imgKey} src={profile.profile_picture_url} alt="avatar" className="w-full h-full object-cover" /> : <User className="w-10 h-10 text-primary" />}
              </div>
              <input ref={avatarRef} type="file" accept="image/*" className="hidden" onChange={(e) => { const f = e.target.files?.[0]; if (f) uploadProfileFile(f, "profile_picture_url", "avatars"); }} />
              <Button variant="outline" size="sm" onClick={() => avatarRef.current?.click()}><Upload className="w-3.5 h-3.5 mr-1" />Change Photo</Button>
            </div>
            <div className="space-y-3 pt-2">
              {[
                { label: "Resume (PDF)", field: "resume_url" as keyof Profile, ref: resumeRef, folder: "resumes", accept: ".pdf" },
                { label: "CV (PDF)", field: "cv_url" as keyof Profile, ref: cvRef, folder: "cvs", accept: ".pdf" },
              ].map(({ label, field, ref, folder, accept }) => (
                <div key={field} className="space-y-1">
                  <label className="text-xs font-medium text-muted-foreground">{label}</label>
                  <div className="flex items-center gap-2">
                    <input ref={ref} type="file" accept={accept} className="hidden" onChange={(e) => { const f = e.target.files?.[0]; if (f) uploadProfileFile(f, field, folder); }} />
                    <Button variant="outline" size="sm" className="flex-1 text-xs" onClick={() => ref.current?.click()}><Upload className="w-3 h-3 mr-1" />{profile[field] ? "Replace" : "Upload"}</Button>
                    {profile[field] && <a href={profile[field] as string} target="_blank" rel="noopener noreferrer"><ExternalLink className="w-3.5 h-3.5 text-primary" /></a>}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Basic Info */}
        <Card className="bg-card/50 lg:col-span-2">
          <CardHeader><CardTitle className="text-base">Basic Information</CardTitle></CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2"><label className="text-sm font-medium flex items-center gap-1"><User className="w-3.5 h-3.5" />Full Name</label><Input value={profile.name} onChange={(e) => setProfile({ ...profile, name: e.target.value })} /></div>
                <div className="space-y-2"><label className="text-sm font-medium flex items-center gap-1"><Briefcase className="w-3.5 h-3.5" />Professional Title</label><Input value={profile.title || ""} onChange={(e) => setProfile({ ...profile, title: e.target.value })} /></div>
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2"><label className="text-sm font-medium flex items-center gap-1"><Mail className="w-3.5 h-3.5" />Email</label><Input type="email" value={profile.email || ""} onChange={(e) => setProfile({ ...profile, email: e.target.value })} /></div>
                <div className="space-y-2"><label className="text-sm font-medium flex items-center gap-1"><MapPin className="w-3.5 h-3.5" />Location</label><Input value={profile.location || ""} onChange={(e) => setProfile({ ...profile, location: e.target.value })} /></div>
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2"><label className="text-sm font-medium flex items-center gap-1"><Linkedin className="w-3.5 h-3.5" />LinkedIn URL</label><Input value={profile.linkedin || ""} onChange={(e) => setProfile({ ...profile, linkedin: e.target.value })} placeholder="https://linkedin.com/in/..." /></div>
                <div className="space-y-2"><label className="text-sm font-medium flex items-center gap-1"><Github className="w-3.5 h-3.5" />GitHub URL</label><Input value={profile.github || ""} onChange={(e) => setProfile({ ...profile, github: e.target.value })} placeholder="https://github.com/..." /></div>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium flex items-center gap-2"><span className="w-3.5 h-3.5 inline-flex items-center justify-center"><span className="w-2 h-2 rounded-full bg-green-500 inline-block" /></span>Availability Status</label>
                <Select value={profile.availability_status ?? "none"} onValueChange={(v) => setProfile({ ...profile, availability_status: v === "none" ? null : v as Profile["availability_status"] })}>
                  <SelectTrigger><SelectValue placeholder="Select status..." /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">— Not shown —</SelectItem>
                    <SelectItem value="available">🟢 Open to Work</SelectItem>
                    <SelectItem value="freelance">🔵 Available for Freelance</SelectItem>
                    <SelectItem value="employed">🟡 Currently Employed</SelectItem>
                  </SelectContent>
                </Select>
                <p className="text-xs text-muted-foreground">Displays a status badge on your hero section. Leave blank to hide it.</p>
              </div>
              <div className="grid gap-4 sm:grid-cols-3">
                <div className="space-y-2">
                  <label className="text-sm font-medium flex items-center gap-1">
                    <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 24 24"><path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/></svg>
                    Facebook URL
                  </label>
                  <Input value={profile.facebook || ""} onChange={(e) => setProfile({ ...profile, facebook: e.target.value })} placeholder="https://facebook.com/..." />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium flex items-center gap-1">
                    <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z"/></svg>
                    Instagram URL
                  </label>
                  <Input value={profile.instagram || ""} onChange={(e) => setProfile({ ...profile, instagram: e.target.value })} placeholder="https://instagram.com/..." />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium flex items-center gap-1">
                    <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 24 24"><path d="M19.59 6.69a4.83 4.83 0 01-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 01-2.88 2.5 2.89 2.89 0 01-2.89-2.89 2.89 2.89 0 012.89-2.89c.28 0 .54.04.79.1V9.01a6.33 6.33 0 00-.79-.05 6.34 6.34 0 00-6.34 6.34 6.34 6.34 0 006.34 6.34 6.34 6.34 0 006.33-6.34V8.69a8.21 8.21 0 004.79 1.52V6.75a4.85 4.85 0 01-1.02-.06z"/></svg>
                    TikTok URL
                  </label>
                  <Input value={profile.tiktok || ""} onChange={(e) => setProfile({ ...profile, tiktok: e.target.value })} placeholder="https://tiktok.com/@..." />
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Bio */}
        <Card className="bg-card/50 lg:col-span-3">
          <CardHeader><CardTitle className="text-base">Bio</CardTitle><CardDescription>Tell visitors about yourself</CardDescription></CardHeader>
          <CardContent>
            <Textarea value={profile.bio || ""} onChange={(e) => setProfile({ ...profile, bio: e.target.value })} rows={5} className="resize-none" />
            <p className="text-xs text-muted-foreground mt-2">{(profile.bio || "").length} characters</p>
          </CardContent>
        </Card>

        {/* Experience & Education Summary */}
        <Card className="bg-card/50 lg:col-span-3">
          <CardHeader><CardTitle className="text-base">Experience & Education Summary</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2"><label className="text-sm font-medium flex items-center gap-1"><Briefcase className="w-3.5 h-3.5" />Current Experience</label><Input value={profile.experience || ""} onChange={(e) => setProfile({ ...profile, experience: e.target.value })} placeholder="e.g., Full Stack Developer" /></div>
            <div className="space-y-2"><label className="text-sm font-medium flex items-center gap-1"><GraduationCap className="w-3.5 h-3.5" />Education</label><Input value={profile.education || ""} onChange={(e) => setProfile({ ...profile, education: e.target.value })} placeholder="e.g., B.S. Computer Science" /></div>
          </CardContent>
        </Card>

        {/* Work Experience Timeline */}
        <Card className="bg-card/50 lg:col-span-3">
          <CardHeader className="flex flex-row items-center justify-between">
            <div><CardTitle className="text-base">Work Experience Timeline</CardTitle><CardDescription>Manage your detailed work history</CardDescription></div>
            <Dialog open={isExpModalOpen} onOpenChange={setIsExpModalOpen}>
              <DialogTrigger asChild><Button variant="outline" size="sm"><Plus className="w-4 h-4 mr-2" />Add Experience</Button></DialogTrigger>
              <DialogContent className="max-w-md">
                <DialogHeader><DialogTitle>Add Work Experience</DialogTitle><DialogDescription>Add a new entry to your timeline. Remember to save changes afterward.</DialogDescription></DialogHeader>
                <div className="space-y-4 py-2">
                  <div className="space-y-2"><label className="text-sm font-medium">Company / Project *</label><Input value={newExp.title} onChange={(e) => setNewExp({...newExp, title: e.target.value})} placeholder="e.g. Acme Corp" /></div>
                  <div className="space-y-2"><label className="text-sm font-medium">Role</label><Input value={newExp.role || ""} onChange={(e) => setNewExp({...newExp, role: e.target.value})} placeholder="e.g. Lead Developer" /></div>
                  <div className="space-y-2"><label className="text-sm font-medium">Period</label><Input value={newExp.period || ""} onChange={(e) => setNewExp({...newExp, period: e.target.value})} placeholder="e.g. 2022 - Present" /></div>
                  <div className="space-y-2"><label className="text-sm font-medium">Description</label><Textarea value={newExp.description || ""} onChange={(e) => setNewExp({...newExp, description: e.target.value})} placeholder="Briefly describe your achievements..." rows={3} /></div>
                </div>
                <DialogFooter>
                  <DialogClose asChild><Button variant="outline">Cancel</Button></DialogClose>
                  <Button onClick={confirmAddEntry} disabled={!newExp.title}>Add Entry</Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </CardHeader>
          <CardContent className="space-y-4">
            {workExperience.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-8">No work experience yet. Click &quot;Add Experience&quot; to start.</p>
            ) : (
              workExperience.map((exp, i) => (
                <div key={exp.id} className="p-4 rounded-lg bg-secondary/50 border border-border space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-muted-foreground flex items-center gap-1.5">
                      <GripVertical className="w-4 h-4" />Entry #{i + 1}
                      {exp.id.startsWith("new-") && <Badge variant="outline" className="text-[10px] px-1.5 py-0 text-primary border-primary/30">New</Badge>}
                    </span>
                    <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive hover:text-destructive" onClick={() => removeEntry(i)}><Trash2 className="w-4 h-4" /></Button>
                  </div>
                  <div className="grid gap-3 sm:grid-cols-3">
                    <div className="space-y-1"><label className="text-xs font-medium">Company *</label><Input value={exp.title} onChange={(e) => updateEntry(i, "title", e.target.value)} /></div>
                    <div className="space-y-1"><label className="text-xs font-medium">Role</label><Input value={exp.role || ""} onChange={(e) => updateEntry(i, "role", e.target.value)} /></div>
                    <div className="space-y-1"><label className="text-xs font-medium">Period</label><Input value={exp.period || ""} onChange={(e) => updateEntry(i, "period", e.target.value)} /></div>
                  </div>
                  <div className="space-y-1"><label className="text-xs font-medium">Description</label><Textarea value={exp.description || ""} onChange={(e) => updateEntry(i, "description", e.target.value)} rows={2} /></div>
                </div>
              ))
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
