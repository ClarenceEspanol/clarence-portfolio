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
  Star, Image, Images, Save, MapPin, Linkedin, Briefcase, GraduationCap,
  LogOut, KeyRound, AlertCircle, Upload, X, Eye, EyeOff, Code,
  BookOpen, FileText, Bot, Send, ChevronDown, ChevronRight,
  MessageCircleHeart, Download, Presentation, ChevronUp, ArrowUpDown,
} from "lucide-react";

// ─── Toast Notification System ───────────────────────────────────────────────

type ToastType = "success" | "error" | "info" | "upload";

interface Toast {
  id: string;
  message: string;
  type: ToastType;
}

let _toastDispatch: ((toast: Omit<Toast, "id">) => void) | null = null;

export function toast(message: string, type: ToastType = "success") {
  _toastDispatch?.({ message, type });
}

function ToastContainer() {
  const [toasts, setToasts] = useState<Toast[]>([]);

  useEffect(() => {
    _toastDispatch = (t) => {
      const id = Math.random().toString(36).slice(2);
      setToasts((prev) => [...prev, { ...t, id }]);
      setTimeout(() => setToasts((prev) => prev.filter((x) => x.id !== id)), 3500);
    };
    return () => { _toastDispatch = null; };
  }, []);

  if (toasts.length === 0) return null;

  const icons: Record<ToastType, React.ReactNode> = {
    success: <CheckCircle2 className="w-4 h-4 text-green-500 shrink-0" />,
    error:   <AlertCircle  className="w-4 h-4 text-destructive shrink-0" />,
    info:    <RefreshCw    className="w-4 h-4 text-primary shrink-0" />,
    upload:  <Upload       className="w-4 h-4 text-blue-500 shrink-0" />,
  };

  const borders: Record<ToastType, string> = {
    success: "border-green-500/30 bg-green-500/10",
    error:   "border-destructive/30 bg-destructive/10",
    info:    "border-primary/30 bg-primary/10",
    upload:  "border-blue-500/30 bg-blue-500/10",
  };

  return (
    <div className="fixed bottom-4 right-4 z-9999 flex flex-col gap-2 pointer-events-none">
      {toasts.map((t) => (
        <div
          key={t.id}
          className={`flex items-center gap-2.5 px-4 py-3 rounded-xl border shadow-xl text-sm font-medium backdrop-blur-sm animate-in slide-in-from-right-4 fade-in duration-300 ${borders[t.type]}`}
        >
          {icons[t.type]}
          <span>{t.message}</span>
        </div>
      ))}
    </div>
  );
}

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
  facebook: string | null; instagram: string | null; tiktok: string | null;
  availability_status: "available" | "freelance" | "employed" | null;
}

interface Skill {
  id: string; name: string; icon: string;
  category: "frontend" | "backend" | "tools";
  description: string | null;
  proficiency_level: "beginner" | "intermediate" | "experienced" | "expert" | null;
  sort_order: number;
}

interface Project {
  id: string; title: string; description: string | null; long_description: string | null;
  tags: string[]; live_url: string | null; github_url: string | null; image_url: string | null;
  gallery_images: string[]; type: string | null; featured: boolean; sort_order: number;
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

interface GalleryImage {
  id: string; url: string; caption: string | null; sort_order: number;
}

interface ChatbotMessage {
  id: string;
  session_id: string;
  role: "user" | "assistant" | "admin";
  content: string;
  file_url?: string | null;
  file_type?: string | null;
  file_name?: string | null;
  created_at: string;
  user_name?: string | null;
  user_email?: string | null;
}

interface ChatSession {
  session_id: string;
  messages: ChatbotMessage[];
  lastActivity: string;
  unread: boolean;
  /** Resolved from user messages if available */
  displayName: string;
  displayEmail: string;
  isDirectChat: boolean;
}

// ─── Storage helper ───────────────────────────────────────────────────────────

const BUCKET = "portfolio-assets";

// Only this email is allowed to access the admin dashboard.
// This prevents any Google-logged-in user from bypassing the admin login.
// Change this to match the email you use to log into Supabase Admin auth.
const OWNER_EMAIL = process.env.NEXT_PUBLIC_ADMIN_EMAIL ?? "clarenceespanol@gmail.com";

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
  const [chatbotSessionCount, setChatbotSessionCount] = useState(0);

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
    const [{ count: projCount }, { count: certCount }, { data: chatData }] = await Promise.all([
      supabase.from("projects").select("*", { count: "exact", head: true }),
      supabase.from("certificates").select("*", { count: "exact", head: true }),
      supabase.from("chatbot_conversations").select("session_id"),
    ]);
    setOverviewCounts({ projects: projCount ?? 0, certificates: certCount ?? 0 });
    const uniqueSessions = new Set((chatData || []).map((r: { session_id: string }) => r.session_id));
    setChatbotSessionCount(uniqueSessions.size);
  }, [supabase]);

  // ── Owner-only guard ──────────────────────────────────────────────────────
  // Even if someone is logged in via Google (e.g. from the chat page), they
  // must not be able to access the admin dashboard. We check the session email
  // on mount and on any auth change; if it doesn't match OWNER_EMAIL we sign
  // them out of the admin session and redirect to /admin (login page).
  useEffect(() => {
    const checkOwner = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        router.push("/admin");
        return;
      }
      if (session.user.email !== OWNER_EMAIL) {
        // Signed in, but NOT the owner — boot them out
        await supabase.auth.signOut();
        router.push("/admin");
      }
    };
    checkOwner();

    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!session || session.user.email !== OWNER_EMAIL) {
        router.push("/admin");
      }
    });
    return () => listener.subscription.unsubscribe();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

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
      <ToastContainer />
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
          <TabsList className="grid grid-cols-9 w-full max-w-5xl">
            <TabsTrigger value="overview"><LayoutDashboard className="w-4 h-4" /><span className="hidden sm:inline ml-1.5">Overview</span></TabsTrigger>
            <TabsTrigger value="messages" className="relative">
              <MessageSquare className="w-4 h-4" /><span className="hidden sm:inline ml-1.5">Messages</span>
              {stats.unreadMessages > 0 && (
                <span className="absolute -top-1 -right-1 w-5 h-5 bg-primary text-primary-foreground text-xs rounded-full flex items-center justify-center">
                  {stats.unreadMessages}
                </span>
              )}
            </TabsTrigger>
            <TabsTrigger value="chatbot">
              <Bot className="w-4 h-4" /><span className="hidden sm:inline ml-1.5">Chatbot</span>
            </TabsTrigger>
            <TabsTrigger value="projects"><FolderKanban className="w-4 h-4" /><span className="hidden sm:inline ml-1.5">Projects</span></TabsTrigger>
            <TabsTrigger value="certificates"><Award className="w-4 h-4" /><span className="hidden sm:inline ml-1.5">Certs</span></TabsTrigger>
            <TabsTrigger value="skills"><Sparkles className="w-4 h-4" /><span className="hidden sm:inline ml-1.5">Skills</span></TabsTrigger>
            <TabsTrigger value="profile"><User className="w-4 h-4" /><span className="hidden sm:inline ml-1.5">Profile</span></TabsTrigger>
            <TabsTrigger value="feedback" className="relative">
              <MessageCircleHeart className="w-4 h-4" /><span className="hidden sm:inline ml-1.5">Feedback</span>
            </TabsTrigger>
            <TabsTrigger value="gallery">
              <Images className="w-4 h-4" /><span className="hidden sm:inline ml-1.5">Gallery</span>
            </TabsTrigger>
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
                    { label: "Chatbot History", icon: <Bot className="w-4 h-4 mr-2" />, tab: "chatbot", badge: chatbotSessionCount > 0 ? `${chatbotSessionCount} sessions` : undefined },
                    { label: "Manage Projects", icon: <FolderKanban className="w-4 h-4 mr-2" />, tab: "projects" },
                    { label: "Add Certificate", icon: <Award className="w-4 h-4 mr-2" />, tab: "certificates" },
                    { label: "Update Profile", icon: <User className="w-4 h-4 mr-2" />, tab: "profile" },
                    { label: "Manage Gallery", icon: <Images className="w-4 h-4 mr-2" />, tab: "gallery" },
                    { label: "View Feedback", icon: <MessageCircleHeart className="w-4 h-4 mr-2" />, tab: "feedback" },
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

          {/* ── Chatbot ── */}
          <TabsContent value="chatbot">
            <ChatbotManager />
          </TabsContent>

          <TabsContent value="projects"><ProjectsManager /></TabsContent>
          <TabsContent value="certificates"><CertificatesManager /></TabsContent>
          <TabsContent value="skills"><SkillsManager /></TabsContent>
          <TabsContent value="profile"><ProfileManager /></TabsContent>
          <TabsContent value="feedback"><FeedbackManager /></TabsContent>
          <TabsContent value="gallery"><GalleryManager /></TabsContent>
        </Tabs>
      </main>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// AI SETTINGS PANEL
