"use client";

import { useState, useEffect, useRef, useCallback, RefObject } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger, DialogFooter, DialogClose } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import {
  LayoutDashboard, FolderKanban, Award, Sparkles, User, Home,
  MessageSquare, Mail, Clock, CheckCircle2, Trash2, RefreshCw,
  TrendingUp, Plus, Pencil, GripVertical, ExternalLink, Github,
  Star, Image, Save, MapPin, Linkedin, Briefcase, GraduationCap,
  LogOut, KeyRound, AlertCircle, Upload, X, Eye, EyeOff, Code,
  BookOpen, FileText,
} from "lucide-react";

// ─── Types ────────────────────────────────────────────────────────────────────

interface ContactMessage {
  id: string; name: string; email: string; subject?: string;
  message: string; created_at: string; is_read: boolean;
}

interface Profile {
  id: string; name: string; title: string | null; email: string | null;
  linkedin: string | null; github: string | null; location: string | null;
  bio: string | null; experience: string | null; education: string | null;
  profile_picture_url: string | null; resume_url: string | null;
  cv_url: string | null; portfolio_pptx_url: string | null;
}

interface Skill {
  id: string; name: string; icon: string;
  category: "frontend" | "backend";
  description: string | null;
  proficiency_level: "beginner" | "intermediate" | "experienced" | "expert" | null;
  sort_order: number;
}

interface Project {
  id: string; title: string; description: string | null; tags: string[];
  live_url: string | null; github_url: string | null; image_url: string | null;
  type: string | null; featured: boolean; sort_order: number;
}

interface Certificate {
  id: string; title: string; issuer: string; date: string | null;
  description: string | null; category: string | null;
  certificate_url: string | null; featured: boolean; sort_order: number;
}

interface WorkExperience {
  id: string; title: string; role: string | null;
  period: string | null; description: string | null; sort_order: number;
}

// ─── Storage helper ───────────────────────────────────────────────────────────

const BUCKET = "portfolio-assets";

