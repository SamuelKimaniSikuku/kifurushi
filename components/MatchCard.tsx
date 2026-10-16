"use client";

import Link from "next/link";
import { requestWeightCopy } from "@/lib/locales/requestWeight";
import { useCallback, useEffect, useRef, useState } from "react";
import {
  ChevronDown, Copy, KeyRound, MessageSquare, PackageCheck, Send, Star,
} from "lucide-react";
import {
  TransitUpdate, MatchStatus, Message,
} from "@/lib/types";
import {
  MatchDetail, deliverNow, fetchMatchWhatsapp, requestMatch, respondMatch, senderConfirmDelivery, advanceMatch, cancelMatch,
  generateDeliveryCode, confirmDelivery,
  fetchTransitUpdates, addTransitUpdate,
  fetchMessages, sendMessage,
} from "@/lib/db";
import { transitUpdateSchema, messageSchema } from "@/lib/validation";
import { useLang, useT } from "@/lib/i18n";
import { reviewCopy } from "@/lib/locales/reviews";
import { deliveryCopy } from "@/lib/locales/delivery";
import DeliveryProblem from "@/components/DeliveryProblem";
import MatchSafety from "@/components/MatchSafety";

const CHAT_POLL_MS = 5000;
const CHAT_IDLE_POLL_MS = 30000;

// Per-match read marker: the timestamp of the newest message this browser has
// seen with the panel open. Anything newer from the other party is unread.
function markerKey(matchId: string) {
  return `kifurushi.chatread.${matchId}`;
}

function readMarker(matchId: string): string {
  if (typeof window === "undefined") return "";
  try {
    return localStorage.getItem(markerKey(matchId)) ?? "";
  } catch {
    return "";
  }
}

function writeMarker(matchId: string, iso: string) {
  try {
    localStorage.setItem(markerKey(matchId), iso);
  } catch {
    // private mode — the badge just won't persist across reloads
  }
}

function ChatPanel({
  matchId,
  myUserId,
  counterpartyName,
  messages,
  visible,
  onSent,
}: {
  matchId: string;
  myUserId: string;
  counterpartyName: string;
  messages: Message[];
  visible: boolean;
  onSent: () => void;
}) {
  const { lang } = useLang();
  const d = deliveryCopy[lang];
  const [draft, setDraft] = useState("");
  const [error, setError] = useState("");
  const [sending, setSending] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = scrollRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [messages.length, visible]);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    const parsed = messageSchema.safeParse(draft);
    if (!parsed.success) {
      setError(parsed.error.issues[0]?.message ?? "Invalid message");
      return;
    }
    if (sending) return;
    setSending(true);
    setError("");
    try {
      await sendMessage(matchId, parsed.data);
      setDraft("");
      onSent();
    } catch {
      setError("Could not send — please try again.");
    } finally {
      setSending(false);
    }
  }

  return (
    <div id={`messages-${matchId}`} className="scroll-mt-24">
      <div
        ref={scrollRef}
        className="max-h-64 space-y-2 overflow-y-auto rounded-xl bg-sand/50 p-3"
        aria-live="polite"
      >
        {messages.length === 0 ? (
          <p className="py-4 text-center text-sm text-muted">{d.emptyChat}</p>
        ) : (
          messages.map((m) => {
            const mine = m.senderId === myUserId;
            return (
              <div
                key={m.id}
                className={`flex ${mine ? "justify-end" : "justify-start"}`}
              >
                <div
                  className={`max-w-[85%] rounded-2xl px-3.5 py-2 text-sm ${
                    mine
                      ? "rounded-br-md bg-forest text-white"
                      : "rounded-bl-md bg-white text-ink"
                  }`}
                >
                  <p className="whitespace-pre-wrap [overflow-wrap:anywhere]">{m.body}</p>
                  <p
                    className={`mt-0.5 text-[10px] ${mine ? "text-white/60" : "text-faint"}`}
                  >
                    {new Date(m.createdAt).toLocaleString(undefined, {
                      day: "numeric", month: "short",
                      hour: "2-digit", minute: "2-digit",
                    })}
                  </p>
                </div>
              </div>
            );
          })
        )}
      </div>

      <form onSubmit={submit} className="mt-3 flex gap-2">
        <input
          aria-label={`Message ${counterpartyName}`}
          className={`field min-w-0 flex-1 ${error ? "field-invalid" : ""}`}
          placeholder={d.messagePlaceholder}
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          maxLength={2000}
        />
        <button
          type="submit"
          className="btn-primary min-h-[44px] shrink-0"
          disabled={sending}
        >
          <Send className="h-4 w-4 shrink-0" strokeWidth={2} aria-hidden />
          {d.send}
        </button>
      </form>
      {error && <p className="field-error">{error}</p>}
    </div>
  );
}