// Reads/writes to `ai_settings` table: { key, value }
// Required rows:
//   ai_chatbot_enabled  → "true" / "false"
//   ai_chatbot_limit    → number string, e.g. "100" (empty = no limit)
// ═══════════════════════════════════════════════════════════════════════════════

function AISettingsPanel() {
  const supabase = createClient();
  const [enabled, setEnabled] = useState(true);
  const [limitInput, setLimitInput] = useState("");
  const [totalResponses, setTotalResponses] = useState(0);
  const [loadingSettings, setLoadingSettings] = useState(true);
  const [saving, setSaving] = useState(false);
  const [autoDeactivated, setAutoDeactivated] = useState(false);

  const loadSettings = async () => {
    setLoadingSettings(true);
    try {
      const [{ data: settings }, { count }] = await Promise.all([
        supabase.from("ai_settings").select("key, value"),
        supabase
          .from("chatbot_conversations")
          .select("*", { count: "exact", head: true })
          .eq("role", "assistant"),
      ]);
      const map: Record<string, string> = {};
      (settings || []).forEach((s: { key: string; value: string }) => { map[s.key] = s.value; });
      setEnabled(map["ai_chatbot_enabled"] !== "false");
      setLimitInput(map["ai_chatbot_limit"] ?? "");
      const total = count ?? 0;
      setTotalResponses(total);

      // Auto-deactivate if limit is reached
      const limit = map["ai_chatbot_limit"] ? parseInt(map["ai_chatbot_limit"], 10) : null;
      if (limit && total >= limit && map["ai_chatbot_enabled"] !== "false") {
        await upsertSetting("ai_chatbot_enabled", "false");
        setEnabled(false);
        setAutoDeactivated(true);
      }
    } catch (e) { console.error(e); }
    finally { setLoadingSettings(false); }
  };

  useEffect(() => { loadSettings(); }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const upsertSetting = async (key: string, value: string) => {
    await supabase.from("ai_settings").upsert({ key, value }, { onConflict: "key" });
  };

  const saveSettings = async () => {
    setSaving(true);
    try {
      await upsertSetting("ai_chatbot_enabled", enabled ? "true" : "false");
      await upsertSetting("ai_chatbot_limit", limitInput.trim());
      toast("AI settings saved.", "success");
      setAutoDeactivated(false);
      await loadSettings();
    } catch { toast("Failed to save settings.", "error"); }
    finally { setSaving(false); }
  };

  const resetCount = async () => {
    // Deletes all assistant messages to reset the counter
    if (!window.confirm("This will delete all AI assistant messages from the database to reset the response counter. Are you sure?")) return;
    await supabase.from("chatbot_conversations").delete().eq("role", "assistant");
    toast("AI response count reset.", "info");
    await loadSettings();
  };

  const limit = limitInput ? parseInt(limitInput, 10) : null;
  const usagePercent = limit ? Math.min(100, Math.round((totalResponses / limit) * 100)) : 0;
  const isLimitReached = limit !== null && totalResponses >= limit;

  if (loadingSettings) return (
    <div className="flex items-center gap-2 text-muted-foreground text-sm py-2">
      <RefreshCw className="w-4 h-4 animate-spin" /> Loading AI settings…
    </div>
  );

  return (
    <Card className={`mb-6 border-2 ${!enabled ? "border-amber-500/40 bg-amber-500/5" : isLimitReached ? "border-red-500/40 bg-red-500/5" : "border-primary/20 bg-primary/5"}`}>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div className="flex items-center gap-2">
            <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${!enabled ? "bg-amber-500/20" : "bg-primary/10"}`}>
              <Bot className={`w-4 h-4 ${!enabled ? "text-amber-500" : "text-primary"}`} />
            </div>
            <div>
              <CardTitle className="text-base">AI Chatbot Settings</CardTitle>
              <CardDescription className="text-xs mt-0">Control AI availability and response limits</CardDescription>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <span className={`text-xs font-semibold px-2 py-1 rounded-full border ${
              !enabled
                ? "bg-amber-500/10 text-amber-600 border-amber-500/30"
                : isLimitReached
                ? "bg-red-500/10 text-red-500 border-red-500/30"
                : "bg-green-500/10 text-green-600 border-green-500/30"
            }`}>
              {!enabled ? "⚠ Disabled" : isLimitReached ? "⛔ Limit Reached" : "✓ Active"}
            </span>
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Auto-deactivation notice */}
        {autoDeactivated && (
          <div className="flex items-start gap-2 p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-600 dark:text-red-400 text-sm">
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
            <div>
              <p className="font-semibold">AI auto-deactivated</p>
              <p className="text-xs mt-0.5 opacity-80">The AI reached its response limit and was automatically disabled to prevent errors. Reset the counter or raise the limit to re-enable.</p>
            </div>
          </div>
        )}

        {/* Enable / Disable toggle */}
        <div className="flex items-center justify-between gap-4 p-3 rounded-xl bg-background/50 border border-border">
          <div>
            <p className="text-sm font-medium">AI Chatbot Active</p>
            <p className="text-xs text-muted-foreground">When disabled, a warning is shown to visitors</p>
          </div>
          <Switch
            checked={enabled}
            onCheckedChange={(val) => { setEnabled(val); setAutoDeactivated(false); }}
          />
        </div>

        {/* Response limit */}
        <div className="p-3 rounded-xl bg-background/50 border border-border space-y-2">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium">Response Limit</p>
              <p className="text-xs text-muted-foreground">Max total AI responses. Leave blank for unlimited. AI auto-disables when reached.</p>
            </div>
          </div>
          <div className="flex gap-2">
            <Input
              type="number"
              min="1"
              value={limitInput}
              onChange={(e) => setLimitInput(e.target.value)}
              placeholder="e.g. 500 (blank = unlimited)"
              className="flex-1 text-sm"
            />
          </div>
          {/* Usage bar */}
          {limit !== null && (
            <div className="space-y-1">
              <div className="flex items-center justify-between text-xs text-muted-foreground">
                <span>{totalResponses} / {limit} responses used</span>
                <span className={`font-semibold ${usagePercent >= 90 ? "text-red-500" : usagePercent >= 70 ? "text-amber-500" : "text-green-600"}`}>
                  {usagePercent}%
                </span>
              </div>
              <div className="h-2 rounded-full bg-muted overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all ${usagePercent >= 90 ? "bg-red-500" : usagePercent >= 70 ? "bg-amber-500" : "bg-green-500"}`}
                  style={{ width: `${usagePercent}%` }}
                />
              </div>
            </div>
          )}
          {limit === null && (
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
              {totalResponses} responses used · No limit set
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="flex gap-2 flex-wrap">
          <Button size="sm" onClick={saveSettings} disabled={saving} className="shrink-0">
            <Save className="w-3.5 h-3.5 mr-1.5" />
            {saving ? "Saving…" : "Save Settings"}
          </Button>
          <Button size="sm" variant="outline" onClick={resetCount} className="text-destructive border-destructive/30 hover:bg-destructive/10 shrink-0">
            <RefreshCw className="w-3.5 h-3.5 mr-1.5" />
            Reset Counter
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// CHATBOT MANAGER
// ═══════════════════════════════════════════════════════════════════════════════

function ChatbotManager() {
  const supabase = createClient();
  const [sessions, setSessions] = useState<ChatSession[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedSession, setSelectedSession] = useState<string | null>(null);
  const [replyText, setReplyText] = useState("");
  const [sending, setSending] = useState(false);
  const [expandedSessions, setExpandedSessions] = useState<Set<string>>(new Set());
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const fetchSessions = useCallback(async () => {
    setLoading(true);
    try {
      const { data } = await supabase
        .from("chatbot_conversations")
        .select("*")
        .order("created_at", { ascending: true });

      const rows: ChatbotMessage[] = data || [];

      // Group by session_id
      const sessionMap = new Map<string, ChatbotMessage[]>();
      for (const row of rows) {
        if (!sessionMap.has(row.session_id)) sessionMap.set(row.session_id, []);
        sessionMap.get(row.session_id)!.push(row);
      }

      const built: ChatSession[] = [];
      sessionMap.forEach((msgs, session_id) => {
        // Find user info from user-role messages
        const userMsg = msgs.find((m) => m.role === "user" && m.user_name);
        const displayName = userMsg?.user_name ?? `Visitor ${session_id.slice(5, 13)}`;
        const displayEmail = userMsg?.user_email ?? "";
        const isDirectChat = session_id.startsWith("user_");
        built.push({
          session_id,
          messages: msgs,
          lastActivity: msgs[msgs.length - 1]?.created_at ?? "",
          unread: msgs.some((m) => m.role === "user"),
          displayName,
          displayEmail,
          isDirectChat,
        });
      });

      // Sort by most recent activity
      built.sort((a, b) => new Date(b.lastActivity).getTime() - new Date(a.lastActivity).getTime());
      setSessions(built);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }, [supabase]);

  useEffect(() => { fetchSessions(); }, [fetchSessions]);

  // Real-time subscription for new chatbot messages
  useEffect(() => {
    const channel = supabase
      .channel("chatbot_admin_watch")
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "chatbot_conversations" },
        () => { fetchSessions(); }
      )
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [supabase, fetchSessions]);

  useEffect(() => {
    if (selectedSession) {
      messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }
  }, [sessions, selectedSession]);

  const sendAdminReply = async () => {
    if (!selectedSession || !replyText.trim() || sending) return;
    setSending(true);
    try {
      await supabase.from("chatbot_conversations").insert({
        session_id: selectedSession,
        role: "admin",
        content: replyText.trim(),
        created_at: new Date().toISOString(),
      });
      setReplyText("");
      await fetchSessions();
    } catch (e) {
      console.error(e);
    } finally {
      setSending(false);
    }
  };

  const deleteSession = async (sessionId: string) => {
    await supabase.from("chatbot_conversations").delete().eq("session_id", sessionId);
    setSessions((prev) => prev.filter((s) => s.session_id !== sessionId));
    if (selectedSession === sessionId) setSelectedSession(null);
  };

  const toggleExpand = (sessionId: string) => {
    setExpandedSessions((prev) => {
      const next = new Set(prev);
      if (next.has(sessionId)) next.delete(sessionId);
      else next.add(sessionId);
      return next;
    });
    setSelectedSession(sessionId);
  };

  const formatTime = (dateStr: string) =>
    new Date(dateStr).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });

  const formatSessionDate = (dateStr: string) =>
    new Date(dateStr).toLocaleString("en-US", { month: "short", day: "numeric", hour: "numeric", minute: "2-digit" });

  const activeSession = sessions.find((s) => s.session_id === selectedSession);

  return (
    <div className="space-y-6">
      {/* ── AI Settings Panel ── */}
      <AISettingsPanel />

      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h2 className="text-2xl font-bold flex items-center gap-2">
            <Bot className="w-6 h-6 text-primary" />
            Chatbot Conversations
          </h2>
          <p className="text-muted-foreground">{sessions.length} session{sessions.length !== 1 ? "s" : ""} total — you can reply directly to visitors</p>
        </div>
        <Button variant="outline" size="sm" onClick={fetchSessions} disabled={loading}>
          <RefreshCw className={`w-4 h-4 mr-2 ${loading ? "animate-spin" : ""}`} />Refresh
        </Button>
      </div>

      {loading ? (
        <div className="flex justify-center py-16"><RefreshCw className="w-6 h-6 animate-spin text-muted-foreground" /></div>
      ) : sessions.length === 0 ? (
        <Card className="bg-card/50">
          <CardContent className="text-center py-16">
            <Bot className="w-12 h-12 mx-auto mb-4 text-muted-foreground/30" />
            <h3 className="font-medium text-lg mb-1">No chatbot conversations yet</h3>
            <p className="text-sm text-muted-foreground">When visitors use the AI chatbot, their conversations will appear here.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 lg:grid-cols-5">
          {/* Session list */}
          <div className="lg:col-span-2 space-y-2">
            {sessions.map((session) => {
              const lastMsg = session.messages[session.messages.length - 1];
              const isSelected = selectedSession === session.session_id;
              const userMsgs = session.messages.filter((m) => m.role === "user").length;
              return (
                <div
                  key={session.session_id}
                  onClick={() => setSelectedSession(session.session_id)}
                  className={`p-3 rounded-xl border cursor-pointer transition-all ${
                    isSelected
                      ? "bg-primary/10 border-primary/40"
                      : "bg-card/50 border-border hover:border-primary/30 hover:bg-secondary/30"
                  }`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-2 min-w-0">
                      <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center shrink-0 text-xs font-bold text-primary">
                        {session.displayName[0]?.toUpperCase() ?? "V"}
                      </div>
                      <div className="min-w-0">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <p className="text-sm font-medium truncate">{session.displayName}</p>
                          {session.isDirectChat && (
                            <Badge variant="outline" className="text-[9px] px-1.5 py-0 text-primary border-primary/40 shrink-0">Direct</Badge>
                          )}
                        </div>
                        {session.displayEmail && (
                          <p className="text-[10px] text-muted-foreground truncate">{session.displayEmail}</p>
                        )}
                        <p className="text-xs text-muted-foreground truncate mt-0.5">
                          {lastMsg?.content
                            ? `${lastMsg.content.slice(0, 45)}${lastMsg.content.length > 45 ? "…" : ""}`
                            : lastMsg?.file_type === "image" ? "📷 Image"
                            : lastMsg?.file_type === "video" ? "🎬 Video"
                            : lastMsg?.file_type === "audio" ? "🎤 Voice message"
                            : lastMsg?.file_type === "file" ? `📎 ${lastMsg.file_name ?? "File"}`
                            : ""}
                        </p>
                      </div>
                    </div>
                    <div className="flex flex-col items-end gap-1 shrink-0">
                      <span className="text-[10px] text-muted-foreground whitespace-nowrap">
                        {formatDate(session.lastActivity)}
                      </span>
                      <Badge variant="outline" className="text-[10px] px-1.5 py-0">
                        {userMsgs} msg{userMsgs !== 1 ? "s" : ""}
                      </Badge>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Conversation thread */}
          <div className="lg:col-span-3">
            {!activeSession ? (
              <Card className="bg-card/50 h-full">
                <CardContent className="flex flex-col items-center justify-center py-16 text-center">
                  <MessageSquare className="w-10 h-10 mb-3 text-muted-foreground/30" />
                  <p className="text-sm text-muted-foreground">Select a session to view the conversation</p>
                </CardContent>
              </Card>
            ) : (
              <Card className="bg-card/50 flex flex-col h-full">
                <CardHeader className="flex flex-row items-center justify-between pb-3 border-b border-border">
                  <div>
                    <CardTitle className="text-base flex items-center gap-2">
                      <div className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center text-xs font-bold text-primary shrink-0">
                        {activeSession.displayName[0]?.toUpperCase() ?? "V"}
                      </div>
                      {activeSession.displayName}
                      {activeSession.isDirectChat && (
                        <Badge variant="outline" className="text-[10px] px-1.5 py-0 text-primary border-primary/40">Direct Chat</Badge>
                      )}
                    </CardTitle>
                    <CardDescription>
                      {activeSession.displayEmail && <span className="mr-2">{activeSession.displayEmail} ·</span>}
                      {activeSession.messages.length} messages · Started {formatSessionDate(activeSession.messages[0]?.created_at)}
                    </CardDescription>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="text-destructive hover:text-destructive shrink-0"
                    onClick={() => deleteSession(activeSession.session_id)}
                    title="Delete session"
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </CardHeader>

                {/* Messages */}
                <CardContent className="flex-1 overflow-y-auto py-4 space-y-3" style={{ maxHeight: 420 }}>
                  {activeSession.messages.map((msg) => {
                    const isUser = msg.role === "user";
                    const isAdmin = msg.role === "admin";
                    const hasFile = !!msg.file_url;
                    return (
                      <div
                        key={msg.id}
                        className={`flex gap-2 ${isUser ? "flex-row-reverse" : "flex-row"}`}
                      >
                        <div className={`w-7 h-7 rounded-full flex items-center justify-center shrink-0 mt-1 ${
                          isUser ? "bg-secondary" : isAdmin ? "bg-green-500/20" : "bg-primary/10"
                        }`}>
                          {isUser ? (
                            <User className="w-4 h-4 text-muted-foreground" />
                          ) : isAdmin ? (
                            <KeyRound className="w-4 h-4 text-green-600" />
                          ) : (
                            <Bot className="w-4 h-4 text-primary" />
                          )}
                        </div>
                        <div className={`max-w-[75%] flex flex-col ${isUser ? "items-end" : "items-start"}`}>
                          {isAdmin && (
                            <span className="text-[10px] text-muted-foreground mb-0.5 px-1">Admin reply</span>
                          )}

                          {/* File / media */}
                          {hasFile && (
                            <div className={`mb-1 rounded-2xl overflow-hidden ${isUser ? "rounded-tr-sm" : "rounded-tl-sm"}`}>
                              {msg.file_type === "image" && (
                                // eslint-disable-next-line @next/next/no-img-element
                                <img
                                  src={msg.file_url!}
                                  alt="Image"
                                  className="max-w-50 max-h-50 object-cover rounded-2xl cursor-pointer"
                                  onClick={() => window.open(msg.file_url!, "_blank")}
                                />
                              )}
                              {msg.file_type === "video" && (
                                <video src={msg.file_url!} controls className="max-w-50 rounded-2xl" />
                              )}
                              {msg.file_type === "audio" && (
                                <div className={`px-3 py-2 rounded-2xl flex items-center gap-2 ${isUser ? "bg-secondary" : "bg-primary/10"}`}>
                                  <FileText className="w-4 h-4 shrink-0 text-muted-foreground" />
                                  <audio src={msg.file_url!} controls className="h-8 max-w-40" />
                                </div>
                              )}
                              {msg.file_type === "file" && (
                                <a
                                  href={msg.file_url!}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className={`flex items-center gap-2 px-3 py-2.5 rounded-2xl text-sm ${isUser ? "bg-secondary text-foreground" : "bg-primary/10 text-foreground"}`}
                                >
                                  <FileText className="w-4 h-4 shrink-0" />
                                  <span className="truncate max-w-37.5">{msg.file_name ?? "File"}</span>
                                </a>
                              )}
                            </div>
                          )}

                          {/* Text */}
                          {msg.content && (
                            <div className={`px-3 py-2 rounded-2xl text-sm leading-relaxed ${
                              isUser
                                ? "bg-secondary text-foreground rounded-tr-sm"
                                : isAdmin
                                ? "bg-green-500/15 border border-green-500/30 text-foreground rounded-tl-sm"
                                : "bg-primary/10 text-foreground rounded-tl-sm"
                            }`}>
                              {msg.content}
                            </div>
                          )}

                          <span className="text-[10px] text-muted-foreground mt-1 px-1">
                            {formatTime(msg.created_at)}
                          </span>
                        </div>
                      </div>
                    );
                  })}
                  <div ref={messagesEndRef} />
                </CardContent>

                {/* Admin reply box */}
                <div className="px-4 py-3 border-t border-border bg-card/50">
                  <p className="text-xs text-muted-foreground mb-2 flex items-center gap-1">
                    <KeyRound className="w-3 h-3" />
                    Reply as admin — visitor will see this in real-time
                  </p>
                  <div className="flex gap-2">
                    <Input
                      value={replyText}
                      onChange={(e) => setReplyText(e.target.value)}
                      onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); sendAdminReply(); }}}
                      placeholder="Type your reply..."
                      className="flex-1 text-sm"
                      disabled={sending}
                    />
                    <Button
                      size="sm"
                      onClick={sendAdminReply}
                      disabled={!replyText.trim() || sending}
                      className="shrink-0"
                    >
                      <Send className="w-4 h-4 mr-1.5" />{sending ? "Sending…" : "Reply"}
                    </Button>
                  </div>
                </div>
              </Card>
            )}
          </div>
        </div>
      )}
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
    title: "", description: null, long_description: null, tags: [], live_url: null, github_url: null, image_url: null, gallery_images: [], type: null, featured: false,
  });

  useEffect(() => {
    supabase.from("projects").select("*").order("sort_order").then(({ data }) => { setProjects(data || []); setLoading(false); });
  }, []);

  const uploadImage = async (file: File) => uploadFile(supabase, file, "projects");

  const handleAdd = async () => {
    if (!newProject.title) return;
    setSaving(true);
    const { data, error } = await supabase.from("projects").insert([{ ...newProject, sort_order: projects.length }]).select().single();
    if (error) { toast("Failed to add project.", "error"); setSaving(false); return; }
    if (data) setProjects([...projects, data]);
    setNewProject({ title: "", description: null, long_description: null, tags: [], live_url: null, github_url: null, image_url: null, gallery_images: [], type: null, featured: false });
    setTagInput(""); setIsAddOpen(false); setSaving(false);
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
    await Promise.all(
      [reordered[idx], reordered[swapIdx]].map((p) =>
        supabase.from("projects").update({ sort_order: p.sort_order }).eq("id", p.id)
      )
    );
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
    await Promise.all(
      reordered.map((p) =>
        supabase.from("projects").update({ sort_order: p.sort_order }).eq("id", p.id)
      )
    );
    toast("Order updated!", "success");
  };

  const addTag = (tags: string[], setFn: (t: string[]) => void) => {
    if (tagInput.trim() && !tags.includes(tagInput.trim())) { setFn([...tags, tagInput.trim()]); setTagInput(""); }
  };
  const removeTag = (tag: string, tags: string[], setFn: (t: string[]) => void) => setFn(tags.filter((t) => t !== tag));

  const ProjectForm = ({ project, setProject }: { project: any; setProject: (p: any) => void }) => {
    const galleryInputRef = useRef<HTMLInputElement | null>(null);
    const galleryImages: string[] = project.gallery_images ?? [];
    const remainingSlots = 5 - galleryImages.length;
    const [uploadingGallery, setUploadingGallery] = useState(false);

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

    const removeGalleryImage = (idx: number) => {
      setProject({ ...project, gallery_images: galleryImages.filter((_: string, i: number) => i !== idx) });
    };

    return (
    <div className="space-y-4 max-h-[60vh] overflow-y-auto pr-2">
      <div className="space-y-2"><label className="text-sm font-medium">Title *</label><Input value={project.title} onChange={(e) => setProject({ ...project, title: e.target.value })} placeholder="Project title" /></div>
      <div className="space-y-2"><label className="text-sm font-medium">Type</label><Input value={project.type || ""} onChange={(e) => setProject({ ...project, type: e.target.value })} placeholder="e.g., Full-Stack Development" /></div>
      <div className="space-y-2"><label className="text-sm font-medium">Short Description</label><Textarea value={project.description || ""} onChange={(e) => setProject({ ...project, description: e.target.value })} rows={2} placeholder="Brief summary shown on the card" /></div>
      <div className="space-y-2"><label className="text-sm font-medium">Full Description <span className="text-xs text-muted-foreground">(shown in modal)</span></label><Textarea value={project.long_description || ""} onChange={(e) => setProject({ ...project, long_description: e.target.value })} rows={5} placeholder="Detailed project write-up, features, challenges, etc." /></div>
      <div className="space-y-2"><label className="text-sm font-medium">Live URL</label><Input value={project.live_url || ""} onChange={(e) => setProject({ ...project, live_url: e.target.value })} placeholder="https://..." /></div>
      <div className="space-y-2"><label className="text-sm font-medium flex items-center gap-1"><Github className="w-3.5 h-3.5" />GitHub URL</label><Input value={project.github_url || ""} onChange={(e) => setProject({ ...project, github_url: e.target.value })} placeholder="https://github.com/..." /></div>

      {/* Cover image */}
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
          <Button type="button" variant="outline" size="sm" onClick={() => imageInputRef.current?.click()}><Upload className="w-3.5 h-3.5 mr-1" />Upload Cover</Button>
        </div>
        {project.image_url && <img src={project.image_url} alt="cover preview" className="w-full h-28 object-cover rounded-lg border" />}
      </div>

      {/* Gallery images */}
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
                <button
                  type="button"
                  onClick={() => removeGalleryImage(idx)}
                  className="absolute top-1 right-1 w-5 h-5 rounded-full bg-destructive text-destructive-foreground flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  <X className="w-3 h-3" />
                </button>
                <div className="absolute bottom-1 left-1 text-[10px] bg-black/50 text-white px-1 rounded">{idx + 1}</div>
              </div>
            ))}
          </div>
        )}
        {remainingSlots > 0 && (
          <div>
            <input
              type="file"
              accept="image/*"
              multiple
              className="hidden"
              ref={galleryInputRef}
              onChange={async (e) => {
                const files = Array.from(e.target.files ?? []);
                await addGalleryImages(files);
                if (e.target) e.target.value = "";
              }}
            />
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => galleryInputRef.current?.click()}
              disabled={remainingSlots === 0 || uploadingGallery}
            >
              {uploadingGallery
                ? <><RefreshCw className="w-3.5 h-3.5 mr-1 animate-spin" />Uploading…</>
                : <><Upload className="w-3.5 h-3.5 mr-1" />Add Gallery Images ({remainingSlots} slot{remainingSlots !== 1 ? "s" : ""} left)</>
              }
            </Button>
          </div>
        )}
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
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div><h2 className="text-2xl font-bold">Projects</h2><p className="text-muted-foreground">{projects.length} projects ({projects.filter((p) => p.featured).length} featured — shown on homepage)</p></div>
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
          {projects.map((project, idx) => (
            <Card key={project.id} className="bg-card/50">
              <CardContent className="p-4">
                <div className="flex items-start justify-between gap-4">
                  {/* Order controls */}
                  <div className="flex flex-col items-center gap-1 shrink-0 pt-0.5">
                    <Button
                      variant="ghost" size="icon"
                      className="h-6 w-6 text-muted-foreground hover:text-foreground disabled:opacity-20"
                      onClick={() => handleMoveProject(project.id, "up")}
                      disabled={idx === 0}
                      title="Move up"
                    >
                      <ChevronUp className="w-3.5 h-3.5" />
                    </Button>
                    <span className="text-xs font-mono font-bold text-muted-foreground leading-none">{idx + 1}</span>
                    <Button
                      variant="ghost" size="icon"
                      className="h-6 w-6 text-muted-foreground hover:text-foreground disabled:opacity-20"
                      onClick={() => handleMoveProject(project.id, "down")}
                      disabled={idx === projects.length - 1}
                      title="Move down"
                    >
                      <ChevronDown className="w-3.5 h-3.5" />
                    </Button>
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
                        {/* Move to position selector */}
                        {projects.length > 1 && (
                          <div className="flex items-center gap-1 ml-auto">
                            <ArrowUpDown className="w-3 h-3 text-muted-foreground" />
                            <Select
                              value={String(idx)}
                              onValueChange={(val) => handleMoveToPosition(project.id, Number(val))}
                            >
                              <SelectTrigger className="h-6 text-[11px] w-22.5 px-2 border-dashed">
                                <SelectValue placeholder="Move to…" />
                              </SelectTrigger>
                              <SelectContent>
                                {projects.map((_, i) => (
                                  <SelectItem key={i} value={String(i)} className="text-xs">
                                    Position {i + 1}{i === idx ? " (current)" : ""}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-1">
                    <Button
                      variant="ghost"
                      size="icon"
                      title={project.featured ? "Remove from featured" : "Mark as featured"}
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
    const { data, error } = await supabase.from("certificates").insert([{ ...newCert, sort_order: certificates.length }]).select().single();
    if (error) { toast("Failed to add certificate.", "error"); setSaving(false); return; }
    if (data) setCertificates([...certificates, data]);
    setNewCert({ title: "", issuer: "", date: null, description: null, category: "Programming", certificate_url: null, featured: false });
    setIsAddOpen(false); setSaving(false);
    toast("Certificate added successfully!", "success");
  };

  const handleUpdate = async () => {
    if (!editingCert) return;
    setSaving(true);
    const { error } = await supabase.from("certificates").update(editingCert).eq("id", editingCert.id);
    if (error) { toast("Failed to save changes.", "error"); setSaving(false); return; }
    setCertificates(certificates.map((c) => (c.id === editingCert.id ? editingCert : c)));
    setEditingCert(null); setSaving(false);
    toast("Certificate saved successfully!", "success");
  };

  const handleDelete = async (id: string) => {
    await supabase.from("certificates").delete().eq("id", id);
    setCertificates(certificates.filter((c) => c.id !== id));
    toast("Certificate deleted.", "info");
  };

  const toggleFeatured = async (cert: Certificate) => {
    const updated = { ...cert, featured: !cert.featured };
    await supabase.from("certificates").update({ featured: updated.featured }).eq("id", cert.id);
    setCertificates(certificates.map((c) => (c.id === cert.id ? updated : c)));
    toast(updated.featured ? "Marked as featured!" : "Removed from featured.", "success");
  };

  const filteredCerts = certificates.filter((c) => {
    if (filter === "all") return true;
    if (filter === "featured") return c.featured;
    return c.category === filter;
  });

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
            toast("Uploading certificate file…", "upload");
            const url = await uploadFile(supabase, file, "certificates");
            if (url) { setCert({ ...cert, certificate_url: url }); toast("Certificate file uploaded!", "success"); }
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

// Icon color palette for skills preview in admin
const ICON_COLORS: Record<string, string> = {
  html: "#E34F26", css: "#1572B6", javascript: "#F7DF1E", typescript: "#3178C6",
  react: "#61DAFB", nextjs: "#888888", tailwind: "#06B6D4", java: "#ED8B00",
  python: "#3776AB", cpp: "#00599C", csharp: "#239120", git: "#F05032",
  docker: "#2496ED", sql: "#336791", php: "#777BB4", wordpress: "#21759B",
  vbnet: "#5C2D91", database: "#FF6B35", design: "#FF4088", prototype: "#A259FF",
  docs: "#4A90D9", default: "#6B7280",
};

function getIconKey(name: string, iconKey?: string): string {
  const n = name.toLowerCase();
  const k = (iconKey || "").toLowerCase();
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
  expert:       { label: "Expert",        icon: <Sparkles className="w-4 h-4" />, color: "bg-primary/20 text-primary" },
  experienced:  { label: "Experienced",   icon: <TrendingUp className="w-4 h-4" />, color: "bg-accent/20 text-accent-foreground" },
  intermediate: { label: "Intermediate",  icon: <Code className="w-4 h-4" />, color: "bg-secondary text-secondary-foreground" },
  beginner:     { label: "Learning",      icon: <BookOpen className="w-4 h-4" />, color: "bg-muted text-muted-foreground" },
};

const ICON_KEYS = [
  // Frontend
  { value: "html",        label: "HTML" },
  { value: "css",         label: "CSS" },
  { value: "javascript",  label: "JavaScript" },
  { value: "typescript",  label: "TypeScript" },
  { value: "react",       label: "React" },
  { value: "nextjs",      label: "Next.js" },
  { value: "tailwind",    label: "Tailwind CSS" },
  { value: "design",      label: "UI/UX Design" },
  { value: "prototype",   label: "Prototyping" },
  { value: "docs",        label: "Documentation" },
  // Backend
  { value: "java",        label: "Java" },
  { value: "python",      label: "Python" },
  { value: "cpp",         label: "C++" },
  { value: "csharp",      label: "C#" },
  { value: "php",         label: "PHP" },
  { value: "vbnet",       label: "VB.NET" },
  { value: "sql",         label: "SQL / PostgreSQL" },
  { value: "database",    label: "Database Integration" },
  { value: "wordpress",   label: "WordPress" },
  // Tools & Others
  { value: "git",         label: "Git" },
  { value: "docker",      label: "Docker" },
  { value: "figma",       label: "Figma" },
  { value: "vscode",      label: "VS Code" },
  { value: "postman",     label: "Postman" },
  { value: "linux",       label: "Linux" },
  { value: "aws",         label: "AWS" },
  { value: "firebase",    label: "Firebase" },
  { value: "vercel",      label: "Vercel" },
  { value: "github",      label: "GitHub" },
  // Generic
  { value: "code",        label: "Generic / Code" },
];

function SkillsManager() {
  const supabase = createClient();
  const [skills, setSkills] = useState<Skill[]>([]);
  const [loading, setLoading] = useState(true);
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [editingSkill, setEditingSkill] = useState<Skill | null>(null);
  const [newSkill, setNewSkill] = useState({ name: "", icon: "code", category: "frontend" as "frontend" | "backend" | "tools", proficiency_level: "intermediate" as Skill["proficiency_level"], description: "" });

  useEffect(() => {
    supabase.from("skills").select("*").order("sort_order").then(({ data }) => { setSkills(data || []); setLoading(false); });
  }, []);

  const handleAdd = async () => {
    if (!newSkill.name) return;
    setSaving(true);
    try {
      const payload = {
        name: newSkill.name,
        icon: newSkill.icon,
        category: newSkill.category,
        proficiency_level: newSkill.proficiency_level,
        description: newSkill.description.trim() || null,
        sort_order: skills.length,
      };
      const { data, error } = await supabase.from("skills").insert(payload).select().single();
      if (error) { console.error("Insert error:", error); toast("Failed to add skill.", "error"); setSaving(false); return; }
      if (data) setSkills([...skills, data]);
      setNewSkill({ name: "", icon: "code", category: "frontend", proficiency_level: "intermediate", description: "" });
      setIsAddOpen(false);
      toast("Skill added successfully!", "success");
    } finally { setSaving(false); }
  };

  const handleUpdate = async () => {
    if (!editingSkill) return;
    setSaving(true);
    const { error } = await supabase.from("skills").update({
      name: editingSkill.name,
      icon: editingSkill.icon,
      category: editingSkill.category,
      proficiency_level: editingSkill.proficiency_level,
      description: editingSkill.description || null,
    }).eq("id", editingSkill.id);
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
                  <SelectContent className="max-h-60">
                    {ICON_KEYS.map((k) => <SelectItem key={k.value} value={k.value}>{k.label}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Category</label>
                  <Select value={newSkill.category} onValueChange={(v) => setNewSkill({ ...newSkill, category: v as "frontend" | "backend" | "tools" })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="frontend">Frontend</SelectItem>
                      <SelectItem value="backend">Backend</SelectItem>
                      <SelectItem value="tools">Tools & Others</SelectItem>
                    </SelectContent>
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
                      <div className="w-6 h-6 rounded flex items-center justify-center text-muted-foreground shrink-0"
                        style={{ background: `${ICON_COLORS[getIconKey(skill.name, skill.icon)]}18` }}>
                        <span style={{ color: ICON_COLORS[getIconKey(skill.name, skill.icon)] }} className="text-[10px] font-bold">
                          {skill.name.slice(0, 2).toUpperCase()}
                        </span>
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

      {/* Edit Skill Dialog */}
      <Dialog open={!!editingSkill} onOpenChange={(open) => { if (!open) setEditingSkill(null); }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Skill</DialogTitle>
            <DialogDescription>Modify the skill details. Changes are saved to the database.</DialogDescription>
          </DialogHeader>
          {editingSkill && (
            <div className="space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Skill Name *</label>
                <Input value={editingSkill.name} onChange={(e) => setEditingSkill({ ...editingSkill, name: e.target.value })} placeholder="e.g., React, Python, Figma" />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Icon</label>
                <Select value={editingSkill.icon} onValueChange={(v) => setEditingSkill({ ...editingSkill, icon: v })}>
                  <SelectTrigger><SelectValue placeholder="Select icon..." /></SelectTrigger>
                  <SelectContent className="max-h-60">
                    {ICON_KEYS.map((k) => <SelectItem key={k.value} value={k.value}>{k.label}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Category</label>
                  <Select value={editingSkill.category} onValueChange={(v) => setEditingSkill({ ...editingSkill, category: v as "frontend" | "backend" | "tools" })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="frontend">Frontend</SelectItem>
                      <SelectItem value="backend">Backend</SelectItem>
                      <SelectItem value="tools">Tools & Others</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Proficiency</label>
                  <Select value={editingSkill.proficiency_level || "intermediate"} onValueChange={(v) => setEditingSkill({ ...editingSkill, proficiency_level: v as Skill["proficiency_level"] })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {PROFICIENCY_LEVELS.map((l) => <SelectItem key={l} value={l}>{PROFICIENCY_INFO[l].label}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Description (optional)</label>
                <Textarea value={editingSkill.description || ""} onChange={(e) => setEditingSkill({ ...editingSkill, description: e.target.value })} placeholder="Short description..." rows={3} className="resize-none" />
              </div>
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
  const [imgKey, setImgKey] = useState(0);

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

    for (let i = 0; i < workExperience.length; i++) {
      const exp = workExperience[i];
      const isNew = exp.id.startsWith("new-");
      if (isNew) {
        await supabase.from("work_experience").insert({
          title: exp.title, role: exp.role || null, period: exp.period || null,
          description: exp.description || null, sort_order: i,
        });
      } else {
        await supabase.from("work_experience").update({
          title: exp.title, role: exp.role || null, period: exp.period || null,
          description: exp.description || null, sort_order: i,
        }).eq("id", exp.id);
      }
    }

    const { data: existingInDb } = await supabase.from("work_experience").select("id");
    const currentRealIds = new Set(workExperience.filter((e) => !e.id.startsWith("new-")).map((e) => e.id));
    for (const row of (existingInDb || [])) {
      if (!currentRealIds.has(row.id)) {
        await supabase.from("work_experience").delete().eq("id", row.id);
      }
    }

    const { data: freshWork } = await supabase.from("work_experience").select("*").order("sort_order");
    setWorkExperience(freshWork || []);

    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
    setSaving(false);
    toast("Profile saved successfully!", "success");
  };

  const confirmAddEntry = () => {
    if (!newExp.title) return;
    setWorkExperience((prev) => [
      ...prev,
      { ...newExp, id: `new-${Date.now()}`, sort_order: prev.length },
    ]);
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
    if (!profile) return;
    toast("Uploading file…", "upload");

    // Delete old file from storage
    const oldUrl = profile[field] as string | null;
    if (oldUrl) {
      try {
        const marker = `/object/public/${BUCKET}/`;
        const idx = oldUrl.indexOf(marker);
        if (idx !== -1) {
          const oldPath = decodeURIComponent(oldUrl.slice(idx + marker.length).split("?")[0]);
          await supabase.storage.from(BUCKET).remove([oldPath]);
        }
      } catch (e) {
        console.warn("Could not delete old file:", e);
      }
    }

    // Upload new file
    const url = await uploadFile(supabase, file, folder);
    if (!url) { toast("Upload failed.", "error"); return; }

    // Update DB — use upsert on the whole row to bypass strict RLS UPDATE policies
    const updatedProfile = { ...profile, [field]: url };
    const { data: upserted, error: upsertErr } = await supabase
      .from("profile")
      .upsert(updatedProfile, { onConflict: "id" })
      .select()
      .single();

    if (upsertErr) {
      console.error("Profile upsert error:", upsertErr);
      toast(`DB error: ${upsertErr.message}`, "error");
      return;
    }

    // Update local state from what DB actually saved
    if (upserted) setProfile(upserted);

    // Force <img> remount so browser fetches fresh photo
    setImgKey((k) => k + 1);

    toast("Photo updated successfully!", "success");
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
              <div className="space-y-2">
                <label className="text-sm font-medium flex items-center gap-2">
                  <span className="w-3.5 h-3.5 inline-flex items-center justify-center">
                    <span className="w-2 h-2 rounded-full bg-green-500 inline-block" />
                  </span>
                  Availability Status
                </label>
                <Select
                  value={profile.availability_status ?? "none"}
                  onValueChange={(v) => setProfile({ ...profile, availability_status: v === "none" ? null : v as Profile["availability_status"] })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select status..." />
                  </SelectTrigger>
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
                    <Input value={newExp.title} onChange={(e) => setNewExp({...newExp, title: e.target.value})} placeholder="e.g. Acme Corp" />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Role</label>
                    <Input value={newExp.role || ""} onChange={(e) => setNewExp({...newExp, role: e.target.value})} placeholder="e.g. Lead Developer" />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Period</label>
                    <Input value={newExp.period || ""} onChange={(e) => setNewExp({...newExp, period: e.target.value})} placeholder="e.g. 2022 - Present" />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Description</label>
                    <Textarea value={newExp.description || ""} onChange={(e) => setNewExp({...newExp, description: e.target.value})} placeholder="Briefly describe your achievements..." rows={3} />
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
                    <div className="space-y-1"><label className="text-xs font-medium">Company *</label><Input value={exp.title} onChange={(e) => updateEntry(i, "title", e.target.value)} /></div>
                    <div className="space-y-1"><label className="text-xs font-medium">Role</label><Input value={exp.role || ""} onChange={(e) => updateEntry(i, "role", e.target.value)} /></div>
                    <div className="space-y-1"><label className="text-xs font-medium">Period</label><Input value={exp.period || ""} onChange={(e) => updateEntry(i, "period", e.target.value)} /></div>
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

// ═══════════════════════════════════════════════════════════════════════════════
// FEEDBACK MANAGER
// ═══════════════════════════════════════════════════════════════════════════════

interface Feedback {
  id: string;
  name: string | null;
  message: string;
  rating: number;
  emoji: string;
  created_at: string;
}

function FeedbackManager() {
  const supabase = createClient();
  const [feedbacks, setFeedbacks] = useState<Feedback[]>([]);
  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState<string | null>(null);

  useEffect(() => { loadFeedbacks(); }, []);

  async function loadFeedbacks() {
    setLoading(true);
    const { data } = await supabase
      .from("feedbacks")
      .select("*")
      .order("created_at", { ascending: false });
    if (data) setFeedbacks(data);
    setLoading(false);
  }

  async function deleteFeedback(id: string) {
    setDeleting(id);
    await supabase.from("feedbacks").delete().eq("id", id);
    setFeedbacks((prev) => prev.filter((f) => f.id !== id));
    toast("Feedback deleted.", "info");
    setDeleting(null);
  }

  const avgRating = feedbacks.length
    ? (feedbacks.reduce((s, f) => s + f.rating, 0) / feedbacks.length).toFixed(1)
    : "—";

  const ratingDist = [5, 4, 3, 2, 1].map((r) => ({
    rating: r,
    emoji: ["😐","🙂","😊","😍","🤩"][r - 1],
    count: feedbacks.filter((f) => f.rating === r).length,
  }));

  if (loading) {
    return (
      <div className="flex items-center justify-center py-16">
        <RefreshCw className="w-6 h-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h2 className="text-2xl font-bold flex items-center gap-2">
            <MessageCircleHeart className="w-6 h-6 text-primary" />
            Feedback
          </h2>
          <p className="text-muted-foreground text-sm mt-0.5">
            {feedbacks.length} total · ⭐ {avgRating} avg rating
          </p>
        </div>
        <Button variant="outline" size="sm" onClick={loadFeedbacks}>
          <RefreshCw className="w-4 h-4 mr-2" />Refresh
        </Button>
      </div>

      {/* Rating distribution */}
      <div className="grid grid-cols-5 gap-3">
        {ratingDist.map(({ rating, emoji, count }) => (
          <Card key={rating} className="bg-card/50">
            <CardContent className="p-4 flex flex-col items-center gap-1">
              <span className="text-2xl">{emoji}</span>
              <div className="flex gap-0.5">
                {Array.from({ length: 5 }).map((_, i) => (
                  <Star key={i} className={`w-2.5 h-2.5 ${i < rating ? "fill-amber-400 text-amber-400" : "text-muted-foreground/20"}`} />
                ))}
              </div>
              <p className="text-xl font-bold leading-none">{count}</p>
              <p className="text-[10px] text-muted-foreground font-mono">review{count !== 1 ? "s" : ""}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Feedback list */}
      {feedbacks.length === 0 ? (
        <Card className="bg-card/50 border-dashed">
          <CardContent className="text-center py-16">
            <div className="text-4xl mb-3">💬</div>
            <p className="text-muted-foreground">No feedback yet.</p>
            <p className="text-muted-foreground/60 text-sm mt-1">Feedback submitted on your portfolio will appear here.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid md:grid-cols-2 gap-4">
          {feedbacks.map((fb) => (
            <Card key={fb.id} className="bg-card/50 border-border group relative">
              <CardContent className="p-5">
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 rounded-full bg-secondary flex items-center justify-center text-xl shrink-0 border border-border">
                    {fb.emoji}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <div className="flex items-center gap-2 mb-0.5">
                          <span className="font-semibold text-sm">
                            {fb.name || <span className="text-muted-foreground italic font-normal">Anonymous</span>}
                          </span>
                          <div className="flex gap-0.5">
                            {Array.from({ length: 5 }).map((_, i) => (
                              <Star key={i} className={`w-3 h-3 ${i < fb.rating ? "fill-amber-400 text-amber-400" : "text-muted-foreground/20"}`} />
                            ))}
                          </div>
                        </div>
                        <p className="text-sm text-muted-foreground leading-relaxed">{fb.message}</p>
                        <p className="text-[11px] text-muted-foreground/50 mt-2 font-mono">
                          {new Date(fb.created_at).toLocaleString("en-US", {
                            month: "short", day: "numeric", year: "numeric",
                            hour: "2-digit", minute: "2-digit",
                          })}
                        </p>
                      </div>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 shrink-0 text-muted-foreground hover:text-destructive opacity-0 group-hover:opacity-100 transition-opacity"
                        onClick={() => deleteFeedback(fb.id)}
                        disabled={deleting === fb.id}
                        title="Delete feedback"
                      >
                        {deleting === fb.id
                          ? <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                          : <Trash2 className="w-3.5 h-3.5" />
                        }
                      </Button>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// GALLERY MANAGER
// ═══════════════════════════════════════════════════════════════════════════════

function GalleryManager() {
  const supabase = createClient();
  const [images, setImages] = useState<GalleryImage[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [editingCaption, setEditingCaption] = useState<{ id: string; value: string } | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => { loadImages(); }, []); // eslint-disable-line

  async function loadImages() {
    setLoading(true);
    const { data } = await supabase
      .from("gallery_images")
      .select("*")
      .order("sort_order", { ascending: true });
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

  if (loading) return (
    <div className="flex items-center justify-center py-16">
      <RefreshCw className="w-6 h-6 animate-spin text-muted-foreground" />
    </div>
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h2 className="text-2xl font-bold flex items-center gap-2">
            <Images className="w-6 h-6 text-cyan-500" />
            Gallery
          </h2>
          <p className="text-muted-foreground text-sm mt-0.5">
            {images.length} image{images.length !== 1 ? "s" : ""} · auto-sliding strip in About section (grayscale → color on hover)
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={loadImages}>
            <RefreshCw className="w-4 h-4 mr-2" />Refresh
          </Button>
          <Button
            size="sm"
            onClick={() => fileRef.current?.click()}
            disabled={uploading}
            className="bg-cyan-500 hover:bg-cyan-600 text-white"
          >
            {uploading
              ? <><RefreshCw className="w-4 h-4 mr-2 animate-spin" />Uploading…</>
              : <><Plus className="w-4 h-4 mr-2" />Add Images</>
            }
          </Button>
          <input
            ref={fileRef}
            type="file"
            accept="image/*"
            multiple
            className="hidden"
            onChange={(e) => handleUpload(e.target.files)}
          />
        </div>
      </div>

      {/* Empty state drop zone */}
      {images.length === 0 ? (
        <Card
          className="border-dashed border-2 border-cyan-500/30 bg-cyan-500/5 cursor-pointer hover:border-cyan-500/60 transition-colors"
          onClick={() => fileRef.current?.click()}
        >
          <CardContent className="text-center py-16">
            <Upload className="w-10 h-10 mx-auto mb-3 text-cyan-500/50" />
            <p className="font-medium text-muted-foreground">Click to upload gallery images</p>
            <p className="text-sm text-muted-foreground/60 mt-1">JPG, PNG, WebP — multiple files supported</p>
          </CardContent>
        </Card>
      ) : (
        <>
          {/* Upload more zone */}
          <div
            className="border border-dashed border-border rounded-xl p-4 flex items-center gap-3 cursor-pointer hover:border-cyan-500/50 hover:bg-cyan-500/5 transition-all"
            onClick={() => fileRef.current?.click()}
          >
            <div className="w-9 h-9 rounded-lg bg-cyan-500/10 flex items-center justify-center shrink-0">
              <Upload className="w-4 h-4 text-cyan-500" />
            </div>
            <div>
              <p className="text-sm font-medium">Upload more images</p>
              <p className="text-xs text-muted-foreground">Click to add more photos to your gallery</p>
            </div>
          </div>

          {/* Image grid */}
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
            {images.map((img, index) => (
              <Card key={img.id} className="bg-card/50 border-border group overflow-hidden">
                <div className="relative aspect-4/3">
                  <img
                    src={img.url}
                    alt={img.caption ?? "Gallery"}
                    className="w-full h-full object-cover grayscale group-hover:grayscale-0 transition-all duration-500"
                  />
                  {/* Overlay actions */}
                  <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                    <Button
                      variant="ghost" size="icon"
                      className="h-8 w-8 bg-white/10 hover:bg-white/20 text-white disabled:opacity-30"
                      onClick={() => moveImage(index, "up")}
                      disabled={index === 0}
                      title="Move left"
                    >←</Button>
                    <Button
                      variant="ghost" size="icon"
                      className="h-8 w-8 bg-red-500/80 hover:bg-red-500 text-white"
                      onClick={() => deleteImage(img)}
                      disabled={deletingId === img.id}
                      title="Delete"
                    >
                      {deletingId === img.id
                        ? <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                        : <Trash2 className="w-3.5 h-3.5" />
                      }
                    </Button>
                    <Button
                      variant="ghost" size="icon"
                      className="h-8 w-8 bg-white/10 hover:bg-white/20 text-white disabled:opacity-30"
                      onClick={() => moveImage(index, "down")}
                      disabled={index === images.length - 1}
                      title="Move right"
                    >→</Button>
                  </div>
                  {/* Order badge */}
                  <div className="absolute top-1.5 left-1.5 w-5 h-5 rounded-full bg-black/60 flex items-center justify-center">
                    <span className="text-[9px] text-white font-mono">{index + 1}</span>
                  </div>
                </div>

                {/* Caption editor */}
                <CardContent className="p-2">
                  {editingCaption?.id === img.id ? (
                    <div className="flex gap-1">
                      <Input
                        value={editingCaption.value}
                        onChange={(e) => setEditingCaption({ id: img.id, value: e.target.value })}
                        onKeyDown={(e) => {
                          if (e.key === "Enter") saveCaption(img.id, editingCaption.value);
                          if (e.key === "Escape") setEditingCaption(null);
                        }}
                        placeholder="Caption…"
                        className="h-7 text-xs"
                        autoFocus
                      />
                      <Button size="icon" className="h-7 w-7 shrink-0" onClick={() => saveCaption(img.id, editingCaption.value)}>✓</Button>
                      <Button size="icon" variant="ghost" className="h-7 w-7 shrink-0" onClick={() => setEditingCaption(null)}><X className="w-3 h-3" /></Button>
                    </div>
                  ) : (
                    <button
                      className="w-full text-left text-xs text-muted-foreground hover:text-foreground transition-colors truncate"
                      onClick={() => setEditingCaption({ id: img.id, value: img.caption ?? "" })}
                    >
                      {img.caption ?? <span className="italic opacity-50">Add caption…</span>}
                    </button>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        </>
      )}

      {/* Supabase hint */}
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