"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger, DialogFooter, DialogClose } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, Pencil, Trash2, RefreshCw, Sparkles, TrendingUp, BookOpen, Code } from "lucide-react";
import { toast } from "./toast";
import { PROFICIENCY_LEVELS } from "./utils";
import type { Skill } from "./types";

const ICON_COLORS: Record<string, string> = {
  html: "#E34F26", css: "#1572B6", javascript: "#F7DF1E", typescript: "#3178C6",
  react: "#61DAFB", nextjs: "#888888", tailwind: "#06B6D4", java: "#ED8B00",
  python: "#3776AB", cpp: "#00599C", csharp: "#239120", git: "#F05032",
  docker: "#2496ED", sql: "#336791", php: "#777BB4", wordpress: "#21759B",
  vbnet: "#5C2D91", database: "#FF6B35", design: "#FF4088", prototype: "#A259FF",
  docs: "#4A90D9", default: "#6B7280",
};

function getIconKey(name: string, iconKey?: string): string {
  const n = name.toLowerCase(); const k = (iconKey || "").toLowerCase();
  if (n.includes("html") || k === "html") return "html";
  if (n.includes("css") || k === "css") return "css";
  if ((n.includes("javascript") || n === "js") && !n.includes("type")) return "javascript";
  if (n.includes("typescript") || k === "typescript") return "typescript";
  if (n.includes("react")) return "react";
  if (n.includes("next")) return "nextjs";
  if (n.includes("tailwind")) return "tailwind";
  if (n.includes("java") && !n.includes("script")) return "java";
  if (n.includes("python")) return "python";
  if (n.includes("c++") || n.includes("cpp")) return "cpp";
  if (n.includes("c#")) return "csharp";
  if (n.includes("git")) return "git";
  if (n.includes("docker")) return "docker";
  if (n.includes("sql") || n.includes("postgres")) return "sql";
  if (n.includes("php")) return "php";
  if (n.includes("wordpress")) return "wordpress";
  if (n.includes("vb") || n.includes("visual basic")) return "vbnet";
  if (n.includes("database")) return "database";
  if (n.includes("ui") || n.includes("ux") || n.includes("design")) return "design";
  if (n.includes("prototype")) return "prototype";
  if (n.includes("document") || n.includes("docs")) return "docs";
  return "default";
}

const PROFICIENCY_INFO: Record<string, { label: string; icon: React.ReactNode; color: string }> = {
  expert:       { label: "Expert",       icon: <Sparkles className="w-4 h-4" />,   color: "bg-primary/20 text-primary" },
  experienced:  { label: "Experienced",  icon: <TrendingUp className="w-4 h-4" />, color: "bg-accent/20 text-accent-foreground" },
  intermediate: { label: "Intermediate", icon: <Code className="w-4 h-4" />,       color: "bg-secondary text-secondary-foreground" },
  beginner:     { label: "Learning",     icon: <BookOpen className="w-4 h-4" />,   color: "bg-muted text-muted-foreground" },
};

const ICON_KEYS = [
  { value: "html", label: "HTML" }, { value: "css", label: "CSS" }, { value: "javascript", label: "JavaScript" },
  { value: "typescript", label: "TypeScript" }, { value: "react", label: "React" }, { value: "nextjs", label: "Next.js" },
  { value: "tailwind", label: "Tailwind CSS" }, { value: "design", label: "UI/UX Design" }, { value: "prototype", label: "Prototyping" },
  { value: "docs", label: "Documentation" }, { value: "java", label: "Java" }, { value: "python", label: "Python" },
  { value: "cpp", label: "C++" }, { value: "csharp", label: "C#" }, { value: "php", label: "PHP" },
  { value: "vbnet", label: "VB.NET" }, { value: "sql", label: "SQL / PostgreSQL" }, { value: "database", label: "Database Integration" },
  { value: "wordpress", label: "WordPress" }, { value: "git", label: "Git" }, { value: "docker", label: "Docker" },
  { value: "figma", label: "Figma" }, { value: "vscode", label: "VS Code" }, { value: "postman", label: "Postman" },
  { value: "linux", label: "Linux" }, { value: "aws", label: "AWS" }, { value: "firebase", label: "Firebase" },
  { value: "vercel", label: "Vercel" }, { value: "github", label: "GitHub" }, { value: "code", label: "Generic / Code" },
];

