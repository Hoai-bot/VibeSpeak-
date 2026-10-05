// src/services/weakPointsService.ts

export interface WeakPointItem {
  id: string;
  stationId: string;
  promptText: string;
  lastScore: number;
  timestamp: number;
}

const STORAGE_KEY = 'vibespeak_weak_points';

export function saveWeakPoint(stationId: string, promptText: string, score: number) {
  if (score >= 60 || !promptText) return;

  const existing = getWeakPoints();
  const newItem: WeakPointItem = {
    id: `weak_${Date.now()}`,
    stationId,
    promptText,
    lastScore: score,
    timestamp: Date.now()
  };

  const filtered = existing.filter(item => item.promptText !== promptText);
  filtered.unshift(newItem);

  if (typeof localStorage !== 'undefined') {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(filtered.slice(0, 20)));
  }
}

export function getWeakPoints(): WeakPointItem[] {
  if (typeof localStorage !== 'undefined') {
    const data = localStorage.getItem(STORAGE_KEY);
    return data ? JSON.parse(data) : [];
  }
  return [];
}