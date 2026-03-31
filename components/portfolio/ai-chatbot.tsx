"use client";

import { useState, useEffect, useRef } from "react";
import { cn } from "@/lib/utils";
import { createClient } from "@/lib/supabase/client";
import { getProfile, getProjects, getSkills } from "@/lib/supabase/data";
import { X, Send, Bot, Minimize2, UserCircle, RefreshCw } from "lucide-react";

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: Date;
  suggestions?: string[]; // AI-recommended follow-up questions
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

// Parse AI response — split out the suggestions line from the visible text
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

// Staggered intro messages shown when chat first opens
const PRE_MESSAGES: { id: string; content: string; delay: number }[] = [
  {
    id: "pre_0",
    content: "Hi there! 👋 I'm Clarence's AI assistant.",
    delay: 0,
  },
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
  {
    id: "pre_3",
    content: "Go ahead — ask me anything! 🚀",
    delay: 2700,
  },
];

const DEFAULT_SUGGESTIONS = [
  "What are your skills?",
  "Tell me about your projects",
  "How can I contact you?",
  "Are you open to work?",
];

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
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const preTimers = useRef<ReturnType<typeof setTimeout>[]>([]);

  useEffect(() => {
    buildPortfolioContext().then(setPortfolioContext);
  }, []);

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
    return () => {
      supabase.removeChannel(channel);
    };
  }, [sessionId, isOpen, isMinimized, supabase]);

  // Play pre-messages — callable anytime (open or reset)
  const playPreMessages = () => {
    // Clear any pending timers
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
      }, delay);
      preTimers.current.push(t);
    });

    const endTimer = setTimeout(() => {
      setPreMessagesTyping(false);
    }, PRE_MESSAGES[PRE_MESSAGES.length - 1].delay + 600);
    preTimers.current.push(endTimer);
  };

  // Show pre-messages on first open
  useEffect(() => {
    if (isOpen && !hasGreeted) {
      setHasGreeted(true);
      playPreMessages();
    }
  }, [isOpen, hasGreeted]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const sendMessage = async (text: string) => {
    if (!text.trim() || isLoading) return;

    const userMsg: Message = {
      id: Date.now().toString(),
      role: "user",
      content: text,
      timestamp: new Date(),
    };
    setMessages((prev) => [...prev, userMsg]);
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
  };

  const formatTime = (d: Date) =>
    d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });

  const userMessageCount = messages.filter((m) => m.role === "user").length;

  return (
    <>
      {/* Floating trigger button */}
      <button
        onClick={() => {
          setIsOpen(true);
          setIsMinimized(false);
          setUnreadCount(0);
        }}
        className={cn(
          "fixed bottom-8 right-24 z-40 w-14 h-14 rounded-full bg-primary text-white shadow-lg flex items-center justify-center transition-all duration-300",
          isOpen && "scale-0 opacity-0 pointer-events-none"
        )}
      >
        <Bot className="w-6 h-6" />
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 rounded-full text-xs flex items-center justify-center font-bold">
            {unreadCount}
          </span>
        )}
      </button>

      {/* Chat window */}
      <div
        className={cn(
          "fixed z-50 bottom-4 right-4 w-80 sm:w-96 transition-all duration-300 origin-bottom-right",
          isOpen ? "scale-100 opacity-100" : "scale-0 opacity-0 pointer-events-none"
        )}
      >
        <div className="flex flex-col rounded-2xl overflow-hidden shadow-2xl border bg-card">

          {/* Header */}
          <div className="flex items-center gap-3 px-4 py-3 bg-primary text-white shrink-0">
            <Bot className="w-5 h-5" />
            <div className="flex-1 text-sm font-bold">Portfolio Assistant</div>
            {/* Reset / replay pre-messages */}
            <button
              onClick={() => {
                setHasGreeted(false);
                playPreMessages();
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
            {/* Messages scroll area — grows to fill, never overflows */}
            <div className="overflow-y-auto p-3 space-y-2 bg-background/50 flex-1 min-h-0 max-h-72">
              {messages.map((msg) => (
                <div
                  key={msg.id}
                  className={cn(
                    "flex gap-2",
                    msg.role === "user" ? "flex-row-reverse" : "flex-row"
                  )}
                >
                  <div
                    className={cn(
                      "max-w-[78%] flex flex-col",
                      msg.role === "user" ? "items-end" : "items-start"
                    )}
                  >
                    <div
                      className={cn(
                        "px-3 py-2 rounded-2xl text-sm whitespace-pre-line leading-relaxed",
                        msg.role === "user"
                          ? "bg-primary text-white"
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
                  <div className="bg-secondary px-3 py-2.5 rounded-2xl flex gap-1 items-center">
                    <span className="w-1.5 h-1.5 bg-muted-foreground rounded-full animate-bounce [animation-delay:0ms]" />
                    <span className="w-1.5 h-1.5 bg-muted-foreground rounded-full animate-bounce [animation-delay:150ms]" />
                    <span className="w-1.5 h-1.5 bg-muted-foreground rounded-full animate-bounce [animation-delay:300ms]" />
                  </div>
                </div>
              )}

              <div ref={messagesEndRef} />
            </div>

            {/* AI-recommended / default suggestions */}
            {!isLoading && latestSuggestions.length > 0 && (
              <div className="px-3 pt-2 pb-1 flex flex-wrap gap-1.5 shrink-0">
                {latestSuggestions.map((q) => (
                  <button
                    key={q}
                    onClick={() => sendMessage(q)}
                    className="text-[10px] border border-primary/30 text-primary rounded-full px-2.5 py-1 hover:bg-primary/10 transition-colors"
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
              <input
                ref={inputRef}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && sendMessage(input)}
                placeholder="Ask about Clarence..."
                className="flex-1 text-sm bg-secondary/50 rounded-full px-4 py-2 outline-none"
                disabled={isLoading}
              />
              <button
                onClick={() => sendMessage(input)}
                disabled={isLoading || !input.trim()}
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