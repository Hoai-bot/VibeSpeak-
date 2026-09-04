/**
 * 👻 Hàm phát giọng đọc chuẩn Cyberpunk / Ma mị cho Trạm Bóng Ma
 */
export const playGhostVoice = (text: string) => {
  if (!('speechSynthesis' in window)) {
    console.warn('Trình duyệt không hỗ trợ Web Speech API');
    return;
  }

  // Hủy các giọng đọc đang chạy dở
  window.speechSynthesis.cancel();

  const utterance = new SpeechSynthesisUtterance(text);
  utterance.lang = 'en-US';

  // 1. Tinh chỉnh Tốc độ & Độ cao để tạo chất giọng trầm, thì thầm u uất
  utterance.rate = 0.82; // Nói chậm lại 18% để tạo cảm giác kì bí
  utterance.pitch = 0.65; // Trầm giọng xuống 35% cho ma mị, bớt phô
  utterance.volume = 1.0;

  // 2. Thuật toán Lọc Giọng đọc Chất lượng cao (Neural / Natural Voices)
  const voices = window.speechSynthesis.getVoices();
  
  // Ưu tiên chọn các giọng đọc AI tự nhiên của Google, Microsoft Edge Neural hoặc Apple Premium
  const ghostVoice = voices.find(
    (v) =>
      v.lang.includes('en') &&
      (v.name.includes('Natural') ||
       v.name.includes('Neural') ||
       v.name.includes('Google') ||
       v.name.includes('Premium') ||
       v.name.includes('Daniel') ||
       v.name.includes('Serena'))
  ) || voices.find((v) => v.lang.startsWith('en'));

  if (ghostVoice) {
    utterance.voice = ghostVoice;
  }

  window.speechSynthesis.speak(utterance);
};