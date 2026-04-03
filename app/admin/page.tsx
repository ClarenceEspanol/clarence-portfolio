/**
 * app/admin/page.tsx
 *
 * Admin login gate.
 * - Only accepts email+password login (Supabase email auth).
 * - Even if the visitor is already signed in via Google (from /chat),
 *   they are BLOCKED unless their email matches OWNER_EMAIL.
 * - On successful login, redirects to /admin/dashboard.
 */

"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Eye, EyeOff, KeyRound, AlertCircle, Loader2, ShieldCheck, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

// Must match OWNER_EMAIL in admin-dashboard.tsx and your .env
const OWNER_EMAIL = process.env.NEXT_PUBLIC_ADMIN_EMAIL ?? "clarenceespanol@gmail.com";

export default function AdminLoginPage() {
  const router = useRouter();
  const supabase = createClient();

  const [email, setEmail]       = useState("");
  const [password, setPassword] = useState("");
  const [showPw, setShowPw]     = useState(false);
  const [loading, setLoading]   = useState(true); // starts true while we check session
  const [error, setError]       = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  // On mount: if a valid owner session already exists, skip the login screen.
  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user?.email === OWNER_EMAIL) {
        router.replace("/admin/dashboard");
      } else {
        // Not the owner — if there's any session (e.g. Google chat user) sign it out
        // so it can't be used to reach the dashboard.
        if (session) supabase.auth.signOut();
        setLoading(false);
      }
    });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSubmitting(true);

    try {
      // 1. Sign in with email + password
      const { data, error: signInError } = await supabase.auth.signInWithPassword({
        email: email.trim().toLowerCase(),
        password,
      });

      if (signInError) {
        setError("Invalid email or password.");
        return;
      }

      // 2. Owner check — even if credentials are valid, only OWNER_EMAIL may enter
      if (data.user?.email !== OWNER_EMAIL) {
        await supabase.auth.signOut();
        setError("Access denied. This dashboard is restricted to the site owner.");
        return;
      }

      // 3. All good — go to dashboard
      router.push("/admin/dashboard");
    } catch {
      setError("An unexpected error occurred. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background px-4 relative">
      {/* Subtle background orbs */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-primary/5 rounded-full blur-3xl" />
        <div className="absolute bottom-1/4 right-1/4 w-80 h-80 bg-accent/5 rounded-full blur-3xl" />
      </div>

      {/* ── Back to Portfolio button ── */}
      <div className="absolute top-5 left-5">
        <Button
          variant="ghost"
          size="sm"
          asChild
          className="text-muted-foreground hover:text-foreground group gap-1.5"
        >
          <a href="/">
            <ArrowLeft className="w-4 h-4 transition-transform group-hover:-translate-x-0.5" />
            Back to Portfolio
          </a>
        </Button>
      </div>

      <Card className="w-full max-w-md relative bg-card/80 backdrop-blur border-border shadow-2xl">
        <CardHeader className="text-center pb-2">
          <div className="w-14 h-14 rounded-2xl bg-primary/10 border border-primary/20 flex items-center justify-center mx-auto mb-4">
            <ShieldCheck className="w-7 h-7 text-primary" />
          </div>
          <CardTitle className="text-2xl font-bold">Admin Access</CardTitle>
          <CardDescription>
            Restricted to the site owner only.
          </CardDescription>
        </CardHeader>

        <CardContent className="pt-4">
          {error && (
            <div className="flex items-start gap-2 p-3 mb-4 rounded-xl bg-destructive/10 border border-destructive/20 text-destructive text-sm">
              <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleLogin} className="space-y-4">
            <div className="space-y-2">
              <label htmlFor="email" className="text-sm font-medium">Email</label>
              <Input
                id="email"
                type="email"
                placeholder="admin@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                autoComplete="email"
                className="bg-secondary/50"
              />
            </div>

            <div className="space-y-2">
              <label htmlFor="password" className="text-sm font-medium flex items-center gap-1">
                <KeyRound className="w-3.5 h-3.5" />
                Password
              </label>
              <div className="relative">
                <Input
                  id="password"
                  type={showPw ? "text" : "password"}
                  placeholder="Enter your password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  autoComplete="current-password"
                  className="bg-secondary/50 pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowPw(!showPw)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                  tabIndex={-1}
                >
                  {showPw ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <Button
              type="submit"
              className="w-full py-5 mt-2"
              disabled={submitting || !email || !password}
            >
              {submitting ? (
                <span className="flex items-center gap-2">
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Signing in...
                </span>
              ) : (
                "Sign In"
              )}
            </Button>
          </form>

          <p className="text-xs text-muted-foreground text-center mt-6">
            This page is not for visitors. If you&apos;re looking to get in touch,{" "}
            <a href="/#contact" className="text-primary hover:underline">contact Clarence here</a>.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}