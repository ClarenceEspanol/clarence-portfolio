"use client";

import { useState, useEffect, useMemo } from "react";
import Image from "next/image";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogOverlay,
} from "@/components/ui/dialog";
import { getCertificates, type Certificate } from "@/lib/supabase/data";
import {
  ZoomIn,
  ExternalLink,
  Calendar,
  Building2,
  FileText,
  X,
  Download,
  Search,
  SlidersHorizontal,
  ChevronDown,
} from "lucide-react";
import { ScrollAnimator } from "./scroll-animator";

const categoryColors: Record<string, string> = {
  Design: "bg-pink-500/10 text-pink-600 dark:text-pink-400 border-pink-500/30",
  Management: "bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/30",
  Analytics: "bg-green-500/10 text-green-600 dark:text-green-400 border-green-500/30",
  Programming: "bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/30",
  AI: "bg-purple-500/10 text-purple-600 dark:text-purple-400 border-purple-500/30",
  Technical: "bg-orange-500/10 text-orange-600 dark:text-orange-400 border-orange-500/30",
  Security: "bg-red-500/10 text-red-600 dark:text-red-400 border-red-500/30",
  Technology: "bg-cyan-500/10 text-cyan-600 dark:text-cyan-400 border-cyan-500/30",
};

const SORT_OPTIONS = [
  { value: "default", label: "Default Order" },
  { value: "title-asc", label: "Title A→Z" },
  { value: "title-desc", label: "Title Z→A" },
  { value: "issuer", label: "By Issuer" },
  { value: "date-desc", label: "Newest First" },
  { value: "date-asc", label: "Oldest First" },
];

function isPdfUrl(url: string): boolean {
  const lower = url.toLowerCase();
  return lower.includes(".pdf") || lower.includes("application/pdf");
}

