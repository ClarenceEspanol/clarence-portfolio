"use client";

import { useEffect, useRef, useState, ReactNode } from "react";

type AnimationType = "fade-up" | "fade-down" | "fade-left" | "fade-right" | "zoom-in" | "flip-up";

interface ScrollAnimatorProps {
  children: ReactNode;
  className?: string;
  delay?: number;
  threshold?: number;
  animation?: AnimationType;
}

export function ScrollAnimator({
  children,
  className = "",
  delay = 0,
  threshold = 0.1,
  animation = "fade-up",
}: ScrollAnimatorProps) {
  const ref = useRef<HTMLDivElement>(null);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setTimeout(() => setIsVisible(true), delay);
          observer.unobserve(entry.target);
        }
      },
      { threshold }
    );

    const current = ref.current;
    if (current) observer.observe(current);
    return () => { if (current) observer.unobserve(current); };
  }, [delay, threshold]);

  return (
    <div
      ref={ref}
      className={`aos-animate aos-${animation} ${isVisible ? "aos-visible" : ""} ${className}`}
    >
      {children}
    </div>
  );
}