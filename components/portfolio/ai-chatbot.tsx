"use client";

import { useState, useEffect, useRef } from "react";
import { cn } from "@/lib/utils";
import { createClient } from "@/lib/supabase/client";
import { getProfile, getProjects, getSkills, type Profile } from "@/lib/supabase/data";
import { X, Send, Bot, Minimize2, UserCircle, RefreshCw, AlertTriangle, PowerOff } from "lucide-react";

// ── Rate limiting constants ───────────────────────────────────────────────────
const AI_COOLDOWN_MS = 10_000;
const SESSION_SOFT_LIMIT = 20;

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: Date;
  suggestions?: string[];
}

interface AIStatus {
  enabled: boolean;
  limit: number | null;
  totalResponses: number;
}

async function fetchAIStatus(supabase: ReturnType<typeof createClient>): Promise<AIStatus> {
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

    const enabled = map["ai_chatbot_enabled"] !== "false";
    const limitRaw = map["ai_chatbot_limit"];
    const limit = limitRaw ? parseInt(limitRaw, 10) : null;
    const totalResponses = count ?? 0;

    return { enabled, limit, totalResponses };
  } catch {
    return { enabled: true, limit: null, totalResponses: 0 };
  }
}

async function buildPortfolioContext() {
  try {
    const [profile, projects, skills] = await Promise.all([
      getProfile(),
      getProjects(),
      getSkills(),
    ]);

    return `
You are an AI assistant for ${profile?.name ?? "Clarence Espanol"}'s portfolio website.
Answer only based on this data. Be friendly, concise, and helpful.
If asked something outside the portfolio scope, politely redirect to what you know.

About: Clarence Espanol is a Full-Stack Developer based in the Philippines, passionate about building modern and performant web apps. He is open to freelance and full-time opportunities.
Skills: ${skills.map((s) => s.name).join(", ")}
Projects: ${projects.map((p) => p.title).join(", ")}
Contact: Visitors can reach Clarence through the Contact section of the portfolio, or by clicking "Chat with Clarence" in this chatbot.

IMPORTANT: At the end of EVERY response, add a line that starts exactly with "SUGGESTIONS:" followed by 2-3 short follow-up questions separated by "|". Example:
SUGGESTIONS: What projects has he built?|Is he available for hire?|What's his tech stack?
`.trim();
  } catch {
    return `You are an AI assistant for Clarence Espanol's portfolio. Answer questions about his skills, projects, and how to contact him. Be friendly and concise.
At the end of EVERY response, add a line starting with "SUGGESTIONS:" followed by 2-3 short follow-up questions separated by "|".`;
  }
}

function parseAIResponse(raw: string): { text: string; suggestions: string[] } {
  const lines = raw.split("\n");
  const suggLine = lines.find((l) => l.trim().startsWith("SUGGESTIONS:"));
  const text = lines
    .filter((l) => !l.trim().startsWith("SUGGESTIONS:"))
    .join("\n")
    .trim();
  const suggestions = suggLine
    ? suggLine
        .replace("SUGGESTIONS:", "")
        .split("|")
        .map((s) => s.trim())
        .filter(Boolean)
    : [];
  return { text, suggestions };
}

async function sendToAI(
  messages: Message[],
  portfolioContext: string,
  userMessage: string
): Promise<{ text: string; suggestions: string[] }> {
  const history = messages
    .filter((m) => !m.id.startsWith("pre_"))
    .slice(-10)
    .map((m) => ({
      role: m.role === "assistant" ? "model" : "user",
      parts: [{ text: m.content }],
    }));

  try {
    const response = await fetch("/api/chat", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        system_instruction: { parts: [{ text: portfolioContext }] },
        contents: [
          ...history,
          { role: "user", parts: [{ text: userMessage }] },
        ],
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      console.error("Server Error FULL:", JSON.stringify(data, null, 2));
      return { text: data?.error || "Something went wrong with AI.", suggestions: [] };
    }

    const raw =
      data?.candidates?.[0]?.content?.parts?.[0]?.text || "No response generated.";
    return parseAIResponse(raw);
  } catch (err) {
    console.error("Fetch Error:", err);
    return { text: "Connection error. Check server.", suggestions: [] };
  }
}

