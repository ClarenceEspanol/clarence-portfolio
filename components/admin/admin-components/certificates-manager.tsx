"use client";

import { useState, useEffect, useRef, RefObject } from "react";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter, DialogClose } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Plus, Pencil, Trash2, RefreshCw, Star, ExternalLink, Upload, FileText, Award } from "lucide-react";
import { toast } from "./toast";
import { uploadFile, isPdfUrl, CERT_CATEGORIES } from "./utils";
import type { Certificate } from "./types";

const MAX_FEATURED = 6;

function CertThumbnail({ url, title }: { url: string; title: string }) {
  if (isPdfUrl(url)) {
    return (
      <div className="w-16 h-12 rounded-lg border bg-muted flex flex-col items-center justify-center shrink-0 gap-0.5">
        <FileText className="w-5 h-5 text-primary" />
        <span className="text-[9px] text-muted-foreground font-medium">PDF</span>
      </div>
    );
  }
  return (
    <div className="w-16 h-12 rounded-lg overflow-hidden border shrink-0">
      <img src={url} alt={title} className="w-full h-full object-cover"
        onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }} />
    </div>
  );
}

// ── CertForm is defined OUTSIDE CertificatesManager so React never remounts it
// on parent state changes — this fixes the auto-scroll-to-top bug when pasting,
// uploading, or interacting with any field inside the form.
interface CertFormProps {
  cert: any;
  setCert: (c: any) => void;
  certFileRef: RefObject<HTMLInputElement | null>;
  supabase: ReturnType<typeof createClient>;
}

function CertForm({ cert, setCert, certFileRef, supabase }: CertFormProps) {
  return (
    <div className="space-y-4 max-h-[60vh] overflow-y-auto pr-2">
      <div className="space-y-2">
        <label className="text-sm font-medium">Title *</label>
        <Input value={cert.title} onChange={(e) => setCert({ ...cert, title: e.target.value })} placeholder="e.g., Google UX Design Certificate" />
      </div>
      <div className="space-y-2">
        <label className="text-sm font-medium">Issuer *</label>
        <Input value={cert.issuer} onChange={(e) => setCert({ ...cert, issuer: e.target.value })} placeholder="e.g., Coursera / Google" />
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <label className="text-sm font-medium">Date</label>
          <Input value={cert.date || ""} onChange={(e) => setCert({ ...cert, date: e.target.value })} placeholder="e.g., Dec 14, 2025" />
        </div>
        <div className="space-y-2">
          <label className="text-sm font-medium">Category</label>
          <Select value={cert.category || "Programming"} onValueChange={(v) => setCert({ ...cert, category: v })}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>{CERT_CATEGORIES.map((cat) => <SelectItem key={cat} value={cat}>{cat}</SelectItem>)}</SelectContent>
          </Select>
        </div>
      </div>
      <div className="space-y-2">
        <label className="text-sm font-medium">Description</label>
        <Textarea value={cert.description || ""} onChange={(e) => setCert({ ...cert, description: e.target.value })} rows={3} />
      </div>
      <div className="space-y-2">
        <label className="text-sm font-medium flex items-center gap-1"><FileText className="w-3.5 h-3.5" />Certificate File / URL</label>
        <Input value={cert.certificate_url || ""} onChange={(e) => setCert({ ...cert, certificate_url: e.target.value })} placeholder="https://... or upload below" />
        <div className="flex items-center gap-2">
          <input ref={certFileRef} type="file" accept="image/*,.pdf" className="hidden" onChange={async (e) => {
            const file = e.target.files?.[0]; if (!file) return;
            toast("Uploading certificate file…", "upload");
            const url = await uploadFile(supabase, file, "certificates");
            if (url) { setCert({ ...cert, certificate_url: url }); toast("Certificate file uploaded!", "success"); }
          }} />
          <Button type="button" variant="outline" size="sm" onClick={() => certFileRef.current?.click()}>
            <Upload className="w-3.5 h-3.5 mr-1" />Upload File (Image or PDF)
          </Button>
        </div>
        {cert.certificate_url && (
          isPdfUrl(cert.certificate_url) ? (
            <div className="flex items-center gap-3 p-3 rounded-lg bg-muted border">
              <FileText className="w-8 h-8 text-primary shrink-0" />
              <div>
                <p className="text-sm font-medium">PDF uploaded</p>
                <a href={cert.certificate_url} target="_blank" rel="noopener noreferrer"
                  className="text-xs text-primary hover:underline flex items-center gap-1 mt-0.5">
                  <ExternalLink className="w-3 h-3" /> Open PDF
                </a>
              </div>
            </div>
          ) : (
            <img src={cert.certificate_url} alt="preview" className="w-full h-28 object-cover rounded-lg border"
              onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }} />
          )
        )}
      </div>
      <div className="flex items-center justify-between">
        <label className="text-sm font-medium">Featured</label>
        <Switch checked={cert.featured} onCheckedChange={(v) => setCert({ ...cert, featured: v })} />
      </div>
    </div>
  );
}

