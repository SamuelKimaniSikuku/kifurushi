import type { MatchDetail } from "./db";
import type { Message } from "./types";

export type InboxFilter = "active" | "unread" | "history";
export type ConversationSummary = { lastMessage?: Message; unread: number };

export function isHistory(match: MatchDetail): boolean {
  return ["released", "cancelled", "declined"].includes(match.status) ||
    (match.status === "requested" && ["booked_elsewhere", "unavailable"].includes(match.requestAvailability ?? ""));
}

export function summarizeConversation(messages: Message[], myUserId: string, readAt: string): ConversationSummary {
  return { lastMessage: messages[messages.length - 1], unread: messages.filter(m => m.senderId !== myUserId && m.createdAt > readAt).length };
}

export function inboxMatches(matches: MatchDetail[], summaries: Record<string, ConversationSummary>, filter: InboxFilter, query: string): MatchDetail[] {
  const search = query.trim().toLocaleLowerCase();
  return matches.filter(m => {
    if (filter === "unread" ? !summaries[m.id]?.unread : filter === "history" ? !isHistory(m) : isHistory(m)) return false;
    return !search || `${m.counterpartyName} ${m.route}`.toLocaleLowerCase().includes(search);
  }).sort((a, b) => {
    const latest = (m: MatchDetail) => Math.max(Date.parse(m.updatedAt) || 0, Date.parse(summaries[m.id]?.lastMessage?.createdAt ?? "") || 0);
    return latest(b) - latest(a) || a.id.localeCompare(b.id);
  });
}

export const CHAT_READ_CHANGED = "kifurushi:chat-read-changed";
export const CHAT_READ_PREFIX = "kifurushi.chatread.";
const memoryReadMarkers = new Map<string, string>();

export function readChatMarker(matchId: string): string {
  let saved = "";
  try { saved = localStorage.getItem(`${CHAT_READ_PREFIX}${matchId}`) ?? ""; } catch { /* Storage can be unavailable. */ }
  const marker = memoryReadMarkers.get(matchId) ?? "";
  return saved > marker ? saved : marker;
}

export function writeChatMarker(matchId: string, iso: string) {
  // A slow response or another tab must never move the read position backwards.
  if (!iso || iso <= readChatMarker(matchId)) return;
  memoryReadMarkers.set(matchId, iso);
  try { localStorage.setItem(`${CHAT_READ_PREFIX}${matchId}`, iso); } catch { /* Keep the shared in-memory marker. */ }
  if (typeof window !== "undefined") window.dispatchEvent(new Event(CHAT_READ_CHANGED));
}
