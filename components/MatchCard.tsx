"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import {
  ChevronDown, Copy, KeyRound, MessageSquare, Plane, Send, Star,
} from "lucide-react";
import {
  STATUS_LABELS, STATUS_ORDER, TransitUpdate, Review, MatchStatus, Message,
} from "@/lib/types";
import {
  MatchDetail, respondMatch, advanceMatch, cancelMatch,
  generateDeliveryCode, confirmDelivery,
  fetchTransitUpdates, addTransitUpdate, fetchMatchReviews, addReview,
  fetchMessages, sendMessage,
} from "@/lib/db";
import { transitUpdateSchema, reviewSchema, messageSchema } from "@/lib/validation";
import { useT } from "@/lib/i18n";
import Stars from "@/components/ui/Stars";

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
  unread,
  open,
  setOpen,
  onSent,
}: {
  matchId: string;
  myUserId: string;
  counterpartyName: string;
  messages: Message[];
  unread: number;
  open: boolean;
  setOpen: (v: boolean) => void;
  onSent: () => void;
}) {
  const [draft, setDraft] = useState("");
  const [error, setError] = useState("");
  const [sending, setSending] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = scrollRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [messages.length, open]);

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
    <div className="mt-5 rounded-xl bg-sand p-4">
      <button
        type="button"
        onClick={() => setOpen(!open)}
        aria-expanded={open}
        className="flex w-full items-center gap-2 rounded text-xs font-semibold uppercase tracking-[0.18em] text-forest focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-leaf"
      >
        <span className="relative shrink-0">
          <MessageSquare className="h-4 w-4" strokeWidth={2} aria-hidden />
          {unread > 0 && (
            <span
              aria-hidden
              className="absolute -right-1 -top-1 h-2 w-2 rounded-full bg-clay ring-2 ring-sand"
            />
          )}
        </span>
        Messages
        {unread > 0 && (
          <span className="ml-1 inline-flex min-w-[20px] items-center justify-center rounded-full bg-clay px-1.5 py-0.5 text-[11px] font-bold normal-case tracking-normal text-white">
            {unread > 9 ? "9+" : unread}
            <span className="sr-only"> unread messages</span>
          </span>
        )}
        <ChevronDown
          className={`ml-auto h-4 w-4 shrink-0 transition-transform ${open ? "rotate-180" : ""}`}
          strokeWidth={2}
          aria-hidden
        />
      </button>

      {open && (
        <>
          <div
            ref={scrollRef}
            className="mt-3 max-h-64 space-y-2 overflow-y-auto pr-1"
            aria-live="polite"
          >
            {messages.length === 0 ? (
              <p className="text-xs text-faint">
                No messages yet — agree the handover details with{" "}
                {counterpartyName} here.
              </p>
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
                      <p className="whitespace-pre-wrap break-words">{m.body}</p>
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
              className={`field flex-1 ${error ? "field-invalid" : ""}`}
              placeholder={`Message ${counterpartyName}…`}
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
              Send
            </button>
          </form>
          {error && <p className="field-error">{error}</p>}
        </>
      )}
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
  const t = useT();
  const [chatOpen, setChatOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [lastRead, setLastRead] = useState<string>(() => readMarker(match.id));
  const [updates, setUpdates] = useState<TransitUpdate[]>([]);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [note, setNote] = useState("");
  const [noteError, setNoteError] = useState("");
  const [rating, setRating] = useState(0);
  const [hover, setHover] = useState(0);
  const [comment, setComment] = useState("");
  const [reviewError, setReviewError] = useState("");
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
  const idx = STATUS_ORDER.indexOf(match.status);
  const inTransit = match.status === "picked_up" || match.status === "in_transit";
  const received = match.status === "delivered" || done;
  const cancellable = ["requested", "accepted", "escrow_paid"].includes(match.status);
  const senderCodeWindow =
    !isTraveler &&
    ["accepted", "escrow_paid", "picked_up", "in_transit", "delivered"].includes(
      match.status
    );

  const title = isTraveler
    ? `${match.route} — carrying for ${match.counterpartyName}`
    : `${match.route} — with ${match.counterpartyName}`;

  useEffect(() => {
    if (inTransit || received) {
      fetchTransitUpdates(match.id).then(setUpdates).catch(() => {});
    }
    if (done) {
      fetchMatchReviews(match.id).then(setReviews).catch(() => {});
    }
  }, [match.id, match.status, inTransit, received, done]);

  // Messages live at card level so the unread badge works even when the card
  // (or the chat panel inside it) is collapsed. Fast poll only while reading.
  const reloadMessages = useCallback(() => {
    fetchMessages(match.id).then(setMessages).catch(() => {});
  }, [match.id]);

  const chatVisible = match.status !== "declined" && match.status !== "cancelled";

  useEffect(() => {
    if (!chatVisible) return;
    reloadMessages();
    const reading = open && chatOpen;
    const t = setInterval(
      reloadMessages,
      reading ? CHAT_POLL_MS : CHAT_IDLE_POLL_MS
    );
    return () => clearInterval(t);
  }, [chatVisible, open, chatOpen, reloadMessages]);

  const unread = messages.filter(
    (m) => m.senderId !== myUserId && m.createdAt > lastRead
  ).length;

  // Having the conversation on screen clears the badge.
  useEffect(() => {
    if (!open || !chatOpen || messages.length === 0) return;
    const newest = messages[messages.length - 1].createdAt;
    if (newest > lastRead) {
      setLastRead(newest);
      writeMarker(match.id, newest);
    }
  }, [open, chatOpen, messages, lastRead, match.id]);

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

  async function submitReview(e: React.FormEvent) {
    e.preventDefault();
    const parsed = reviewSchema.safeParse({ rating, comment });
    if (!parsed.success) {
      setReviewError(parsed.error.issues[0]?.message ?? "Invalid review");
      return;
    }
    if (!match.counterpartyId) {
      setReviewError("Could not identify your match partner.");
      return;
    }
    try {
      await addReview(match.id, match.counterpartyId, parsed.data.rating, parsed.data.comment);
      setReviews(await fetchMatchReviews(match.id));
      setReviewError("");
    } catch {
      setReviewError("Could not submit the review — please try again.");
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

  const myReview = reviews.find((r) => r.authorId === myUserId);
  const theirReview = reviews.find((r) => r.authorId !== myUserId);

  return (
    <div className="card p-5">
      <button
        type="button"
        onClick={() => setOpen(!open)}
        aria-expanded={open}
        className="flex w-full flex-wrap items-center justify-between gap-2 rounded-lg text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-leaf"
      >
        <div className="font-semibold text-base">{title}</div>
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
            {STATUS_LABELS[match.status]}
          </span>
          <ChevronDown
            className={`h-4 w-4 shrink-0 text-muted transition-transform ${open ? "rotate-180" : ""}`}
            strokeWidth={2}
            aria-hidden
          />
        </span>
      </button>

      {open && (
      <>

      {/* Progress bar — happy path only */}
      {idx >= 0 && (
        <>
          <div className="mt-4 flex items-center gap-1">
            {STATUS_ORDER.map((s, i) => (
              <div key={s} className="flex-1">
                <div className={`h-1.5 rounded-full ${i <= idx ? "bg-forest" : "bg-sand-deep"}`} />
                <div
                  className={`mt-1.5 hidden text-[10px] uppercase tracking-wide sm:block ${
                    i <= idx ? "font-semibold text-forest" : "text-faint"
                  }`}
                >
                  {STATUS_LABELS[s]}
                </div>
              </div>
            ))}
          </div>
          <p className="mt-2 text-xs text-muted sm:hidden">
            {STATUS_LABELS[match.status]}
          </p>
        </>
      )}

      {/* Role-aware actions */}
      {!done && !ended && (
        <div className="mt-4 space-y-3">
          {match.status === "requested" &&
            (canRespond ? (
              <div>
                <div className="flex flex-wrap gap-2">
                <button
                  className="btn-primary min-h-[44px]"
                  disabled={busy}
                  onClick={() =>
                    act(() => respondMatch(match.id, true), "Could not accept — try again.")
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
              </p>
            ))}

          {match.status === "accepted" && (
            <>
              <p className="text-sm text-muted">
                Agree the carriage fee and handover details with{" "}
                {match.counterpartyName} — then confirm below. Payment is between
                the two of you; Kifurushi never takes a cut.
              </p>
              <button
                className="btn-primary min-h-[44px]"
                disabled={busy}
                onClick={() =>
                  act(() => advanceMatch(match.id), "Could not update — try again.")
                }
              >
                Terms agreed
              </button>
            </>
          )}

          {match.status === "escrow_paid" &&
            (isTraveler ? (
              <>
                <p className="text-sm text-muted">
                  Inspect the parcel together, seal it, photograph it — then mark
                  it picked up.
                </p>
                <button
                  className="btn-primary min-h-[44px]"
                  disabled={busy}
                  onClick={() =>
                    act(() => advanceMatch(match.id), "Could not update — try again.")
                  }
                >
                  Mark sealed &amp; picked up
                </button>
              </>
            ) : (
              <p className="text-sm text-muted">
                Waiting for {match.counterpartyName} to collect and seal the parcel.
              </p>
            ))}

          {match.status === "picked_up" && isTraveler && (
            <button
              className="btn-primary min-h-[44px]"
              disabled={busy}
              onClick={() =>
                act(() => advanceMatch(match.id), "Could not update — try again.")
              }
            >
              Mark in transit
            </button>
          )}

          {match.status === "in_transit" && isTraveler && (
            <button
              className="btn-primary min-h-[44px]"
              disabled={busy}
              onClick={() =>
                act(() => advanceMatch(match.id), "Could not update — try again.")
              }
            >
              Mark delivered
            </button>
          )}

          {match.status === "delivered" &&
            (isTraveler ? (
              <form onSubmit={submitCode} className="space-y-2">
                <p className="text-sm text-muted">
                  Ask the receiver for their 6-digit delivery code to complete the
                  handover.
                </p>
                <div className="flex gap-2">
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
                {match.counterpartyName} has marked the parcel delivered. The
                receiver confirms the handover with the delivery code below.
              </p>
            ))}

          {/* Sender: the one-time delivery code */}
          {senderCodeWindow && (
            <div className="rounded-xl bg-sand p-4">
              <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.18em] text-forest">
                <KeyRound className="h-4 w-4 shrink-0" strokeWidth={2} aria-hidden />
                Delivery code
              </div>
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
            </div>
          )}

          {cancellable && (
            <button
              className="btn-ghost min-h-[44px] text-xs"
              disabled={busy}
              onClick={() =>
                act(() => cancelMatch(match.id), "Could not cancel — try again.")
              }
            >
              Cancel this match
            </button>
          )}

          {actionError && <p role="alert" className="field-error">{actionError}</p>}
        </div>
      )}

      {ended && (
        <p className="mt-3 text-sm text-muted">
          {match.status === "declined" &&
            (isTraveler
              ? "You declined this request."
              : `${match.counterpartyName} declined this request.`)}
          {match.status === "cancelled" && "This match was cancelled."}
          {match.status === "disputed" &&
            "This delivery is disputed — support has the full record."}
        </p>
      )}

      {/* Match-scoped chat — everywhere except dead matches */}
      {chatVisible && (
        <ChatPanel
          matchId={match.id}
          myUserId={myUserId}
          counterpartyName={match.counterpartyName}
          messages={messages}
          unread={unread}
          open={chatOpen}
          setOpen={setChatOpen}
          onSent={reloadMessages}
        />
      )}

      {/* Journey updates: visible from pickup onward */}
      {(inTransit || (received && updates.length > 0)) && (
        <div className="mt-5 rounded-xl bg-sand p-4">
          <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.18em] text-forest">
            <Plane className="h-4 w-4 shrink-0 text-forest" strokeWidth={2} aria-hidden />
            Journey updates
          </div>
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

          {inTransit && isTraveler && (
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
        </div>
      )}

      {/* Reviews: two-way, once the code has released the delivery */}
      {done && (
        <div className="mt-5 rounded-xl bg-sand p-4">
          <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.18em] text-forest">
            <Star className="h-4 w-4 shrink-0 fill-gold text-gold" strokeWidth={2} aria-hidden />
            Rate this delivery
          </div>

          {theirReview && (
            <div className="mt-3">
              <Stars rating={theirReview.rating} />
              {theirReview.comment && (
                <blockquote className="mt-2 border-l-2 border-line-strong pl-3 text-sm text-ink">
                  “{theirReview.comment}”
                </blockquote>
              )}
              <p className="mt-2 text-xs text-faint">
                By {theirReview.authorName} · reviews are public and can&apos;t be edited.
              </p>
            </div>
          )}

          {myReview ? (
            <div className="mt-3">
              <Stars rating={myReview.rating} />
              {myReview.comment && (
                <blockquote className="mt-2 border-l-2 border-line-strong pl-3 text-sm text-ink">
                  “{myReview.comment}”
                </blockquote>
              )}
              <p className="mt-2 text-xs text-faint">
                Your review · public and can&apos;t be edited.
              </p>
            </div>
          ) : (
            <form onSubmit={submitReview} className="mt-3 space-y-3">
              <div role="group" aria-label="Rating" className="flex gap-1">
                {[1, 2, 3, 4, 5].map((n) => (
                  <button
                    key={n}
                    type="button"
                    aria-label={`${n} star${n > 1 ? "s" : ""}`}
                    aria-pressed={rating >= n}
                    onClick={() => setRating(n)}
                    onMouseEnter={() => setHover(n)}
                    onMouseLeave={() => setHover(0)}
                    className="grid h-10 w-10 place-items-center rounded-lg transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-leaf"
                  >
                    <Star
                      className={`h-7 w-7 ${
                        n <= (hover || rating) ? "fill-gold text-gold-deep" : "text-line-strong"
                      }`}
                      strokeWidth={2}
                      aria-hidden
                    />
                  </button>
                ))}
              </div>
              <textarea
                aria-label="Review comment"
                aria-invalid={reviewError ? true : undefined}
                className={`field min-h-[70px] ${reviewError ? "field-invalid" : ""}`}
                placeholder="How was the delivery? Your review is public and helps the next sender."
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                maxLength={300}
              />
              {reviewError && <p className="field-error">{reviewError}</p>}
              <button type="submit" className="btn-accent min-h-[44px]">Submit review</button>
            </form>
          )}
        </div>
      )}
      </>
      )}
    </div>
  );
}
