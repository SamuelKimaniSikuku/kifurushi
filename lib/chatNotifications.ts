import { supabase } from "./supabase";
import { readChatMarker } from "./inbox";

export type IncomingChatActivity = Record<string, string>;

/** Only incoming-message timestamps are needed; RLS limits rows to match parties. */
export async function fetchIncomingChatActivity(userId: string): Promise<IncomingChatActivity> {
  const { data, error: authError } = await supabase.auth.getSession();
  if (authError) throw authError;
  if (data.session?.user.id !== userId) return {};
  const latest: IncomingChatActivity = {};
  const pageSize = 500;
  for (let offset = 0; ; offset += pageSize) {
    const { data: rows, error } = await supabase.from("messages")
      .select("match_id, created_at")
      .neq("sender_id", userId)
      .order("created_at", { ascending: false })
      .order("id", { ascending: false })
      .range(offset, offset + pageSize - 1);
    if (error) throw error;
    for (const row of rows ?? []) {
      if (!latest[row.match_id] || row.created_at > latest[row.match_id]) latest[row.match_id] = row.created_at;
    }
    if (!rows || rows.length < pageSize) break;
  }
  return latest;
}

/** Count conversations, matching the inbox's Unread filter, not pending deliveries. */
export function countUnreadChats(activity: IncomingChatActivity): number {
  return Object.entries(activity).filter(([id, timestamp]) => timestamp > readChatMarker(id)).length;
}