const PRE_MESSAGES: { id: string; content: string; delay: number }[] = [
  { id: "pre_0", content: "Hi there! 👋 I'm Clarence's AI assistant.", delay: 0 },
  {
    id: "pre_1",
    content:
      "This portfolio showcases Clarence's work as a Full-Stack Developer — from his skills and tech stack to the projects he's built. 💻",
    delay: 900,
  },
  {
    id: "pre_2",
    content:
      "You can ask me things like:\n• What tech stack does Clarence use?\n• What projects has he built?\n• Is he available for hire?\n• How can I get in touch with him?",
    delay: 1800,
  },
  { id: "pre_3", content: "Go ahead — ask me anything! 🚀", delay: 2700 },
];

const DEFAULT_SUGGESTIONS = [
  "What are your skills?",
  "Tell me about your projects",
  "How can I contact you?",
  "Are you open to work?",
];

// ── Avatar component ──────────────────────────────────────────────────────────
function AssistantAvatar({ profile }: { profile: Profile | null }) {
  if (profile?.profile_picture_url) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={profile.profile_picture_url}
        alt={profile.name ?? "Clarence"}
        className="w-7 h-7 rounded-full object-cover shrink-0 border border-border"
      />
    );
  }
  return (
    <div className="w-7 h-7 rounded-full bg-primary/20 flex items-center justify-center shrink-0">
      <Bot className="w-4 h-4 text-primary" />
    </div>
  );
}

