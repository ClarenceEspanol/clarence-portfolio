"use client";

import React, { useState, useEffect, useCallback } from "react";
import { cn } from "@/lib/utils";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Tabs, TabsContent } from "@/components/ui/tabs";
import {
  LayoutDashboard, FolderKanban, Award, Sparkles, User, Home,
  MessageSquare, MessageCircle, Mail, Bot, Images, LogOut, KeyRound,
  MessageCircleHeart, RefreshCw, Type, Star,
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
import { HeroRolesManager } from "./admin-components/hero-roles-manager";

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

  // ── Overview previews ─────────────────────────────────────────────────────
  interface RecentChatMsg { session_id: string; content: string; role: string; created_at: string; user_name: string | null; user_email: string | null; is_direct: boolean; }
  interface RecentFeedback { id: string; name: string | null; message: string; rating: number; emoji: string; created_at: string; }
  const [recentAiMsgs, setRecentAiMsgs]         = useState<RecentChatMsg[]>([]);
  const [recentDirectMsgs, setRecentDirectMsgs] = useState<RecentChatMsg[]>([]);
  const [recentFeedbacks, setRecentFeedbacks]   = useState<RecentFeedback[]>([]);

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

    // Recent AI chatbot messages (no user_name/email = anonymous AI chat)
    const { data: recentAi } = await supabase
      .from("chatbot_conversations")
      .select("session_id, content, role, created_at, user_name, user_email")
      .eq("role", "user")
      .is("user_name", null)
      .is("user_email", null)
      .order("created_at", { ascending: false })
      .limit(3);
    setRecentAiMsgs((recentAi || []).map((m: { session_id: string; content: string; role: string; created_at: string; user_name: string | null; user_email: string | null }) => ({ ...m, is_direct: false })));

    // Recent direct chat messages (have user_name or user_email)
    const { data: recentDirect } = await supabase
      .from("chatbot_conversations")
      .select("session_id, content, role, created_at, user_name, user_email")
      .eq("role", "user")
      .not("user_email", "is", null)
      .order("created_at", { ascending: false })
      .limit(3);
    setRecentDirectMsgs((recentDirect || []).map((m: { session_id: string; content: string; role: string; created_at: string; user_name: string | null; user_email: string | null }) => ({ ...m, is_direct: true })));

    // Recent feedback (last 3)
    const { data: recentFb } = await supabase
      .from("feedbacks")
      .select("id, name, message, rating, emoji, created_at")
      .order("created_at", { ascending: false })
      .limit(3);
    setRecentFeedbacks(recentFb || []);
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
          {/* ── Tab Nav — icon-only with tooltips, matches portfolio nav style ── */}
          <div className="flex items-center gap-1 p-1 rounded-xl bg-card/50 border border-border w-fit">
            {(
              [
                { value: "overview",     Icon: LayoutDashboard,   label: "Overview" },
                { value: "messages",     Icon: MessageSquare,     label: "Messages",    badge: stats.unreadMessages > 0 ? stats.unreadMessages : undefined },
                { value: "chatbot",      Icon: Bot,               label: "Chatbot",     badge: chatbotSessionCount > 0 ? chatbotSessionCount : undefined },
                { value: "projects",     Icon: FolderKanban,      label: "Projects" },
                { value: "certificates", Icon: Award,             label: "Certificates" },
                { value: "skills",       Icon: Sparkles,          label: "Skills" },
                { value: "profile",      Icon: User,              label: "Profile" },
                { value: "hero-roles",   Icon: Type,              label: "Hero Roles" },
                { value: "feedback",     Icon: MessageCircleHeart, label: "Feedback" },
                { value: "gallery",      Icon: Images,            label: "Gallery" },
              ] as { value: string; Icon: React.ElementType; label: string; badge?: number }[]
            ).map(({ value, Icon, label, badge }) => {
              const isActive = activeTab === value;
              return (
                <button
                  key={value}
                  onClick={() => setActiveTab(value)}
                  className={cn(
                    "group relative flex items-center justify-center w-10 h-10 rounded-lg transition-all duration-200",
                    isActive
                      ? "bg-primary/10 text-primary shadow-sm"
                      : "text-muted-foreground hover:text-foreground hover:bg-secondary"
                  )}
                  aria-label={label}
                >
                  <Icon className="w-4 h-4" />
                  {isActive && (
                    <span className="absolute bottom-1 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full bg-primary" />
                  )}
                  {badge !== undefined && (
                    <span className="absolute -top-1 -right-1 w-4 h-4 bg-primary text-primary-foreground text-[10px] font-bold rounded-full flex items-center justify-center leading-none">
                      {badge > 9 ? "9+" : badge}
                    </span>
                  )}
                  <span className="absolute top-full mt-2 px-2 py-1 text-xs font-medium bg-popover text-popover-foreground border border-border rounded-lg shadow-lg whitespace-nowrap opacity-0 group-hover:opacity-100 translate-y-1 group-hover:translate-y-0 transition-all duration-200 pointer-events-none z-50">
                    {label}
                  </span>
                </button>
              );
            })}
          </div>

          {/* ── Overview ── */}
          <TabsContent value="overview" className="space-y-6">
            {/* Stats row */}
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
              <StatsCard title="Total Messages" value={String(stats.totalMessages)} description="Contact submissions" icon={<MessageSquare className="w-4 h-4" />} trend={stats.todayMessages > 0 ? `+${stats.todayMessages} today` : undefined} />
              <StatsCard title="Unread Messages" value={String(stats.unreadMessages)} description="Awaiting response" icon={<Mail className="w-4 h-4" />} highlight={stats.unreadMessages > 0} />
              <StatsCard title="Projects" value={String(overviewCounts.projects)} description="Active projects" icon={<FolderKanban className="w-4 h-4" />} />
              <StatsCard title="Certificates" value={String(overviewCounts.certificates)} description="Total certificates" icon={<Award className="w-4 h-4" />} />
            </div>

            {/* Recent activity — 2×2 grid */}
            <div className="grid gap-4 md:grid-cols-2">

              {/* Recent Contact Messages */}
              <Card className="bg-card/50">
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <div>
                    <CardTitle className="text-base flex items-center gap-2"><MessageSquare className="w-4 h-4 text-primary" />Contact Messages</CardTitle>
                    <CardDescription>Latest form submissions</CardDescription>
                  </div>
                  <Button variant="ghost" size="sm" onClick={() => setActiveTab("messages")}>View All</Button>
                </CardHeader>
                <CardContent>
                  {isLoadingMessages ? (
                    <div className="flex items-center justify-center py-8"><RefreshCw className="w-5 h-5 animate-spin text-muted-foreground" /></div>
                  ) : messages.length === 0 ? (
                    <div className="text-center py-8 text-muted-foreground"><MessageSquare className="w-8 h-8 mx-auto mb-2 opacity-50" /><p className="text-sm">No messages yet</p></div>
                  ) : (
                    <div className="space-y-2">
                      {messages.slice(0, 3).map((msg) => (
                        <div key={msg.id} className={`p-3 rounded-lg border ${msg.is_read ? "bg-secondary/30 border-border" : "bg-primary/5 border-primary/20"}`}>
                          <div className="flex items-start justify-between gap-2">
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2">
                                <p className="font-medium text-sm truncate">{msg.name}</p>
                                {!msg.is_read && <Badge variant="default" className="text-[10px] px-1.5 py-0">New</Badge>}
                              </div>
                              <p className="text-xs text-muted-foreground truncate">{msg.email}</p>
                              <p className="text-xs text-muted-foreground mt-1 line-clamp-1">{msg.message}</p>
                            </div>
                            <span className="text-xs text-muted-foreground/70 whitespace-nowrap">{formatDate(msg.created_at)}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Recent Direct Messages (chatpage) */}
              <Card className="bg-card/50">
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <div>
                    <CardTitle className="text-base flex items-center gap-2">
                      <MessageCircle className="w-4 h-4 text-primary" />Direct Messages
                    </CardTitle>
                    <CardDescription>Messages from authenticated visitors</CardDescription>
                  </div>
                  <Button variant="ghost" size="sm" onClick={() => setActiveTab("chatbot")}>View All</Button>
                </CardHeader>
                <CardContent>
                  {recentDirectMsgs.length === 0 ? (
                    <div className="text-center py-8 text-muted-foreground"><MessageCircle className="w-8 h-8 mx-auto mb-2 opacity-50" /><p className="text-sm">No direct messages yet</p></div>
                  ) : (
                    <div className="space-y-2">
                      {recentDirectMsgs.map((msg, i) => {
                        const name = msg.user_name ?? msg.user_email ?? "Visitor";
                        const initial = name[0]?.toUpperCase() ?? "V";
                        return (
                          <div key={`direct-${msg.session_id}-${i}`} className="flex items-start gap-2.5 p-2.5 rounded-lg border border-primary/20 bg-primary/5">
                            <div className="w-7 h-7 rounded-full bg-primary/10 flex items-center justify-center text-xs font-bold text-primary shrink-0">{initial}</div>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-1.5 mb-0.5">
                                <p className="text-xs font-medium truncate">{name}</p>
                                <Badge variant="outline" className="text-[9px] px-1.5 py-0 text-primary border-primary/40 shrink-0">Direct</Badge>
                              </div>
                              <p className="text-xs text-muted-foreground line-clamp-1">{msg.content || "—"}</p>
                            </div>
                            <span className="text-[10px] text-muted-foreground/70 whitespace-nowrap shrink-0">{formatDate(msg.created_at)}</span>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Recent AI Chatbot */}
              <Card className="bg-card/50">
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <div>
                    <CardTitle className="text-base flex items-center gap-2"><Bot className="w-4 h-4 text-primary" />AI Chatbot</CardTitle>
                    <CardDescription>Recent anonymous AI conversations</CardDescription>
                  </div>
                  <Button variant="ghost" size="sm" onClick={() => setActiveTab("chatbot")}>View All</Button>
                </CardHeader>
                <CardContent>
                  {recentAiMsgs.length === 0 ? (
                    <div className="text-center py-8 text-muted-foreground"><Bot className="w-8 h-8 mx-auto mb-2 opacity-50" /><p className="text-sm">No AI chat activity yet</p></div>
                  ) : (
                    <div className="space-y-2">
                      {recentAiMsgs.map((msg, i) => (
                        <div key={`ai-${msg.session_id}-${i}`} className="flex items-start gap-2.5 p-2.5 rounded-lg border border-border bg-secondary/20">
                          <div className="w-7 h-7 rounded-full bg-secondary flex items-center justify-center shrink-0">
                            <Bot className="w-3.5 h-3.5 text-muted-foreground" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-1.5 mb-0.5">
                              <p className="text-xs font-medium text-muted-foreground">Anonymous visitor</p>
                              <Badge variant="outline" className="text-[9px] px-1.5 py-0 shrink-0">AI Chat</Badge>
                            </div>
                            <p className="text-xs text-muted-foreground line-clamp-1">{msg.content || "—"}</p>
                          </div>
                          <span className="text-[10px] text-muted-foreground/70 whitespace-nowrap shrink-0">{formatDate(msg.created_at)}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Recent Feedback */}
              <Card className="bg-card/50">
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <div>
                    <CardTitle className="text-base flex items-center gap-2"><MessageCircleHeart className="w-4 h-4 text-primary" />Recent Feedback</CardTitle>
                    <CardDescription>Latest portfolio reviews</CardDescription>
                  </div>
                  <Button variant="ghost" size="sm" onClick={() => setActiveTab("feedback")}>View All</Button>
                </CardHeader>
                <CardContent>
                  {recentFeedbacks.length === 0 ? (
                    <div className="text-center py-8 text-muted-foreground"><MessageCircleHeart className="w-8 h-8 mx-auto mb-2 opacity-50" /><p className="text-sm">No feedback yet</p></div>
                  ) : (
                    <div className="space-y-2">
                      {recentFeedbacks.map((fb) => (
                        <div key={fb.id} className="flex items-start gap-2.5 p-2.5 rounded-lg border border-border bg-secondary/20">
                          <div className="w-7 h-7 rounded-full bg-secondary flex items-center justify-center text-base shrink-0 border border-border">{fb.emoji}</div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-1.5 mb-0.5">
                              <p className="text-xs font-medium truncate">{fb.name || <span className="italic text-muted-foreground">Anonymous</span>}</p>
                              <div className="flex gap-0.5 shrink-0">
                                {Array.from({ length: 5 }).map((_, i) => (
                                  <Star key={i} className={`w-2.5 h-2.5 ${i < fb.rating ? "fill-amber-400 text-amber-400" : "text-muted-foreground/20"}`} />
                                ))}
                              </div>
                            </div>
                            <p className="text-xs text-muted-foreground line-clamp-1">{fb.message}</p>
                          </div>
                          <span className="text-[10px] text-muted-foreground/70 whitespace-nowrap shrink-0">{formatDate(fb.created_at)}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>

            {/* Quick Actions */}
            <Card className="bg-card/50">
              <CardHeader><CardTitle className="text-base">Quick Actions</CardTitle><CardDescription>Jump to any section</CardDescription></CardHeader>
              <CardContent className="flex flex-wrap gap-2">
                {[
                  { label: "View Messages",    icon: <MessageSquare className="w-4 h-4" />,         tab: "messages",     badge: stats.unreadMessages > 0 ? `${stats.unreadMessages} unread` : undefined },
                  { label: "Chatbot History",  icon: <Bot className="w-4 h-4" />,                   tab: "chatbot",      badge: chatbotSessionCount > 0 ? `${chatbotSessionCount} sessions` : undefined },
                  { label: "Manage Projects",  icon: <FolderKanban className="w-4 h-4" />,          tab: "projects" },
                  { label: "Add Certificate",  icon: <Award className="w-4 h-4" />,                 tab: "certificates" },
                  { label: "Update Profile",   icon: <User className="w-4 h-4" />,                  tab: "profile" },
                  { label: "Hero Roles",       icon: <Type className="w-4 h-4" />,                  tab: "hero-roles" },
                  { label: "Manage Gallery",   icon: <Images className="w-4 h-4" />,                tab: "gallery" },
                  { label: "View Feedback",    icon: <MessageCircleHeart className="w-4 h-4" />,    tab: "feedback" },
                ].map((action) => (
                  <Button key={action.tab} variant="outline" size="sm" className="gap-2" onClick={() => setActiveTab(action.tab)}>
                    {action.icon}{action.label}
                    {action.badge && <Badge variant="secondary" className="ml-1">{action.badge}</Badge>}
                  </Button>
                ))}
              </CardContent>
            </Card>
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
          <TabsContent value="hero-roles"><HeroRolesManager /></TabsContent>
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