export function SkillsManager() {
  const supabase = createClient();
  const [skills, setSkills] = useState<Skill[]>([]);
  const [loading, setLoading] = useState(true);
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [editingSkill, setEditingSkill] = useState<Skill | null>(null);
  const [newSkill, setNewSkill] = useState({ name: "", icon: "code", category: "frontend" as "frontend" | "backend" | "tools", proficiency_level: "intermediate" as Skill["proficiency_level"], description: "" });

  useEffect(() => {
    supabase.from("skills").select("*").order("sort_order").then(({ data }) => { setSkills(data || []); setLoading(false); });
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const handleAdd = async () => {
    if (!newSkill.name) return;
    setSaving(true);
    try {
      const payload = { name: newSkill.name, icon: newSkill.icon, category: newSkill.category, proficiency_level: newSkill.proficiency_level, description: newSkill.description.trim() || null, sort_order: skills.length };
      const { data, error } = await supabase.from("skills").insert(payload).select().single();
      if (error) { toast("Failed to add skill.", "error"); setSaving(false); return; }
      if (data) setSkills([...skills, data]);
      setNewSkill({ name: "", icon: "code", category: "frontend", proficiency_level: "intermediate", description: "" });
      setIsAddOpen(false);
      toast("Skill added successfully!", "success");
    } finally { setSaving(false); }
  };

  const handleUpdate = async () => {
    if (!editingSkill) return;
    setSaving(true);
    const { error } = await supabase.from("skills").update({ name: editingSkill.name, icon: editingSkill.icon, category: editingSkill.category, proficiency_level: editingSkill.proficiency_level, description: editingSkill.description || null }).eq("id", editingSkill.id);
    if (error) { toast("Failed to save changes.", "error"); setSaving(false); return; }
    setSkills(skills.map((s) => (s.id === editingSkill.id ? editingSkill : s)));
    setEditingSkill(null); setSaving(false);
    toast("Skill saved successfully!", "success");
  };

  const handleDelete = async (id: string) => {
    await supabase.from("skills").delete().eq("id", id);
    setSkills(skills.filter((s) => s.id !== id));
    toast("Skill deleted.", "info");
  };

  const moveLevel = async (skill: Skill, level: Skill["proficiency_level"]) => {
    await supabase.from("skills").update({ proficiency_level: level }).eq("id", skill.id);
    setSkills(skills.map((s) => (s.id === skill.id ? { ...s, proficiency_level: level } : s)));
    toast("Proficiency level updated.", "success");
  };

  const grouped = PROFICIENCY_LEVELS.reduce((acc, level) => {
    acc[level] = skills.filter((s) => s.proficiency_level === level);
    return acc;
  }, {} as Record<string, Skill[]>);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div><h2 className="text-2xl font-bold">Skills</h2><p className="text-muted-foreground">{skills.length} skills total</p></div>
        <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
          <DialogTrigger asChild><Button><Plus className="w-4 h-4 mr-2" />Add Skill</Button></DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle>Add New Skill</DialogTitle></DialogHeader>
            <div className="space-y-4">
              <div className="space-y-2"><label className="text-sm font-medium">Skill Name *</label><Input value={newSkill.name} onChange={(e) => setNewSkill({ ...newSkill, name: e.target.value })} placeholder="e.g., React, Python, Figma" /></div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Icon</label>
                <Select value={newSkill.icon} onValueChange={(v) => setNewSkill({ ...newSkill, icon: v })}>
                  <SelectTrigger><SelectValue placeholder="Select icon..." /></SelectTrigger>
                  <SelectContent className="max-h-60">{ICON_KEYS.map((k) => <SelectItem key={k.value} value={k.value}>{k.label}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Category</label>
                  <Select value={newSkill.category} onValueChange={(v) => setNewSkill({ ...newSkill, category: v as "frontend" | "backend" | "tools" })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent><SelectItem value="frontend">Frontend</SelectItem><SelectItem value="backend">Backend</SelectItem><SelectItem value="tools">Tools & Others</SelectItem></SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Proficiency</label>
                  <Select value={newSkill.proficiency_level || "intermediate"} onValueChange={(v) => setNewSkill({ ...newSkill, proficiency_level: v as Skill["proficiency_level"] })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>{PROFICIENCY_LEVELS.map((l) => <SelectItem key={l} value={l}>{PROFICIENCY_INFO[l].label}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
              </div>
              <div className="space-y-2"><label className="text-sm font-medium">Description (optional)</label><Input value={newSkill.description} onChange={(e) => setNewSkill({ ...newSkill, description: e.target.value })} placeholder="Short description..." /></div>
            </div>
            <DialogFooter>
              <DialogClose asChild><Button variant="outline">Cancel</Button></DialogClose>
              <Button onClick={handleAdd} disabled={saving || !newSkill.name}>{saving ? "Saving..." : "Add Skill"}</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {loading ? <div className="flex justify-center py-16"><RefreshCw className="w-6 h-6 animate-spin text-muted-foreground" /></div> : (
        <div className="grid gap-6 lg:grid-cols-2 xl:grid-cols-4">
          {PROFICIENCY_LEVELS.map((level) => (
            <Card key={level} className="bg-card/50">
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2 text-base">
                  <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${PROFICIENCY_INFO[level].color}`}>{PROFICIENCY_INFO[level].icon}</div>
                  <div><span>{PROFICIENCY_INFO[level].label}</span><p className="text-xs font-normal text-muted-foreground">{grouped[level]?.length || 0} skills</p></div>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {(grouped[level] || []).map((skill) => (
                  <div key={skill.id} className="flex items-center justify-between p-2 rounded-lg bg-secondary/50 group">
                    <div className="flex items-center gap-2">
                      <div className="w-6 h-6 rounded flex items-center justify-center text-muted-foreground shrink-0" style={{ background: `${ICON_COLORS[getIconKey(skill.name, skill.icon)]}18` }}>
                        <span style={{ color: ICON_COLORS[getIconKey(skill.name, skill.icon)] }} className="text-[10px] font-bold">{skill.name.slice(0, 2).toUpperCase()}</span>
                      </div>
                      <div><p className="text-sm font-medium">{skill.name}</p><p className="text-xs text-muted-foreground capitalize">{skill.category}</p></div>
                    </div>
                    <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => setEditingSkill(skill)}><Pencil className="w-3 h-3" /></Button>
                      <Select value={level} onValueChange={(v) => moveLevel(skill, v as Skill["proficiency_level"])}>
                        <SelectTrigger className="h-7 w-7 p-0 border-0 bg-transparent"><TrendingUp className="w-3 h-3" /></SelectTrigger>
                        <SelectContent>{PROFICIENCY_LEVELS.map((l) => <SelectItem key={l} value={l} disabled={l === level}>→ {PROFICIENCY_INFO[l].label}</SelectItem>)}</SelectContent>
                      </Select>
                      <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive hover:text-destructive" onClick={() => handleDelete(skill.id)}><Trash2 className="w-3 h-3" /></Button>
                    </div>
                  </div>
                ))}
                {(grouped[level] || []).length === 0 && <p className="text-sm text-muted-foreground text-center py-4">No skills here</p>}
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <Dialog open={!!editingSkill} onOpenChange={(open) => { if (!open) setEditingSkill(null); }}>
        <DialogContent>
          <DialogHeader><DialogTitle>Edit Skill</DialogTitle><DialogDescription>Modify the skill details. Changes are saved to the database.</DialogDescription></DialogHeader>
          {editingSkill && (
            <div className="space-y-4">
              <div className="space-y-2"><label className="text-sm font-medium">Skill Name *</label><Input value={editingSkill.name} onChange={(e) => setEditingSkill({ ...editingSkill, name: e.target.value })} placeholder="e.g., React, Python, Figma" /></div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Icon</label>
                <Select value={editingSkill.icon} onValueChange={(v) => setEditingSkill({ ...editingSkill, icon: v })}>
                  <SelectTrigger><SelectValue placeholder="Select icon..." /></SelectTrigger>
                  <SelectContent className="max-h-60">{ICON_KEYS.map((k) => <SelectItem key={k.value} value={k.value}>{k.label}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Category</label>
                  <Select value={editingSkill.category} onValueChange={(v) => setEditingSkill({ ...editingSkill, category: v as "frontend" | "backend" | "tools" })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent><SelectItem value="frontend">Frontend</SelectItem><SelectItem value="backend">Backend</SelectItem><SelectItem value="tools">Tools & Others</SelectItem></SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Proficiency</label>
                  <Select value={editingSkill.proficiency_level || "intermediate"} onValueChange={(v) => setEditingSkill({ ...editingSkill, proficiency_level: v as Skill["proficiency_level"] })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>{PROFICIENCY_LEVELS.map((l) => <SelectItem key={l} value={l}>{PROFICIENCY_INFO[l].label}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
              </div>
              <div className="space-y-2"><label className="text-sm font-medium">Description (optional)</label><Textarea value={editingSkill.description || ""} onChange={(e) => setEditingSkill({ ...editingSkill, description: e.target.value })} placeholder="Short description..." rows={3} className="resize-none" /></div>
            </div>
          )}
          <DialogFooter>
            <DialogClose asChild><Button variant="outline">Cancel</Button></DialogClose>
            <Button onClick={handleUpdate} disabled={saving || !editingSkill?.name}>{saving ? "Saving..." : "Save Changes"}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
