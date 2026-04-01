"use client";

import { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { ScrollAnimator } from "./scroll-animator";
import { createClient } from "@/lib/supabase/client";
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogTrigger 
} from "@/components/ui/dialog";
import { cn } from "@/lib/utils";

interface Feedback {
  id: string;
  name: string | null;
  message: string;
  rating: number;
  emoji: string;
  created_at: string;
}

const EMOJI_RATINGS = [
  { emoji: "😐", label: "Meh", value: 1 },
  { emoji: "🙂", label: "Okay", value: 2 },
  { emoji: "😊", label: "Good", value: 3 },
  { emoji: "😍", label: "Love it", value: 4 },
  { emoji: "🤩", label: "Amazing!", value: 5 },
];

/** * Handles timezone drift and relative time display.
 */
function formatFeedbackTime(dateStr: string) {
  const date = new Date(dateStr);
  const now = new Date();
  
  const diffInMs = now.getTime() - date.getTime();
  const diffInSecs = Math.floor(diffInMs / 1000);
  const diffInMins = Math.floor(diffInSecs / 60);
  const diffInHours = Math.floor(diffInMins / 60);

  if (diffInSecs < 60) return "Just now";
  
  if (diffInHours < 24) {
    if (diffInHours < 1) return `${diffInMins} ${diffInMins === 1 ? 'minute' : 'minutes'} ago`;
    return `${diffInHours} ${diffInHours === 1 ? 'hour' : 'hours'} ago`;
  }
  
  return date.toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function StarBurst({ visible }: { visible: boolean }) {
  if (!visible) return null;
  return (
    <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-10">
      {Array.from({ length: 8 }).map((_, i) => (
        <div
          key={i}
          className="absolute w-2 h-2 rounded-full bg-primary"
          style={{
            transform: `rotate(${i * 45}deg) translateY(-28px)`,
            animation: "starburst 0.6s ease-out forwards",
            animationDelay: `${i * 0.05}s`,
            opacity: 0,
          }}
        />
      ))}
      <style jsx>{`
        @keyframes starburst {
          0% { opacity: 1; transform: rotate(var(--r, 0deg)) translateY(-8px) scale(1); }
          100% { opacity: 0; transform: rotate(var(--r, 0deg)) translateY(-40px) scale(0); }
        }
      `}</style>
    </div>
  );
}

function FeedbackCard({ feedback, index }: { feedback: Feedback; index: number }) {
  const colors = [
    "border-purple-500/30 bg-purple-500/5",
    "border-blue-500/30 bg-blue-500/5",
    "border-pink-500/30 bg-pink-500/5",
    "border-amber-500/30 bg-amber-500/5",
    "border-green-500/30 bg-green-500/5",
    "border-cyan-500/30 bg-cyan-500/5",
  ];
  const colorClass = colors[index % colors.length];
  const isLong = feedback.message.length > 180;

  return (
    <div
      className={cn(
        "group p-4 rounded-2xl border transition-all duration-300 hover:scale-[1.01] hover:shadow-md relative overflow-hidden",
        colorClass
      )}
    >
      <div className="absolute top-0 right-0 text-4xl opacity-10 pointer-events-none select-none translate-x-2 -translate-y-2 transition-all duration-300 group-hover:opacity-20">
        {feedback.emoji}
      </div>
      <div className="flex items-start gap-3">
        <div className="w-8 h-8 rounded-full bg-secondary flex items-center justify-center text-base shrink-0 border border-border">
          {feedback.emoji}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <span className="font-semibold text-sm text-foreground truncate">
              {feedback.name || "Anonymous"}
            </span>
            <div className="flex gap-0.5 shrink-0">
              {Array.from({ length: 5 }).map((_, i) => (
                <span
                  key={i}
                  className={`text-[10px] ${i < feedback.rating ? "text-amber-400" : "text-muted-foreground/30"}`}
                >
                  ★
                </span>
              ))}
            </div>
          </div>

          <div className="relative">
            <p className={cn("text-xs md:text-sm text-muted-foreground leading-relaxed", isLong && "line-clamp-3")}>
              {feedback.message}
            </p>
            {isLong && (
              <Dialog>
                <DialogTrigger asChild>
                  <button className="text-[10px] md:text-xs text-primary font-bold mt-1 hover:underline cursor-pointer">
                    Read more
                  </button>
                </DialogTrigger>
                <DialogContent className="max-w-[90vw] sm:max-w-md rounded-2xl">
                  <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                      <span className="text-xl">{feedback.emoji}</span>
                      From {feedback.name || "Anonymous"}
                    </DialogTitle>
                  </DialogHeader>
                  <div className="mt-2 text-sm text-foreground leading-relaxed whitespace-pre-wrap bg-secondary/20 p-4 rounded-xl border max-h-[60vh] overflow-y-auto">
                    {feedback.message}
                  </div>
                </DialogContent>
              </Dialog>
            )}
          </div>

          <p className="text-[9px] text-muted-foreground/50 mt-1.5 font-mono">
            {formatFeedbackTime(feedback.created_at)}
          </p>
        </div>
      </div>
    </div>
  );
}

export function FeedbackSection() {
  const [feedbacks, setFeedbacks] = useState<Feedback[]>([]);
  const [formState, setFormState] = useState({ name: "", message: "", rating: 0, emoji: "" });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [hoveredRating, setHoveredRating] = useState(0);
  const [showBurst, setShowBurst] = useState(false);

  const supabase = createClient();

  useEffect(() => {
    loadFeedbacks();
    const channel = supabase
      .channel("feedbacks")
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "feedbacks" }, (payload) => {
        setFeedbacks((prev) => [payload.new as Feedback, ...prev]);
      })
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, []);

  async function loadFeedbacks() {
    const { data } = await supabase
      .from("feedbacks")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(20);
    if (data) setFeedbacks(data);
  }

  const handleRatingClick = (item: typeof EMOJI_RATINGS[0]) => {
    setFormState({ ...formState, rating: item.value, emoji: item.emoji });
    setShowBurst(true);
    setTimeout(() => setShowBurst(false), 700);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formState.rating) return;
    setIsSubmitting(true);
    try {
      const { error } = await supabase.from("feedbacks").insert({
        name: formState.name.trim() || null,
        message: formState.message,
        rating: formState.rating,
        emoji: formState.emoji,
      });
      if (!error) {
        setSubmitted(true);
        setFormState({ name: "", message: "", rating: 0, emoji: "" });
        setTimeout(() => setSubmitted(false), 5000);
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const avgRating = feedbacks.length
    ? (feedbacks.reduce((s, f) => s + f.rating, 0) / feedbacks.length).toFixed(1)
    : "—";

  return (
    <section id="feedback" className="py-10 md:py-24 px-3 sm:px-4 relative overflow-x-hidden">
      <div className="max-w-6xl mx-auto relative z-10">
        <ScrollAnimator animation="fade-up" className="text-center mb-8 md:mb-12">
          <p className="text-primary font-mono text-xs md:text-sm mb-2">Share Your Thoughts</p>
          <h2 className="text-2xl md:text-5xl font-bold tracking-tight mb-3">
            Feedback Wall 💬
          </h2>
          <p className="text-muted-foreground max-w-md mx-auto text-xs md:text-base px-2">
            Loved the portfolio? Drop your thoughts below — no login needed!
          </p>
          {feedbacks.length > 0 && (
            <div className="inline-flex items-center gap-2 mt-4 px-3 py-1.5 rounded-full bg-amber-500/10 border border-amber-500/20 text-amber-600 dark:text-amber-400 text-xs font-medium">
              <span className="text-base">⭐</span>
              <span>{avgRating} average · {feedbacks.length} reviews</span>
            </div>
          )}
        </ScrollAnimator>

        <div className="grid lg:grid-cols-2 gap-8 items-start">
          <ScrollAnimator animation="fade-left" delay={100}>
            <Card className="bg-card/50 border-border overflow-hidden">
              <CardContent className="p-4 sm:p-5 md:p-8">
                <h3 className="text-base md:text-lg font-semibold mb-5 flex items-center gap-2">
                  <span className="text-xl">✍️</span> Leave Feedback
                </h3>

                {submitted ? (
                  <div className="flex flex-col items-center py-10 text-center animate-in fade-in zoom-in duration-300">
                    <div className="text-5xl mb-4 animate-bounce">🎉</div>
                    <h4 className="text-lg font-bold mb-2">Thank you!</h4>
                    <p className="text-muted-foreground text-xs">Your feedback means the world to me!</p>
                  </div>
                ) : (
                  <form onSubmit={handleSubmit} className="space-y-4 md:space-y-5">
                    <div>
                      <label className="text-[10px] md:text-xs font-bold uppercase text-foreground mb-3 block">
                        How would you rate this portfolio? *
                      </label>
                        <div className="relative flex items-center justify-between gap-1 py-2 w-full">
                        <StarBurst visible={showBurst} />
                        {EMOJI_RATINGS.map((item) => (
                          <button
                            key={item.value}
                            type="button"
                            onClick={() => handleRatingClick(item)}
                            onMouseEnter={() => setHoveredRating(item.value)}
                            onMouseLeave={() => setHoveredRating(0)}
                            className={cn(
                              "flex flex-col items-center gap-1 p-1.5 rounded-xl transition-all duration-200 flex-1 min-w-0",
                              formState.rating === item.value
                                ? "bg-primary/15 scale-110 shadow-sm ring-1 ring-primary/30"
                                : hoveredRating >= item.value
                                ? "scale-105 bg-secondary/60"
                                : "hover:bg-secondary/40"
                            )}
                          >
                            <span className="text-xl sm:text-2xl md:text-3xl leading-none select-none">
                              {item.emoji}
                            </span>
                            <span className={cn(
                              "text-[8px] sm:text-[9px] font-bold font-mono leading-none",
                              formState.rating === item.value ? "text-primary" : "text-muted-foreground"
                            )}>
                              {item.label}
                            </span>
                          </button>
                        ))}
                      </div>
                    </div>

                    <div className="space-y-1.5">
                      <Input
                        placeholder="Your name (optional) 👤"
                        value={formState.name}
                        onChange={(e) => setFormState({ ...formState, name: e.target.value })}
                        className="bg-secondary/20 border-border h-9 text-sm"
                      />
                    </div>

                    <div className="space-y-1.5">
                      <Textarea
                        placeholder="What did you think? 💭"
                        rows={3}
                        value={formState.message}
                        onChange={(e) => setFormState({ ...formState, message: e.target.value })}
                        required
                        className="bg-secondary/20 border-border resize-none text-sm"
                      />
                    </div>

                    <Button
                      type="submit"
                      className="w-full h-10 font-bold rounded-xl text-sm"
                      disabled={isSubmitting || !formState.rating}
                    >
                      🚀 {isSubmitting ? "Sending..." : "Submit Feedback"}
                    </Button>
                  </form>
                )}
              </CardContent>
            </Card>
          </ScrollAnimator>

          <ScrollAnimator animation="fade-right" delay={200}>
            <div className="space-y-3">
              <div className="flex items-center justify-between mb-4 px-1">
                <h3 className="font-semibold flex items-center gap-2 text-base md:text-lg">
                  <span className="text-xl">🏆</span> What People Say
                </h3>
              </div>

              {feedbacks.length === 0 ? (
                <div className="flex flex-col items-center py-16 text-center border border-dashed border-border rounded-2xl">
                  <p className="text-muted-foreground font-mono text-xs">No feedback yet</p>
                </div>
              ) : (
                <div className="space-y-3 max-h-[420px] md:max-h-[520px] overflow-y-auto overflow-x-hidden px-1 custom-scrollbar">
                  {feedbacks.map((fb, i) => (
                    <FeedbackCard key={fb.id} feedback={fb} index={i} />
                  ))}
                </div>
              )}
            </div>
          </ScrollAnimator>
        </div>
      </div>
      <style jsx global>{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 4px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: transparent;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: hsl(var(--border));
          border-radius: 10px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: hsl(var(--primary) / 0.3);
        }
      `}</style>
    </section>
  );
}