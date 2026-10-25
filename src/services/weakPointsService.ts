// src/services/weakPointsService.ts
export interface WeakItem {
  id: string;
  word: string;
  phonemeHint?: string;
  mistakeCount: number;
  stage: number; // 0: Mới thêm, 1: Sau 1 ngày, 2: Sau 3 ngày, 3: Sau 7 ngày, 4: Thành thạo (xóa khỏi blacklist)
  lastReviewDate: string; // YYYY-MM-DD
  nextReviewDate: string; // YYYY-MM-DD
  targetSentence?: string;
}

const WEAK_VAULT_KEY = 'vibespeak_personal_weak_vault';

const getTodayString = (): string => {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
};

const addDays = (dateStr: string, days: number): string => {
  const d = new Date(dateStr);
  d.setDate(d.getDate() + days);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
};

// 🎯 1. TỰ ĐỘNG THU THẬP TỪ YẾU/CẶP ÂM KHI AI PHÁT HIỆN SAI HOẶC NGẬP NGỪNG
export const harvestWeakWords = (
  spokenWords: { word: string; isConfident: boolean }[], 
  contextSentence?: string
) => {
  try {
    const raw = localStorage.getItem(WEAK_VAULT_KEY);
    let vault: WeakItem[] = raw ? JSON.parse(raw) : [];
    const today = getTodayString();

    const failedWords = spokenWords.filter(w => !w.isConfident && w.word.trim().length > 1);

    failedWords.forEach(({ word }) => {
      const clean = word.toLowerCase().replace(/[^a-z]/g, '');
      if (!clean) return;

      const existingIndex = vault.findIndex(item => item.word.toLowerCase() === clean);

      // Dự đoán âm khó hay gặp ở người Việt
      let phoneme = 'Ngữ điệu / Trọng âm';
      if (clean.includes('sh') || clean.includes('ch')) phoneme = '/ʃ/ vs /tʃ/';
      else if (clean.includes('th')) phoneme = '/θ/ vs /ð/';
      else if (clean.endsWith('s') || clean.endsWith('ed')) phoneme = 'Âm đuôi (Ending sound)';

      if (existingIndex !== -1) {
        vault[existingIndex].mistakeCount += 1;
        // Bị sai lại -> Đưa về mốc ôn 1 ngày tiếp theo
        vault[existingIndex].nextReviewDate = addDays(today, 1);
      } else {
        vault.push({
          id: `weak_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
          word: clean,
          phonemeHint: phoneme,
          mistakeCount: 1,
          stage: 1,
          lastReviewDate: today,
          nextReviewDate: addDays(today, 1), // Ôn lại sau 1 ngày
          targetSentence: contextSentence || `Please practice saying the word "${clean}" clearly.`
        });
      }
    });

    localStorage.setItem(WEAK_VAULT_KEY, JSON.stringify(vault));
  } catch (e) {
    console.warn("Không thể lưu weak points:", e);
  }
};

// 🎯 2. LẤY DANH SÁCH "TOP CẦN PHỤC THÙ" & CÁC TỪ ĐẾN HẠN ÔN HÔM NAY (SPACED REPETITION)
export const getWeakVaultSummary = () => {
  try {
    const raw = localStorage.getItem(WEAK_VAULT_KEY);
    const vault: WeakItem[] = raw ? JSON.parse(raw) : [];
    const today = getTodayString();

    // Top 5 lỗi sai nhiều nhất
    const topRevenge = [...vault]
      .sort((a, b) => b.mistakeCount - a.mistakeCount)
      .slice(0, 5);

    // Các từ đến hạn ôn tập (nextReviewDate <= hôm nay)
    const dueForReview = vault.filter(item => item.nextReviewDate <= today);

    return {
      all: vault,
      topRevenge,
      dueForReview,
      totalWeak: vault.length,
    };
  } catch (e) {
    return { all: [], topRevenge: [], dueForReview: [], totalWeak: 0 };
  }
};

// 🎯 3. XỬ LÝ KẾT QUẢ MINI-TEST (THĂNG HẠNG HOẶC XÓA KHỎI BLACKLIST)
export const resolveWeakWordReview = (wordId: string, isSuccess: boolean) => {
  try {
    const raw = localStorage.getItem(WEAK_VAULT_KEY);
    if (!raw) return;
    let vault: WeakItem[] = JSON.parse(raw);
    const today = getTodayString();

    const idx = vault.findIndex(item => item.id === wordId);
    if (idx === -1) return;

    if (isSuccess) {
      const nextStage = vault[idx].stage + 1;
      if (nextStage >= 4) {
        // Hoàn thành cả 3 chu kỳ (1 ngày -> 3 ngày -> 7 ngày) -> XÓA KHỎI BLACKLIST
        vault.splice(idx, 1);
      } else {
        vault[idx].stage = nextStage;
        vault[idx].lastReviewDate = today;
        // Chu kỳ Spaced Repetition: Stage 2 = 3 ngày, Stage 3 = 7 ngày
        const intervalDays = nextStage === 2 ? 3 : 7;
        vault[idx].nextReviewDate = addDays(today, intervalDays);
      }
    } else {
      // Làm sai -> Đưa về Stage 1 (ôn lại sau 1 ngày)
      vault[idx].stage = 1;
      vault[idx].mistakeCount += 1;
      vault[idx].nextReviewDate = addDays(today, 1);
    }

    localStorage.setItem(WEAK_VAULT_KEY, JSON.stringify(vault));
  } catch (e) {}
};

// 🎯 4. HÀM LƯU TỪ YẾU CHO CÁC TRẠM (DÙNG TRONG STATION 4)
export const saveWeakPoint = (station: string, promptText: string, score: number) => {
  try {
    harvestWeakWords(
      [{ word: promptText, isConfident: false }],
      `Luyện lại cụm từ từ ${station} (Điểm: ${score})`
    );
  } catch (e) {}
};