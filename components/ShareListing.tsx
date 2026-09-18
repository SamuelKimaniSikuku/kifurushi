"use client";

// Most Kifurushi matchmaking happens off-platform — someone spots a trip and
// forwards it to the person who needs it on WhatsApp. This makes that a
// one-tap act: the native share sheet where it exists, copy-link elsewhere.
// The link lands on the browse page scrolled to that exact listing.

import { useState } from "react";
import { Check, Share2 } from "lucide-react";
import { useT } from "@/lib/i18n";

export default function ShareListing({ url, text }: { url: string; text: string }) {
  const t = useT();
  const [copied, setCopied] = useState(false);

  async function share() {
    const payload = `${text} ${url}`;
    try {
      if (navigator.share) {
        await navigator.share({ text: payload });
        return;
      }
    } catch {
      // Share sheet dismissed — nothing to do.
      return;
    }
    try {
      await navigator.clipboard.writeText(payload);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Clipboard unavailable (very old browser) — the button just no-ops.
    }
  }

  return (
    <div className="relative flex shrink-0">
      <button
        type="button"
        onClick={share}
        className="inline-flex min-h-11 items-center justify-center gap-2 whitespace-nowrap rounded-xl border border-line-strong bg-white px-3 py-2.5 text-sm font-semibold text-forest transition hover:border-forest hover:bg-sand focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-leaf focus-visible:ring-offset-2"
      >
        {copied ? (
          <Check size={16} strokeWidth={2} aria-hidden className="text-success" />
        ) : (
          <Share2 size={16} strokeWidth={2} aria-hidden />
        )}
        {t.browse.share}
      </button>
      <span
        role="status"
        className={copied
          ? "pointer-events-none absolute bottom-full right-0 z-10 mb-2 w-max max-w-[15rem] rounded-lg bg-forest px-3 py-2 text-sm text-white shadow-sm"
          : "sr-only"}
      >
        {copied ? t.browse.linkCopied : ""}
      </span>
    </div>
  );
}
