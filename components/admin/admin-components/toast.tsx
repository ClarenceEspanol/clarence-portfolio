"use client";

import { useState, useEffect } from "react";
import { CheckCircle2, AlertCircle, RefreshCw, Upload } from "lucide-react";

export type ToastType = "success" | "error" | "info" | "upload";

interface Toast {
  id: string;
  message: string;
  type: ToastType;
}

let _toastDispatch: ((toast: Omit<Toast, "id">) => void) | null = null;

export function toast(message: string, type: ToastType = "success") {
  _toastDispatch?.({ message, type });
}

export function ToastContainer() {
  const [toasts, setToasts] = useState<Toast[]>([]);

  useEffect(() => {
    _toastDispatch = (t) => {
      const id = Math.random().toString(36).slice(2);
      setToasts((prev) => [...prev, { ...t, id }]);
      setTimeout(() => setToasts((prev) => prev.filter((x) => x.id !== id)), 3500);
    };
    return () => { _toastDispatch = null; };
  }, []);

  if (toasts.length === 0) return null;

  const icons: Record<ToastType, React.ReactNode> = {
    success: <CheckCircle2 className="w-4 h-4 text-green-500 shrink-0" />,
    error:   <AlertCircle  className="w-4 h-4 text-destructive shrink-0" />,
    info:    <RefreshCw    className="w-4 h-4 text-primary shrink-0" />,
    upload:  <Upload       className="w-4 h-4 text-blue-500 shrink-0" />,
  };

  const borders: Record<ToastType, string> = {
    success: "border-green-500/30 bg-green-500/10",
    error:   "border-destructive/30 bg-destructive/10",
    info:    "border-primary/30 bg-primary/10",
    upload:  "border-blue-500/30 bg-blue-500/10",
  };

  return (
    <div className="fixed bottom-4 right-4 z-9999 flex flex-col gap-2 pointer-events-none">
      {toasts.map((t) => (
        <div
          key={t.id}
          className={`flex items-center gap-2.5 px-4 py-3 rounded-xl border shadow-xl text-sm font-medium backdrop-blur-sm animate-in slide-in-from-right-4 fade-in duration-300 ${borders[t.type]}`}
        >
          {icons[t.type]}
          <span>{t.message}</span>
        </div>
      ))}
    </div>
  );
}
