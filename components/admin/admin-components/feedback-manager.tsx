"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { RefreshCw, Trash2, Star, MessageCircleHeart } from "lucide-react";
import { toast } from "./toast";

interface Feedback {
  id: string;
  name: string | null;
  message: string;
  rating: number;
  emoji: string;
  created_at: string;
}

export function FeedbackManager() {
  const supabase = createClient();
  const [feedbacks, setFeedbacks] = useState<Feedback[]>([]);
  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState<string | null>(null);

  useEffect(() => { loadFeedbacks(); }, []); // eslint-disable-line react-hooks/exhaustive-deps

  async function loadFeedbacks() {
    setLoading(true);
    const { data } = await supabase.from("feedbacks").select("*").order("created_at", { ascending: false });
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

  const avgRating = feedbacks.length ? (feedbacks.reduce((s, f) => s + f.rating, 0) / feedbacks.length).toFixed(1) : "—";
  const ratingDist = [5, 4, 3, 2, 1].map((r) => ({
    rating: r,
    emoji: ["😐","🙂","😊","😍","🤩"][r - 1],
    count: feedbacks.filter((f) => f.rating === r).length,
  }));

  if (loading) return <div className="flex items-center justify-center py-16"><RefreshCw className="w-6 h-6 animate-spin text-muted-foreground" /></div>;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h2 className="text-2xl font-bold flex items-center gap-2"><MessageCircleHeart className="w-6 h-6 text-primary" />Feedback</h2>
          <p className="text-muted-foreground text-sm mt-0.5">{feedbacks.length} total · ⭐ {avgRating} avg rating</p>
        </div>
        <Button variant="outline" size="sm" onClick={loadFeedbacks}><RefreshCw className="w-4 h-4 mr-2" />Refresh</Button>
      </div>

      <div className="grid grid-cols-5 gap-3">
        {ratingDist.map(({ rating, emoji, count }) => (
          <Card key={rating} className="bg-card/50">
            <CardContent className="p-4 flex flex-col items-center gap-1">
              <span className="text-2xl">{emoji}</span>
              <div className="flex gap-0.5">{Array.from({ length: 5 }).map((_, i) => <Star key={i} className={`w-2.5 h-2.5 ${i < rating ? "fill-amber-400 text-amber-400" : "text-muted-foreground/20"}`} />)}</div>
              <p className="text-xl font-bold leading-none">{count}</p>
              <p className="text-[10px] text-muted-foreground font-mono">review{count !== 1 ? "s" : ""}</p>
            </CardContent>
          </Card>
        ))}
      </div>

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
                  <div className="w-10 h-10 rounded-full bg-secondary flex items-center justify-center text-xl shrink-0 border border-border">{fb.emoji}</div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <div className="flex items-center gap-2 mb-0.5">
                          <span className="font-semibold text-sm">{fb.name || <span className="text-muted-foreground italic font-normal">Anonymous</span>}</span>
                          <div className="flex gap-0.5">{Array.from({ length: 5 }).map((_, i) => <Star key={i} className={`w-3 h-3 ${i < fb.rating ? "fill-amber-400 text-amber-400" : "text-muted-foreground/20"}`} />)}</div>
                        </div>
                        <p className="text-sm text-muted-foreground leading-relaxed">{fb.message}</p>
                        <p className="text-[11px] text-muted-foreground/50 mt-2 font-mono">
                          {new Date(fb.created_at).toLocaleString("en-US", { month: "short", day: "numeric", year: "numeric", hour: "2-digit", minute: "2-digit" })}
                        </p>
                      </div>
                      <Button variant="ghost" size="icon" className="h-8 w-8 shrink-0 text-muted-foreground hover:text-destructive opacity-0 group-hover:opacity-100 transition-opacity" onClick={() => deleteFeedback(fb.id)} disabled={deleting === fb.id} title="Delete feedback">
                        {deleting === fb.id ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Trash2 className="w-3.5 h-3.5" />}
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
