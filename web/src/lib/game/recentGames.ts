const STORAGE_KEY = "trader-titan-recent-games-v1";
const MAX_ENTRIES = 5;

export interface RecentGameEntry {
  completedAt: string; // ISO timestamp
  standings: { name: string; pnl: number }[]; // sorted, winner first
}

export function loadRecentGames(): RecentGameEntry[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as RecentGameEntry[]) : [];
  } catch {
    return [];
  }
}

export function saveRecentGame(entry: RecentGameEntry) {
  if (typeof window === "undefined") return;
  const existing = loadRecentGames();
  const updated = [entry, ...existing].slice(0, MAX_ENTRIES);
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
}
