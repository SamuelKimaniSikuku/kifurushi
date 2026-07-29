"use client";

import { useEffect, useRef, useState } from "react";
import { AlertCircle, CheckCircle2, X } from "lucide-react";

const AUTO_DISMISS_MS = 4000;

export default function Toast({
  message,
  onClose,
  tone = "success",
}: {
  message: string;
  onClose: () => void;
  tone?: "success" | "error";
}) {
  const [shown, setShown] = useState(false);

  // Held in a ref so a fresh inline onClose from the parent doesn't restart
  // the dismiss timer on every render.
  const onCloseRef = useRef(onClose);
  useEffect(() => {
    onCloseRef.current = onClose;
  });

  useEffect(() => {
    const raf = requestAnimationFrame(() => setShown(true));
    return () => cancelAnimationFrame(raf);
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => onCloseRef.current(), AUTO_DISMISS_MS);
    return () => clearTimeout(timer);
  }, [message]);

  return (
    <div
      role="status"
      aria-live="polite"
      className={`fixed inset-x-4 bottom-4 z-50 flex items-start gap-3 rounded-2xl border border-line bg-white p-4 shadow-[0_10px_30px_-12px_rgba(20,32,27,0.35)] transition-all duration-300 sm:left-auto sm:right-6 sm:max-w-sm ${
        shown ? "translate-y-0 opacity-100" : "translate-y-3 opacity-0"
      }`}
    >
      {tone === "error" ? (
        <AlertCircle size={20} strokeWidth={2} className="mt-0.5 shrink-0 text-danger" aria-hidden />
      ) : (
        <CheckCircle2 size={20} strokeWidth={2} className="mt-0.5 shrink-0 text-success" aria-hidden />
      )}
      <p className="flex-1 text-sm font-medium text-ink">{message}</p>
      <button
        type="button"
        onClick={onClose}
        aria-label="Dismiss notification"
        className="-my-1 -mr-1 grid h-8 w-8 shrink-0 place-items-center rounded-lg text-muted transition hover:bg-sand hover:text-ink focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-leaf"
      >
        <X size={16} strokeWidth={2} aria-hidden />
      </button>
    </div>
  );
}