function CertificatePreview({ url, title }: { url: string; title: string }) {
  if (isPdfUrl(url)) {
    return (
      <div className="relative w-full rounded-xl overflow-hidden border border-border mb-4 bg-secondary/30 flex flex-col items-center justify-center gap-4 py-14">
        <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center text-primary">
          <FileText className="w-8 h-8" />
        </div>
        <div className="text-center">
          <p className="font-semibold text-sm mb-1">{title}</p>
          <p className="text-xs text-muted-foreground font-mono">PDF Certificate</p>
        </div>
        <div className="flex gap-3">
          <Button asChild size="sm" variant="outline">
            <a href={url} target="_blank" rel="noopener noreferrer">
              <ExternalLink className="w-4 h-4 mr-1.5" /> Open PDF
            </a>
          </Button>
          <Button asChild size="sm">
            <a href={url} download>
              <Download className="w-4 h-4 mr-1.5" /> Download
            </a>
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="relative aspect-4/3 w-full rounded-lg overflow-hidden bg-muted mb-4">
      <Image src={url} alt={title} fill className="object-contain" />
    </div>
  );
}

function CertificateCard({ cert, onClick }: { cert: Certificate; onClick: () => void }) {
  const hasPdf = cert.certificate_url ? isPdfUrl(cert.certificate_url) : false;
  return (
    <Card
      className="group relative overflow-hidden bg-card/50 border-border hover:border-primary/50 transition-all duration-300 hover:scale-[1.02] hover:shadow-xl hover:shadow-primary/5 cursor-pointer"
      onClick={onClick}
    >
      <CardContent className="p-5">
        <Badge
          variant="outline"
          className={`mb-3 text-xs ${categoryColors[cert.category ?? ""] || "border-primary/30 text-primary"}`}
        >
          {cert.category}
        </Badge>

        <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center mb-3 group-hover:bg-primary group-hover:text-primary-foreground transition-all duration-300">
          {hasPdf ? (
            <FileText className="w-5 h-5" />
          ) : (
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" />
            </svg>
          )}
        </div>

        <h3 className="font-semibold text-base mb-2 group-hover:text-primary transition-colors duration-300 line-clamp-2">
          {cert.title}
        </h3>

        <div className="space-y-1">
          <p className="text-sm text-muted-foreground flex items-center gap-1.5">
            <Building2 className="w-3.5 h-3.5 shrink-0" />{cert.issuer}
          </p>
          <p className="text-xs text-muted-foreground/70 flex items-center gap-1.5">
            <Calendar className="w-3 h-3 shrink-0" />{cert.date}
          </p>
          {hasPdf && (
            <p className="text-xs text-primary/70 flex items-center gap-1.5 mt-1">
              <FileText className="w-3 h-3 shrink-0" />PDF Certificate
            </p>
          )}
        </div>

        <div className="absolute top-3 right-3 opacity-0 group-hover:opacity-100 transition-opacity">
          <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
            <ZoomIn className="w-4 h-4 text-primary" />
          </div>
        </div>

        <div className="absolute bottom-0 right-0 w-16 h-16 bg-linear-to-tl from-primary/5 to-transparent rounded-tl-full opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
      </CardContent>
    </Card>
  );
}

function CertificateModal({
  cert,
  isOpen,
  onClose,
}: {
  cert: Certificate | null;
  isOpen: boolean;
  onClose: () => void;
}) {
  if (!cert) return null;
  const hasPdf = cert.certificate_url ? isPdfUrl(cert.certificate_url) : false;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogOverlay className="backdrop-blur-sm bg-black/50" />
      <DialogContent className="max-w-3xl max-h-[92vh] overflow-y-auto bg-card border-border p-0">
        <DialogHeader className="p-6 pb-4 sticky top-0 bg-card/95 backdrop-blur z-10 border-b border-border">
          <div className="flex items-start justify-between gap-4">
            <div className="flex-1">
              <Badge
                variant="outline"
                className={`mb-2 ${categoryColors[cert.category ?? ""] || "border-primary/30 text-primary"}`}
              >
                {cert.category}
              </Badge>
              <DialogTitle className="text-xl font-bold pr-8">{cert.title}</DialogTitle>
              <div className="flex flex-wrap items-center gap-4 mt-2 text-sm text-muted-foreground">
                <span className="flex items-center gap-1.5">
                  <Building2 className="w-4 h-4" />{cert.issuer}
                </span>
                <span className="flex items-center gap-1.5">
                  <Calendar className="w-4 h-4" />{cert.date}
                </span>
              </div>
            </div>
            <button
              onClick={onClose}
              className="shrink-0 p-1.5 rounded-lg hover:bg-secondary transition-colors text-muted-foreground hover:text-foreground"
              aria-label="Close"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </DialogHeader>

        <div className="p-6 pt-4">
          {cert.certificate_url ? (
            <CertificatePreview url={cert.certificate_url} title={cert.title} />
          ) : (
            <div className="relative aspect-4/3 w-full rounded-lg overflow-hidden bg-linear-to-br from-muted to-muted/50 flex items-center justify-center mb-4">
              <div className="text-center">
                <div className="w-20 h-20 mx-auto mb-4 rounded-full bg-primary/10 flex items-center justify-center">
                  <svg className="w-10 h-10 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" />
                  </svg>
                </div>
                <p className="text-muted-foreground text-sm">Certificate preview not available</p>
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}

// ── View All Modal Filter Panel ───────────────────────────────────────────────

function FilterPanel({
  categories,
  activeCategory,
  onCategoryChange,
  sortBy,
  onSortChange,
  onClose,
}: {
  categories: string[];
  activeCategory: string;
  onCategoryChange: (cat: string) => void;
  sortBy: string;
  onSortChange: (sort: string) => void;
  onClose: () => void;
}) {
  return (
    <div className="absolute top-full right-0 mt-2 w-72 bg-card border border-border rounded-2xl shadow-2xl shadow-black/20 z-50 p-4 space-y-4 animate-in fade-in slide-in-from-top-2 duration-200">
      <div className="flex items-center justify-between">
        <p className="text-sm font-semibold">Filters & Sort</p>
        <button
          onClick={onClose}
          className="w-6 h-6 rounded-md hover:bg-secondary flex items-center justify-center text-muted-foreground hover:text-foreground transition-colors"
        >
          <X className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* Category filter */}
      <div className="space-y-2">
        <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Category</p>
        <div className="flex flex-wrap gap-1.5">
          <button
            onClick={() => onCategoryChange("all")}
            className={`px-2.5 py-1 rounded-lg text-xs font-medium transition-all duration-150 ${
              activeCategory === "all"
                ? "bg-primary text-primary-foreground"
                : "bg-secondary text-muted-foreground hover:text-foreground hover:bg-secondary/80"
            }`}
          >
            All
          </button>
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => onCategoryChange(cat)}
              className={`px-2.5 py-1 rounded-lg text-xs font-medium transition-all duration-150 ${
                activeCategory === cat
                  ? "bg-primary text-primary-foreground"
                  : "bg-secondary text-muted-foreground hover:text-foreground hover:bg-secondary/80"
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* Sort */}
      <div className="space-y-2">
        <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Sort by</p>
        <div className="space-y-1">
          {SORT_OPTIONS.map((opt) => (
            <button
              key={opt.value}
              onClick={() => onSortChange(opt.value)}
              className={`w-full text-left px-3 py-1.5 rounded-lg text-xs transition-all duration-150 ${
                sortBy === opt.value
                  ? "bg-primary/10 text-primary font-medium"
                  : "text-muted-foreground hover:text-foreground hover:bg-secondary"
              }`}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

// ── Main Section ──────────────────────────────────────────────────────────────

export function CertificatesSection() {
  const [allCertificates, setAllCertificates] = useState<Certificate[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedCert, setSelectedCert] = useState<Certificate | null>(null);
  const [showAllModal, setShowAllModal] = useState(false);

  // View-All modal state
  const [search, setSearch] = useState("");
  const [activeCategory, setActiveCategory] = useState("all");
  const [sortBy, setSortBy] = useState("default");
  const [showFilterPanel, setShowFilterPanel] = useState(false);

  useEffect(() => {
    getCertificates().then(setAllCertificates);
  }, []);

  const featured = allCertificates.filter((c) => c.featured);

  // Unique categories from data
  const categories = useMemo(
    () => Array.from(new Set(allCertificates.map((c) => c.category).filter(Boolean))) as string[],
    [allCertificates]
  );

  // Filtered + sorted certs for the View All modal
  const filteredCerts = useMemo(() => {
    let list = [...allCertificates];

    // Search
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter(
        (c) =>
          c.title.toLowerCase().includes(q) ||
          c.issuer.toLowerCase().includes(q) ||
          (c.category ?? "").toLowerCase().includes(q)
      );
    }

    // Category filter
    if (activeCategory !== "all") {
      list = list.filter((c) => c.category === activeCategory);
    }

    // Sort
    switch (sortBy) {
      case "title-asc":
        list.sort((a, b) => a.title.localeCompare(b.title));
        break;
      case "title-desc":
        list.sort((a, b) => b.title.localeCompare(a.title));
        break;
      case "issuer":
        list.sort((a, b) => a.issuer.localeCompare(b.issuer));
        break;
      case "date-desc":
        list.sort((a, b) => (b.date ?? "").localeCompare(a.date ?? ""));
        break;
      case "date-asc":
        list.sort((a, b) => (a.date ?? "").localeCompare(b.date ?? ""));
        break;
      default:
        break;
    }

    return list;
  }, [allCertificates, search, activeCategory, sortBy]);

  const handleCertClick = (cert: Certificate) => {
    setSelectedCert(cert);
    setIsModalOpen(true);
  };

  const activeFilterCount =
    (activeCategory !== "all" ? 1 : 0) + (sortBy !== "default" ? 1 : 0);

  return (
    <section id="certificates" className="py-20 px-4 relative">
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-0 right-1/4 w-72 h-72 bg-accent/5 rounded-full blur-3xl" />
        <div className="absolute bottom-1/4 left-0 w-64 h-64 bg-primary/5 rounded-full blur-3xl" />
      </div>

      <div className="max-w-6xl mx-auto relative">
        <ScrollAnimator>
          <div className="text-center mb-12">
            <p className="text-primary font-mono text-sm mb-2">My Achievements</p>
            <h2 className="text-3xl md:text-4xl font-bold">Certificates</h2>
            <p className="text-muted-foreground mt-3 max-w-md mx-auto">
              Click on any certificate to view details
            </p>
          </div>
        </ScrollAnimator>

        <ScrollAnimator delay={100}>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5 mb-10">
            {featured.map((cert) => (
              <CertificateCard key={cert.id} cert={cert} onClick={() => handleCertClick(cert)} />
            ))}
          </div>
        </ScrollAnimator>

        <ScrollAnimator delay={200}>
          <div className="text-center">
            <Button
              size="lg"
              variant="outline"
              className="px-6 py-5 text-base rounded-xl border-border text-foreground hover:border-primary hover:bg-primary/10 hover:text-cyan-500 transition-all duration-300"
              onClick={() => setShowAllModal(true)}
            >
              <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
              </svg>
              View All {allCertificates.length} Certificates
            </Button>
          </div>
        </ScrollAnimator>
      </div>

      {/* ── View All Modal ── */}
      <Dialog
        open={showAllModal}
        onOpenChange={(open) => {
          setShowAllModal(open);
          if (!open) {
            setSearch("");
            setActiveCategory("all");
            setSortBy("default");
            setShowFilterPanel(false);
          }
        }}
      >
        <DialogOverlay className="backdrop-blur-sm bg-black/50" />
        {/* Wide container: max-w-4xl, constrain only height not width */}
        <DialogContent className="max-w-[95vw]! w-[95vw] sm:max-w-5xl! max-h-[88vh] overflow-hidden flex flex-col bg-card border-border p-0">
          {/* Header */}
          <DialogHeader className="flex flex-col gap-3 p-6 pb-4 border-b border-border shrink-0">
            <div className="flex items-center justify-between">
              <DialogTitle className="text-2xl font-bold">All Certificates</DialogTitle>
              <p className="text-sm text-muted-foreground">
                {filteredCerts.length}
                {filteredCerts.length !== allCertificates.length && ` of ${allCertificates.length}`} certificates
              </p>
            </div>

            {/* Search + Filter row */}
            <div className="flex gap-2 items-center">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
                <input
                  type="text"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Search by title, issuer, or category…"
                  className="w-full h-9 pl-9 pr-4 rounded-lg bg-secondary/60 border border-border text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary/50 transition-all"
                />
                {search && (
                  <button
                    onClick={() => setSearch("")}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 w-5 h-5 rounded-full bg-muted-foreground/20 flex items-center justify-center hover:bg-muted-foreground/30 transition-colors"
                  >
                    <X className="w-3 h-3 text-muted-foreground" />
                  </button>
                )}
              </div>

              {/* Filter button */}
              <div className="relative">
                <button
                  onClick={() => setShowFilterPanel((v) => !v)}
                  className={`h-9 px-3 rounded-lg border text-sm font-medium flex items-center gap-1.5 transition-all duration-150 ${
                    showFilterPanel || activeFilterCount > 0
                      ? "bg-primary/10 border-primary/40 text-primary"
                      : "bg-secondary/60 border-border text-muted-foreground hover:text-foreground hover:border-border/80"
                  }`}
                >
                  <SlidersHorizontal className="w-4 h-4" />
                  <span>Filter</span>
                  {activeFilterCount > 0 && (
                    <span className="w-5 h-5 rounded-full bg-primary text-primary-foreground text-[10px] font-bold flex items-center justify-center">
                      {activeFilterCount}
                    </span>
                  )}
                  <ChevronDown className={`w-3.5 h-3.5 transition-transform duration-200 ${showFilterPanel ? "rotate-180" : ""}`} />
                </button>

                {showFilterPanel && (
                  <FilterPanel
                    categories={categories}
                    activeCategory={activeCategory}
                    onCategoryChange={(cat) => { setActiveCategory(cat); }}
                    sortBy={sortBy}
                    onSortChange={(s) => { setSortBy(s); }}
                    onClose={() => setShowFilterPanel(false)}
                  />
                )}
              </div>
            </div>

            {/* Active filters chips */}
            {(activeCategory !== "all" || sortBy !== "default") && (
              <div className="flex flex-wrap gap-1.5 pt-0.5">
                {activeCategory !== "all" && (
                  <span className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-primary/10 text-primary text-xs font-medium">
                    {activeCategory}
                    <button onClick={() => setActiveCategory("all")} className="hover:text-primary/70">
                      <X className="w-3 h-3" />
                    </button>
                  </span>
                )}
                {sortBy !== "default" && (
                  <span className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-secondary text-muted-foreground text-xs font-medium">
                    {SORT_OPTIONS.find((o) => o.value === sortBy)?.label}
                    <button onClick={() => setSortBy("default")} className="hover:text-foreground">
                      <X className="w-3 h-3" />
                    </button>
                  </span>
                )}
              </div>
            )}
          </DialogHeader>

          {/* Scrollable content — 3 columns */}
          <div className="overflow-y-auto p-6 pt-4 flex-1">
            {filteredCerts.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-20 text-center">
                <div className="w-16 h-16 rounded-2xl bg-secondary flex items-center justify-center mb-4">
                  <Search className="w-7 h-7 text-muted-foreground/50" />
                </div>
                <p className="font-semibold text-muted-foreground mb-1">No certificates found</p>
                <p className="text-sm text-muted-foreground/60">Try adjusting your search or filters</p>
                <button
                  onClick={() => { setSearch(""); setActiveCategory("all"); setSortBy("default"); }}
                  className="mt-3 text-xs text-primary hover:underline"
                >
                  Clear all filters
                </button>
              </div>
            ) : (
              <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {filteredCerts.map((cert) => {
                  const hasPdf = cert.certificate_url ? isPdfUrl(cert.certificate_url) : false;
                  return (
                    <div
                      key={cert.id}
                      onClick={() => {
                        setShowAllModal(false);
                        setTimeout(() => handleCertClick(cert), 200);
                      }}
                      className="p-5 rounded-xl bg-secondary/50 border border-border hover:border-primary/50 transition-all duration-300 cursor-pointer hover:bg-secondary hover:shadow-md hover:shadow-primary/5 group"
                    >
                      <div className="flex items-start gap-4">
                        <div className="w-11 h-11 rounded-lg bg-primary/10 flex items-center justify-center shrink-0 group-hover:bg-primary group-hover:text-primary-foreground transition-all duration-300">
                          {hasPdf ? (
                            <FileText className="w-5 h-5 text-primary group-hover:text-primary-foreground" />
                          ) : (
                            <svg className="w-5 h-5 text-primary group-hover:text-primary-foreground" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" />
                            </svg>
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <Badge
                            variant="outline"
                            className={`mb-2 text-xs ${categoryColors[cert.category ?? ""] || "border-primary/30 text-primary"}`}
                          >
                            {cert.category}
                          </Badge>
                          <h4 className="font-semibold text-base mb-1.5 leading-snug group-hover:text-primary transition-colors duration-200">{cert.title}</h4>
                          <p className="text-sm text-muted-foreground flex items-center gap-1.5">
                            <Building2 className="w-3.5 h-3.5 shrink-0" />{cert.issuer}
                          </p>
                          <p className="text-xs text-muted-foreground/70 mt-1 flex items-center gap-1.5">
                            <Calendar className="w-3 h-3 shrink-0" />{cert.date}
                          </p>
                          {hasPdf && (
                            <p className="text-xs text-primary/70 mt-1.5 flex items-center gap-1">
                              <FileText className="w-3 h-3" /> PDF Certificate
                            </p>
                          )}
                        </div>
                        <ZoomIn className="w-4 h-4 text-muted-foreground/40 shrink-0 mt-0.5 group-hover:text-primary/50 transition-colors" />
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>

      <CertificateModal cert={selectedCert} isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} />
    </section>
  );
}