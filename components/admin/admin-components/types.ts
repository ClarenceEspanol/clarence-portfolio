// ─── Shared Types ─────────────────────────────────────────────────────────────

export interface ContactMessage {
  id: string; name: string; email: string; subject?: string;
  message: string; created_at: string; is_read: boolean;
}

export interface Profile {
  id: string; name: string; title: string | null; email: string | null;
  linkedin: string | null; github: string | null; location: string | null;
  bio: string | null; experience: string | null; education: string | null;
  profile_picture_url: string | null; resume_url: string | null;
  cv_url: string | null; portfolio_pptx_url: string | null;
  facebook: string | null; instagram: string | null; tiktok: string | null;
  availability_status: "available" | "freelance" | "employed" | null;
}

export interface Skill {
  id: string; name: string; icon: string;
  category: "frontend" | "backend" | "tools";
  description: string | null;
  proficiency_level: "beginner" | "intermediate" | "experienced" | "expert" | null;
  sort_order: number;
}

export interface Project {
  id: string; title: string; description: string | null; long_description: string | null;
  tags: string[]; live_url: string | null; github_url: string | null; image_url: string | null;
  gallery_images: string[]; type: string | null; featured: boolean; sort_order: number;
}

export interface Certificate {
  id: string; title: string; issuer: string; date: string | null;
  description: string | null; category: string | null;
  certificate_url: string | null; featured: boolean; sort_order: number;
}

export interface WorkExperience {
  id: string; title: string; role: string | null;
  period: string | null; description: string | null; sort_order: number;
}

export interface GalleryImage {
  id: string; url: string; caption: string | null; sort_order: number;
}

export interface ChatbotMessage {
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

export interface ChatSession {
  session_id: string;
  messages: ChatbotMessage[];
  lastActivity: string;
  unread: boolean;
  displayName: string;
  displayEmail: string;
  isDirectChat: boolean;
}