// ── Main component ────────────────────────────────────────────────────────────

export function CertificatesManager() {
  const supabase = createClient();
  const [certificates, setCertificates] = useState<Certificate[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingCert, setEditingCert] = useState<Certificate | null>(null);
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [filter, setFilter] = useState("all");
  const fileInputRef = useRef<HTMLInputElement>(null);
  const editFileInputRef = useRef<HTMLInputElement>(null);
  const [newCert, setNewCert] = useState<Omit<Certificate, "id" | "sort_order">>({
    title: "", issuer: "", date: null, description: null, category: "Programming", certificate_url: null, featured: false,
  });

  useEffect(() => {
    supabase.from("certificates").select("*").order("sort_order").then(({ data }) => { setCertificates(data || []); setLoading(false); });
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const handleAdd = async () => {
    if (!newCert.title || !newCert.issuer) return;
    setSaving(true);
    const { data, error } = await supabase.from("certificates").insert([{ ...newCert, sort_order: certificates.length }]).select().single();
    if (error) { toast("Failed to add certificate.", "error"); setSaving(false); return; }
    if (data) setCertificates([...certificates, data]);
    setNewCert({ title: "", issuer: "", date: null, description: null, category: "Programming", certificate_url: null, featured: false });
    setIsAddOpen(false); setSaving(false);
    toast("Certificate added successfully!", "success");
  };

  const handleUpdate = async () => {
    if (!editingCert) return;
    setSaving(true);
    const { error } = await supabase.from("certificates").update(editingCert).eq("id", editingCert.id);
    if (error) { toast("Failed to save changes.", "error"); setSaving(false); return; }
    setCertificates(certificates.map((c) => (c.id === editingCert.id ? editingCert : c)));
    setEditingCert(null); setSaving(false);
    toast("Certificate saved successfully!", "success");
  };

  const handleDelete = async (id: string) => {
    await supabase.from("certificates").delete().eq("id", id);
    setCertificates(certificates.filter((c) => c.id !== id));
    toast("Certificate deleted.", "info");
  };

  const toggleFeatured = async (cert: Certificate) => {
    const featuredCount = certificates.filter((c) => c.featured).length;
    if (!cert.featured && featuredCount >= MAX_FEATURED) {
      toast(`Max ${MAX_FEATURED} featured certificates allowed. Remove one first.`, "error");
      return;
    }
    const updated = { ...cert, featured: !cert.featured };
    await supabase.from("certificates").update({ featured: updated.featured }).eq("id", cert.id);
    setCertificates(certificates.map((c) => (c.id === cert.id ? updated : c)));
    toast(updated.featured ? "Marked as featured!" : "Removed from featured.", "success");
  };

  const filteredCerts = certificates.filter((c) => {
    if (filter === "all") return true;
    if (filter === "featured") return c.featured;
    return c.category === filter;
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h2 className="text-2xl font-bold">Certificates</h2>
          <p className="text-muted-foreground">
            {certificates.length} certificates ({certificates.filter((c) => c.featured).length}/{MAX_FEATURED} featured)
          </p>
        </div>
        <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
          <DialogTrigger asChild><Button><Plus className="w-4 h-4 mr-2" />Add Certificate</Button></DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader><DialogTitle>Add New Certificate</DialogTitle></DialogHeader>
            <CertForm cert={newCert} setCert={setNewCert} certFileRef={fileInputRef} supabase={supabase} />
            <DialogFooter>
              <DialogClose asChild><Button variant="outline">Cancel</Button></DialogClose>
              <Button onClick={handleAdd} disabled={saving || !newCert.title || !newCert.issuer}>{saving ? "Saving..." : "Add Certificate"}</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      <div className="flex flex-wrap gap-2">
        {[
          { key: "all", label: `All (${certificates.length})` },
          { key: "featured", label: `⭐ Featured (${certificates.filter((c) => c.featured).length}/${MAX_FEATURED})` },
          ...CERT_CATEGORIES.filter((cat) => certificates.some((c) => c.category === cat))
            .map((cat) => ({ key: cat, label: `${cat} (${certificates.filter((c) => c.category === cat).length})` }))
        ].map(({ key, label }) => (
          <Button key={key} variant={filter === key ? "default" : "outline"} size="sm" onClick={() => setFilter(key)}>{label}</Button>
        ))}
      </div>

      {loading ? <div className="flex justify-center py-16"><RefreshCw className="w-6 h-6 animate-spin text-muted-foreground" /></div> : (
        <div className="grid gap-3">
          {filteredCerts.map((cert) => (
            <Card key={cert.id} className={`bg-card/50 ${cert.featured ? "border-primary/30" : ""}`}>
              <CardContent className="p-4">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex items-start gap-3 flex-1">
                    {cert.certificate_url ? <CertThumbnail url={cert.certificate_url} title={cert.title} /> : (
                      <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${cert.featured ? "bg-primary/20" : "bg-muted"}`}>
                        <Award className={`w-5 h-5 ${cert.featured ? "text-primary" : "text-muted-foreground"}`} />
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="font-semibold truncate">{cert.title}</h3>
                        {cert.featured && <Star className="w-4 h-4 text-primary fill-primary" />}
                      </div>
                      <p className="text-sm text-muted-foreground">{cert.issuer}</p>
                      <div className="flex items-center gap-2 mt-2">
                        {cert.category && <Badge variant="outline" className="text-xs">{cert.category}</Badge>}
                        {cert.date && <span className="text-xs text-muted-foreground">{cert.date}</span>}
                        {cert.certificate_url && (
                          <a href={cert.certificate_url} target="_blank" rel="noopener noreferrer"
                            className="text-xs text-primary hover:underline flex items-center gap-1">
                            <ExternalLink className="w-3 h-3" />View
                          </a>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-1">
                    <Button
                      variant="ghost" size="icon"
                      onClick={() => toggleFeatured(cert)}
                      title={cert.featured ? "Unfeature" : certificates.filter((c) => c.featured).length >= MAX_FEATURED ? `Max ${MAX_FEATURED} featured reached` : "Feature"}
                    >
                      <Star className={`w-4 h-4 ${cert.featured ? "text-primary fill-primary" : ""}`} />
                    </Button>
                    <Dialog>
                      <DialogTrigger asChild>
                        <Button variant="ghost" size="icon" onClick={() => setEditingCert(cert)}><Pencil className="w-4 h-4" /></Button>
                      </DialogTrigger>
                      <DialogContent className="max-w-2xl">
                        <DialogHeader><DialogTitle>Edit Certificate</DialogTitle></DialogHeader>
                        {editingCert && <CertForm cert={editingCert} setCert={setEditingCert} certFileRef={editFileInputRef} supabase={supabase} />}
                        <DialogFooter>
                          <DialogClose asChild><Button variant="outline">Cancel</Button></DialogClose>
                          <DialogClose asChild><Button onClick={handleUpdate} disabled={saving}>{saving ? "Saving..." : "Save Changes"}</Button></DialogClose>
                        </DialogFooter>
                      </DialogContent>
                    </Dialog>
                    <Button variant="ghost" size="icon" className="text-destructive hover:text-destructive" onClick={() => handleDelete(cert.id)}>
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
          {filteredCerts.length === 0 && (
            <Card className="bg-card/50 border-dashed">
              <CardContent className="p-8 text-center"><p className="text-muted-foreground">No certificates found.</p></CardContent>
            </Card>
          )}
        </div>
      )}
    </div>
  );
}