// src/services/weakPointsService.ts
export interface WeakItem {
  id: string;
  word: string;
  phonemeHint?: string;
  mistakeCount: number;
  stage: number; // 0: Mới thêm, 1: Sau 1 ngày, 2: Sau 3 ngày, 3: Sau 7 ngày, 4: Thành thạo (xóa khỏi blacklist)[cite: 10]
  lastReviewDate: string; // YYYY-MM-DD[cite: 10]
  nextReviewDate: string; // YYYY-MM-DD[cite: 10]
  targetSentence?: string;
}

const WEAK_VAULT_KEY = 'vibespeak_personal_weak_vault';[cite: 10]

const getTodayString = (): string => {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;[cite: 10]
};

const addDays = (dateStr: string, days: number): string => {
  const d = new Date(dateStr);
  d.setDate(d.getDate() + days);[cite: 10]
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;[cite: 10]
};

// 🎯 1. TỰ ĐỘNG THU THẬP TỪ YẾU/CẶP ÂM KHI AI PHÁT HIỆN SAI HOẶC NGẬP NGỪNG[cite: 10]
export const harvestWeakWords = (
  spokenWords: { word: string; isConfident: boolean }[], 
  contextSentence?: string
) => {
  try {
    const raw = localStorage.getItem(WEAK_VAULT_KEY);[cite: 10]
    let vault: WeakItem[] = raw ? JSON.parse(raw) : [];[cite: 10]
    const today = getTodayString();[cite: 10]

    const failedWords = spokenWords.filter(w => !w.isConfident && w.word.trim().length > 1);[cite: 10]

    failedWords.forEach(({ word }) => {
      const clean = word.toLowerCase().replace(/[^a-z]/g, '');[cite: 10]
      if (!clean) return;[cite: 10]

      const existingIndex = vault.findIndex(item => item.word.toLowerCase() === clean);[cite: 10]

      // Dự đoán âm khó hay gặp ở người Việt[cite: 10]
      let phoneme = 'Ngữ điệu / Trọng âm';[cite: 10]
      if (clean.includes('sh') || clean.includes('ch')) phoneme = '/ʃ/ vs /tʃ/';[cite: 10]
      else if (clean.includes('th')) phoneme = '/θ/ vs /ð/';[cite: 10]
      else if (clean.endsWith('s') || clean.endsWith('ed')) phoneme = 'Âm đuôi (Ending sound)';[cite: 10]

      if (existingIndex !== -1) {
        vault[existingIndex].mistakeCount += 1;[cite: 10]
        // Bị sai lại -> Đưa về mốc ôn 1 ngày tiếp theo[cite: 10]
        vault[existingIndex].nextReviewDate = addDays(today, 1);[cite: 10]
      } else {
        vault.push({
          id: `weak_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
          word: clean,
          phonemeHint: phoneme,
          mistakeCount: 1,
          stage: 1,
          lastReviewDate: today,
          nextReviewDate: addDays(today, 1), // Ôn lại sau 1 ngày[cite: 10]
          targetSentence: contextSentence || `Please practice saying the word "${clean}" clearly.`[cite: 10]
        });
      }
    });

    localStorage.setItem(WEAK_VAULT_KEY, JSON.stringify(vault));[cite: 10]
  } catch (e) {
    console.warn("Không thể lưu weak points:", e);[cite: 10]
  }
};

// 🎯 2. LẤY DANH SÁCH "TOP CẦN PHỤC THÙ" & CÁC TỪ ĐẾN HẠN ÔN HÔM NAY (SPACED REPETITION)[cite: 10]
export const getWeakVaultSummary = () => {
  try {
    const raw = localStorage.getItem(WEAK_VAULT_KEY);[cite: 10]
    const vault: WeakItem[] = raw ? JSON.parse(raw) : [];[cite: 10]
    const today = getTodayString();[cite: 10]

    // Top 5 lỗi sai nhiều nhất[cite: 10]
    const topRevenge = [...vault]
      .sort((a, b) => b.mistakeCount - a.mistakeCount)[cite: 10]
      .slice(0, 5);[cite: 10]

    // Các từ đến hạn ôn tập (nextReviewDate <= hôm nay)[cite: 10]
    const dueForReview = vault.filter(item => item.nextReviewDate <= today);[cite: 10]

    return {
      all: vault,
      topRevenge,
      dueForReview,
      totalWeak: vault.length,
    };
  } catch (e) {
    return { all: [], topRevenge: [], dueForReview: [], totalWeak: 0 };[cite: 10]
  }
};

// 🎯 3. XỬ LÝ KẾT QUẢ MINI-TEST (THĂNG HẠNG HOẶC XÓA KHỎI BLACKLIST)[cite: 10]
export const resolveWeakWordReview = (wordId: string, isSuccess: boolean) => {
  try {
    const raw = localStorage.getItem(WEAK_VAULT_KEY);[cite: 10]
    if (!raw) return;[cite: 10]
    let vault: WeakItem[] = JSON.parse(raw);[cite: 10]
    const today = getTodayString();[cite: 10]

    const idx = vault.findIndex(item => item.id === wordId);[cite: 10]
    if (idx === -1) return;[cite: 10]

    if (isSuccess) {
      const nextStage = vault[idx].stage + 1;[cite: 10]
      if (nextStage >= 4) {
        // Hoàn thành cả 3 chu kỳ (1 ngày -> 3 ngày -> 7 ngày) -> XÓA KHỎI BLACKLIST[cite: 10]
        vault.splice(idx, 1);[cite: 10]
      } else {
        vault[idx].stage = nextStage;[cite: 10]
        vault[idx].lastReviewDate = today;[cite: 10]
        // Chu kỳ Spaced Repetition: Stage 2 = 3 ngày, Stage 3 = 7 ngày[cite: 10]
        const intervalDays = nextStage === 2 ? 3 : 7;[cite: 10]
        vault[idx].nextReviewDate = addDays(today, intervalDays);[cite: 10]
      }
    } else {
      // Làm sai -> Đưa về Stage 1 (ôn lại sau 1 ngày)[cite: 10]
      vault[idx].stage = 1;[cite: 10]
      vault[idx].mistakeCount += 1;[cite: 10]
      vault[idx].nextReviewDate = addDays(today, 1);[cite: 10]
    }

    localStorage.setItem(WEAK_VAULT_KEY, JSON.stringify(vault));[cite: 10]
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