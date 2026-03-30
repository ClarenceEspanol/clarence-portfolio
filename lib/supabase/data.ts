import { createClient } from "./client";

export interface Profile {
  id: string;
  name: string;
  title: string | null;
  email: string | null;
  linkedin: string | null;
  github: string | null;           // ← new: GitHub profile URL
  location: string | null;
  bio: string | null;
  experience: string | null;
  education: string | null;
  profile_picture_url: string | null;
  resume_url: string | null;
  cv_url: string | null;
  portfolio_pptx_url: string | null;
}

export interface Skill {
  id: string;
  name: string;
  icon: string;
  category: "frontend" | "backend";
  description: string | null;
  proficiency_level: "beginner" | "intermediate" | "experienced" | "expert" | null;
  sort_order: number;
}

export interface Project {
  id: string;
  title: string;
  description: string | null;
  tags: string[];
  live_url: string | null;
  github_url: string | null;
  image_url: string | null;
  type: string | null;
  featured: boolean;
  sort_order: number;
}

export interface Certificate {
  id: string;
  title: string;
  issuer: string;
  date: string | null;
  description: string | null;
  category: string | null;
  certificate_url: string | null;
  featured: boolean;
  sort_order: number;
}

export interface WorkExperience {
  id: string;
  title: string;
  role: string | null;
  period: string | null;
  description: string | null;
  sort_order: number;
}

export async function getProfile(): Promise<Profile | null> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("profile")
    .select("*")
    .limit(1)
    .single();

  if (error) {
    console.error("Error fetching profile:", error);
    return null;
  }

  return data;
}

export async function getSkills(): Promise<Skill[]> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("skills")
    .select("*")
    .order("sort_order", { ascending: true });

  if (error) {
    console.error("Error fetching skills:", error);
    return [];
  }

  return data || [];
}

export async function getProjects(): Promise<Project[]> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("projects")
    .select("*")
    .order("sort_order", { ascending: true });

  if (error) {
    console.error("Error fetching projects:", error);
    return [];
  }

  return data || [];
}

export async function getCertificates(): Promise<Certificate[]> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("certificates")
    .select("*")
    .order("sort_order", { ascending: true });

  if (error) {
    console.error("Error fetching certificates:", error);
    return [];
  }

  return data || [];
}

export async function getWorkExperience(): Promise<WorkExperience[]> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("work_experience")
    .select("*")
    .order("sort_order", { ascending: true });

  if (error) {
    console.error("Error fetching work experience:", error);
    return [];
  }

  return data || [];
}

export async function submitContactMessage(data: {
  name: string;
  email: string;
  subject?: string;
  message: string;
}): Promise<{ success: boolean; error?: string }> {
  const supabase = createClient();
  const { error } = await supabase.from("contact_messages").insert([data]);

  if (error) {
    console.error("Error submitting contact message:", error);
    return { success: false, error: error.message };
  }

  return { success: true };
}