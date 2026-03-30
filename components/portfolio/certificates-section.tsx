"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { getCertificates, type Certificate } from "@/lib/supabase/data";
import { ZoomIn, ExternalLink, Calendar, Building2, FileText, X } from "lucide-react";
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

function isPdfUrl(url: string): boolean {
  const lower = url.toLowerCase();
  return lower.includes(".pdf") || lower.includes("application/pdf");
}

/**
 * Renders the certificate preview.
 * For PDFs: use Google Docs viewer so it works cross-browser without the black bar.
 * For images: use next/image.
 */
function CertificatePreview({ url, title }: { url: string; title: string }) {
  if (isPdfUrl(url)) {
    // Google Docs viewer strips browser PDF chrome and shows clean preview
    const viewerUrl = `https://docs.google.com/gview?url=${encodeURIComponent(url)}&embedded=true`;
    return (
      <div className="relative w-full rounded-lg overflow-hidden border border-border mb-4 bg-muted" style={{ height: 460 }}>
        <iframe
          src={viewerUrl}
          title={title}
          className="w-full h-full border-0 bg-white"
          allow="fullscreen"
        />
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
            {/* Keeping your manual X button here as requested */}
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
            <>
              <CertificatePreview url={cert.certificate_url} title={cert.title} />
              <Button className="w-full" asChild>
                <a href={cert.certificate_url} target="_blank" rel="noopener noreferrer">
                  <ExternalLink className="w-4 h-4 mr-2" />
                  {hasPdf ? "Open PDF" : "View Credential"}
                </a>
              </Button>
            </>
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

export function CertificatesSection() {
  const [allCertificates, setAllCertificates] = useState<Certificate[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedCert, setSelectedCert] = useState<Certificate | null>(null);
  const [showAllModal, setShowAllModal] = useState(false);

  useEffect(() => {
    getCertificates().then(setAllCertificates);
  }, []);

  const featured = allCertificates.filter((c) => c.featured);

  const handleCertClick = (cert: Certificate) => {
    setSelectedCert(cert);
    setIsModalOpen(true);
  };

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

        <ScrollAnimator delay={0.1}>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5 mb-10">
            {featured.map((cert) => (
              <CertificateCard key={cert.id} cert={cert} onClick={() => handleCertClick(cert)} />
            ))}
          </div>
        </ScrollAnimator>

        <ScrollAnimator delay={0.2}>
          <div className="text-center">
            <Dialog open={showAllModal} onOpenChange={setShowAllModal}>
              <DialogTrigger asChild>
                <Button
                  size="lg"
                  variant="outline"
                  className="px-6 py-5 text-base rounded-xl border-border hover:border-primary hover:bg-primary hover:text-primary-foreground transition-all duration-300"
                >
                  <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                  </svg>
                  View All {allCertificates.length} Certificates
                </Button>
              </DialogTrigger>

              <DialogContent className="max-w-4xl max-h-[85vh] overflow-hidden flex flex-col bg-card border-border p-0">
                {/* Header for View All - NO custom manual button here to prevent double X */}
                <DialogHeader className="flex flex-row items-center justify-between p-6 pb-4 border-b border-border shrink-0">
                  <DialogTitle className="text-2xl font-bold">All Certificates</DialogTitle>
                  {/* Note: Standard Dialog close button is hidden by p-0/header structure or redundant, 
                      so we leave this header clean for standard behavior. */}
                </DialogHeader>

                <div className="overflow-y-auto p-6 pt-4 flex-1">
                  <div className="grid sm:grid-cols-2 gap-4">
                    {allCertificates.map((cert) => {
                      const hasPdf = cert.certificate_url ? isPdfUrl(cert.certificate_url) : false;
                      return (
                        <div
                          key={cert.id}
                          onClick={() => {
                            setShowAllModal(false);
                            setTimeout(() => handleCertClick(cert), 200);
                          }}
                          className="p-4 rounded-xl bg-secondary/50 border border-border hover:border-primary/50 transition-all duration-300 cursor-pointer hover:bg-secondary"
                        >
                          <div className="flex items-start gap-3">
                            <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                              {hasPdf ? (
                                <FileText className="w-5 h-5 text-primary" />
                              ) : (
                                <svg className="w-5 h-5 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
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
                              <h4 className="font-medium text-sm mb-1 line-clamp-2">{cert.title}</h4>
                              <p className="text-xs text-muted-foreground">{cert.issuer}</p>
                              <p className="text-xs text-muted-foreground/70 mt-1">{cert.date}</p>
                              {hasPdf && (
                                <p className="text-xs text-primary/70 mt-1 flex items-center gap-1">
                                  <FileText className="w-3 h-3" /> PDF
                                </p>
                              )}
                            </div>
                            <ZoomIn className="w-4 h-4 text-muted-foreground/50 shrink-0" />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </ScrollAnimator>
      </div>

      <CertificateModal cert={selectedCert} isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} />
    </section>
  );
}