import { useState, useCallback, useRef } from 'react';
import { generateDynamicTopic, GeneratedDrill } from '../services/groqClient';

const STORAGE_KEY = 'VIBESPEAK_PERMANENT_HISTORY';

export function useDrillManager() {
  const [currentDrill, setCurrentDrill] = useState<GeneratedDrill>({
    text: "Seat Sheet",
    meaning: "Seat (Chỗ ngồi) vs Sheet (Tờ giấy / Ga giường)",
    phonetics: "/siːt ʃiːt/",
    tip: "Âm /s/ kéo dài khóe môi cười (Seat), âm /ʃ/ chu tròn môi đẩy hơi (Sheet)",
    bpm: 90,
    focus: "Minimal Pair Contrast"
  });

  const [isLoading, setIsLoading] = useState<boolean>(false);
  // Ref khóa chống spam bấm nút liên tục làm văng API Groq
  const isRequestingRef = useRef<boolean>(false);

  // Lấy danh sách cấm từ Storage
  const getHistory = (): string[] => {
    if (typeof window !== 'undefined' && window.localStorage) {
      try {
        const stored = window.localStorage.getItem(STORAGE_KEY);
        return stored ? JSON.parse(stored) : [];
      } catch (e) {
        return [];
      }
    }
    return [];
  };

  // Lưu tức thì vào Storage
  const saveHistory = (newText: string) => {
    const history = getHistory();
    const updated = Array.from(new Set([...history, newText])).slice(-150); // Mở rộng cấm 150 câu
    if (typeof window !== 'undefined' && window.localStorage) {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
    }
  };

  const nextDrill = useCallback(async (tier: 1 | 2 | 3) => {
    // Nếu đang trong tiến trình tạo bài thì bỏ qua lệnh bấm dồn
    if (isRequestingRef.current) return;

    isRequestingRef.current = true;
    setIsLoading(true);

    try {
      // 1. Lấy lịch sử mới nhất ngay tại thời điểm bấm
      const currentHistory = getHistory();

      // 2. Gọi AI tạo bài mới với mảng cấm đầy đủ
      const drill = await generateDynamicTopic(tier, currentHistory);

      // 3. Cập nhật State và Lưu lịch sử ngay lập tức
      setCurrentDrill(drill);
      saveHistory(drill.text);

    } catch (error) {
      console.error("Lỗi tạo bài tập mới:", error);
    } finally {
      setIsLoading(false);
      // Mở khóa sau 800ms để đảm bảo Groq API không bị ngợp Rate Limit
      setTimeout(() => {
        isRequestingRef.current = false;
      }, 800);
    }
  }, []);

  return {
    currentDrill,
    isLoading,
    nextDrill
  };
}