async function uploadFile(
  supabase: ReturnType<typeof createClient>,
  file: File,
  folder: string
): Promise<string | null> {
  const ext = file.name.split(".").pop();
  const path = `${folder}/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;
  const { error } = await supabase.storage.from(BUCKET).upload(path, file, { upsert: true });
  if (error) { console.error("Upload error:", error); return null; }
  const { data } = supabase.storage.from(BUCKET).getPublicUrl(path);
  return data.publicUrl;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatDate(dateString: string) {
  const date = new Date(dateString);
  const now = new Date();
  const diff = now.getTime() - date.getTime();
  const hours = Math.floor(diff / (1000 * 60 * 60));
  const days = Math.floor(hours / 24);
  if (hours < 1) return "Just now";
  if (hours < 24) return `${hours}h ago`;
  if (days < 7) return `${days}d ago`;
  return date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

function isPdfUrl(url: string) {
  return url.toLowerCase().includes(".pdf") || url.toLowerCase().includes("application/pdf");
}

function CertThumbnail({ url, title }: { url: string; title: string }) {
  if (isPdfUrl(url)) {
    return (
      <div className="w-16 h-12 rounded-lg border bg-muted flex flex-col items-center justify-center shrink-0 gap-0.5">
        <FileText className="w-5 h-5 text-primary" />
        <span className="text-[9px] text-muted-foreground font-medium">PDF</span>
      </div>
    );
  }
  return (
    <div className="w-16 h-12 rounded-lg overflow-hidden border shrink-0">
      <img src={url} alt={title} className="w-full h-full object-cover"
        onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }} />
    </div>
  );
}

const CERT_CATEGORIES = ["Design", "Management", "Analytics", "Programming", "AI", "Technical", "Security", "Technology"];
const PROFICIENCY_LEVELS = ["beginner", "intermediate", "experienced", "expert"] as const;

// ═══════════════════════════════════════════════════════════════════════════════
// MAIN DASHBOARD
// ═══════════════════════════════════════════════════════════════════════════════

export function AdminDashboard() {
  const router = useRouter();
  const supabase = createClient();
  const [activeTab, setActiveTab] = useState("overview");

  const [messages, setMessages] = useState<ContactMessage[]>([]);
  const [isLoadingMessages, setIsLoadingMessages] = useState(true);
  const [stats, setStats] = useState({ totalMessages: 0, unreadMessages: 0, todayMessages: 0 });
  const [overviewCounts, setOverviewCounts] = useState({ projects: 0, certificates: 0 });

  const fetchMessages = useCallback(async () => {
    setIsLoadingMessages(true);
    try {
      const { data } = await supabase.from("contact_messages").select("*").order("created_at", { ascending: false });
      const msgs = data || [];
      setMessages(msgs);
      const today = new Date().toDateString();
      setStats({
        totalMessages: msgs.length,
        unreadMessages: msgs.filter((m: ContactMessage) => !m.is_read).length,
        todayMessages: msgs.filter((m: ContactMessage) => new Date(m.created_at).toDateString() === today).length,
      });
    } catch (e) { console.error(e); }
    finally { setIsLoadingMessages(false); }
  }, [supabase]);

  const fetchCounts = useCallback(async () => {
    const [{ count: projCount }, { count: certCount }] = await Promise.all([
      supabase.from("projects").select("*", { count: "exact", head: true }),
      supabase.from("certificates").select("*", { count: "exact", head: true }),
    ]);
    setOverviewCounts({ projects: projCount ?? 0, certificates: certCount ?? 0 });
  }, [supabase]);

  useEffect(() => { fetchMessages(); fetchCounts(); }, [fetchMessages, fetchCounts]);

  const markAsRead = async (id: string) => {
    await supabase.from("contact_messages").update({ is_read: true }).eq("id", id);
    setMessages((prev) => prev.map((m) => (m.id === id ? { ...m, is_read: true } : m)));
    setStats((prev) => ({ ...prev, unreadMessages: Math.max(0, prev.unreadMessages - 1) }));
  };

  const deleteMessage = async (id: string) => {
    const msg = messages.find((m) => m.id === id);
    await supabase.from("contact_messages").delete().eq("id", id);
    setMessages((prev) => prev.filter((m) => m.id !== id));
    setStats((prev) => ({
      ...prev,
      totalMessages: prev.totalMessages - 1,
      unreadMessages: msg && !msg.is_read ? prev.unreadMessages - 1 : prev.unreadMessages,
    }));
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push("/admin");
  };

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-50 border-b border-border bg-card/80 backdrop-blur-xl">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
              <LayoutDashboard className="w-5 h-5 text-primary" />
            </div>
            <div>
              <h1 className="font-bold text-lg">Admin Dashboard</h1>
              <p className="text-xs text-muted-foreground">Manage your portfolio</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <ChangePasswordDialog />
            <Button variant="ghost" size="sm" asChild>
              <a href="/" target="_blank" rel="noopener noreferrer"><Home className="w-4 h-4 mr-2" />View Site</a>
            </Button>
            <Button variant="ghost" size="sm" onClick={handleLogout} className="text-destructive hover:text-destructive">
              <LogOut className="w-4 h-4 mr-2" />Sign Out
            </Button>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid grid-cols-6 w-full max-w-3xl">
            <TabsTrigger value="overview"><LayoutDashboard className="w-4 h-4" /><span className="hidden sm:inline ml-1.5">Overview</span></TabsTrigger>
            <TabsTrigger value="messages" className="relative">
              <MessageSquare className="w-4 h-4" /><span className="hidden sm:inline ml-1.5">Messages</span>
              {stats.unreadMessages > 0 && (
                <span className="absolute -top-1 -right-1 w-5 h-5 bg-primary text-primary-foreground text-xs rounded-full flex items-center justify-center">
                  {stats.unreadMessages}
                </span>
              )}
            </TabsTrigger>
            <TabsTrigger value="projects"><FolderKanban className="w-4 h-4" /><span className="hidden sm:inline ml-1.5">Projects</span></TabsTrigger>
            <TabsTrigger value="certificates"><Award className="w-4 h-4" /><span className="hidden sm:inline ml-1.5">Certs</span></TabsTrigger>
            <TabsTrigger value="skills"><Sparkles className="w-4 h-4" /><span className="hidden sm:inline ml-1.5">Skills</span></TabsTrigger>
            <TabsTrigger value="profile"><User className="w-4 h-4" /><span className="hidden sm:inline ml-1.5">Profile</span></TabsTrigger>
          </TabsList>

          {/* ── Overview ── */}
          <TabsContent value="overview" className="space-y-6">
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
              <StatsCard title="Total Messages" value={String(stats.totalMessages)} description="Contact submissions" icon={<MessageSquare className="w-4 h-4" />} trend={stats.todayMessages > 0 ? `+${stats.todayMessages} today` : undefined} />
              <StatsCard title="Unread Messages" value={String(stats.unreadMessages)} description="Awaiting response" icon={<Mail className="w-4 h-4" />} highlight={stats.unreadMessages > 0} />
              <StatsCard title="Projects" value={String(overviewCounts.projects)} description="Active projects" icon={<FolderKanban className="w-4 h-4" />} />
              <StatsCard title="Certificates" value={String(overviewCounts.certificates)} description="Total certificates" icon={<Award className="w-4 h-4" />} />
            </div>
            <div className="grid gap-4 md:grid-cols-2">
              <Card className="bg-card/50">
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <div><CardTitle className="text-base">Recent Messages</CardTitle><CardDescription>Latest contact submissions</CardDescription></div>
                  <Button variant="ghost" size="sm" onClick={() => setActiveTab("messages")}>View All</Button>
                </CardHeader>
                <CardContent>
                  {isLoadingMessages ? (
                    <div className="flex items-center justify-center py-8"><RefreshCw className="w-5 h-5 animate-spin text-muted-foreground" /></div>
                  ) : messages.length === 0 ? (
                    <div className="text-center py-8 text-muted-foreground"><MessageSquare className="w-8 h-8 mx-auto mb-2 opacity-50" /><p className="text-sm">No messages yet</p></div>
                  ) : (
                    <div className="space-y-3">
                      {messages.slice(0, 3).map((msg) => (
                        <div key={msg.id} className={`p-3 rounded-lg border ${msg.is_read ? "bg-secondary/30 border-border" : "bg-primary/5 border-primary/20"}`}>
                          <div className="flex items-start justify-between gap-2">
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2">
                                <p className="font-medium text-sm truncate">{msg.name}</p>
                                {!msg.is_read && <Badge variant="default" className="text-[10px] px-1.5 py-0">New</Badge>}
                              </div>
                              <p className="text-xs text-muted-foreground truncate">{msg.email}</p>
                              <p className="text-sm text-muted-foreground mt-1 line-clamp-1">{msg.message}</p>
                            </div>
                            <span className="text-xs text-muted-foreground/70 whitespace-nowrap">{formatDate(msg.created_at)}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
              <Card className="bg-card/50">
                <CardHeader><CardTitle className="text-base">Quick Actions</CardTitle><CardDescription>Common tasks</CardDescription></CardHeader>
                <CardContent className="space-y-2">
                  {[
                    { label: "View Messages", icon: <MessageSquare className="w-4 h-4 mr-2" />, tab: "messages", badge: stats.unreadMessages > 0 ? `${stats.unreadMessages} unread` : undefined },
                    { label: "Manage Projects", icon: <FolderKanban className="w-4 h-4 mr-2" />, tab: "projects" },
                    { label: "Add Certificate", icon: <Award className="w-4 h-4 mr-2" />, tab: "certificates" },
                    { label: "Update Profile", icon: <User className="w-4 h-4 mr-2" />, tab: "profile" },
                  ].map((action) => (
                    <Button key={action.tab} variant="ghost" className="w-full justify-start" onClick={() => setActiveTab(action.tab)}>
                      {action.icon}{action.label}
                      {action.badge && <Badge variant="secondary" className="ml-auto">{action.badge}</Badge>}
                    </Button>
                  ))}
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* ── Messages ── */}
          <TabsContent value="messages">
            <Card className="bg-card/50">
              <CardHeader className="flex flex-row items-center justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2"><MessageSquare className="w-5 h-5 text-primary" />Contact Messages</CardTitle>
                  <CardDescription>{stats.totalMessages} total, {stats.unreadMessages} unread</CardDescription>
                </div>
                <Button variant="outline" size="sm" onClick={fetchMessages} disabled={isLoadingMessages}>
                  <RefreshCw className={`w-4 h-4 mr-2 ${isLoadingMessages ? "animate-spin" : ""}`} />Refresh
                </Button>
              </CardHeader>
              <CardContent>
                {isLoadingMessages ? (
                  <div className="flex items-center justify-center py-16"><RefreshCw className="w-6 h-6 animate-spin text-muted-foreground" /></div>
                ) : messages.length === 0 ? (
                  <div className="text-center py-16">
                    <MessageSquare className="w-12 h-12 mx-auto mb-4 text-muted-foreground/30" />
                    <h3 className="font-medium text-lg mb-1">No messages yet</h3>
                    <p className="text-sm text-muted-foreground">When visitors send you a message, they&apos;ll appear here.</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {messages.map((msg) => (
                      <div key={msg.id} className={`p-4 rounded-xl border ${msg.is_read ? "bg-secondary/30 border-border" : "bg-primary/5 border-primary/20 shadow-sm"}`}>
                        <div className="flex items-start justify-between gap-4">
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-1">
                              <div className={`w-2 h-2 rounded-full ${msg.is_read ? "bg-muted-foreground/30" : "bg-primary"}`} />
                              <p className="font-semibold">{msg.name}</p>
                              {!msg.is_read && <Badge variant="default" className="text-xs">Unread</Badge>}
                            </div>
                            <a href={`mailto:${msg.email}`} className="text-sm text-primary hover:underline">{msg.email}</a>
                            {msg.subject && <p className="text-sm font-medium mt-1">Re: {msg.subject}</p>}
                            <p className="text-sm text-muted-foreground mt-2 whitespace-pre-wrap">{msg.message}</p>
                            <div className="flex items-center gap-1 mt-3 text-xs text-muted-foreground">
                              <Clock className="w-3 h-3" />
                              {new Date(msg.created_at).toLocaleString("en-US", { month: "short", day: "numeric", year: "numeric", hour: "numeric", minute: "2-digit" })}
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            {!msg.is_read && (
                              <Button variant="ghost" size="sm" onClick={() => markAsRead(msg.id)} title="Mark as read">
                                <CheckCircle2 className="w-4 h-4" />
                              </Button>
                            )}
                            <Button variant="ghost" size="sm" className="text-destructive hover:text-destructive" onClick={() => deleteMessage(msg.id)}>
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="projects"><ProjectsManager /></TabsContent>
          <TabsContent value="certificates"><CertificatesManager /></TabsContent>
          <TabsContent value="skills"><SkillsManager /></TabsContent>
          <TabsContent value="profile"><ProfileManager /></TabsContent>
        </Tabs>
      </main>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// CHANGE PASSWORD
// ═══════════════════════════════════════════════════════════════════════════════

function ChangePasswordDialog() {
  const supabase = createClient();
  const [open, setOpen] = useState(false);
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const handleChangePassword = async () => {
    setError(null);
    if (newPassword.length < 8) { setError("New password must be at least 8 characters."); return; }
    if (newPassword !== confirmPassword) { setError("Passwords do not match."); return; }
    setIsLoading(true);
    try {
      const { data: userData } = await supabase.auth.getUser();
      if (!userData.user?.email) { setError("Session error. Please sign in again."); return; }
      const { error: signInError } = await supabase.auth.signInWithPassword({ email: userData.user.email, password: currentPassword });
      if (signInError) { setError("Current password is incorrect."); return; }
      const { error: updateError } = await supabase.auth.updateUser({ password: newPassword });
      if (updateError) { setError(updateError.message); return; }
      setSuccess(true);
      setTimeout(() => { setOpen(false); setSuccess(false); setCurrentPassword(""); setNewPassword(""); setConfirmPassword(""); }, 2000);
    } catch { setError("An unexpected error occurred."); }
    finally { setIsLoading(false); }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="ghost" size="sm"><KeyRound className="w-4 h-4 mr-2" />Change Password</Button>
      </DialogTrigger>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2"><KeyRound className="w-4 h-4 text-primary" />Change Password</DialogTitle>
          <DialogDescription>Update your admin login password.</DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          {error && <div className="flex items-start gap-2 p-3 rounded-lg bg-destructive/10 border border-destructive/20 text-destructive text-sm"><AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />{error}</div>}
          {success && <div className="flex items-center gap-2 p-3 rounded-lg bg-green-500/10 border border-green-500/20 text-green-600 text-sm"><CheckCircle2 className="w-4 h-4" />Password updated successfully!</div>}
          <div className="space-y-2"><label className="text-sm font-medium">Current Password</label><Input type="password" value={currentPassword} onChange={(e) => setCurrentPassword(e.target.value)} placeholder="Enter current password" /></div>
          <div className="space-y-2">
            <label className="text-sm font-medium">New Password</label>
            <div className="relative">
              <Input type={showNew ? "text" : "password"} value={newPassword} onChange={(e) => setNewPassword(e.target.value)} placeholder="At least 8 characters" className="pr-10" />
              <button type="button" onClick={() => setShowNew(!showNew)} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground">{showNew ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}</button>
            </div>
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium">Confirm New Password</label>
            <div className="relative">
              <Input type={showConfirm ? "text" : "password"} value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} placeholder="Repeat new password" className="pr-10" />
              <button type="button" onClick={() => setShowConfirm(!showConfirm)} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground">{showConfirm ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}</button>
            </div>
          </div>
        </div>
        <DialogFooter>
          <DialogClose asChild><Button variant="outline">Cancel</Button></DialogClose>
          <Button onClick={handleChangePassword} disabled={isLoading || !currentPassword || !newPassword || !confirmPassword}>{isLoading ? "Updating..." : "Update Password"}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// PROJECTS MANAGER
// ═══════════════════════════════════════════════════════════════════════════════

function ProjectsManager() {
  const supabase = createClient();
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingProject, setEditingProject] = useState<Project | null>(null);
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [tagInput, setTagInput] = useState("");
  const imageInputRef = useRef<HTMLInputElement>(null);
  const [newProject, setNewProject] = useState<Omit<Project, "id" | "sort_order">>({
    title: "", description: null, tags: [], live_url: null, github_url: null, image_url: null, type: null, featured: false,
  });

  useEffect(() => {
    supabase.from("projects").select("*").order("sort_order").then(({ data }) => { setProjects(data || []); setLoading(false); });
  }, []);

  const uploadImage = async (file: File) => uploadFile(supabase, file, "projects");

  const handleAdd = async () => {
    if (!newProject.title) return;
    setSaving(true);
    const { data } = await supabase.from("projects").insert([{ ...newProject, sort_order: projects.length }]).select().single();
    if (data) setProjects([...projects, data]);
    setNewProject({ title: "", description: null, tags: [], live_url: null, github_url: null, image_url: null, type: null, featured: false });
    setTagInput(""); setIsAddOpen(false); setSaving(false);
  };

  const handleUpdate = async () => {
    if (!editingProject) return;
    setSaving(true);
    await supabase.from("projects").update(editingProject).eq("id", editingProject.id);
    setProjects(projects.map((p) => (p.id === editingProject.id ? editingProject : p)));
    setEditingProject(null); setSaving(false);
  };

  const handleDelete = async (id: string) => {
    await supabase.from("projects").delete().eq("id", id);
    setProjects(projects.filter((p) => p.id !== id));
  };

  const addTag = (tags: string[], setFn: (t: string[]) => void) => {
    if (tagInput.trim() && !tags.includes(tagInput.trim())) { setFn([...tags, tagInput.trim()]); setTagInput(""); }
  };
  const removeTag = (tag: string, tags: string[], setFn: (t: string[]) => void) => setFn(tags.filter((t) => t !== tag));

  const ProjectForm = ({ project, setProject }: { project: any; setProject: (p: any) => void }) => (
    <div className="space-y-4 max-h-[60vh] overflow-y-auto pr-2">
      <div className="space-y-2"><label className="text-sm font-medium">Title *</label><Input value={project.title} onChange={(e) => setProject({ ...project, title: e.target.value })} placeholder="Project title" /></div>
      <div className="space-y-2"><label className="text-sm font-medium">Type</label><Input value={project.type || ""} onChange={(e) => setProject({ ...project, type: e.target.value })} placeholder="e.g., Full-Stack Development" /></div>
      <div className="space-y-2"><label className="text-sm font-medium">Description</label><Textarea value={project.description || ""} onChange={(e) => setProject({ ...project, description: e.target.value })} rows={3} /></div>
      <div className="space-y-2"><label className="text-sm font-medium">Live URL</label><Input value={project.live_url || ""} onChange={(e) => setProject({ ...project, live_url: e.target.value })} placeholder="https://..." /></div>
      <div className="space-y-2"><label className="text-sm font-medium flex items-center gap-1"><Github className="w-3.5 h-3.5" />GitHub URL</label><Input value={project.github_url || ""} onChange={(e) => setProject({ ...project, github_url: e.target.value })} placeholder="https://github.com/..." /></div>
      <div className="space-y-2">
        <label className="text-sm font-medium flex items-center gap-1"><Image className="w-3.5 h-3.5" />Project Image</label>
        <Input value={project.image_url || ""} onChange={(e) => setProject({ ...project, image_url: e.target.value })} placeholder="https://... or upload below" />
        <div className="flex items-center gap-2">
          <input ref={imageInputRef} type="file" accept="image/*" className="hidden" onChange={async (e) => {
            const file = e.target.files?.[0]; if (!file) return;
            const url = await uploadImage(file); if (url) setProject({ ...project, image_url: url });
          }} />
          <Button type="button" variant="outline" size="sm" onClick={() => imageInputRef.current?.click()}><Upload className="w-3.5 h-3.5 mr-1" />Upload Image</Button>
        </div>
        {project.image_url && <img src={project.image_url} alt="preview" className="w-full h-28 object-cover rounded-lg border" />}
      </div>
      <div className="space-y-2">
        <label className="text-sm font-medium">Tags</label>
        <div className="flex gap-2">
          <Input value={tagInput} onChange={(e) => setTagInput(e.target.value)} placeholder="Add tag..." onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); addTag(project.tags, (t) => setProject({ ...project, tags: t })); } }} />
          <Button type="button" variant="outline" onClick={() => addTag(project.tags, (t) => setProject({ ...project, tags: t }))}>Add</Button>
        </div>
        <div className="flex flex-wrap gap-2">
          {(project.tags || []).map((tag: string) => (
            <Badge key={tag} variant="secondary" className="cursor-pointer gap-1" onClick={() => removeTag(tag, project.tags, (t) => setProject({ ...project, tags: t }))}>{tag}<X className="w-3 h-3" /></Badge>
          ))}
        </div>
      </div>
      <div className="flex items-center justify-between"><label className="text-sm font-medium">Featured</label><Switch checked={project.featured} onCheckedChange={(v) => setProject({ ...project, featured: v })} /></div>
    </div>
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div><h2 className="text-2xl font-bold">Projects</h2><p className="text-muted-foreground">Manage your portfolio projects</p></div>
        <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
          <DialogTrigger asChild><Button><Plus className="w-4 h-4 mr-2" />Add Project</Button></DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader><DialogTitle>Add New Project</DialogTitle></DialogHeader>
            <ProjectForm project={newProject} setProject={setNewProject} />
            <DialogFooter>
              <DialogClose asChild><Button variant="outline">Cancel</Button></DialogClose>
              <Button onClick={handleAdd} disabled={saving || !newProject.title}>{saving ? "Saving..." : "Add Project"}</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {loading ? <div className="flex justify-center py-16"><RefreshCw className="w-6 h-6 animate-spin text-muted-foreground" /></div> : (
        <div className="grid gap-4">
          {projects.map((project) => (
            <Card key={project.id} className="bg-card/50">
              <CardContent className="p-4">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex items-start gap-3 flex-1">
                    <GripVertical className="w-5 h-5 text-muted-foreground mt-1" />
                    {project.image_url && <img src={project.image_url} alt={project.title} className="w-16 h-12 object-cover rounded-lg border shrink-0" />}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="font-semibold truncate">{project.title}</h3>
                        {project.type && <Badge variant="outline" className="text-xs">{project.type}</Badge>}
                        {project.featured && <Star className="w-3.5 h-3.5 text-primary fill-primary" />}
                      </div>
                      <p className="text-sm text-muted-foreground line-clamp-2 mb-2">{project.description}</p>
                      <div className="flex flex-wrap gap-1">{(project.tags || []).map((tag) => <Badge key={tag} variant="secondary" className="text-xs">{tag}</Badge>)}</div>
                    </div>
                  </div>
                  <div className="flex items-center gap-1">
                    {project.live_url && <Button variant="ghost" size="icon" asChild><a href={project.live_url} target="_blank" rel="noopener noreferrer"><ExternalLink className="w-4 h-4" /></a></Button>}
                    {project.github_url && <Button variant="ghost" size="icon" asChild><a href={project.github_url} target="_blank" rel="noopener noreferrer"><Github className="w-4 h-4" /></a></Button>}
                    <Dialog>
                      <DialogTrigger asChild><Button variant="ghost" size="icon" onClick={() => setEditingProject(project)}><Pencil className="w-4 h-4" /></Button></DialogTrigger>
                      <DialogContent className="max-w-2xl">
                        <DialogHeader><DialogTitle>Edit Project</DialogTitle></DialogHeader>
                        {editingProject && <ProjectForm project={editingProject} setProject={setEditingProject} />}
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

// ═══════════════════════════════════════════════════════════════════════════════
// CERTIFICATES MANAGER
// ═══════════════════════════════════════════════════════════════════════════════

function CertificatesManager() {
  const supabase = createClient();
  const [certificates, setCertificates] = useState<Certificate[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingCert, setEditingCert] = useState<Certificate | null>(null);
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [filter, setFilter] = useState("all");
  
  // Using explicit union type for refs to prevent TS errors in child components
  const fileInputRef = useRef<HTMLInputElement>(null);
  const editFileInputRef = useRef<HTMLInputElement>(null);

  const [newCert, setNewCert] = useState<Omit<Certificate, "id" | "sort_order">>({
    title: "", issuer: "", date: null, description: null, category: "Programming", certificate_url: null, featured: false,
  });

  useEffect(() => {
    supabase.from("certificates").select("*").order("sort_order").then(({ data }) => { setCertificates(data || []); setLoading(false); });
  }, []);

  const handleAdd = async () => {
    if (!newCert.title || !newCert.issuer) return;
    setSaving(true);
    const { data } = await supabase.from("certificates").insert([{ ...newCert, sort_order: certificates.length }]).select().single();
    if (data) setCertificates([...certificates, data]);
    setNewCert({ title: "", issuer: "", date: null, description: null, category: "Programming", certificate_url: null, featured: false });
    setIsAddOpen(false); setSaving(false);
  };

  const handleUpdate = async () => {
    if (!editingCert) return;
    setSaving(true);
    await supabase.from("certificates").update(editingCert).eq("id", editingCert.id);
    setCertificates(certificates.map((c) => (c.id === editingCert.id ? editingCert : c)));
    setEditingCert(null); setSaving(false);
  };

  const handleDelete = async (id: string) => {
    await supabase.from("certificates").delete().eq("id", id);
    setCertificates(certificates.filter((c) => c.id !== id));
  };

  const toggleFeatured = async (cert: Certificate) => {
    const updated = { ...cert, featured: !cert.featured };
    await supabase.from("certificates").update({ featured: updated.featured }).eq("id", cert.id);
    setCertificates(certificates.map((c) => (c.id === cert.id ? updated : c)));
  };

  const filteredCerts = certificates.filter((c) => {
    if (filter === "all") return true;
    if (filter === "featured") return c.featured;
    return c.category === filter;
  });

  // FIXED: Prop definition now accepts RefObject<HTMLInputElement | null>
  const CertForm = ({ cert, setCert, certFileRef }: { 
    cert: any; 
    setCert: (c: any) => void; 
    certFileRef: RefObject<HTMLInputElement | null> 
  }) => (
    <div className="space-y-4 max-h-[60vh] overflow-y-auto pr-2">
      <div className="space-y-2"><label className="text-sm font-medium">Title *</label><Input value={cert.title} onChange={(e) => setCert({ ...cert, title: e.target.value })} placeholder="e.g., Google UX Design Certificate" /></div>
      <div className="space-y-2"><label className="text-sm font-medium">Issuer *</label><Input value={cert.issuer} onChange={(e) => setCert({ ...cert, issuer: e.target.value })} placeholder="e.g., Coursera / Google" /></div>
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2"><label className="text-sm font-medium">Date</label><Input value={cert.date || ""} onChange={(e) => setCert({ ...cert, date: e.target.value })} placeholder="e.g., Dec 14, 2025" /></div>
        <div className="space-y-2">
          <label className="text-sm font-medium">Category</label>
          <Select value={cert.category || "Programming"} onValueChange={(v) => setCert({ ...cert, category: v })}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>{CERT_CATEGORIES.map((cat) => <SelectItem key={cat} value={cat}>{cat}</SelectItem>)}</SelectContent>
          </Select>
        </div>
      </div>
      <div className="space-y-2"><label className="text-sm font-medium">Description</label><Textarea value={cert.description || ""} onChange={(e) => setCert({ ...cert, description: e.target.value })} rows={3} /></div>
      <div className="space-y-2">
        <label className="text-sm font-medium flex items-center gap-1"><FileText className="w-3.5 h-3.5" />Certificate File / URL</label>
        <Input value={cert.certificate_url || ""} onChange={(e) => setCert({ ...cert, certificate_url: e.target.value })} placeholder="https://... or upload below" />
        <div className="flex items-center gap-2">
          <input ref={certFileRef} type="file" accept="image/*,.pdf" className="hidden" onChange={async (e) => {
            const file = e.target.files?.[0]; if (!file) return;
            const url = await uploadFile(supabase, file, "certificates"); if (url) setCert({ ...cert, certificate_url: url });
          }} />
          <Button type="button" variant="outline" size="sm" onClick={() => certFileRef.current?.click()}><Upload className="w-3.5 h-3.5 mr-1" />Upload File (Image or PDF)</Button>
        </div>
        {cert.certificate_url && (
          isPdfUrl(cert.certificate_url) ? (
            <div className="flex items-center gap-3 p-3 rounded-lg bg-muted border">
              <FileText className="w-8 h-8 text-primary shrink-0" />
              <div>
                <p className="text-sm font-medium">PDF uploaded</p>
                <a href={cert.certificate_url} target="_blank" rel="noopener noreferrer" className="text-xs text-primary hover:underline flex items-center gap-1 mt-0.5">
                  <ExternalLink className="w-3 h-3" /> Open PDF
                </a>
              </div>
            </div>
          ) : (
            <img src={cert.certificate_url} alt="preview" className="w-full h-28 object-cover rounded-lg border"
              onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }} />
          )
        )}
      </div>
      <div className="flex items-center justify-between"><label className="text-sm font-medium">Featured</label><Switch checked={cert.featured} onCheckedChange={(v) => setCert({ ...cert, featured: v })} /></div>
    </div>
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div><h2 className="text-2xl font-bold">Certificates</h2><p className="text-muted-foreground">{certificates.length} certificates ({certificates.filter((c) => c.featured).length} featured)</p></div>
        <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
          <DialogTrigger asChild><Button><Plus className="w-4 h-4 mr-2" />Add Certificate</Button></DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader><DialogTitle>Add New Certificate</DialogTitle></DialogHeader>
            <CertForm cert={newCert} setCert={setNewCert} certFileRef={fileInputRef} />
            <DialogFooter>
              <DialogClose asChild><Button variant="outline">Cancel</Button></DialogClose>
              <Button onClick={handleAdd} disabled={saving || !newCert.title || !newCert.issuer}>{saving ? "Saving..." : "Add Certificate"}</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      <div className="flex flex-wrap gap-2">
        {[{ key: "all", label: `All (${certificates.length})` }, { key: "featured", label: `⭐ Featured (${certificates.filter((c) => c.featured).length})` },
          ...CERT_CATEGORIES.filter((cat) => certificates.some((c) => c.category === cat)).map((cat) => ({ key: cat, label: `${cat} (${certificates.filter((c) => c.category === cat).length})` }))
        ].map(({ key, label }) => (
          <Button key={key} variant={filter === key ? "default" : "outline"} size="sm" onClick={() => setFilter(key)}>{label}</Button>
        ))}
      </div>

      {loading ? <div className="flex justify-center py-16"><RefreshCw className="w-6 h-6 animate-spin text-muted-foreground" /></div> : (
        <div className="grid gap-3">
          {filteredCerts.map((cert) => (
            <Card key={cert.id} className={`bg-card/50 ${cert.featured ? "border-primary/30" : ""}`}>
              <CardContent className="p-4">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex items-start gap-3 flex-1">
                    {cert.certificate_url ? (
                      <CertThumbnail url={cert.certificate_url} title={cert.title} />
                    ) : (
                      <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${cert.featured ? "bg-primary/20" : "bg-muted"}`}>
                        <Award className={`w-5 h-5 ${cert.featured ? "text-primary" : "text-muted-foreground"}`} />
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="font-semibold truncate">{cert.title}</h3>
                        {cert.featured && <Star className="w-4 h-4 text-primary fill-primary" />}
                      </div>
                      <p className="text-sm text-muted-foreground">{cert.issuer}</p>
                      <div className="flex items-center gap-2 mt-2">
                        {cert.category && <Badge variant="outline" className="text-xs">{cert.category}</Badge>}
                        {cert.date && <span className="text-xs text-muted-foreground">{cert.date}</span>}
                        {cert.certificate_url && (
                          <a href={cert.certificate_url} target="_blank" rel="noopener noreferrer" className="text-xs text-primary hover:underline flex items-center gap-1">
                            <ExternalLink className="w-3 h-3" />View
                          </a>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-1">
                    <Button variant="ghost" size="icon" onClick={() => toggleFeatured(cert)} title={cert.featured ? "Unfeature" : "Feature"}>
                      <Star className={`w-4 h-4 ${cert.featured ? "text-primary fill-primary" : ""}`} />
                    </Button>
                    <Dialog>
                      <DialogTrigger asChild><Button variant="ghost" size="icon" onClick={() => setEditingCert(cert)}><Pencil className="w-4 h-4" /></Button></DialogTrigger>
                      <DialogContent className="max-w-2xl">
                        <DialogHeader><DialogTitle>Edit Certificate</DialogTitle></DialogHeader>
                        {editingCert && <CertForm cert={editingCert} setCert={setEditingCert} certFileRef={editFileInputRef} />}
                        <DialogFooter>
                          <DialogClose asChild><Button variant="outline">Cancel</Button></DialogClose>
                          <DialogClose asChild><Button onClick={handleUpdate} disabled={saving}>{saving ? "Saving..." : "Save Changes"}</Button></DialogClose>
                        </DialogFooter>
                      </DialogContent>
                    </Dialog>
                    <Button variant="ghost" size="icon" className="text-destructive hover:text-destructive" onClick={() => handleDelete(cert.id)}><Trash2 className="w-4 h-4" /></Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
          {filteredCerts.length === 0 && <Card className="bg-card/50 border-dashed"><CardContent className="p-8 text-center"><p className="text-muted-foreground">No certificates found.</p></CardContent></Card>}
        </div>
      )}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// SKILLS MANAGER
