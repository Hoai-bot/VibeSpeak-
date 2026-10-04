// src/services/drills/station1Service.ts
import { LINKING_SOUNDS_DATA, LinkingSoundItem } from '../../data/station1/linkingSounds';
import { MINIMAL_PAIRS_DATA, MinimalPairItem } from '../../data/station1/minimalPairs';
import { TONGUE_TWISTERS_DATA, TongueTwisterItem } from '../../data/station1/tongueTwisters';

export type DrillType = 'minimal_pairs' | 'linking_sounds' | 'tongue_twisters';

// Bộ nhớ đệm lưu ID các bài tập vừa xuất hiện để chống lặp
const recentUsedIds: Record<DrillType, string[]> = {
  minimal_pairs: [],
  linking_sounds: [],
  tongue_twisters: [],
};

const MAX_RECENT_HISTORY = 15; // Không lặp lại 15 bài gần nhất

/**
 * Thuật toán xáo trộn mảng ngẫu nhiên (Fisher-Yates Shuffle)
 */
function shuffleArray<T>(array: T[]): T[] {
  const shuffled = [...array];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}

/**
 * Lấy ngẫu nhiên một bài tập từ Local Data Pool mà không bị lặp câu vừa học
 */
export const getRandomStation1Drill = (type: DrillType) => {
  let pool: any[] = [];

  if (type === 'minimal_pairs') pool = MINIMAL_PAIRS_DATA;
  else if (type === 'linking_sounds') pool = LINKING_SOUNDS_DATA;
  else if (type === 'tongue_twisters') pool = TONGUE_TWISTERS_DATA;

  if (!pool || pool.length === 0) return null;

  // Lọc bỏ những ID bài tập đã làm gần đây
  const history = recentUsedIds[type];
  let availablePool = pool.filter((item) => !history.includes(item.id));

  // Nếu đã dùng hết danh sách, reset lại lịch sử
  if (availablePool.length === 0) {
    recentUsedIds[type] = [];
    availablePool = pool;
  }

  // Xáo trộn mảng và lấy ngẫu nhiên 1 phần tử
  const shuffled = shuffleArray(availablePool);
  const selectedItem = shuffled[0];

  // Lưu lại ID vào lịch sử gần đây
  recentUsedIds[type].push(selectedItem.id);
  if (recentUsedIds[type].length > MAX_RECENT_HISTORY) {
    recentUsedIds[type].shift();
  }

  return {
    ...selectedItem,
    // Ép id kèm ngẫu nhiên hash để React luôn re-render bài học mới
    sessionKey: `${selectedItem.id}_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
  };
};