"use client";

import { useLang } from "@/lib/i18n";

// Floating WhatsApp chat bubble — the support channel. Number in
// international format without "+" or spaces, per wa.me requirements.
const WHATSAPP_NUMBER = "33623887995"; // Samuel's WhatsApp — empty hides the button

const GREETINGS: Record<string, string> = {
  en: "Hello Kifurushi! I have a question:",
  fr: "Bonjour Kifurushi ! J'ai une question :",
  sw: "Habari Kifurushi! Nina swali:",
};

export default function WhatsAppButton() {
  const { lang } = useLang();
  if (!WHATSAPP_NUMBER) return null;

  const href = `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(
    GREETINGS[lang] ?? GREETINGS.en
  )}`;

  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      aria-label="Chat with us on WhatsApp"
      className="fixed bottom-5 right-5 z-50 grid h-14 w-14 place-items-center rounded-full bg-[#25D366] text-white shadow-lg transition hover:scale-105 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-leaf focus-visible:ring-offset-2"
    >
      {/* WhatsApp glyph */}
      <svg viewBox="0 0 32 32" className="h-7 w-7 fill-current" aria-hidden>
        <path d="M16 3C9.4 3 4 8.3 4 14.9c0 2.1.6 4.1 1.6 5.9L4 29l8.4-1.6c1.7.9 3.7 1.4 5.6 1.4 6.6 0 12-5.3 12-11.9C30 8.3 24.6 3 16 3zm0 21.8c-1.7 0-3.4-.5-4.9-1.3l-.4-.2-5 1 1-4.8-.3-.4c-1-1.6-1.5-3.4-1.5-5.2 0-5.5 4.5-9.9 10-9.9s10 4.4 10 9.9-4.4 10.9-8.9 10.9zm5.5-7.4c-.3-.2-1.8-.9-2.1-1-.3-.1-.5-.2-.7.2-.2.3-.8 1-.9 1.2-.2.2-.3.2-.6.1-.3-.2-1.3-.5-2.4-1.5-.9-.8-1.5-1.8-1.7-2.1-.2-.3 0-.5.1-.6l.5-.5c.2-.2.2-.3.3-.5.1-.2 0-.4 0-.6-.1-.2-.7-1.7-1-2.3-.3-.6-.5-.5-.7-.5h-.6c-.2 0-.6.1-.9.4-.3.3-1.1 1.1-1.1 2.7s1.2 3.1 1.3 3.3c.2.2 2.3 3.5 5.6 4.9.8.3 1.4.5 1.9.7.8.2 1.5.2 2 .1.6-.1 1.8-.8 2.1-1.5.3-.7.3-1.3.2-1.5-.1-.1-.3-.2-.6-.3z" />
      </svg>
    </a>
  );
}
