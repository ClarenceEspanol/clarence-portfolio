import { createClient } from "@/lib/supabase/client";

export const BUCKET = "portfolio-assets";
export const OWNER_EMAIL = process.env.NEXT_PUBLIC_ADMIN_EMAIL ?? "clarenceespanol@gmail.com";

export async function uploadFile(
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

export function formatDate(dateString: string) {
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

export function isPdfUrl(url: string) {
  return url.toLowerCase().includes(".pdf") || url.toLowerCase().includes("application/pdf");
}

export const CERT_CATEGORIES = ["Design", "Management", "Analytics", "Programming", "AI", "Technical", "Security", "Technology"];
export const PROFICIENCY_LEVELS = ["beginner", "intermediate", "experienced", "expert"] as const;
