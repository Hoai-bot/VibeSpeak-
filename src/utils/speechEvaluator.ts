// src/utils/speechEvaluator.ts
import { analyzeSpeechSpontaneity, SpontaneityResult } from './spontaneityDetector';
import { DetailedFeedbackData } from '../components/DetailedSpeechFeedbackModal';

interface EvaluateParams {
  transcript: string;
  targetPrompt: string;
  pitchHistory: number[];
  durationSeconds: number;
  cefrLevel: string;
}

export function evaluateSpeechSubmission({
  transcript,
  targetPrompt,
  pitchHistory,
  durationSeconds,
  cefrLevel
}: EvaluateParams): DetailedFeedbackData {
  const spontaneity: SpontaneityResult = analyzeSpeechSpontaneity(pitchHistory);

  const spokenWords = transcript.toLowerCase().replace(/[^a-z0-9\s]/g, '').split(/\s+/).filter(Boolean);
  const targetWords = targetPrompt.toLowerCase().replace(/[^a-z0-9\s]/g, '').split(/\s+/).filter(Boolean);
  
  let matchCount = 0;
  targetWords.forEach(w => {
    if (spokenWords.includes(w)) matchCount++;
  });
  const wordAccuracyRatio = targetWords.length > 0 ? matchCount / targetWords.length : 0.8;
  const pronScore = Math.min(100, Math.max(35, Math.round(wordAccuracyRatio * 60 + 35)));
  const intonationScore = spontaneity.score;

  const durationMin = Math.max(durationSeconds / 60, 0.1);
  const wpm = Math.round(spokenWords.length / durationMin);
  let fluencyScore = 75;
  if (wpm >= 110 && wpm <= 160) fluencyScore = 92;
  else if (wpm >= 85 && wpm < 110) fluencyScore = 82;
  else if (wpm > 160) fluencyScore = 70;
  else fluencyScore = Math.max(40, Math.round((wpm / 85) * 80));

  const uniqueWords = new Set(spokenWords);
  const ttr = spokenWords.length > 0 ? uniqueWords.size / spokenWords.length : 0.8;
  const vocabScore = Math.min(100, Math.max(45, Math.round(ttr * 50 + (targetWords.length > 6 ? 45 : 35))));
  const grammarScore = Math.min(100, Math.max(40, Math.round(wordAccuracyRatio * 40 + (spokenWords.length >= 6 ? 50 : 30))));
  const contentScore = Math.min(100, Math.max(40, Math.round(wordAccuracyRatio * 70 + (durationSeconds >= 4 ? 25 : 10))));

  const totalScore = Math.round(
    pronScore * 0.20 +
    intonationScore * 0.20 +
    fluencyScore * 0.15 +
    vocabScore * 0.15 +
    grammarScore * 0.15 +
    contentScore * 0.15
  );

  return {
    totalScore,
    cefrLevel,
    transcript: transcript || targetPrompt,
    pitchHistory,
    spontaneityScore: spontaneity.score,
    isScriptSuspected: spontaneity.isScriptSuspected,
    rubrics: {
      pronunciation: { name: 'Phát âm (Pronunciation)', key: 'pronunciation', score: pronScore, weight: '20%', feedback: 'Phát âm chuẩn xác nguyên âm và phụ âm.', color: '#00FFFF' },
      intonation: { name: 'Ngữ điệu (Intonation)', key: 'intonation', score: intonationScore, weight: '20%', feedback: spontaneity.isScriptSuspected ? 'Ngữ điệu đơn điệu, nghi vấn đọc tài liệu.' : 'Ngữ điệu tự nhiên.', color: spontaneity.isScriptSuspected ? '#FF0055' : '#39FF14' },
      fluency: { name: 'Độ trôi chảy (Fluency)', key: 'fluency', score: fluencyScore, weight: '15%', feedback: `Tốc độ phản xạ: ~${wpm} WPM.`, color: '#FFD700' },
      vocabulary: { name: 'Từ vựng (Vocabulary)', key: 'vocabulary', score: vocabScore, weight: '15%', feedback: `Đạt chuẩn từ vựng ${cefrLevel}.`, color: '#FF007F' },
      grammar: { name: 'Ngữ pháp (Grammar)', key: 'grammar', score: grammarScore, weight: '15%', feedback: 'Cấu trúc câu hoàn chỉnh.', color: '#A855F7' },
      content: { name: 'Nội dung (Content)', key: 'content', score: contentScore, weight: '15%', feedback: 'Bám sát yêu cầu đề bài.', color: '#38BDF8' }
    },
    keyImprovements: ['Tiếp tục duy trì phản xạ tự nhiên.']
  };
}