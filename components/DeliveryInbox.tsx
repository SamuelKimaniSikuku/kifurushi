"use client";

import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";
import { MessageSquare, Search } from "lucide-react";
import { fetchMessages, type MatchDetail } from "@/lib/db";
import { useLang } from "@/lib/i18n";
import { inboxCopy } from "@/lib/locales/inbox";
import { deliveryCopy } from "@/lib/locales/delivery";
import { requestWeightCopy } from "@/lib/locales/requestWeight";
import { receiptCopy } from "@/lib/locales/receipt";
import { CHAT_READ_CHANGED, CHAT_READ_PREFIX, inboxMatches, isHistory, readChatMarker, summarizeConversation, type ConversationSummary, type InboxFilter } from "@/lib/inbox";
import MatchCard from "./MatchCard";

export default function DeliveryInbox({ matches, myUserId, active, onChanged }: {
  matches: MatchDetail[]; myUserId: string; active: boolean; onChanged: () => void;
}) {
  const { lang } = useLang();
  const s = inboxCopy[lang], d = deliveryCopy[lang], w = requestWeightCopy[lang];
  const [filter, setFilter] = useState<InboxFilter>("active");
  const [query, setQuery] = useState("");
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [summaries, setSummaries] = useState<Record<string, ConversationSummary>>({});
  const [failed, setFailed] = useState(false);
  const [attempt, setAttempt] = useState(0);
  // Drafts live only in this signed-in dashboard, and survive switching chats.
  const drafts = useRef(new Map<string, string>());
  const matchKey = matches.map(m => m.id).sort().join(",");

  useEffect(() => {
    if (!active || !mobileOpen || !selectedId) return;
    const frame = requestAnimationFrame(() => document.getElementById(`conversation-heading-${selectedId}`)?.focus({ preventScroll: true }));
    return () => cancelAnimationFrame(frame);
  }, [active, mobileOpen, selectedId]);

  useEffect(() => {
    const sync = () => {
      const hash = window.location.hash.slice(1);
      if (hash.startsWith("messages-")) {
        const id = hash.slice("messages-".length);
        const match = matches.find(m => m.id === id);
        if (match) {
          setSelectedId(id); setMobileOpen(true); setQuery("");
          setFilter(isHistory(match) ? "history" : "active");
        }
      } else if (hash === "unread") {
        setFilter("unread"); setSelectedId(null); setMobileOpen(false); setQuery("");
      } else if (hash === "deliveries") setMobileOpen(false);
    };
    sync(); window.addEventListener("hashchange", sync);
    return () => window.removeEventListener("hashchange", sync);
  }, [matches]);

  useEffect(() => {
    if (!active || !matchKey) return;
    let live = true, running = false;
    const load = async () => {
      if (running || document.visibilityState !== "visible") return;
      running = true;
      const ids = matchKey.split(",");
      const results = await Promise.allSettled(ids.map(id => fetchMessages(id)));
      if (live) {
        setFailed(results.some(result => result.status === "rejected"));
        setSummaries(current => {
          const next = { ...current };
          results.forEach((result, i) => {
            const id = ids[i];
            if (result.status !== "fulfilled") return;
            const summary = summarizeConversation(result.value, myUserId, readChatMarker(id));
            // A slower background response must not replace a newer chat update.
            if ((summary.lastMessage?.createdAt ?? "") < (current[id]?.lastMessage?.createdAt ?? "")) return;
            next[id] = summary;
          });
          return next;
        });
      }
      running = false;
    };
    void load();
    const timer = setInterval(() => void load(), 30000);
    const onFocus = () => void load();
    const onStorage = (event: StorageEvent) => { if (!event.key || event.key.startsWith(CHAT_READ_PREFIX)) void load(); };
    document.addEventListener("visibilitychange", onFocus);
    window.addEventListener(CHAT_READ_CHANGED, onFocus);
    window.addEventListener("storage", onStorage);
    return () => {
      live = false; clearInterval(timer);
      document.removeEventListener("visibilitychange", onFocus);
      window.removeEventListener(CHAT_READ_CHANGED, onFocus);
      window.removeEventListener("storage", onStorage);
    };
  }, [active, matchKey, myUserId, attempt]);

  const updateSummary = useCallback((id: string, summary: ConversationSummary) => {
    setSummaries(current => ({ ...current, [id]: summary }));
  }, []);
  const visibleMatches = inboxMatches(matches, summaries, filter, query);
  // Keep the selected thread open when reading it removes it from Unread.
  const selected = matches.find(m => m.id === selectedId);
  const unreadCount = matches.filter(m => summaries[m.id]?.unread > 0).length;
  const choose = (match: MatchDetail) => {
    setSelectedId(match.id); setMobileOpen(true);
    window.history.replaceState(null, "", `#messages-${match.id}`);
  };
  const changeFilter = (next: InboxFilter) => {
    setFilter(next); setSelectedId(null); setMobileOpen(false);
    window.history.replaceState(null, "", next === "unread" ? "#unread" : "#deliveries");
  };

  return <div className={`delivery-inbox card ${mobileOpen ? "inbox-mobile-open" : ""}`}>
    <aside className="inbox-list" aria-label={s.title}>
      <div className="shrink-0 border-b border-line p-4">
        <h2 className="text-lg font-bold text-forest">{s.title}</h2>
        <label className="relative mt-3 block">
          <Search size={16} className="pointer-events-none absolute left-3 top-3.5 text-muted" aria-hidden />
          <input type="search" className="field pl-9 text-sm" aria-label={s.search} placeholder={s.search} value={query}
            onChange={event => { setQuery(event.target.value); setSelectedId(null); }} />
        </label>
        <div className="mt-3 flex gap-1" aria-label={s.title}>
          {(["active", "unread", "history"] as const).map(item => <button key={item} type="button" aria-pressed={filter === item}
            onClick={() => changeFilter(item)} className={`min-h-11 flex-1 rounded-lg px-2 text-xs font-semibold ${filter === item ? "bg-forest text-white" : "text-muted hover:bg-sand"}`}>
            {s[item]}{item === "unread" && unreadCount > 0 ? ` (${unreadCount})` : ""}
          </button>)}
        </div>
      </div>
      {failed && <p role="status" className="px-4 py-2 text-xs text-danger">{s.failed} <button className="underline" onClick={() => setAttempt(n => n + 1)}>{s.retry}</button></p>}
      <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain">
        {visibleMatches.map(match => {
          const summary = summaries[match.id], last = summary?.lastMessage;
          const status = match.receiptOutcome ? receiptCopy[lang][match.receiptOutcome] : match.status === "requested" && match.requestAvailability === "booked_elsewhere" ? w.bookedElsewhere : match.status === "requested" && match.requestAvailability === "unavailable" ? w.unavailable : d.status[match.status];
          return <button key={match.id} id={`conversation-link-${match.id}`} type="button" onClick={() => choose(match)}
            aria-current={selected?.id === match.id ? "true" : undefined}
            className={`inbox-row w-full border-b border-line/60 p-4 text-left ${selected?.id === match.id ? "bg-success-bg" : "hover:bg-sand/70"}`}>
            <span className="flex items-start gap-3">
              <span aria-hidden className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-sand-deep text-sm font-bold text-forest">
                {match.counterpartyName.split(/\s+/).slice(0, 2).map(n => n[0]).join("")}
              </span>
              <span className="min-w-0 flex-1">
                <span className="flex items-start justify-between gap-2">
                  <span className="truncate text-sm font-semibold text-ink">{match.counterpartyName}</span>
                  <span className="shrink-0 text-[10px] text-muted">{new Date(last?.createdAt ?? match.updatedAt).toLocaleDateString(lang, { day: "numeric", month: "short" })}</span>
                </span>
                <span className="block truncate text-xs text-muted">{match.route}</span>
                <span className="mt-1 flex items-center gap-2">
                  <span className={`block flex-1 truncate text-xs ${summary?.unread ? "font-semibold text-ink" : "text-muted"}`}>{last ? `${last.senderId === myUserId ? `${s.you}: ` : ""}${last.body}` : summary ? s.newChat : s.loading}</span>
                  {!!summary?.unread && <span className="rounded-full bg-clay-deep px-1.5 text-[11px] font-bold text-white">{summary.unread > 99 ? "99+" : summary.unread}<span className="sr-only"> {s.unreadMessages}</span></span>}
                </span>
                <span className="mt-2 inline-block max-w-full truncate rounded bg-white/80 px-1.5 py-0.5 text-[10px] font-medium text-muted">{status}</span>
              </span>
            </span>
          </button>;
        })}
        {visibleMatches.length === 0 && <div className="px-5 py-10 text-center text-sm text-muted">
          <MessageSquare size={25} className="mx-auto mb-3 text-leaf" aria-hidden />
          <p>{query ? s.noResults : filter === "unread" ? s.noUnread : s.empty}</p>
          {query ? <button className="mt-3 min-h-11 text-forest underline" onClick={() => setQuery("")}>{s.clear}</button> : matches.length === 0 && <Link href="/trips" className="btn-ghost mt-4">{s.start}</Link>}
        </div>}
      </div>
    </aside>
    <div className="inbox-main">
      {selected ? <MatchCard key={selected.id} match={selected} myUserId={myUserId} onChanged={onChanged}
        conversation draftStore={drafts.current} onSummary={updateSummary}
        onBack={() => {
          setMobileOpen(false); window.history.replaceState(null, "", "#deliveries");
          requestAnimationFrame(() => document.getElementById(`conversation-link-${selected.id}`)?.focus({ preventScroll: true }));
        }} /> :
        <div className="flex h-full flex-col items-center justify-center gap-3 p-8 text-center text-muted"><MessageSquare size={32} aria-hidden /><p className="text-sm">{s.choose}</p></div>}
    </div>
  </div>;
}
