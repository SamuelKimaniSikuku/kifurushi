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
    <button
      type="button"
      onClick={share}
      className="inline-flex min-h-[36px] items-center gap-1.5 rounded-full border border-line-strong px-3 py-1 text-xs font-semibold text-muted transition hover:border-forest hover:text-forest focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-leaf"
    >
      {copied ? (
        <>
          <Check size={13} strokeWidth={2.5} aria-hidden className="text-success" />
          {t.browse.linkCopied}
        </>
      ) : (
        <>
          <Share2 size={13} strokeWidth={2.5} aria-hidden />
          {t.browse.share}
        </>
      )}
    </button>
  );
}
