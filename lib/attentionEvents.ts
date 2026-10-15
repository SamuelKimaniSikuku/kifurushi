export const ATTENTION_CHANGED = "kifurushi:attention-changed";

export function notifyAttentionChanged() {
  if (typeof window !== "undefined") window.dispatchEvent(new Event(ATTENTION_CHANGED));
}
