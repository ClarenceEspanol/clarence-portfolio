"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import {
  Bot, RefreshCw, Trash2, Send, KeyRound, User, FileText,
  AlertCircle, Save, MessageSquare, MessageCircle,
} from "lucide-react";
import { toast } from "./toast";
import type { ChatSession, ChatbotMessage } from "./types";

// ─── AI Settings Panel ────────────────────────────────────────────────────────

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
        supabase.from("chatbot_conversations").select("*", { count: "exact", head: true }).eq("role", "assistant"),
      ]);
      const map: Record<string, string> = {};
      (settings || []).forEach((s: { key: string; value: string }) => { map[s.key] = s.value; });
      setEnabled(map["ai_chatbot_enabled"] !== "false");
      setLimitInput(map["ai_chatbot_limit"] ?? "");
      const total = count ?? 0;
      setTotalResponses(total);
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
          <span className={`text-xs font-semibold px-2 py-1 rounded-full border ${!enabled ? "bg-amber-500/10 text-amber-600 border-amber-500/30" : isLimitReached ? "bg-red-500/10 text-red-500 border-red-500/30" : "bg-green-500/10 text-green-600 border-green-500/30"}`}>
            {!enabled ? "⚠ Disabled" : isLimitReached ? "⛔ Limit Reached" : "✓ Active"}
          </span>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {autoDeactivated && (
          <div className="flex items-start gap-2 p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-600 dark:text-red-400 text-sm">
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
            <div>
              <p className="font-semibold">AI auto-deactivated</p>
              <p className="text-xs mt-0.5 opacity-80">The AI reached its response limit and was automatically disabled to prevent errors. Reset the counter or raise the limit to re-enable.</p>
            </div>
          </div>
        )}
        <div className="flex items-center justify-between gap-4 p-3 rounded-xl bg-background/50 border border-border">
          <div>
            <p className="text-sm font-medium">AI Chatbot Active</p>
            <p className="text-xs text-muted-foreground">When disabled, a warning is shown to visitors</p>
          </div>
          <Switch checked={enabled} onCheckedChange={(val) => { setEnabled(val); setAutoDeactivated(false); }} />
        </div>
        <div className="p-3 rounded-xl bg-background/50 border border-border space-y-2">
          <div><p className="text-sm font-medium">Response Limit</p><p className="text-xs text-muted-foreground">Max total AI responses. Leave blank for unlimited. AI auto-disables when reached.</p></div>
          <Input type="number" min="1" value={limitInput} onChange={(e) => setLimitInput(e.target.value)} placeholder="e.g. 500 (blank = unlimited)" className="flex-1 text-sm" />
          {limit !== null && (
            <div className="space-y-1">
              <div className="flex items-center justify-between text-xs text-muted-foreground">
                <span>{totalResponses} / {limit} responses used</span>
                <span className={`font-semibold ${usagePercent >= 90 ? "text-red-500" : usagePercent >= 70 ? "text-amber-500" : "text-green-600"}`}>{usagePercent}%</span>
              </div>
              <div className="h-2 rounded-full bg-muted overflow-hidden">
                <div className={`h-full rounded-full transition-all ${usagePercent >= 90 ? "bg-red-500" : usagePercent >= 70 ? "bg-amber-500" : "bg-green-500"}`} style={{ width: `${usagePercent}%` }} />
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
        <div className="flex gap-2 flex-wrap">
          <Button size="sm" onClick={saveSettings} disabled={saving} className="shrink-0">
            <Save className="w-3.5 h-3.5 mr-1.5" />{saving ? "Saving…" : "Save Settings"}
          </Button>
          <Button size="sm" variant="outline" onClick={resetCount} className="text-destructive border-destructive/30 hover:bg-destructive/10 shrink-0">
            <RefreshCw className="w-3.5 h-3.5 mr-1.5" />Reset Counter
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

// ─── Chatbot Manager ──────────────────────────────────────────────────────────

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

export function ChatbotManager() {
  const supabase = createClient();
  const [sessions, setSessions] = useState<ChatSession[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedSession, setSelectedSession] = useState<string | null>(null);
  const [replyText, setReplyText] = useState("");
  const [sending, setSending] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const fetchSessions = useCallback(async () => {
    setLoading(true);
    try {
      const { data } = await supabase.from("chatbot_conversations").select("*").order("created_at", { ascending: true });
      const rows: ChatbotMessage[] = data || [];
      const sessionMap = new Map<string, ChatbotMessage[]>();
      for (const row of rows) {
        if (!sessionMap.has(row.session_id)) sessionMap.set(row.session_id, []);
        sessionMap.get(row.session_id)!.push(row);
      }
      const built: ChatSession[] = [];
      sessionMap.forEach((msgs, session_id) => {
        const userMsg = msgs.find((m) => m.role === "user" && m.user_name);
        const displayName = userMsg?.user_name ?? `Visitor ${session_id.slice(5, 13)}`;
        const displayEmail = userMsg?.user_email ?? "";
        const isDirectChat = session_id.startsWith("user_");
        built.push({ session_id, messages: msgs, lastActivity: msgs[msgs.length - 1]?.created_at ?? "", unread: msgs.some((m) => m.role === "user"), displayName, displayEmail, isDirectChat });
      });
      built.sort((a, b) => new Date(b.lastActivity).getTime() - new Date(a.lastActivity).getTime());
      setSessions(built);
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  }, [supabase]);

  useEffect(() => { fetchSessions(); }, [fetchSessions]);

  useEffect(() => {
    const channel = supabase.channel("chatbot_admin_watch")
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "chatbot_conversations" }, () => { fetchSessions(); })
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [supabase, fetchSessions]);

  useEffect(() => {
    if (selectedSession) messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [sessions, selectedSession]);

  const sendAdminReply = async () => {
    if (!selectedSession || !replyText.trim() || sending) return;
    setSending(true);
    try {
      await supabase.from("chatbot_conversations").insert({ session_id: selectedSession, role: "admin", content: replyText.trim(), created_at: new Date().toISOString() });
      setReplyText("");
      await fetchSessions();
    } catch (e) { console.error(e); }
    finally { setSending(false); }
  };

  const deleteSession = async (sessionId: string) => {
    await supabase.from("chatbot_conversations").delete().eq("session_id", sessionId);
    setSessions((prev) => prev.filter((s) => s.session_id !== sessionId));
    if (selectedSession === sessionId) setSelectedSession(null);
  };

  const formatTime = (dateStr: string) => new Date(dateStr).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  const formatSessionDate = (dateStr: string) => new Date(dateStr).toLocaleString("en-US", { month: "short", day: "numeric", hour: "numeric", minute: "2-digit" });
  const activeSession = sessions.find((s) => s.session_id === selectedSession);

  return (
    <div className="space-y-6">
      <AISettingsPanel />
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h2 className="text-2xl font-bold flex items-center gap-2"><Bot className="w-6 h-6 text-primary" />Chatbot Conversations</h2>
          <p className="text-muted-foreground">{sessions.filter(s => !s.isDirectChat).length} AI · {sessions.filter(s => s.isDirectChat).length} Direct — you can reply directly to visitors</p>
        </div>
        <Button variant="outline" size="sm" onClick={fetchSessions} disabled={loading}>
          <RefreshCw className={`w-4 h-4 mr-2 ${loading ? "animate-spin" : ""}`} />Refresh
        </Button>
      </div>

      {loading ? (
        <div className="flex justify-center py-16"><RefreshCw className="w-6 h-6 animate-spin text-muted-foreground" /></div>
      ) : (
        <Tabs defaultValue="ai" className="space-y-4">
          <TabsList className="h-10">
            <TabsTrigger value="ai" className="gap-2 text-sm">
              <Bot className="w-4 h-4" />
              AI Conversations
              {sessions.filter((s) => !s.isDirectChat).length > 0 && (
                <span className="ml-1 px-1.5 py-0.5 rounded-full text-[10px] font-semibold bg-primary/15 text-primary">
                  {sessions.filter((s) => !s.isDirectChat).length}
                </span>
              )}
            </TabsTrigger>
            <TabsTrigger value="direct" className="gap-2 text-sm">
              <MessageCircle className="w-4 h-4" />
              Direct Messages
              {sessions.filter((s) => s.isDirectChat).length > 0 && (
                <span className="ml-1 px-1.5 py-0.5 rounded-full text-[10px] font-semibold bg-blue-500/15 text-blue-500">
                  {sessions.filter((s) => s.isDirectChat).length}
                </span>
              )}
            </TabsTrigger>
          </TabsList>

          {(["ai", "direct"] as const).map((tab) => {
            const tabSessions = sessions.filter((s) => tab === "direct" ? s.isDirectChat : !s.isDirectChat);
            const emptyIcon = tab === "direct" ? <MessageCircle className="w-12 h-12 mx-auto mb-4 text-muted-foreground/30" /> : <Bot className="w-12 h-12 mx-auto mb-4 text-muted-foreground/30" />;
            const emptyText = tab === "direct" ? "No direct messages yet" : "No AI conversations yet";
            const emptyDesc = tab === "direct" ? "Direct messages from visitors who provide their name and email will appear here." : "When visitors use the AI chatbot anonymously, their conversations will appear here.";
            return (
              <TabsContent key={tab} value={tab}>
                {tabSessions.length === 0 ? (
                  <Card className="bg-card/50"><CardContent className="text-center py-16">{emptyIcon}<h3 className="font-medium text-lg mb-1">{emptyText}</h3><p className="text-sm text-muted-foreground">{emptyDesc}</p></CardContent></Card>
                ) : (
        <div className="grid gap-4 lg:grid-cols-5">
          {/* Session list */}
          <div className="lg:col-span-2 space-y-2">
            {tabSessions.map((session) => {
              const lastMsg = session.messages[session.messages.length - 1];
              const isSelected = selectedSession === session.session_id;
              const userMsgs = session.messages.filter((m) => m.role === "user").length;
              return (
                <div key={session.session_id} onClick={() => setSelectedSession(session.session_id)}
                  className={`p-3 rounded-xl border cursor-pointer transition-all ${isSelected ? tab === "direct" ? "bg-blue-500/10 border-blue-500/40" : "bg-primary/10 border-primary/40" : "bg-card/50 border-border hover:border-primary/30 hover:bg-secondary/30"}`}>
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-2 min-w-0">
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 text-xs font-bold ${tab === "direct" ? "bg-blue-500/10 text-blue-500" : "bg-primary/10 text-primary"}`}>
                        {tab === "direct" ? (session.displayName[0]?.toUpperCase() ?? "V") : <Bot className="w-4 h-4" />}
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm font-medium truncate">{session.displayName}</p>
                        {session.displayEmail && <p className="text-[10px] text-muted-foreground truncate">{session.displayEmail}</p>}
                        <p className="text-xs text-muted-foreground truncate mt-0.5">
                          {lastMsg?.content ? `${lastMsg.content.slice(0, 45)}${lastMsg.content.length > 45 ? "…" : ""}` : lastMsg?.file_type === "image" ? "📷 Image" : lastMsg?.file_type === "video" ? "🎬 Video" : lastMsg?.file_type === "audio" ? "🎤 Voice message" : lastMsg?.file_type === "file" ? `📎 ${lastMsg.file_name ?? "File"}` : ""}
                        </p>
                      </div>
                    </div>
                    <div className="flex flex-col items-end gap-1 shrink-0">
                      <span className="text-[10px] text-muted-foreground whitespace-nowrap">{formatDate(session.lastActivity)}</span>
                      <Badge variant="outline" className="text-[10px] px-1.5 py-0">{userMsgs} msg{userMsgs !== 1 ? "s" : ""}</Badge>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Conversation thread */}
          <div className="lg:col-span-3">
            {!activeSession || !tabSessions.find((s) => s.session_id === selectedSession) ? (
              <Card className="bg-card/50 h-full"><CardContent className="flex flex-col items-center justify-center py-16 text-center"><MessageSquare className="w-10 h-10 mb-3 text-muted-foreground/30" /><p className="text-sm text-muted-foreground">Select a conversation to view messages</p></CardContent></Card>
            ) : (
              <Card className="bg-card/50 flex flex-col h-full">
                <CardHeader className="flex flex-row items-center justify-between pb-3 border-b border-border">
                  <div>
                    <CardTitle className="text-base flex items-center gap-2">
                      <div className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center text-xs font-bold text-primary shrink-0">{activeSession.displayName[0]?.toUpperCase() ?? "V"}</div>
                      {activeSession.displayName}
                      {activeSession.isDirectChat && <Badge variant="outline" className="text-[10px] px-1.5 py-0 text-primary border-primary/40">Direct Chat</Badge>}
                    </CardTitle>
                    <CardDescription>
                      {activeSession.displayEmail && <span className="mr-2">{activeSession.displayEmail} ·</span>}
                      {activeSession.messages.length} messages · Started {formatSessionDate(activeSession.messages[0]?.created_at)}
                    </CardDescription>
                  </div>
                  <Button variant="ghost" size="icon" className="text-destructive hover:text-destructive shrink-0" onClick={() => deleteSession(activeSession.session_id)} title="Delete session">
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </CardHeader>
                <CardContent className="flex-1 overflow-y-auto py-4 space-y-3" style={{ maxHeight: 420 }}>
                  {activeSession.messages.map((msg) => {
                    const isUser = msg.role === "user";
                    const isAdmin = msg.role === "admin";
                    const hasFile = !!msg.file_url;
                    return (
                      <div key={msg.id} className={`flex gap-2 ${isUser ? "flex-row-reverse" : "flex-row"}`}>
                        <div className={`w-7 h-7 rounded-full flex items-center justify-center shrink-0 mt-1 ${isUser ? "bg-secondary" : isAdmin ? "bg-green-500/20" : "bg-primary/10"}`}>
                          {isUser ? <User className="w-4 h-4 text-muted-foreground" /> : isAdmin ? <KeyRound className="w-4 h-4 text-green-600" /> : <Bot className="w-4 h-4 text-primary" />}
                        </div>
                        <div className={`max-w-[75%] flex flex-col ${isUser ? "items-end" : "items-start"}`}>
                          {isAdmin && <span className="text-[10px] text-muted-foreground mb-0.5 px-1">Admin reply</span>}
                          {hasFile && (
                            <div className={`mb-1 rounded-2xl overflow-hidden ${isUser ? "rounded-tr-sm" : "rounded-tl-sm"}`}>
                              {msg.file_type === "image" && <img src={msg.file_url!} alt="Image" className="max-w-50 max-h-50 object-cover rounded-2xl cursor-pointer" onClick={() => window.open(msg.file_url!, "_blank")} />}
                              {msg.file_type === "video" && <video src={msg.file_url!} controls className="max-w-50 rounded-2xl" />}
                              {msg.file_type === "audio" && <div className={`px-3 py-2 rounded-2xl flex items-center gap-2 ${isUser ? "bg-secondary" : "bg-primary/10"}`}><FileText className="w-4 h-4 shrink-0 text-muted-foreground" /><audio src={msg.file_url!} controls className="h-8 max-w-40" /></div>}
                              {msg.file_type === "file" && <a href={msg.file_url!} target="_blank" rel="noopener noreferrer" className={`flex items-center gap-2 px-3 py-2.5 rounded-2xl text-sm ${isUser ? "bg-secondary text-foreground" : "bg-primary/10 text-foreground"}`}><FileText className="w-4 h-4 shrink-0" /><span className="truncate max-w-37.5">{msg.file_name ?? "File"}</span></a>}
                            </div>
                          )}
                          {msg.content && (
                            <div className={`px-3 py-2 rounded-2xl text-sm leading-relaxed ${isUser ? "bg-secondary text-foreground rounded-tr-sm" : isAdmin ? "bg-green-500/15 border border-green-500/30 text-foreground rounded-tl-sm" : "bg-primary/10 text-foreground rounded-tl-sm"}`}>
                              {msg.content}
                            </div>
                          )}
                          <span className="text-[10px] text-muted-foreground mt-1 px-1">{formatTime(msg.created_at)}</span>
                        </div>
                      </div>
                    );
                  })}
                  <div ref={messagesEndRef} />
                </CardContent>
                {tab === "direct" ? (
                  <div className="px-4 py-3 border-t border-border bg-card/50">
                    <p className="text-xs text-muted-foreground mb-2 flex items-center gap-1"><KeyRound className="w-3 h-3" />Reply as admin — visitor will see this in real-time</p>
                    <div className="flex gap-2">
                      <Input value={replyText} onChange={(e) => setReplyText(e.target.value)} onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); sendAdminReply(); }}} placeholder="Type your reply..." className="flex-1 text-sm" disabled={sending} />
                      <Button size="sm" onClick={sendAdminReply} disabled={!replyText.trim() || sending} className="shrink-0">
                        <Send className="w-4 h-4 mr-1.5" />{sending ? "Sending…" : "Reply"}
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div className="px-4 py-3 border-t border-border bg-muted/30">
                    <p className="text-xs text-muted-foreground flex items-center gap-1.5">
                      <Bot className="w-3.5 h-3.5 shrink-0" />
                      AI-only conversation — no user identity to reply to. View only.
                    </p>
                  </div>
                )}
              </Card>
            )}
              </div>
            </div>
                )}
              </TabsContent>
            );
          })}
        </Tabs>
      )}
    </div>
  );
}