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

export function readChatMarker(matchId: string): string {
  try { return localStorage.getItem(`kifurushi.chatread.${matchId}`) ?? ""; } catch { return ""; }
}

export function writeChatMarker(matchId: string, iso: string) {
  try { localStorage.setItem(`kifurushi.chatread.${matchId}`, iso); } catch { /* Private browsing: keep the in-memory marker. */ }
}