export function AIChatbot() {
  const supabase = createClient();
  const [isOpen, setIsOpen] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [portfolioContext, setPortfolioContext] = useState("");
  const [hasGreeted, setHasGreeted] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const [preMessagesTyping, setPreMessagesTyping] = useState(false);
  const [latestSuggestions, setLatestSuggestions] = useState<string[]>(DEFAULT_SUGGESTIONS);
  const [sessionId] = useState(() => `session_${Date.now()}`);

  // ── Profile for avatar/name ────────────────────────────────────────────────
  const [profile, setProfile] = useState<Profile | null>(null);

  // ── AI Status ──────────────────────────────────────────────────────────────
  const [aiStatus, setAIStatus] = useState<AIStatus>({ enabled: true, limit: null, totalResponses: 0 });
  const [aiStatusLoaded, setAIStatusLoaded] = useState(false);

  // ── Rate limiting state ────────────────────────────────────────────────────
  const [lastMessageTime, setLastMessageTime] = useState<number>(0);
  const [cooldownRemaining, setCooldownRemaining] = useState(0);
  const [sessionMessageCount, setSessionMessageCount] = useState(0);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const preTimers = useRef<ReturnType<typeof setTimeout>[]>([]);
  const cooldownTimer = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    buildPortfolioContext().then(setPortfolioContext);
    getProfile().then(setProfile);
  }, []);

  useEffect(() => {
    fetchAIStatus(supabase).then((status) => {
      setAIStatus(status);
      setAIStatusLoaded(true);
    });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    const interval = setInterval(() => {
      fetchAIStatus(supabase).then(setAIStatus);
    }, 60_000);
    return () => clearInterval(interval);
  // eslint-disable-next-line react-hours/exhaustive-deps
  }, []);

  // ── Cooldown ticker ────────────────────────────────────────────────────────
  useEffect(() => {
    if (cooldownRemaining <= 0) {
      if (cooldownTimer.current) clearInterval(cooldownTimer.current);
      return;
    }
    cooldownTimer.current = setInterval(() => {
      const remaining = Math.max(0, AI_COOLDOWN_MS - (Date.now() - lastMessageTime));
      setCooldownRemaining(remaining);
      if (remaining <= 0 && cooldownTimer.current) clearInterval(cooldownTimer.current);
    }, 500);
    return () => { if (cooldownTimer.current) clearInterval(cooldownTimer.current); };
  }, [cooldownRemaining, lastMessageTime]);

  // Supabase real-time listener for admin replies
  useEffect(() => {
    const channel = supabase
      .channel(`chatbot_${sessionId}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "chatbot_conversations",
          filter: `session_id=eq.${sessionId}`,
        },
        (payload) => {
          const row = payload.new as {
            id: string;
            role: string;
            content: string;
            created_at: string;
          };
          if (row.role === "admin") {
            setMessages((prev) => [
              ...prev,
              {
                id: row.id,
                role: "assistant",
                content: `👤 Clarence: ${row.content}`,
                timestamp: new Date(row.created_at),
              },
            ]);
            if (!isOpen || isMinimized) setUnreadCount((c) => c + 1);
          }
        }
      )
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [sessionId, isOpen, isMinimized, supabase]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  useEffect(() => {
    if (isOpen && !isMinimized) {
      setTimeout(() => inputRef.current?.focus(), 300);
    }
  }, [isOpen, isMinimized]);

  const playPreMessages = () => {
    preTimers.current.forEach(clearTimeout);
    preTimers.current = [];
    setMessages([]);
    setLatestSuggestions(DEFAULT_SUGGESTIONS);
    setPreMessagesTyping(true);

    PRE_MESSAGES.forEach(({ id, content, delay }) => {
      const t = setTimeout(() => {
        setMessages((prev) => [
          ...prev,
          { id, role: "assistant", content, timestamp: new Date() },
        ]);
        if (id === PRE_MESSAGES[PRE_MESSAGES.length - 1].id) {
          setPreMessagesTyping(false);
        }
      }, delay);
      preTimers.current.push(t);
    });
  };

  useEffect(() => {
    if (isOpen && !hasGreeted) {
      setHasGreeted(true);
      playPreMessages();
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen]);

  // ── Derived AI availability ────────────────────────────────────────────────
  const isAIDisabled = !aiStatus.enabled;
  const isAILimitReached =
    aiStatus.limit !== null && aiStatus.totalResponses >= aiStatus.limit;
  const isAIUnavailable = isAIDisabled || isAILimitReached;

  const sendMessage = async (text: string = input) => {
    if (!text.trim() || isLoading || preMessagesTyping) return;
    if (isAIUnavailable) return;

    const now = Date.now();
    const timeSinceLast = now - lastMessageTime;
    if (lastMessageTime > 0 && timeSinceLast < AI_COOLDOWN_MS) {
      const remaining = Math.ceil((AI_COOLDOWN_MS - timeSinceLast) / 1000);
      setCooldownRemaining(AI_COOLDOWN_MS - timeSinceLast);
      const cooldownMsg: Message = {
        id: `cooldown_${now}`,
        role: "assistant",
        content: `⏳ Please wait ${remaining}s before sending another message.`,
        timestamp: new Date(),
      };
      setMessages((prev) => {
        const filtered = prev.filter((m) => !m.id.startsWith("cooldown_"));
        return [...filtered, cooldownMsg];
      });
      return;
    }

    setLastMessageTime(now);
    setCooldownRemaining(AI_COOLDOWN_MS);
    setSessionMessageCount((c) => c + 1);

    const userMsg: Message = {
      id: Date.now().toString(),
      role: "user",
      content: text,
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev.filter((m) => !m.id.startsWith("cooldown_")), userMsg]);
    setInput("");
    setIsLoading(true);
    setLatestSuggestions([]);

    await supabase
      .from("chatbot_conversations")
      .insert({ session_id: sessionId, role: "user", content: text });

    const { text: replyText, suggestions } = await sendToAI(
      messages,
      portfolioContext,
      text
    );

    const aiMsg: Message = {
      id: (Date.now() + 1).toString(),
      role: "assistant",
      content: replyText,
      timestamp: new Date(),
      suggestions,
    };

    setMessages((prev) => [...prev, aiMsg]);
    setLatestSuggestions(suggestions.length > 0 ? suggestions : DEFAULT_SUGGESTIONS);
    setIsLoading(false);

    await supabase
      .from("chatbot_conversations")
      .insert({ session_id: sessionId, role: "assistant", content: replyText });

    fetchAIStatus(supabase).then(setAIStatus);
  };

  const formatTime = (d: Date) =>
    d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });

  const cooldownSecs = Math.ceil(cooldownRemaining / 1000);
  const isCoolingDown = cooldownRemaining > 0 && !isLoading;
  const inputDisabled = isLoading || isCoolingDown || isAIUnavailable;

  // Display name for header
  const assistantName = profile?.name ? `${profile.name.split(" ")[0]} Assistant` : "Clarence Assistant";

  return (
    <>
      {/* Floating trigger button */}
      <div
        className={cn(
          "fixed bottom-8 right-24 z-40 group",
          isOpen && "scale-0 opacity-0 pointer-events-none"
        )}
      >
        <span className="absolute inset-0 rounded-full bg-primary/40 animate-ping group-hover:animate-none" />
        <span className="absolute bottom-full mb-2.5 left-1/2 -translate-x-1/2 whitespace-nowrap rounded-lg bg-popover border border-border text-popover-foreground text-xs font-medium px-2.5 py-1.5 shadow-md opacity-0 scale-90 group-hover:opacity-100 group-hover:scale-100 transition-all duration-200 pointer-events-none">
          Chat with AI 💬
          <span className="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-border" style={{ marginTop: '-1px' }} />
          <span className="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-popover" />
        </span>
        <button
          onClick={() => {
            setIsOpen(true);
            setIsMinimized(false);
            setUnreadCount(0);
          }}
          className="relative w-14 h-14 rounded-full bg-primary text-white shadow-lg flex items-center justify-center transition-all duration-300 hover:scale-110 hover:shadow-primary/40 hover:shadow-xl"
        >
          <Bot className="w-6 h-6 transition-transform duration-300 group-hover:rotate-12" />
          {unreadCount > 0 && (
            <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 rounded-full text-xs flex items-center justify-center font-bold">
              {unreadCount}
            </span>
          )}
        </button>
      </div>

      {/* Chat window */}
      <div
        className={cn(
          "fixed z-50 bottom-4 right-4 w-80 sm:w-96 transition-all duration-300 origin-bottom-right",
          isOpen ? "scale-100 opacity-100" : "scale-0 opacity-0 pointer-events-none"
        )}
      >
        <div className="flex flex-col rounded-2xl overflow-hidden shadow-2xl border bg-card">

          {/* Header — with profile pic + name */}
          <div className="flex items-center gap-3 px-4 py-3 bg-primary text-white shrink-0">
            {/* Avatar */}
            {profile?.profile_picture_url ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={profile.profile_picture_url}
                alt={profile.name ?? "Clarence"}
                className="w-8 h-8 rounded-full object-cover border-2 border-white/30 shrink-0"
              />
            ) : (
              <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center shrink-0">
                <Bot className="w-5 h-5" />
              </div>
            )}
            <div className="flex-1 min-w-0">
              <p className="text-sm font-bold leading-tight truncate">{assistantName}</p>
              {profile?.name && (
                <p className="text-[10px] text-white/70 leading-tight">AI-powered · {profile.name}</p>
              )}
            </div>
            <button
              onClick={() => {
                setHasGreeted(false);
                playPreMessages();
                setSessionMessageCount(0);
              }}
              title="Restart conversation"
              className="opacity-70 hover:opacity-100 transition-opacity"
            >
              <RefreshCw className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => setIsMinimized(!isMinimized)}
              title={isMinimized ? "Expand" : "Minimize"}
            >
              <Minimize2 className="w-4 h-4" />
            </button>
            <button onClick={() => setIsOpen(false)} title="Close">
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Collapsible body */}
          <div
            className={cn(
              "flex flex-col transition-all duration-300 overflow-hidden",
              isMinimized ? "max-h-0" : "max-h-130"
            )}
          >
            {/* ── AI Unavailable Banner ── */}
            {aiStatusLoaded && isAIUnavailable && (
              <div className="mx-3 mt-3 px-3 py-2.5 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-start gap-2">
                {isAIDisabled ? (
                  <PowerOff className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
                ) : (
                  <AlertTriangle className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
                )}
                <div>
                  <p className="text-xs font-semibold text-amber-600 dark:text-amber-400">
                    {isAIDisabled ? "AI Assistant Unavailable" : "AI Limit Reached"}
                  </p>
                  <p className="text-[11px] text-amber-600/80 dark:text-amber-400/80 mt-0.5">
                    {isAIDisabled
                      ? "The AI assistant has been temporarily disabled. You can still chat directly with Clarence below."
                      : "The AI has reached its response limit for now. Chat directly with Clarence instead!"}
                  </p>
                </div>
              </div>
            )}

            {/* Session soft-limit warning */}
            {!isAIUnavailable && sessionMessageCount >= SESSION_SOFT_LIMIT && (
              <div className="mx-3 mt-3 px-3 py-2 rounded-xl bg-orange-500/10 border border-orange-500/30 flex items-center gap-2">
                <AlertTriangle className="w-3.5 h-3.5 text-orange-500 shrink-0" />
                <p className="text-[11px] text-orange-600 dark:text-orange-400">
                  Long conversation — consider chatting directly with Clarence for more help.
                </p>
              </div>
            )}

            {/* Messages scroll area */}
            <div className="overflow-y-auto p-3 space-y-2 bg-background/50 flex-1 min-h-0 max-h-72">
              {messages.map((msg) => (
                <div
                  key={msg.id}
                  className={cn(
                    "flex gap-2",
                    msg.role === "user" ? "flex-row-reverse" : "flex-row"
                  )}
                >
                  {/* Assistant avatar inline with message */}
                  {msg.role === "assistant" && (
                    <AssistantAvatar profile={profile} />
                  )}

                  <div
                    className={cn(
                      "max-w-[78%] flex flex-col",
                      msg.role === "user" ? "items-end" : "items-start"
                    )}
                  >
                    {/* Name label for assistant messages */}
                    {msg.role === "assistant" && !msg.id.startsWith("pre_") && !msg.id.startsWith("cooldown_") && (
                      <span className="text-[10px] text-muted-foreground mb-0.5 px-1 font-medium">
                        {profile?.name ?? "Clarence"}
                      </span>
                    )}
                    <div
                      className={cn(
                        "px-3 py-2 rounded-2xl text-sm whitespace-pre-line leading-relaxed",
                        msg.role === "user"
                          ? "bg-primary text-white"
                          : msg.id.startsWith("cooldown_")
                          ? "bg-amber-500/10 border border-amber-500/30 text-amber-700 dark:text-amber-400 text-xs"
                          : "bg-secondary"
                      )}
                    >
                      {msg.content}
                    </div>
                    <span className="text-[10px] opacity-50 mt-1">
                      {formatTime(msg.timestamp)}
                    </span>
                  </div>
                </div>
              ))}

              {/* Typing indicator */}
              {(preMessagesTyping || isLoading) && (
                <div className="flex gap-2">
                  <AssistantAvatar profile={profile} />
                  <div className="bg-secondary px-3 py-2.5 rounded-2xl flex gap-1 items-center">
                    <span className="w-1.5 h-1.5 bg-muted-foreground rounded-full animate-bounce [animation-delay:0ms]" />
                    <span className="w-1.5 h-1.5 bg-muted-foreground rounded-full animate-bounce [animation-delay:150ms]" />
                    <span className="w-1.5 h-1.5 bg-muted-foreground rounded-full animate-bounce [animation-delay:300ms]" />
                  </div>
                </div>
              )}

              <div ref={messagesEndRef} />
            </div>

            {/* Suggestions */}
            {!isLoading && !isAIUnavailable && latestSuggestions.length > 0 && (
              <div className="px-3 pt-2 pb-1 flex flex-wrap gap-1.5 shrink-0">
                {latestSuggestions.map((q) => (
                  <button
                    key={q}
                    onClick={() => !inputDisabled && sendMessage(q)}
                    disabled={inputDisabled}
                    className="text-[10px] border border-primary/30 text-primary rounded-full px-2.5 py-1 hover:bg-primary/10 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                  >
                    {q}
                  </button>
                ))}
              </div>
            )}

            {/* Chat with Clarence CTA */}
            <div className="px-3 pb-2 pt-1 shrink-0">
              <a
                href="/chat"
                className="flex items-center justify-center gap-2 w-full py-2 rounded-xl border border-primary/30 bg-primary/5 hover:bg-primary/10 text-primary text-xs font-semibold transition-colors"
              >
                <UserCircle className="w-4 h-4" />
                Chat with Clarence
              </a>
            </div>

            {/* Input */}
            <div className="p-3 border-t flex gap-2 shrink-0">
              <div className="flex-1 relative">
                <input
                  ref={inputRef}
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && !inputDisabled && sendMessage(input)}
                  placeholder={
                    isAIUnavailable
                      ? "AI unavailable — use Chat with Clarence ↑"
                      : isCoolingDown
                      ? `Please wait ${cooldownSecs}s...`
                      : "Ask about Clarence..."
                  }
                  className="w-full text-sm bg-secondary/50 rounded-full px-4 py-2 outline-none disabled:opacity-50 disabled:cursor-not-allowed"
                  disabled={inputDisabled}
                />
                {isCoolingDown && (
                  <div className="absolute bottom-0 left-4 right-4 h-0.5 bg-muted rounded-full overflow-hidden">
                    <div
                      className="h-full bg-primary/50 rounded-full transition-all"
                      style={{ width: `${((AI_COOLDOWN_MS - cooldownRemaining) / AI_COOLDOWN_MS) * 100}%` }}
                    />
                  </div>
                )}
              </div>
              <button
                onClick={() => sendMessage(input)}
                disabled={inputDisabled || !input.trim()}
                className="bg-primary text-white p-2 rounded-full disabled:opacity-40 transition-opacity"
              >
                <Send className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}