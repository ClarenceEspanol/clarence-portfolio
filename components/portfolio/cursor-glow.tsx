"use client";

import { useEffect, useState } from "react";

export function CursorGlow() {
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [isVisible, setIsVisible] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [isTouchDevice, setIsTouchDevice] = useState(false);

  useEffect(() => {
    setMounted(true);
    setIsTouchDevice("ontouchstart" in window);

    const handleMouseMove = (e: MouseEvent) => {
      setPosition({ x: e.clientX, y: e.clientY });
      setIsVisible(true);
    };

    const handleMouseLeave = () => {
      setIsVisible(false);
    };

    window.addEventListener("mousemove", handleMouseMove);
    document.body.addEventListener("mouseleave", handleMouseLeave);

    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
      document.body.removeEventListener("mouseleave", handleMouseLeave);
    };
  }, []);

  // Don't render until mounted or on touch devices
  if (!mounted || isTouchDevice) {
    return null;
  }

  return (
    <div
      className="pointer-events-none fixed inset-0 z-30 transition-opacity duration-300"
      style={{ opacity: isVisible ? 1 : 0 }}
    >
      <div
        className="absolute w-75 h-75 rounded-full"
        style={{
          background:
            "radial-gradient(circle, oklch(0.72 0.15 220 / 0.05) 0%, transparent 75%)",
          /* Offset is half of the width/height (150px) to keep cursor centered */
          transform: `translate(${position.x - 150}px, ${position.y - 150}px)`,
          transition: "transform 0.1s ease-out",
        }}
      />
    </div>
  );
}