// ═══════════════════════════════════════════════════════════════════════════════

const PROFICIENCY_INFO: Record<string, { label: string; icon: React.ReactNode; color: string }> = {
  expert:       { label: "Expert",        icon: <Sparkles className="w-4 h-4" />, color: "bg-primary/20 text-primary" },
  experienced:  { label: "Experienced",   icon: <TrendingUp className="w-4 h-4" />, color: "bg-accent/20 text-accent-foreground" },
  intermediate: { label: "Intermediate",  icon: <Code className="w-4 h-4" />, color: "bg-secondary text-secondary-foreground" },
  beginner:     { label: "Learning",      icon: <BookOpen className="w-4 h-4" />, color: "bg-muted text-muted-foreground" },
};

function SkillsManager() {
  const supabase = createClient();
  const [skills, setSkills] = useState<Skill[]>([]);
  const [loading, setLoading] = useState(true);
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [newSkill, setNewSkill] = useState({ name: "", icon: "code", category: "frontend" as "frontend" | "backend", proficiency_level: "intermediate" as Skill["proficiency_level"], description: "" });

  useEffect(() => {
    supabase.from("skills").select("*").order("sort_order").then(({ data }) => { setSkills(data || []); setLoading(false); });
  }, []);

  const handleAdd = async () => {
    if (!newSkill.name) return;
    setSaving(true);
    const { data } = await supabase.from("skills").insert([{ ...newSkill, description: newSkill.description || null, sort_order: skills.length }]).select().single();
    if (data) setSkills([...skills, data]);
    setNewSkill({ name: "", icon: "code", category: "frontend", proficiency_level: "intermediate", description: "" });
    setIsAddOpen(false); setSaving(false);
  };

  const handleDelete = async (id: string) => {
    await supabase.from("skills").delete().eq("id", id);
    setSkills(skills.filter((s) => s.id !== id));
  };

  const moveLevel = async (skill: Skill, level: Skill["proficiency_level"]) => {
    await supabase.from("skills").update({ proficiency_level: level }).eq("id", skill.id);
    setSkills(skills.map((s) => (s.id === skill.id ? { ...s, proficiency_level: level } : s)));
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
              <div className="space-y-2"><label className="text-sm font-medium">Icon key</label><Input value={newSkill.icon} onChange={(e) => setNewSkill({ ...newSkill, icon: e.target.value })} placeholder="e.g., react, nodejs, figma" /></div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Category</label>
                  <Select value={newSkill.category} onValueChange={(v) => setNewSkill({ ...newSkill, category: v as "frontend" | "backend" })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent><SelectItem value="frontend">Frontend</SelectItem><SelectItem value="backend">Backend</SelectItem></SelectContent>
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
                      <Code className="w-4 h-4 text-muted-foreground" />
                      <div><p className="text-sm font-medium">{skill.name}</p><p className="text-xs text-muted-foreground">{skill.category}</p></div>
                    </div>
                    <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
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
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// PROFILE MANAGER
// ═══════════════════════════════════════════════════════════════════════════════

function ProfileManager() {
  const supabase = createClient();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [workExperience, setWorkExperience] = useState<WorkExperience[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  // Modal State for adding work experience
  const [isExpModalOpen, setIsExpModalOpen] = useState(false);
  const [newExp, setNewExp] = useState<Omit<WorkExperience, "id" | "sort_order">>({
    title: "", role: "", period: "", description: ""
  });

  const avatarRef = useRef<HTMLInputElement>(null);
  const resumeRef = useRef<HTMLInputElement>(null);
  const cvRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    Promise.all([
      supabase.from("profile").select("*").limit(1).single(),
      supabase.from("work_experience").select("*").order("sort_order"),
    ]).then(([{ data: p }, { data: w }]) => {
      setProfile(p);
      setWorkExperience(w || []);
      setLoading(false);
    });
  }, []);

  const handleSave = async () => {
    if (!profile) return;
    setSaving(true);
    const { id, ...rest } = profile;
    await supabase.from("profile").update(rest).eq("id", id);

    // Upsert work experience entries individually (preserves existing IDs)
    for (let i = 0; i < workExperience.length; i++) {
      const exp = workExperience[i];
      const isNew = exp.id.startsWith("new-");
      if (isNew) {
        // Insert new entry, let DB generate id
        await supabase.from("work_experience").insert({
          title: exp.title,
          role: exp.role || null,
          period: exp.period || null,
          description: exp.description || null,
          sort_order: i,
        });
      } else {
        // Update existing
        await supabase.from("work_experience").update({
          title: exp.title,
          role: exp.role || null,
          period: exp.period || null,
          description: exp.description || null,
          sort_order: i,
        }).eq("id", exp.id);
      }
    }

    // Delete entries that were removed from state (only non-new ones)
    const { data: existingInDb } = await supabase.from("work_experience").select("id");
    const currentRealIds = new Set(workExperience.filter((e) => !e.id.startsWith("new-")).map((e) => e.id));
    for (const row of (existingInDb || [])) {
      if (!currentRealIds.has(row.id)) {
        await supabase.from("work_experience").delete().eq("id", row.id);
      }
    }

    // Re-fetch so new entries get their real DB ids
    const { data: freshWork } = await supabase.from("work_experience").select("*").order("sort_order");
    setWorkExperience(freshWork || []);

    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
    setSaving(false);
  };

  /** Adds entry to local state from modal data */
  const confirmAddEntry = () => {
    if (!newExp.title) return;
    setWorkExperience((prev) => [
      ...prev,
      {
        ...newExp,
        id: `new-${Date.now()}`,
        sort_order: prev.length,
      },
    ]);
    // Reset and close modal
    setNewExp({ title: "", role: "", period: "", description: "" });
    setIsExpModalOpen(false);
  };

  const removeEntry = (index: number) => {
    setWorkExperience((prev) => prev.filter((_, i) => i !== index));
  };

  const updateEntry = (index: number, field: keyof WorkExperience, value: string) => {
    setWorkExperience((prev) =>
      prev.map((exp, i) => (i === index ? { ...exp, [field]: value } : exp))
    );
  };

  const uploadProfileFile = async (file: File, field: keyof Profile, folder: string) => {
    const url = await uploadFile(supabase, file, folder);
    if (url && profile) setProfile({ ...profile, [field]: url });
  };

  if (loading) return <div className="flex justify-center py-16"><RefreshCw className="w-6 h-6 animate-spin text-muted-foreground" /></div>;
  if (!profile) return <div className="text-center py-16 text-muted-foreground">No profile found in database.</div>;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div><h2 className="text-2xl font-bold">Profile</h2><p className="text-muted-foreground">Update your personal information</p></div>
        <Button onClick={handleSave} disabled={saving || saved}>
          <Save className="w-4 h-4 mr-2" />{saved ? "Saved!" : saving ? "Saving..." : "Save Changes"}
        </Button>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Avatar & Files */}
        <Card className="bg-card/50">
          <CardHeader><CardTitle className="text-base">Profile Photo & Files</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <div className="flex flex-col items-center gap-3">
              <div className="w-24 h-24 rounded-full border-4 border-primary/20 overflow-hidden bg-primary/10 flex items-center justify-center">
                {profile.profile_picture_url ? <img src={profile.profile_picture_url} alt="avatar" className="w-full h-full object-cover" /> : <User className="w-10 h-10 text-primary" />}
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
                    <Button variant="outline" size="sm" className="flex-1 text-xs" onClick={() => ref.current?.click()}>
                      <Upload className="w-3 h-3 mr-1" />{profile[field] ? "Replace" : "Upload"}
                    </Button>
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

        {/* Experience & Education summary */}
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
            <div>
              <CardTitle className="text-base">Work Experience Timeline</CardTitle>
              <CardDescription>Manage your detailed work history</CardDescription>
            </div>
            
            <Dialog open={isExpModalOpen} onOpenChange={setIsExpModalOpen}>
              <DialogTrigger asChild>
                <Button variant="outline" size="sm">
                  <Plus className="w-4 h-4 mr-2" />Add Experience
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-md">
                <DialogHeader>
                  <DialogTitle>Add Work Experience</DialogTitle>
                  <DialogDescription>Add a new entry to your timeline. Remember to save changes afterward.</DialogDescription>
                </DialogHeader>
                <div className="space-y-4 py-2">
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Company / Project *</label>
                    <Input 
                      value={newExp.title} 
                      onChange={(e) => setNewExp({...newExp, title: e.target.value})} 
                      placeholder="e.g. Acme Corp" 
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Role</label>
                    <Input 
                      value={newExp.role || ""} 
                      onChange={(e) => setNewExp({...newExp, role: e.target.value})} 
                      placeholder="e.g. Lead Developer" 
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Period</label>
                    <Input 
                      value={newExp.period || ""} 
                      onChange={(e) => setNewExp({...newExp, period: e.target.value})} 
                      placeholder="e.g. 2022 - Present" 
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Description</label>
                    <Textarea 
                      value={newExp.description || ""} 
                      onChange={(e) => setNewExp({...newExp, description: e.target.value})} 
                      placeholder="Briefly describe your achievements..."
                      rows={3}
                    />
                  </div>
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
                    <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive hover:text-destructive" onClick={() => removeEntry(i)}>
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                  <div className="grid gap-3 sm:grid-cols-3">
                    <div className="space-y-1">
                      <label className="text-xs font-medium">Company *</label>
                      <Input value={exp.title} onChange={(e) => updateEntry(i, "title", e.target.value)} />
                    </div>
                    <div className="space-y-1">
                      <label className="text-xs font-medium">Role</label>
                      <Input value={exp.role || ""} onChange={(e) => updateEntry(i, "role", e.target.value)} />
                    </div>
                    <div className="space-y-1">
                      <label className="text-xs font-medium">Period</label>
                      <Input value={exp.period || ""} onChange={(e) => updateEntry(i, "period", e.target.value)} />
                    </div>
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-medium">Description</label>
                    <Textarea value={exp.description || ""} onChange={(e) => updateEntry(i, "description", e.target.value)} rows={2} />
                  </div>
                </div>
              ))
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

// ─── Shared Stats Card ────────────────────────────────────────────────────────

function StatsCard({ title, value, description, icon, trend, highlight }: {
  title: string; value: string; description?: string; icon: React.ReactNode; trend?: string; highlight?: boolean;
}) {
  return (
    <Card className={`bg-card/50 ${highlight ? "border-primary/30 bg-primary/5" : ""}`}>
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground">{title}</CardTitle>
        <div className={highlight ? "text-primary" : "text-muted-foreground"}>{icon}</div>
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">{value}</div>
        <div className="flex items-center gap-2">
          {description && <p className="text-xs text-muted-foreground">{description}</p>}
          {trend && <span className="text-xs text-primary flex items-center gap-0.5"><TrendingUp className="w-3 h-3" />{trend}</span>}
        </div>
      </CardContent>
    </Card>
  );
}