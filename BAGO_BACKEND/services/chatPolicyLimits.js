// Users get this many warnings in a conversation; the next violation locks the chat.
export const DEFAULT_WARNINGS_BEFORE_LOCK = 3;
export const MIN_WARNINGS_BEFORE_LOCK = 2;
export const MAX_WARNINGS_BEFORE_LOCK = 10;

export function clampWarningLimit(value) {
  const n = Number.isFinite(Number(value)) ? Math.trunc(Number(value)) : DEFAULT_WARNINGS_BEFORE_LOCK;
  return Math.max(MIN_WARNINGS_BEFORE_LOCK, Math.min(MAX_WARNINGS_BEFORE_LOCK, n || DEFAULT_WARNINGS_BEFORE_LOCK));
}
