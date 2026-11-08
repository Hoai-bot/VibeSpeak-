// src/utils/spontaneityDetector.ts

export interface SpontaneityResult {
  score: number;             // 0 - 100đ
  pitchVariance: number;     // Độ lệch chuẩn tần số cơ bản F0
  isScriptSuspected: boolean;// Cờ nghi vấn đọc kịch bản
  label: 'SPONTANEOUS' | 'NATURAL' | 'MONOTONE_READING';
}

/**
 * Phân tích độ biến thiên F0 và nhịp điệu để phát hiện giọng đọc văn bản
 * @param pitchHistory Mảng tần số F0 (Hz) thu thập được từ Web Audio API / AudioContext
 */
export function analyzeSpeechSpontaneity(pitchHistory: number[]): SpontaneityResult {
  // 1. Lọc bỏ các khoảng lặng (F0 = 0) và tần số ngoài dải giọng người bình thường
  const validPitches = pitchHistory.filter(f => f >= 60 && f <= 450);

  if (validPitches.length < 25) {
    return {
      score: 75,
      pitchVariance: 25.0,
      isScriptSuspected: false,
      label: 'NATURAL'
    };
  }

  // 2. Tính trung bình F0 (Mean)
  const sum = validPitches.reduce((acc, val) => acc + val, 0);
  const mean = sum / validPitches.length;

  // 3. Tính độ lệch chuẩn (Standard Deviation - SD)
  const variance = validPitches.reduce((acc, val) => acc + Math.pow(val - mean, 2), 0) / validPitches.length;
  const stdDev = Math.sqrt(variance);

  // 4. Phân loại âm học:
  // - stdDev < 20 Hz: Quá phẳng/đơn điệu (đặc trưng đọc văn bản)
  // - 20 Hz <= stdDev < 28 Hz: Tự nhiên mức cơ bản
  // - stdDev >= 28 Hz: Biến thiên linh hoạt, cảm xúc phong phú
  const calculatedScore = Math.min(100, Math.max(30, Math.round((stdDev / 32) * 100)));
  const isSuspected = stdDev < 20;

  let label: 'SPONTANEOUS' | 'NATURAL' | 'MONOTONE_READING' = 'NATURAL';
  if (isSuspected) {
    label = 'MONOTONE_READING';
  } else if (stdDev >= 28) {
    label = 'SPONTANEOUS';
  }

  return {
    score: calculatedScore,
    pitchVariance: Number(stdDev.toFixed(2)),
    isScriptSuspected: isSuspected,
    label
  };
}