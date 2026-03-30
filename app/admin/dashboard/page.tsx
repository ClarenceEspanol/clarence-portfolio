import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { AdminDashboard } from "@/components/admin/admin-dashboard";

export default async function AdminDashboardPage() {
  // Server-side auth guard — redirects to login if not authenticated
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect("/admin");
  }

  return <AdminDashboard />;
}