const TERMINAL_NEGATIVE: MatchStatus[] = ["declined", "cancelled", "disputed"];

export default function MatchCard({
  match,
  myUserId,
  onChanged,
  defaultOpen = true,
}: {
  match: MatchDetail;
  myUserId: string;
  onChanged: () => void;
  defaultOpen?: boolean;
}) {
  const [open, setOpen] = useState(defaultOpen);
  const [reportHold, setReportHold] = useState(false);
  const t = useT();
  const { lang } = useLang();
  const weightText = requestWeightCopy[lang];
  const d = deliveryCopy[lang];
  const weightNeedsAgreement = match.parcelWeightKg == null || (match.remainingKg != null && match.parcelWeightKg > match.remainingKg);
  const [view, setView] = useState<"messages" | "details">("messages");
  const chatPanelRef = useRef<HTMLDivElement>(null);
  const [chatInView, setChatInView] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [lastRead, setLastRead] = useState<string>(() => readMarker(match.id));
  const [updates, setUpdates] = useState<TransitUpdate[]>([]);
  const [note, setNote] = useState("");
  const [noteError, setNoteError] = useState("");
  const [busy, setBusy] = useState(false);
  const [actionError, setActionError] = useState("");
  const [code, setCode] = useState<string | null>(null); // sender: freshly minted
  const [codeCopied, setCodeCopied] = useState(false);
  const [codeEntry, setCodeEntry] = useState("");
  const [codeEntryError, setCodeEntryError] = useState("");

  const isTraveler = match.role === "traveler";
  // The side that did not initiate answers the request.
  const canRespond = match.requesterId !== myUserId;
  const done = match.status === "released";
  const ended = TERMINAL_NEGATIVE.includes(match.status);
  const stepIndex = ["requested", "accepted"].includes(match.status) ? 0 : match.status === "escrow_paid" ? 1 : 2;
  const inTransit = match.status === "picked_up" || match.status === "in_transit";
  const received = match.status === "delivered" || done;
  const cancellable = ["requested", "accepted", "escrow_paid"].includes(match.status);
  const waitingDays = Math.floor(
    (Date.now() - new Date(match.updatedAt).getTime()) / 86400000
  );
  const [waNumber, setWaNumber] = useState<string | null>(null);
  const [inspectionReady, setInspectionReady] = useState(false);

  // The counterparty's opted-in WhatsApp number — the RPC answers only after
  // acceptance, so pre-acceptance renders never even ask.
  useEffect(() => {
    if (
      !["accepted", "escrow_paid", "picked_up", "in_transit", "delivered", "released"].includes(
        match.status
      )
    ) {
      return;
    }
    let live = true;
    fetchMatchWhatsapp(match.id)
      .then((n) => live && setWaNumber(n))
      .catch(() => {});
    return () => {
      live = false;
    };
  }, [match.id, match.status]);
  const senderCodeWindow =
    !isTraveler &&
    ["picked_up", "in_transit", "delivered"].includes(match.status);

  const title = isTraveler
    ? `${match.route} — carrying for ${match.counterpartyName}`
    : `${match.route} — with ${match.counterpartyName}`;

  useEffect(() => {
    if (inTransit || received) {
      fetchTransitUpdates(match.id).then(setUpdates).catch(() => {});
    }
  }, [match.id, match.status, inTransit, received, done]);

  // Messages live at card level so the unread badge works even when the card
  // (or the chat panel inside it) is collapsed. Fast poll only while reading.
  const reloadMessages = useCallback(() => {
    fetchMessages(match.id).then(setMessages).catch(() => {});
  }, [match.id]);

  const chatVisible = match.status !== "declined" && match.status !== "cancelled";
  const chatOpen = chatVisible && view === "messages";
  const activeView = chatVisible ? view : "details";

  // Opening the dashboard is not the same as reading every conversation.
  useEffect(() => {
    const panel = chatPanelRef.current;
    if (!open || !chatOpen || !panel) { setChatInView(false); return; }
    let intersects = false;
    const update = () => setChatInView(intersects && document.visibilityState === "visible");
    const observer = new IntersectionObserver(([entry]) => {
      intersects = entry.isIntersecting && entry.intersectionRatio >= 0.25;
      update();
    }, { threshold: 0.25 });
    observer.observe(panel);
    document.addEventListener("visibilitychange", update);
    return () => { observer.disconnect(); document.removeEventListener("visibilitychange", update); };
  }, [open, chatOpen]);

  useEffect(() => {
    if (!chatVisible) return;
    reloadMessages();
    const reading = open && chatOpen && chatInView;
    const t = setInterval(
      reloadMessages,
      reading ? CHAT_POLL_MS : CHAT_IDLE_POLL_MS
    );
    return () => clearInterval(t);
  }, [chatVisible, open, chatOpen, chatInView, reloadMessages]);

  const unread = messages.filter(
    (m) => m.senderId !== myUserId && m.createdAt > lastRead
  ).length;

  // Having the conversation on screen clears the badge.
  useEffect(() => {
    if (!open || !chatOpen || !chatInView || messages.length === 0) return;
    const newest = messages[messages.length - 1].createdAt;
    if (newest > lastRead) {
      setLastRead(newest);
      writeMarker(match.id, newest);
    }
  }, [open, chatOpen, chatInView, messages, lastRead, match.id]);

  const act = useCallback(
    async (fn: () => Promise<unknown>, fallbackMessage: string) => {
      if (busy) return;
      setBusy(true);
      setActionError("");
      try {
        await fn();
        onChanged();
      } catch {
        setActionError(fallbackMessage);
      } finally {
        setBusy(false);
      }
    },
    [busy, onChanged]
  );

  async function postUpdate(e: React.FormEvent) {
    e.preventDefault();
    const parsed = transitUpdateSchema.safeParse(note);
    if (!parsed.success) {
      setNoteError(parsed.error.issues[0]?.message ?? "Invalid update");
      return;
    }
    try {
      await addTransitUpdate(match.id, parsed.data);
      setUpdates(await fetchTransitUpdates(match.id));
      setNote("");
      setNoteError("");
    } catch {
      setNoteError("Could not post the update — please try again.");
    }
  }

  async function mintCode() {
    if (busy) return;
    setBusy(true);
    setActionError("");
    try {
      setCode(await generateDeliveryCode(match.id));
      setCodeCopied(false);
      onChanged(); // refreshes hasCode
    } catch {
      setActionError("Could not generate the code — please try again.");
    } finally {
      setBusy(false);
    }
  }

  async function submitCode(e: React.FormEvent) {
    e.preventDefault();
    if (!/^\d{6}$/.test(codeEntry)) {
      setCodeEntryError("Enter the 6-digit code the receiver reads out.");
      return;
    }
    if (busy) return;
    setBusy(true);
    setCodeEntryError("");
    try {
      const ok = await confirmDelivery(match.id, codeEntry);
      if (ok) {
        onChanged();
      } else {
        setCodeEntryError("Wrong code — ask the receiver to read it again.");
      }
    } catch {
      setCodeEntryError("Too many attempts or the code isn't ready — try again later.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="card p-4 sm:p-5">
      <button
        type="button"
        onClick={() => setOpen(!open)}
        aria-expanded={open}
        aria-label={title}
        className="flex w-full flex-wrap items-center justify-between gap-2 rounded-lg text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-leaf"
      >
        <span className="min-w-0 flex-1">
          <span className="block text-base font-semibold">{match.route}</span>
          <span className="mt-1 block break-words text-sm text-muted">{isTraveler ? d.sender : d.traveller}: {match.counterpartyName}</span>
        </span>
        <span className="flex items-center gap-2">
          {!open && unread > 0 && (
            <span className="inline-flex items-center gap-1 rounded-full bg-clay px-2.5 py-1 text-[11px] font-bold text-white">
              <MessageSquare className="h-3 w-3" strokeWidth={2.5} aria-hidden />
              {unread > 9 ? "9+" : unread}
              <span className="sr-only"> unread messages</span>
            </span>
          )}
          <span
            className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold ${
              done
                ? "bg-success-bg text-success"
                : ended
                  ? "bg-sand-deep text-muted"
                  : "bg-warn-bg text-warn"
            }`}
          >
            {d.status[match.status]}
          </span>
          <ChevronDown
            className={`h-4 w-4 shrink-0 text-muted transition-transform ${open ? "rotate-180" : ""}`}
            strokeWidth={2}
            aria-hidden
          />
        </span>
      </button>

      {done && <a href="#ratings" className="mt-3 inline-flex min-h-11 items-center gap-2 text-sm font-semibold text-forest underline underline-offset-2">
        <Star size={17} className="fill-gold text-gold-deep" aria-hidden />
        {reviewCopy[lang].reviewLink}
      </a>}

      {open && (
      <>

      {!ended && <ol aria-label={d.progress} className="mt-4 grid grid-cols-3 gap-2">
        {d.steps.map((step, i) => <li key={step} aria-current={!done && i === stepIndex ? "step" : undefined}>
          <div className={`h-1 rounded-full ${i <= stepIndex ? "bg-forest" : "bg-sand-deep"}`} />
          <p className={`mt-1 text-xs ${i <= stepIndex ? "font-medium text-forest" : "text-muted"}`}>{i + 1}. {step}</p>
        </li>)}
      </ol>}

      <MatchSafety match={match} myUserId={myUserId} onChanged={onChanged} onReady={setInspectionReady} onMessage={() => setView("messages")}>
      {({ inspection, parcelDetails }) => <>
      {(inspection || (!done && !ended)) && <div className="mt-4 space-y-3 rounded-xl bg-sand/60 p-4">
      {inspection}

      {/* Role-aware actions */}
      {!done && !ended && (
        <div className="space-y-3">
          {match.status === "requested" && <div className="rounded-xl bg-sand p-3 text-sm">
            <p className="font-semibold">{match.parcelWeightKg == null ? weightText.toAgree : `${match.parcelWeightKg} kg`}</p>
            {weightNeedsAgreement && <p className="mt-1 text-xs text-muted">{weightText.pending}</p>}
            <div className="mt-2 flex flex-wrap gap-3">
              {!isTraveler && <Link href={`/post/parcel?edit=${match.parcelId}&next=%2Fdashboard%23deliveries`} className="font-semibold text-forest underline">{weightText.edit}</Link>}
              <button type="button" disabled={busy} onClick={onChanged} className="text-forest underline">{weightText.refresh}</button>
            </div>
          </div>}
          {match.status === "requested" &&
            (canRespond ? (
              <div>
                {/* updated_at still equals the request time while nothing has
                    answered it, so it doubles as "how long they've waited". */}
                {waitingDays >= 1 && (
                  <p className="mb-2 rounded-lg bg-gold/15 px-3 py-2 text-xs font-medium text-ink">
                    {t.browse.waitingForYou(match.counterpartyName, waitingDays)}
                  </p>
                )}
                <div className="flex flex-wrap gap-2">
                <button
                  className="btn-primary min-h-[44px]"
                  disabled={busy || weightNeedsAgreement}
                  onClick={() =>
                    act(() => respondMatch(match.id, true), weightText.acceptError)
                  }
                >
                  Accept request
                </button>
                <button
                  className="btn-ghost min-h-[44px]"
                  disabled={busy}
                  onClick={() =>
                    act(() => respondMatch(match.id, false), "Could not decline — try again.")
                  }
                >
                  Decline
                </button>
                </div>
                {/* The chat below is open already — accepting is not the only
                    way to start talking, and people assume it is. */}
                <p className="mt-2 text-xs text-muted">{t.browse.askFirst}</p>
              </div>
            ) : (
              <p className="text-sm text-muted">
                {t.browse.chatWhileWaiting(match.counterpartyName)}
                {waitingDays >= 1 && <> {t.browse.waitingSent(waitingDays)}</>}
              </p>
            ))}

          {match.status === "accepted" && <>
            <p className="text-sm text-muted">{d.termsIntro}</p>
            <button className="btn-primary min-h-11" disabled={busy}
              onClick={() => act(() => advanceMatch(match.id), "Could not update — try again.")}>
              {d.confirmTerms}
            </button>
          </>}

          {match.status === "escrow_paid" && isTraveler && inspectionReady && !reportHold && (
            <button className="btn-primary min-h-11" disabled={busy}
              onClick={() => act(() => advanceMatch(match.id), "Could not update — try again.")}>
              {d.collect}
            </button>
          )}

          {inTransit && !isTraveler && <p className="text-sm text-muted">{d.withTraveller(match.counterpartyName)}</p>}

          {inTransit && isTraveler && !reportHold && (
            <button className="btn-primary min-h-11" disabled={busy}
              onClick={() => act(() => deliverNow(match.id), "Could not update — try again.")}>
              {d.delivered}
            </button>
          )}

          {match.status === "delivered" && !reportHold &&
            (isTraveler ? (
              <form onSubmit={submitCode} className="space-y-2">
                <p className="text-sm text-muted">
                  Ask the receiver for their 6-digit delivery code to complete the
                  handover.
                </p>
                <div className="flex flex-wrap gap-2">
                  <input
                    aria-label="Delivery code"
                    inputMode="numeric"
                    maxLength={6}
                    className={`field w-36 text-center font-mono text-lg tracking-[0.3em] ${
                      codeEntryError ? "field-invalid" : ""
                    }`}
                    placeholder="000000"
                    value={codeEntry}
                    onChange={(e) => setCodeEntry(e.target.value.replace(/\D/g, ""))}
                  />
                  <button type="submit" className="btn-accent min-h-[44px]" disabled={busy}>
                    <KeyRound className="h-4 w-4 shrink-0" strokeWidth={2} aria-hidden />
                    Confirm delivery
                  </button>
                </div>
                {codeEntryError && <p className="field-error">{codeEntryError}</p>}
              </form>
            ) : (
              <p className="text-sm text-muted">
                {d.withTraveller(match.counterpartyName)}
              </p>
            ))}

          {!isTraveler && !reportHold && (inTransit || match.status === "delivered") && <div>
            <p className="text-sm text-muted">{d.receivedHelp}</p>
            <button className="btn-primary mt-3 min-h-11" disabled={busy}
              onClick={() => act(() => senderConfirmDelivery(match.id), "Could not confirm — try again.")}>
              <PackageCheck className="h-4 w-4 shrink-0" aria-hidden />{d.confirmArrived}
            </button>
          </div>}

          {actionError && <p role="alert" className="field-error">{actionError}</p>}
        </div>
      )}

      </div>}

      {ended && (
        <div className="mt-3">
          <p className="text-sm text-muted">
            {match.status === "declined" &&
              (canRespond
                ? "You declined this request."
                : `${match.counterpartyName} declined this request.`)}
            {match.status === "cancelled" && "This match was cancelled."}
            {match.status === "disputed" &&
              "This delivery is disputed — support has the full record."}
          </p>
          {/* A decline is a no, not a never: slips happen, and minds change
              after a chat. One live request per pair is still enforced, so
              this can't be used to pester someone who hasn't answered. */}
          {match.status === "declined" && !canRespond && (
            <button
              className="btn-ghost mt-2 min-h-[44px]"
              disabled={busy}
              onClick={() =>
                act(async () => {
                  await requestMatch(match.tripId, match.parcelId);
                }, "Could not send the request again — try again.")
              }
            >
              {t.browse.requestAgain}
            </button>
          )}
          {actionError && (
            <p role="alert" className="field-error mt-2">{actionError}</p>
          )}
        </div>
      )}

      <DeliveryProblem matchId={match.id} handover={match.status === "escrow_paid"} onHold={setReportHold} />

      {chatVisible && <div role="tablist" aria-label={d.sections} className="mt-5 flex gap-5 border-b border-line">
        {(["messages", "details"] as const).map((tab) => <button
          key={tab} id={`${tab}-tab-${match.id}`} type="button" role="tab"
          aria-selected={activeView === tab} aria-controls={`${tab}-panel-${match.id}`}
          tabIndex={activeView === tab ? 0 : -1}
          onClick={() => setView(tab)}
          onKeyDown={(event) => {
            if (!["ArrowLeft", "ArrowRight", "Home", "End"].includes(event.key)) return;
            event.preventDefault();
            const next = event.key === "Home" ? "messages" : event.key === "End" ? "details" : tab === "messages" ? "details" : "messages";
            setView(next);
            document.getElementById(`${next}-tab-${match.id}`)?.focus();
          }}
          className={`inline-flex min-h-11 items-center gap-2 border-b-2 px-1 text-sm font-semibold focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-leaf ${activeView === tab ? "border-forest text-forest" : "border-transparent text-muted hover:text-forest"}`}
        >
          {tab === "messages" ? d.messages : d.details}
          {tab === "messages" && unread > 0 && <span className="rounded-full bg-clay px-1.5 py-0.5 text-xs text-white">{unread > 9 ? "9+" : unread}<span className="sr-only"> unread messages</span></span>}
        </button>)}
      </div>}
      {chatVisible && <div ref={chatPanelRef} id={`messages-panel-${match.id}`} role="tabpanel" aria-labelledby={`messages-tab-${match.id}`} hidden={activeView !== "messages"} tabIndex={0} className="pt-4 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-leaf">
      {waNumber && !ended && (
        <a
          href={`https://wa.me/${waNumber.replace("+", "")}`}
          target="_blank"
          rel="noopener noreferrer"
          className="mb-2 inline-flex min-h-11 items-center gap-2 text-sm font-semibold text-success underline"
        >
          <MessageSquare className="h-4 w-4 shrink-0" strokeWidth={2} aria-hidden />
          WhatsApp
        </a>
      )}

      {/* Match-scoped chat — everywhere except dead matches */}
      {chatVisible && (
        <ChatPanel
          matchId={match.id}
          myUserId={myUserId}
          counterpartyName={match.counterpartyName}
          messages={messages}
          visible={chatOpen}
          onSent={reloadMessages}
        />
      )}

      </div>}
      <div id={`details-panel-${match.id}`} role={chatVisible ? "tabpanel" : undefined} aria-labelledby={chatVisible ? `details-tab-${match.id}` : undefined} hidden={activeView !== "details"} tabIndex={0} className="space-y-4 pt-4 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-leaf">
        {parcelDetails}
          {/* Sender: the one-time delivery code */}
          {senderCodeWindow && (
            <details className="rounded-xl bg-sand p-3">
              <summary className="cursor-pointer text-sm font-medium text-forest">{d.code}</summary>
              {code ? (
                <div className="mt-2">
                  <div className="flex items-center gap-3">
                    <span className="font-mono text-2xl font-bold tracking-[0.3em] text-forest">
                      {code}
                    </span>
                    <button
                      type="button"
                      className="btn-ghost min-h-[44px] text-xs"
                      onClick={() => {
                        navigator.clipboard?.writeText(code);
                        setCodeCopied(true);
                      }}
                    >
                      <Copy className="h-4 w-4 shrink-0" strokeWidth={2} aria-hidden />
                      {codeCopied ? "Copied" : "Copy"}
                    </button>
                  </div>
                  <p className="mt-2 text-xs text-muted">
                    Share it with the <b>receiver only</b> — it&apos;s shown once and
                    releases the delivery at handover.
                  </p>
                </div>
              ) : (
                <div className="mt-2">
                  <p className="text-xs text-muted">
                    {match.hasCode
                      ? "A code exists. Generating a new one replaces it."
                      : "Generate the one-time code and share it with the receiver — the traveller needs it at handover."}
                  </p>
                  <button
                    type="button"
                    className="btn-primary mt-2 min-h-[44px] text-xs"
                    disabled={busy}
                    onClick={mintCode}
                  >
                    {match.hasCode ? "Regenerate code" : "Generate code"}
                  </button>
                </div>
              )}
            </details>
          )}

          {(cancellable || (isTraveler && match.status === "picked_up")) && <section className="border-t border-line pt-3 text-sm">
            <h3 className="font-semibold text-forest">{d.more}</h3>
            <div className="mt-1 flex flex-wrap gap-3">
              {!waNumber && cancellable && match.status !== "requested" && <a href="#whatsapp" className="inline-flex min-h-11 items-center text-forest underline">{d.addWhatsapp}</a>}
              {isTraveler && match.status === "picked_up" && <button className="btn-ghost min-h-11" disabled={busy}
                onClick={() => act(() => advanceMatch(match.id), "Could not update — try again.")}>Mark in transit</button>}
              {cancellable && <button className="btn-ghost min-h-11 text-xs" disabled={busy}
                onClick={() => act(() => cancelMatch(match.id), "Could not cancel — try again.")}>Cancel this match</button>}
            </div>
          </section>}

      {/* Journey updates: visible from pickup onward */}
      {(inTransit || (received && updates.length > 0)) && (
        <details className="mt-4 rounded-xl bg-sand p-3">
          <summary className="cursor-pointer text-sm font-medium text-forest">{d.updates}{updates.length > 0 && ` (${updates.length})`}</summary>
          {updates.length > 0 ? (
            <ul className="mt-3 space-y-3 border-l border-line pl-4">
              {updates.map((u) => (
                <li key={u.id} className="relative text-sm text-ink">
                  <span
                    aria-hidden
                    className="absolute -left-[21px] top-1.5 h-2 w-2 rounded-full bg-clay ring-2 ring-sand"
                  />
                  <div>
                    {u.note}
                    <span className="ml-2 text-xs text-faint">
                      {new Date(u.createdAt).toLocaleString(undefined, {
                        day: "numeric", month: "short", hour: "2-digit", minute: "2-digit",
                      })}
                    </span>
                  </div>
                </li>
              ))}
            </ul>
          ) : (
            <p className="mt-2 text-xs text-faint">
              {isTraveler
                ? "No updates yet — post the first one so the sender and receiver can follow along."
                : "No updates yet — the traveller posts them as the journey progresses."}
            </p>
          )}

          {inTransit && isTraveler && !reportHold && (
            <form onSubmit={postUpdate} className="mt-3 flex gap-2">
              <input
                aria-label="Journey update"
                aria-invalid={noteError ? true : undefined}
                className={`field flex-1 ${noteError ? "field-invalid" : ""}`}
                placeholder="e.g. Landed in Lagos, heading to Ikeja pickup point"
                value={note}
                onChange={(e) => setNote(e.target.value)}
                maxLength={200}
              />
              <button type="submit" className="btn-primary min-h-[44px] shrink-0">
                <Send className="h-4 w-4 shrink-0" strokeWidth={2} aria-hidden />
                Post
              </button>
            </form>
          )}
          {noteError && <p className="field-error">{noteError}</p>}
        </details>
      )}
      </div>
      </>}
      </MatchSafety>

      </>
      )}
    </div>
  );
}
