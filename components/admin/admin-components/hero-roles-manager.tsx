"use client";

import { useState, useEffect, useCallback } from "react";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Plus, Trash2, GripVertical, Save, RefreshCw } from "lucide-react";
import { toast } from "./toast";

interface HeroRole {
  id: string;
  label: string;
  sort_order: number;
}

export function HeroRolesManager() {
  const supabase = createClient();
  const [roles, setRoles] = useState<HeroRole[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [newLabel, setNewLabel] = useState("");
  const [dragIndex, setDragIndex] = useState<number | null>(null);

  const fetchRoles = useCallback(async () => {
    setIsLoading(true);
    const { data } = await supabase
      .from("hero_roles")
      .select("*")
      .order("sort_order", { ascending: true });
    setRoles(data ?? []);
    setIsLoading(false);
  }, [supabase]);

  useEffect(() => { fetchRoles(); }, [fetchRoles]);

  // ── Add ──────────────────────────────────────────────────────────────────────
  const handleAdd = async () => {
    const label = newLabel.trim();
    if (!label) return;
    const sort_order = roles.length;
    const { data, error } = await supabase
      .from("hero_roles")
      .insert({ label, sort_order })
      .select()
      .single();
    if (error) { toast("Failed to add role", "error"); return; }
    setRoles((prev) => [...prev, data]);
    setNewLabel("");
    toast("Role added!", "success");
  };

  // ── Delete ───────────────────────────────────────────────────────────────────
  const handleDelete = async (id: string) => {
    await supabase.from("hero_roles").delete().eq("id", id);
    setRoles((prev) => prev.filter((r) => r.id !== id));
    toast("Role removed", "info");
  };

  // ── Inline edit ──────────────────────────────────────────────────────────────
  const handleLabelChange = (id: string, value: string) => {
    setRoles((prev) => prev.map((r) => (r.id === id ? { ...r, label: value } : r)));
  };

  // ── Save all (batch upsert) ──────────────────────────────────────────────────
  const handleSave = async () => {
    setIsSaving(true);
    const updates = roles.map((r, i) => ({ id: r.id, label: r.label, sort_order: i }));
    const { error } = await supabase.from("hero_roles").upsert(updates);
    if (error) { toast("Failed to save", "error"); }
    else { toast("Roles saved!", "success"); }
    setIsSaving(false);
  };

  // ── Drag-to-reorder (simple mouse-based) ─────────────────────────────────────
  const handleDragStart = (index: number) => setDragIndex(index);
  const handleDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault();
    if (dragIndex === null || dragIndex === index) return;
    const updated = [...roles];
    const [moved] = updated.splice(dragIndex, 1);
    updated.splice(index, 0, moved);
    setRoles(updated);
    setDragIndex(index);
  };
  const handleDragEnd = () => setDragIndex(null);

  return (
    <Card className="bg-card/50">
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
          <CardTitle className="flex items-center gap-2 text-base">
            🖊️ Hero Typing Roles
          </CardTitle>
          <CardDescription>
            The words that cycle in the typewriter on your hero section. Drag to reorder.
          </CardDescription>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={fetchRoles} disabled={isLoading}>
            <RefreshCw className={`w-4 h-4 mr-1 ${isLoading ? "animate-spin" : ""}`} />
            Refresh
          </Button>
          <Button size="sm" onClick={handleSave} disabled={isSaving}>
            {isSaving
              ? <RefreshCw className="w-4 h-4 mr-1 animate-spin" />
              : <Save className="w-4 h-4 mr-1" />}
            Save
          </Button>
        </div>
      </CardHeader>

      <CardContent className="space-y-3">
        {isLoading ? (
          <div className="flex justify-center py-8">
            <RefreshCw className="w-5 h-5 animate-spin text-muted-foreground" />
          </div>
        ) : (
          <>
            {roles.length === 0 && (
              <p className="text-sm text-muted-foreground text-center py-4">
                No roles yet. Add one below.
              </p>
            )}

            {roles.map((role, index) => (
              <div
                key={role.id}
                draggable
                onDragStart={() => handleDragStart(index)}
                onDragOver={(e) => handleDragOver(e, index)}
                onDragEnd={handleDragEnd}
                className={`flex items-center gap-2 p-2 rounded-lg border bg-background transition-all ${
                  dragIndex === index ? "opacity-50 border-primary" : "border-border"
                }`}
              >
                <GripVertical className="w-4 h-4 text-muted-foreground cursor-grab shrink-0" />
                <Input
                  value={role.label}
                  onChange={(e) => handleLabelChange(role.id, e.target.value)}
                  className="flex-1 h-8 border-0 shadow-none focus-visible:ring-0 bg-transparent"
                  placeholder="e.g. Full Stack Developer"
                />
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-destructive hover:text-destructive shrink-0"
                  onClick={() => handleDelete(role.id)}
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>
            ))}

            {/* Add new role */}
            <div className="flex items-center gap-2 pt-2 border-t border-border">
              <Input
                value={newLabel}
                onChange={(e) => setNewLabel(e.target.value)}
                placeholder="Add a new role…"
                className="flex-1 h-9"
                onKeyDown={(e) => { if (e.key === "Enter") handleAdd(); }}
              />
              <Button size="sm" onClick={handleAdd} disabled={!newLabel.trim()}>
                <Plus className="w-4 h-4 mr-1" />Add
              </Button>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}