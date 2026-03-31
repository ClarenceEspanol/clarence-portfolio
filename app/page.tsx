"use client";

import { useState } from "react";
import { Navigation } from "@/components/portfolio/navigation";
import { HeroSection } from "@/components/portfolio/hero-section";
import { AboutSection } from "@/components/portfolio/about-section";
import { SkillsSection } from "@/components/portfolio/skills-section";
import { ProjectsSection } from "@/components/portfolio/projects-section";
import { CertificatesSection } from "@/components/portfolio/certificates-section";
import { ContactSection } from "@/components/portfolio/contact-section";
import { Footer } from "@/components/portfolio/footer";
import { AIChatbot } from "@/components/portfolio/ai-chatbot";
import { KonamiCode } from "@/components/portfolio/konami-code";
import { ScrollProgress } from "@/components/portfolio/scroll-progress";
import { BackToTop } from "@/components/portfolio/back-to-top";
import { LoadingScreen } from "@/components/portfolio/loading-screen";

export default function Portfolio() {
  const [isLoading, setIsLoading] = useState(true);

  return (
    <>
      {isLoading && <LoadingScreen onComplete={() => setIsLoading(false)} />}

      <main
        className={`relative min-h-screen overflow-x-hidden transition-opacity duration-500 ${
          isLoading ? "opacity-0" : "opacity-100"
        }`}
      >
        <KonamiCode />
        <ScrollProgress />
        <BackToTop />
        <Navigation />
        <HeroSection />
        <AboutSection />
        <SkillsSection />
        <ProjectsSection />
        <CertificatesSection />
        <ContactSection />
        <Footer />
        <AIChatbot />
      </main>
    </>
  );
}