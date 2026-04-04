"use client";

import { useState, useEffect, useRef } from "react";
import { createClient } from "@/lib/supabase/client";
import { Footer } from "@/components/portfolio/footer";
import { getProfile, type Profile } from "@/lib/supabase/data";
import {
  Send, MessageCircle, Loader2, UserCircle, ShieldCheck, Lock,
  Paperclip, Mic, X, Play, Pause, FileText, Film, AlertCircle,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useTheme } from "next-themes";
import { Sun, Moon } from "lucide-react";

const BUCKET = "portfolio-assets";

// ── File size limits ──────────────────────────────────────────────────────────
const MAX_FILE_SIZES: Record<string, number> = {
  image: 5 * 1024 * 1024,   // 5 MB
  video: 20 * 1024 * 1024,  // 20 MB
  audio: 10 * 1024 * 1024,  // 10 MB
  file:  5 * 1024 * 1024,   // 5 MB
};
const FILE_SIZE_LABELS: Record<string, string> = {
  image: "5 MB",
  video: "20 MB",
  audio: "10 MB",
  file:  "5 MB",
};

// ── Nav ───────────────────────────────────────────────────────────────────────

function ChatNav() {
  const { resolvedTheme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  const [profile, setProfile] = useState<Profile | null>(null);

  useEffect(() => {
    setMounted(true);
    getProfile().then(setProfile);
  }, []);

  const initials = profile?.name ? profile.name.split(" ").map((n) => n[0]).join("") : "CE";
  const firstName = profile?.name ? profile.name.split(" ")[0] : "Clarence";

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 glass bg-background/80 border-b border-border shadow-lg">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <a href="/" className="flex items-center gap-3 hover:opacity-80 transition-opacity">
            <div className="w-8 h-8 overflow-hidden">
              {profile?.profile_picture_url ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={profile.profile_picture_url}
                  alt={profile.name ?? "Profile"}
                  className="w-8 h-8 rounded-full object-cover border-2 border-primary/20"
                />
              ) : (
                <div className="w-8 h-8 rounded-full bg-linear-to-br from-primary/20 to-accent/20 flex items-center justify-center text-xs font-bold text-primary border-2 border-primary/20">
                  {initials}
                </div>
              )}
            </div>
            <span className="text-xl font-bold text-gradient">{firstName}</span>
          </a>
          <div className="flex items-center gap-1">
            {[
              { name: "Home", href: "/" },
              { name: "About", href: "/#about" },
              { name: "Skills", href: "/#skills" },
              { name: "Projects", href: "/#projects" },
              { name: "Contact", href: "/#contact" },
            ].map((item) => (
              <a
                key={item.name}
                href={item.href}
                className="px-4 py-2 rounded-lg text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-secondary transition-all duration-300 hidden md:block"
              >
                {item.name}
              </a>
            ))}
            <div className="ml-2 border-l border-border pl-2">
              {mounted && (
                <button
                  onClick={() => setTheme(resolvedTheme === "dark" ? "light" : "dark")}
                  className="relative p-2 rounded-lg hover:bg-secondary transition-colors text-muted-foreground hover:text-foreground"
                  aria-label="Toggle theme"
                >
                  <Sun className={cn("h-5 w-5 transition-all duration-300 absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2", resolvedTheme === "dark" ? "opacity-0 rotate-90 scale-0" : "opacity-100 rotate-0 scale-100")} />
                  <Moon className={cn("h-5 w-5 transition-all duration-300 absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2", resolvedTheme === "dark" ? "opacity-100 rotate-0 scale-100" : "opacity-0 -rotate-90 scale-0")} />
                  <span className="invisible">T</span>
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </nav>
  );
}

// ── Types ─────────────────────────────────────────────────────────────────────

interface ChatMessage {
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

interface GoogleUser {
  id: string;
  email: string;
  name: string;
  avatar_url?: string;
}

// ── Voice recorder hook ───────────────────────────────────────────────────────

function useVoiceRecorder() {
  const [recording, setRecording] = useState(false);
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null);
  const [duration, setDuration] = useState(0);
  const mediaRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const start = async () => {
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    const mr = new MediaRecorder(stream);
    chunksRef.current = [];
    mr.ondataavailable = (e) => chunksRef.current.push(e.data);
    mr.onstop = () => {
      const blob = new Blob(chunksRef.current, { type: "audio/webm" });
      setAudioBlob(blob);
      stream.getTracks().forEach((t) => t.stop());
    };
    mr.start();
    mediaRef.current = mr;
    setRecording(true);
    setDuration(0);
    timerRef.current = setInterval(() => setDuration((d) => d + 1), 1000);
  };

  const stop = () => {
    mediaRef.current?.stop();
    setRecording(false);
    if (timerRef.current) clearInterval(timerRef.current);
  };

  const cancel = () => {
    mediaRef.current?.stop();
    setRecording(false);
    setAudioBlob(null);
    setDuration(0);
    if (timerRef.current) clearInterval(timerRef.current);
  };

  return { recording, audioBlob, duration, start, stop, cancel, setAudioBlob };
}

// ── Audio player ──────────────────────────────────────────────────────────────

function AudioPlayer({ url }: { url: string }) {
  const audioRef = useRef<HTMLAudioElement>(null);
  const [playing, setPlaying] = useState(false);
  const [progress, setProgress] = useState(0);

  const toggle = () => {
    if (!audioRef.current) return;
    if (playing) { audioRef.current.pause(); setPlaying(false); }
    else { audioRef.current.play(); setPlaying(true); }
  };

  return (
    <div className="flex items-center gap-2 min-w-40">
      <button
        onClick={toggle}
        className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center shrink-0 hover:bg-primary/40 transition-colors"
      >
        {playing ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
      </button>
      <div className="flex-1 h-1.5 bg-primary/20 rounded-full overflow-hidden">
        <div className="h-full bg-primary rounded-full transition-all" style={{ width: `${progress}%` }} />
      </div>
      <audio
        ref={audioRef}
        src={url}
        onTimeUpdate={() => {
          if (audioRef.current)
            setProgress((audioRef.current.currentTime / audioRef.current.duration) * 100);
        }}
        onEnded={() => { setPlaying(false); setProgress(0); }}
      />
    </div>
  );
}

// ── Message bubble ────────────────────────────────────────────────────────────

function MessageBubble({
  msg,
  isMe,
  userName,
  clarenceProfile,
}: {
  msg: ChatMessage;
  isMe: boolean;
  userName: string;
  clarenceProfile: Profile | null;
}) {
  const isAdmin = msg.role === "admin";
  const hasFile = !!msg.file_url;

  // ── Avatar ────────────────────────────────────────────────────────────────
  const avatar = isMe ? (
    <div className="w-7 h-7 rounded-full bg-primary/20 flex items-center justify-center shrink-0 text-xs font-bold mt-1 text-primary">
      {userName[0]?.toUpperCase() ?? "U"}
    </div>
  ) : isAdmin && clarenceProfile?.profile_picture_url ? (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={clarenceProfile.profile_picture_url}
      alt={clarenceProfile.name ?? "Clarence"}
      className="w-7 h-7 rounded-full object-cover shrink-0 mt-1 border border-border"
    />
  ) : (
    <div className={cn(
      "w-7 h-7 rounded-full flex items-center justify-center shrink-0 text-xs font-bold mt-1",
      isAdmin ? "bg-green-500/20 text-green-600 dark:text-green-400" : "bg-secondary text-foreground"
    )}>
      {isAdmin
        ? (clarenceProfile?.name?.[0]?.toUpperCase() ?? "C")
        : "AI"}
    </div>
  );

  return (
    <div className={cn("flex gap-2", isMe ? "flex-row-reverse" : "flex-row")}>
      {avatar}
      <div className={cn("flex flex-col max-w-[75%]", isMe ? "items-end" : "items-start")}>
        {isAdmin && (
          <span className="text-[10px] text-muted-foreground mb-0.5 px-1 font-medium">
            {clarenceProfile?.name ?? "Clarence"}
          </span>
        )}

        {/* File / media content */}
        {hasFile && (
          <div className={cn("mb-1 rounded-2xl overflow-hidden", isMe ? "rounded-tr-sm" : "rounded-tl-sm")}>
            {msg.file_type === "image" && (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={msg.file_url!}
                alt="Image"
                className="max-w-55 max-h-55 object-cover rounded-2xl cursor-pointer"
                onClick={() => window.open(msg.file_url!, "_blank")}
              />
            )}
            {msg.file_type === "video" && (
              <video src={msg.file_url!} controls className="max-w-55 rounded-2xl" />
            )}
            {msg.file_type === "audio" && (
              <div className={cn("px-3 py-2 rounded-2xl", isMe ? "bg-primary text-white" : "bg-secondary")}>
                <p className="text-[10px] opacity-60 mb-1">🎤 Voice message</p>
                <AudioPlayer url={msg.file_url!} />
              </div>
            )}
            {msg.file_type === "file" && (
              <a
                href={msg.file_url!}
                target="_blank"
                rel="noopener noreferrer"
                className={cn(
                  "flex items-center gap-2 px-3 py-2.5 rounded-2xl text-sm",
                  isMe ? "bg-primary text-white" : "bg-secondary"
                )}
              >
                <FileText className="w-4 h-4 shrink-0" />
                <span className="truncate max-w-37.5">{msg.file_name ?? "File"}</span>
              </a>
            )}
          </div>
        )}

        {/* Text content */}
        {msg.content && (
          <div className={cn(
            "px-4 py-2.5 rounded-2xl text-sm leading-relaxed",
            isMe
              ? "bg-primary text-white rounded-tr-sm"
              : isAdmin
              ? "bg-green-500/10 border border-green-500/30 text-foreground rounded-tl-sm"
              : "bg-secondary text-foreground rounded-tl-sm"
          )}>
            {msg.content}
          </div>
        )}

        <span className="text-[10px] opacity-50 mt-0.5 px-1">
          {new Date(msg.created_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
        </span>
      </div>
    </div>
  );
}

// ── Rate limiting ─────────────────────────────────────────────────────────────
const CHAT_COOLDOWN_MS = 5_000;
const MAX_MSGS_PER_MINUTE = 8;

// ── Main page ─────────────────────────────────────────────────────────────────

export function ChatPage() {
  const supabase = createClient();

  const [user, setUser] = useState<GoogleUser | null>(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const [sessionId, setSessionId] = useState<string>("");
  const [uploadingFile, setUploadingFile] = useState(false);
  const [pendingFile, setPendingFile] = useState<{ file: File; previewUrl: string; type: string } | null>(null);
  const [fileError, setFileError] = useState<string | null>(null);

  // ── Clarence's profile (for message bubble avatar) ─────────────────────────
  const [clarenceProfile, setClarenceProfile] = useState<Profile | null>(null);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const messagesContainerRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const voice = useVoiceRecorder();
  // Tracks whether the initial history fetch has completed so we don't
  // auto-scroll on load (which would yank the page down to the footer).
  const initialLoadDone = useRef(false);

  // ── Rate limiting state ────────────────────────────────────────────────────
  const [lastMsgTime, setLastMsgTime] = useState(0);
  const [recentMsgTimes, setRecentMsgTimes] = useState<number[]>([]);
  const [cooldownRemaining, setCooldownRemaining] = useState(0);
  const [spamBlocked, setSpamBlocked] = useState(false);
  const cooldownTimer = useRef<ReturnType<typeof setInterval> | null>(null);

  // ── Reset scroll on mount ─────────────────────────────────────────────────
  // Prevents the browser from restoring the previous scroll position on reload,
  // which would push the page down to the input/footer area.
  useEffect(() => {
    if (typeof window !== "undefined") {
      window.history.scrollRestoration = "manual";
      window.scrollTo({ top: 0, left: 0, behavior: "instant" });
    }
  }, []);

  // ── Load Clarence's profile once ──────────────────────────────────────────
  useEffect(() => {
    getProfile().then(setClarenceProfile);
  }, []);

  // ── Auth ──────────────────────────────────────────────────────────────────

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user) {
        setUser({
          id: session.user.id,
          email: session.user.email ?? "",
          name: session.user.user_metadata?.full_name ?? session.user.email ?? "Visitor",
          avatar_url: session.user.user_metadata?.avatar_url,
        });
        setSessionId(`user_${session.user.id}`);
      }
      setAuthLoading(false);
    });

    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session?.user) {
        setUser({
          id: session.user.id,
          email: session.user.email ?? "",
          name: session.user.user_metadata?.full_name ?? session.user.email ?? "Visitor",
          avatar_url: session.user.user_metadata?.avatar_url,
        });
        setSessionId(`user_${session.user.id}`);
      } else {
        setUser(null);
        setSessionId("");
      }
    });

    return () => listener.subscription.unsubscribe();
  }, [supabase]);

  // ── Load messages ─────────────────────────────────────────────────────────

  useEffect(() => {
    if (!sessionId) return;
    initialLoadDone.current = false;
    supabase
      .from("chatbot_conversations")
      .select("*")
      .eq("session_id", sessionId)
      .order("created_at", { ascending: true })
      .then(({ data }) => {
        setMessages((data as ChatMessage[]) || []);
        requestAnimationFrame(() => {
          requestAnimationFrame(() => {
            initialLoadDone.current = true;
          });
        });
      });
  }, [sessionId, supabase]);

  // ── Real-time ─────────────────────────────────────────────────────────────
  // NOTE: We intentionally do NOT use a server-side `filter` here because
  // Supabase `postgres_changes` filters require specific RLS / publication
  // configuration that may silently drop events. Instead we listen to ALL
  // inserts on the table and filter client-side by session_id. This is the
  // most reliable approach for catching admin replies in real time.

  useEffect(() => {
    if (!sessionId) return;
    const channelName = `chat_realtime_${sessionId}`;
    const channel = supabase
      .channel(channelName)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "chatbot_conversations",
        },
        (payload) => {
          const row = payload.new as ChatMessage;
          // Only show messages that belong to this user's session
          if (row.session_id !== sessionId) return;
          setMessages((prev) => {
            if (prev.find((m) => m.id === row.id)) return prev;
            return [...prev, row];
          });
        }
      )
      .subscribe((status) => {
        if (status === "SUBSCRIBED") {
          console.log("[Realtime] Subscribed to chatbot_conversations");
        }
      });
    return () => { supabase.removeChannel(channel); };
  }, [sessionId, supabase]);

  // Only scroll when a NEW message arrives after the initial history load.
  // This prevents the page from jumping down to the footer on every reload.
  // We scroll only the messages container, not the whole window.
  useEffect(() => {
    if (!initialLoadDone.current) return;
    const container = messagesContainerRef.current;
    if (container) {
      container.scrollTop = container.scrollHeight;
    }
  }, [messages]);

  // ── Auth actions ──────────────────────────────────────────────────────────

  const signInWithGoogle = async () => {
    await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: `${window.location.origin}/chat`,
        queryParams: { prompt: "select_account" },
      },
    });
  };

  const signOut = async () => {
    await supabase.auth.signOut();
    setUser(null);
    setMessages([]);
    setSessionId("");
  };

  // ── Cooldown ticker ────────────────────────────────────────────────────────

  useEffect(() => {
    if (cooldownRemaining <= 0) {
      if (cooldownTimer.current) clearInterval(cooldownTimer.current);
      return;
    }
    cooldownTimer.current = setInterval(() => {
      const remaining = Math.max(0, CHAT_COOLDOWN_MS - (Date.now() - lastMsgTime));
      setCooldownRemaining(remaining);
      if (remaining <= 0) {
        if (cooldownTimer.current) clearInterval(cooldownTimer.current);
        setSpamBlocked(false);
      }
    }, 300);
    return () => { if (cooldownTimer.current) clearInterval(cooldownTimer.current); };
  }, [cooldownRemaining, lastMsgTime]);

  // ── File error auto-dismiss ────────────────────────────────────────────────

  useEffect(() => {
    if (!fileError) return;
    const t = setTimeout(() => setFileError(null), 4000);
    return () => clearTimeout(t);
  }, [fileError]);

  // ── File picker ───────────────────────────────────────────────────────────

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = ""; // always reset so same file can be re-selected
    if (!file) return;

    const isImage = file.type.startsWith("image/");
    const isVideo = file.type.startsWith("video/");
    const isAudio = file.type.startsWith("audio/");
    const type = isImage ? "image" : isVideo ? "video" : isAudio ? "audio" : "file";

    // ── Size guard ────────────────────────────────────────────────────────
    const maxBytes = MAX_FILE_SIZES[type];
    if (file.size > maxBytes) {
      setFileError(
        `${type.charAt(0).toUpperCase() + type.slice(1)} is too large. Maximum allowed size is ${FILE_SIZE_LABELS[type]}.`
      );
      return;
    }

    setFileError(null);
    const previewUrl = (isImage || isVideo) ? URL.createObjectURL(file) : "";
    setPendingFile({ file, previewUrl, type });
  };

  // ── Upload helper ─────────────────────────────────────────────────────────

  const uploadToSupabase = async (file: File): Promise<{ url: string; type: string } | null> => {
    const ext = file.name.split(".").pop();
    const path = `chat-files/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;
    const { error } = await supabase.storage.from(BUCKET).upload(path, file, { upsert: true });
    if (error) { console.error("Upload error:", error); return null; }
    const { data } = supabase.storage.from(BUCKET).getPublicUrl(path);
    const isImage = file.type.startsWith("image/");
    const isVideo = file.type.startsWith("video/");
    const isAudio = file.type.startsWith("audio/");
    const type = isImage ? "image" : isVideo ? "video" : isAudio ? "audio" : "file";
    return { url: data.publicUrl, type };
  };

  // ── Send message ──────────────────────────────────────────────────────────

  const sendMessage = async (overrideText?: string, fileBlob?: Blob, blobType?: string) => {
    const text = overrideText ?? input;
    const hasText = text.trim().length > 0;
    const hasPendingFile = !!pendingFile;
    const hasVoice = !!fileBlob;

    if (!hasText && !hasPendingFile && !hasVoice) return;
    if (sending || !user || !sessionId) return;

    // ── Rate limiting ─────────────────────────────────────────────────────
    const now = Date.now();

    if (lastMsgTime > 0 && now - lastMsgTime < CHAT_COOLDOWN_MS) {
      setCooldownRemaining(CHAT_COOLDOWN_MS - (now - lastMsgTime));
      setSpamBlocked(true);
      return;
    }

    const oneMinuteAgo = now - 60_000;
    const updatedRecent = [...recentMsgTimes.filter((t) => t > oneMinuteAgo), now];
    if (updatedRecent.length > MAX_MSGS_PER_MINUTE) {
      setSpamBlocked(true);
      setCooldownRemaining(30_000);
      setLastMsgTime(now - CHAT_COOLDOWN_MS + 30_000);
      return;
    }

    setLastMsgTime(now);
    setRecentMsgTimes(updatedRecent);
    setCooldownRemaining(CHAT_COOLDOWN_MS);
    setSpamBlocked(false);
    // ── End rate limiting ─────────────────────────────────────────────────

    setSending(true);
    setInput("");

    let file_url: string | null = null;
    let file_type: string | null = null;
    let file_name: string | null = null;

    if (hasPendingFile) {
      setUploadingFile(true);
      const result = await uploadToSupabase(pendingFile.file);
      setUploadingFile(false);
      setPendingFile(null);
      if (result) {
        file_url = result.url;
        file_type = result.type;
        file_name = pendingFile.file.name;
      }
    }

    if (hasVoice && fileBlob) {
      setUploadingFile(true);
      const voiceFile = new File([fileBlob], `voice_${Date.now()}.webm`, { type: "audio/webm" });
      const result = await uploadToSupabase(voiceFile);
      setUploadingFile(false);
      if (result) {
        file_url = result.url;
        file_type = "audio";
        file_name = voiceFile.name;
      }
    }

    const { data: inserted } = await supabase
      .from("chatbot_conversations")
      .insert({
        session_id: sessionId,
        role: "user",
        content: text.trim(),
        file_url,
        file_type,
        file_name,
        user_name: user.name,
        user_email: user.email,
      })
      .select()
      .single();

    if (inserted) {
      setMessages((prev) => {
        if (prev.find((m) => m.id === inserted.id)) return prev;
        return [...prev, inserted as ChatMessage];
      });
    }

    setSending(false);
  };

  // ── Send voice ────────────────────────────────────────────────────────────

  const sendVoiceMessage = async () => {
    voice.stop();
    await new Promise((r) => setTimeout(r, 300));
    if (voice.audioBlob) {
      await sendMessage("", voice.audioBlob, "audio");
      voice.setAudioBlob(null);
    }
  };

  // ── Date grouping ─────────────────────────────────────────────────────────

  const formatDate = (str: string) =>
    new Date(str).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });

  const grouped: { date: string; msgs: ChatMessage[] }[] = [];
  for (const msg of messages) {
    const d = formatDate(msg.created_at);
    const last = grouped[grouped.length - 1];
    if (!last || last.date !== d) grouped.push({ date: d, msgs: [msg] });
    else last.msgs.push(msg);
  }

  // ── Render ────────────────────────────────────────────────────────────────

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <ChatNav />

      <main className="flex-1 flex flex-col items-center justify-start pt-24 pb-12 px-4">
        <div className="w-full max-w-2xl flex flex-col" style={{ minHeight: "calc(100vh - 200px)" }}>

          <div id="chat-hero" className="mb-6 text-center">
            <h1 className="text-3xl font-bold text-gradient flex items-center justify-center gap-2">
              <MessageCircle className="w-7 h-7 text-primary" />
              Chat with Clarence
            </h1>
            <p className="text-muted-foreground text-sm mt-1">
              Send a message directly — Clarence will reply as soon as he can.
            </p>
          </div>

          <div className="flex-1 flex flex-col rounded-2xl border bg-card shadow-xl overflow-hidden">

            {authLoading ? (
              <div className="flex-1 flex items-center justify-center py-24">
                <Loader2 className="w-7 h-7 animate-spin text-primary" />
              </div>

            ) : !user ? (
              <div className="flex-1 flex flex-col items-center justify-center gap-6 py-24 px-6 text-center">
                <div className="w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center">
                  <MessageCircle className="w-10 h-10 text-primary" />
                </div>
                <div>
                  <h2 className="text-xl font-bold mb-1">Sign in to chat</h2>
                  <p className="text-muted-foreground text-sm max-w-xs">
                    A Google account is required so Clarence knows who he&apos;s talking to.
                    Only your name and email are accessed — nothing else.
                  </p>
                </div>
                <button
                  onClick={signInWithGoogle}
                  className="flex items-center gap-3 px-6 py-3 rounded-xl bg-white text-gray-800 border border-gray-200 shadow-sm hover:shadow-md font-semibold text-sm transition-all"
                >
                  <svg className="w-5 h-5" viewBox="0 0 24 24">
                    <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                    <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                    <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                    <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
                  </svg>
                  Continue with Google
                </button>
              </div>

            ) : (
              <>
                {/* Chat header */}
                <div className="flex items-center justify-between px-5 py-3 border-b bg-card/80 backdrop-blur-sm">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-full bg-primary/10 flex items-center justify-center overflow-hidden">
                      {user.avatar_url ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={user.avatar_url} alt={user.name} className="w-full h-full object-cover" />
                      ) : (
                        <UserCircle className="w-5 h-5 text-primary" />
                      )}
                    </div>
                    <div>
                      <p className="text-sm font-semibold leading-tight">{user.name}</p>
                      <p className="text-xs text-muted-foreground">{user.email}</p>
                    </div>
                  </div>
                  <button
                    onClick={signOut}
                    className="text-xs text-muted-foreground hover:text-foreground underline transition-colors"
                  >
                    Sign out
                  </button>
                </div>

                {/* Messages */}
                <div
                  ref={messagesContainerRef}
                  className="flex-1 overflow-y-auto px-4 py-4 space-y-4 bg-background/40"
                  style={{ minHeight: 340 }}
                >
                  {messages.length === 0 && (
                    <div className="text-center text-muted-foreground text-sm py-12">
                      <MessageCircle className="w-10 h-10 mx-auto mb-2 opacity-30" />
                      <p>No messages yet. Say hi! 👋</p>
                    </div>
                  )}

                  {grouped.map(({ date, msgs }) => (
                    <div key={date}>
                      <div className="flex items-center gap-3 my-3">
                        <div className="flex-1 h-px bg-border" />
                        <span className="text-[10px] text-muted-foreground font-medium px-2">{date}</span>
                        <div className="flex-1 h-px bg-border" />
                      </div>
                      <div className="space-y-2">
                        {msgs.map((msg) => (
                          <MessageBubble
                            key={msg.id}
                            msg={msg}
                            isMe={msg.role === "user"}
                            userName={user.name}
                            clarenceProfile={clarenceProfile}
                          />
                        ))}
                      </div>
                    </div>
                  ))}
                  <div ref={messagesEndRef} />
                </div>

                {/* File size error toast */}
                {fileError && (
                  <div className="px-4 py-2 border-t border-red-500/30 bg-red-500/10 flex items-center gap-2">
                    <AlertCircle className="w-4 h-4 text-red-500 shrink-0" />
                    <p className="text-xs text-red-600 dark:text-red-400 font-medium flex-1">{fileError}</p>
                    <button
                      onClick={() => setFileError(null)}
                      className="text-red-400 hover:text-red-600 transition-colors"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>
                )}

                {/* Pending file preview */}
                {pendingFile && (
                  <div className="px-4 pt-2 flex items-center gap-2 border-t">
                    <div className="relative inline-block">
                      {pendingFile.type === "image" && (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={pendingFile.previewUrl}
                          alt="preview"
                          className="w-16 h-16 object-cover rounded-lg border"
                        />
                      )}
                      {pendingFile.type === "video" && (
                        <div className="w-16 h-16 rounded-lg border bg-secondary flex items-center justify-center">
                          <Film className="w-6 h-6 text-muted-foreground" />
                        </div>
                      )}
                      {pendingFile.type === "file" && (
                        <div className="w-16 h-16 rounded-lg border bg-secondary flex items-center justify-center">
                          <FileText className="w-6 h-6 text-muted-foreground" />
                        </div>
                      )}
                      {pendingFile.type === "audio" && (
                        <div className="w-16 h-16 rounded-lg border bg-secondary flex items-center justify-center">
                          <Mic className="w-6 h-6 text-muted-foreground" />
                        </div>
                      )}
                      <button
                        onClick={() => setPendingFile(null)}
                        className="absolute -top-1.5 -right-1.5 w-5 h-5 rounded-full bg-destructive text-destructive-foreground flex items-center justify-center"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs text-muted-foreground truncate">{pendingFile.file.name}</p>
                      <p className="text-[10px] text-muted-foreground/60 mt-0.5">
                        {(pendingFile.file.size / (1024 * 1024)).toFixed(1)} MB
                        {" · "}Max {FILE_SIZE_LABELS[pendingFile.type]}
                      </p>
                    </div>
                  </div>
                )}

                {/* Voice recording indicator */}
                {voice.recording && (
                  <div className="px-4 pt-2 border-t flex items-center gap-3">
                    <div className="flex items-center gap-2 text-red-500 text-sm font-medium">
                      <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
                      Recording {voice.duration}s
                    </div>
                    <button
                      onClick={voice.cancel}
                      className="text-xs text-muted-foreground underline"
                    >
                      Cancel
                    </button>
                  </div>
                )}

                {/* Spam / cooldown warning banner */}
                {spamBlocked && (
                  <div className="px-4 py-2 border-t border-amber-500/30 bg-amber-500/10 flex items-center gap-2">
                    <span className="text-amber-500 text-sm">⏳</span>
                    <p className="text-xs text-amber-600 dark:text-amber-400 font-medium">
                      {cooldownRemaining > 10_000
                        ? `Slow down! Please wait ${Math.ceil(cooldownRemaining / 1000)}s before sending again.`
                        : `Please wait ${Math.ceil(cooldownRemaining / 1000)}s…`}
                    </p>
                  </div>
                )}

                {/* Input bar */}
                <div className="p-3 border-t bg-card/80 flex gap-2 items-end">

                  {/* File attach button */}
                  <button
                    onClick={() => fileInputRef.current?.click()}
                    disabled={sending || voice.recording}
                    className="p-2.5 rounded-xl text-muted-foreground hover:bg-secondary hover:text-foreground transition-colors shrink-0 disabled:opacity-40"
                    title={`Attach file · Images up to ${FILE_SIZE_LABELS.image}, Videos up to ${FILE_SIZE_LABELS.video}, Docs up to ${FILE_SIZE_LABELS.file}`}
                  >
                    <Paperclip className="w-5 h-5" />
                  </button>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*,video/*,audio/*,.pdf,.doc,.docx,.txt,.zip"
                    className="hidden"
                    onChange={handleFileSelect}
                  />

                  {/* Text input */}
                  <textarea
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" && !e.shiftKey) {
                        e.preventDefault();
                        if (!spamBlocked) sendMessage();
                      }
                    }}
                    placeholder={
                      voice.recording
                        ? "Recording voice..."
                        : spamBlocked
                        ? `Please wait ${Math.ceil(cooldownRemaining / 1000)}s…`
                        : "Type a message..."
                    }
                    rows={1}
                    className="flex-1 text-sm bg-secondary/50 rounded-xl px-4 py-2.5 outline-none resize-none max-h-32 overflow-y-auto disabled:opacity-60"
                    disabled={sending || voice.recording || spamBlocked}
                    style={{ lineHeight: "1.5" }}
                  />

                  {/* Voice / send button */}
                  {!input.trim() && !pendingFile ? (
                    voice.recording ? (
                      <button
                        onClick={sendVoiceMessage}
                        disabled={sending || uploadingFile}
                        className="bg-red-500 text-white p-2.5 rounded-xl hover:bg-red-600 transition-colors shrink-0"
                        title="Send voice message"
                      >
                        <Send className="w-4 h-4" />
                      </button>
                    ) : (
                      <button
                        onClick={voice.start}
                        disabled={sending || spamBlocked}
                        className="p-2.5 rounded-xl text-muted-foreground hover:bg-secondary hover:text-foreground transition-colors shrink-0 disabled:opacity-40"
                        title="Record voice message"
                      >
                        <Mic className="w-5 h-5" />
                      </button>
                    )
                  ) : (
                    <button
                      onClick={() => sendMessage()}
                      disabled={sending || uploadingFile || voice.recording || spamBlocked}
                      className="bg-primary text-white p-2.5 rounded-xl disabled:opacity-50 hover:bg-primary/90 transition-colors shrink-0"
                    >
                      {sending || uploadingFile
                        ? <Loader2 className="w-4 h-4 animate-spin" />
                        : <Send className="w-4 h-4" />}
                    </button>
                  )}
                </div>
              </>
            )}
          </div>

          {/* Privacy notice */}
          <div className="mt-4 rounded-xl border border-border bg-card/40 px-4 py-3 flex gap-3 items-start">
            <ShieldCheck className="w-4 h-4 text-primary shrink-0 mt-0.5" />
            <div className="text-xs text-muted-foreground leading-relaxed space-y-1">
              <p className="font-semibold text-foreground flex items-center gap-1">
                <Lock className="w-3 h-3" /> Your privacy is protected
              </p>
              <p>
                Messages and files are stored securely and are only visible to you and Clarence.
                Your Google account information is used solely to identify your conversation —
                never shared, sold, or used for marketing.
              </p>
              <p>You may request deletion of your conversation at any time by contacting Clarence directly.</p>
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}