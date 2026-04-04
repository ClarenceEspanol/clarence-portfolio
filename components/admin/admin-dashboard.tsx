"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  LayoutDashboard, FolderKanban, Award, Sparkles, User, Home,
  MessageSquare, Mail, Bot, Images, LogOut, KeyRound,
  MessageCircleHeart, RefreshCw,
} from "lucide-react";

// ── Sub-components (split into admin-components/) ────────────────────────────
import { ToastContainer } from "./admin-components/toast";
import { StatsCard } from "./admin-components/stats-card";
import { ChangePasswordDialog } from "./admin-components/change-password-dialog";
import { ChatbotManager } from "./admin-components/chatbot-manager";
import { ProjectsManager } from "./admin-components/projects-manager";
import { CertificatesManager } from "./admin-components/certificates-manager";
import { SkillsManager } from "./admin-components/skills-manager";
import { ProfileManager } from "./admin-components/profile-manager";
import { FeedbackManager } from "./admin-components/feedback-manager";
import { GalleryManager } from "./admin-components/gallery-manager";

// ── Types ─────────────────────────────────────────────────────────────────────
import type { ContactMessage } from "./admin-components/types";
import { formatDate, OWNER_EMAIL } from "./admin-components/utils";

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

  // Owner-only guard
  useEffect(() => {
    const checkOwner = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) { router.push("/admin"); return; }
      if (session.user.email !== OWNER_EMAIL) {
        await supabase.auth.signOut();
        router.push("/admin");
      }
    };
    checkOwner();
    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!session || session.user.email !== OWNER_EMAIL) router.push("/admin");
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

      {/* ── Header ── */}
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

      {/* ── Main ── */}
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
            <TabsTrigger value="chatbot"><Bot className="w-4 h-4" /><span className="hidden sm:inline ml-1.5">Chatbot</span></TabsTrigger>
            <TabsTrigger value="projects"><FolderKanban className="w-4 h-4" /><span className="hidden sm:inline ml-1.5">Projects</span></TabsTrigger>
            <TabsTrigger value="certificates"><Award className="w-4 h-4" /><span className="hidden sm:inline ml-1.5">Certs</span></TabsTrigger>
            <TabsTrigger value="skills"><Sparkles className="w-4 h-4" /><span className="hidden sm:inline ml-1.5">Skills</span></TabsTrigger>
            <TabsTrigger value="profile"><User className="w-4 h-4" /><span className="hidden sm:inline ml-1.5">Profile</span></TabsTrigger>
            <TabsTrigger value="feedback"><MessageCircleHeart className="w-4 h-4" /><span className="hidden sm:inline ml-1.5">Feedback</span></TabsTrigger>
            <TabsTrigger value="gallery"><Images className="w-4 h-4" /><span className="hidden sm:inline ml-1.5">Gallery</span></TabsTrigger>
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
                    { label: "View Messages",    icon: <MessageSquare className="w-4 h-4 mr-2" />,    tab: "messages",     badge: stats.unreadMessages > 0 ? `${stats.unreadMessages} unread` : undefined },
                    { label: "Chatbot History",  icon: <Bot className="w-4 h-4 mr-2" />,              tab: "chatbot",      badge: chatbotSessionCount > 0 ? `${chatbotSessionCount} sessions` : undefined },
                    { label: "Manage Projects",  icon: <FolderKanban className="w-4 h-4 mr-2" />,     tab: "projects" },
                    { label: "Add Certificate",  icon: <Award className="w-4 h-4 mr-2" />,            tab: "certificates" },
                    { label: "Update Profile",   icon: <User className="w-4 h-4 mr-2" />,             tab: "profile" },
                    { label: "Manage Gallery",   icon: <Images className="w-4 h-4 mr-2" />,           tab: "gallery" },
                    { label: "View Feedback",    icon: <MessageCircleHeart className="w-4 h-4 mr-2" />, tab: "feedback" },
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
                      <MessageCard
                        key={msg.id}
                        msg={msg}
                        onMarkRead={markAsRead}
                        onDelete={deleteMessage}
                      />
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* ── Delegated tabs ── */}
          <TabsContent value="chatbot"><ChatbotManager /></TabsContent>
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

// ─── Message Card (inline — small enough to keep here) ────────────────────────

import { CheckCircle2, Trash2, Clock } from "lucide-react";

function MessageCard({
  msg,
  onMarkRead,
  onDelete,
}: {
  msg: ContactMessage;
  onMarkRead: (id: string) => void;
  onDelete: (id: string) => void;
}) {
  return (
    <div className={`p-4 rounded-xl border ${msg.is_read ? "bg-secondary/30 border-border" : "bg-primary/5 border-primary/20 shadow-sm"}`}>
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
            <Button variant="ghost" size="sm" onClick={() => onMarkRead(msg.id)} title="Mark as read">
              <CheckCircle2 className="w-4 h-4" />
            </Button>
          )}
          <Button variant="ghost" size="sm" className="text-destructive hover:text-destructive" onClick={() => onDelete(msg.id)}>
            <Trash2 className="w-4 h-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}