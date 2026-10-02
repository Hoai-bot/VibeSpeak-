// src/screens/Station2Screen.tsx
import React, { useState, useEffect, useRef } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView, ActivityIndicator } from 'react-native';

interface Props {
  onBack: () => void;
}

export default function Station2Screen({ onBack }: Props) {
  const [cefrLevel, setCefrLevel] = useState<string>('A1');
  const [mode, setMode] = useState<'solo' | 'relay' | 'roleplay'>('solo');
  const [loading, setLoading] = useState<boolean>(false);
  const [exercise, setExercise] = useState<any>({
    id: 'demo_st2_1',
    title: 'Thử thách Từ vựng',
    promptEn: 'Discuss the importance of renewable energy in modern cities.',
    promptVi: 'Thảo luận về tầm quan trọng của năng lượng tái tạo trong các thành phố hiện đại.'
  });

  // 🔊 State & Ref cho hệ thống phát âm TTS
  const [isPlayingTTS, setIsPlayingTTS] = useState<boolean>(false);
  const currentAudioRef = useRef<HTMLAudioElement | null>(null);

  const CEFR_LEVELS = ['A1', 'A2', 'B1', 'B2', 'C1', 'C2'];

  // 🧹 HỦY TOÀN BỘ ÂM THANH ĐANG PHÁT VÀ TẮT TTS TRƯỚC
  const stopAllAudio = () => {
    if (currentAudioRef.current) {
      currentAudioRef.current.pause();
      currentAudioRef.current.currentTime = 0;
      currentAudioRef.current = null;
    }
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      window.speechSynthesis.cancel();
    }
    setIsPlayingTTS(false);
  };

  // 🔊 PHÁT ÂM CHUẨN TỰ NHIÊN (TỰ ĐỘNG LỌC CHỈ ĐỌC CHUỖI TIẾNG ANH)
  const playPromptTTS = (textToSpeak: string) => {
    if (!textToSpeak) return;

    stopAllAudio();

    // 💥 ĐẢM BẢO CHỈ LẤY CHUỖI TIẾNG ANH (Lọc bỏ các ký tự tiếng Việt)
    const englishOnlyText = textToSpeak.replace(/[\u0300-\u036f\u1ea0-\u1eff]/g, '').trim();
    if (!englishOnlyText) return;

    try {
      setIsPlayingTTS(true);

      const encodedText = encodeURIComponent(englishOnlyText);
      const ttsUrl = `https://translate.google.com/translate_tts?ie=UTF-8&q=${encodedText}&tl=en&client=tw-ob`;

      const audio = new Audio(ttsUrl);
      currentAudioRef.current = audio;

      audio.onplay = () => setIsPlayingTTS(true);
      audio.onended = () => setIsPlayingTTS(false);
      audio.onerror = () => fallbackBrowserTTS(englishOnlyText);

      audio.play().catch(() => fallbackBrowserTTS(englishOnlyText));
    } catch (err) {
      fallbackBrowserTTS(englishOnlyText);
    }
  };

  // 🎙 BỘ LỌC GIỌNG ĐỌC BẢN NGỮ (FALLBACK CHO BROWSER)
  const fallbackBrowserTTS = (textToSpeak: string) => {
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      window.speechSynthesis.cancel();

      const utterance = new SpeechSynthesisUtterance(textToSpeak);
      utterance.lang = 'en-US';
      utterance.rate = 0.9;
      utterance.pitch = 1.0;

      const voices = window.speechSynthesis.getVoices();
      const premiumVoice = voices.find(v => 
        v.lang.includes('en') && (
          v.name.includes('Google') || 
          v.name.includes('Natural') || 
          v.name.includes('Samantha') || 
          v.name.includes('Daniel') ||
          v.name.includes('Karen')
        )
      );

      if (premiumVoice) {
        utterance.voice = premiumVoice;
      }

      utterance.onstart = () => setIsPlayingTTS(true);
      utterance.onend = () => setIsPlayingTTS(false);
      utterance.onerror = () => setIsPlayingTTS(false);

      window.speechSynthesis.speak(utterance);
    }
  };

  // 🎯 Tự động phát âm mỗi khi đổi câu/bài tập
  useEffect(() => {
    const textToPlay = exercise?.promptEn || exercise?.sentenceEn || exercise?.targetWord;
    if (exercise && textToPlay) {
      const timer = setTimeout(() => {
        playPromptTTS(textToPlay);
      }, 300);
      return () => clearTimeout(timer);
    }
  }, [exercise?.id]);

  useEffect(() => {
    return () => stopAllAudio();
  }, []);

  const getTargetText = () => {
    if (!exercise) return '';
    return exercise.promptEn || exercise.sentenceEn || exercise.targetWord || '';
  };

  return (
    <View style={styles.container}>
      {/* Thanh Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={onBack} style={styles.backBtn}>
          <Text style={styles.backText}>🔙 QUAY LẠI MAP</Text>
        </TouchableOpacity>
        <Text style={styles.title}>⚔️ TRẠM 2: VOCABULARY ARENA</Text>
      </View>

      <ScrollView contentContainerStyle={{ alignItems: 'center', width: '100%', paddingBottom: 30 }}>
        {/* Chọn Cấp độ CEFR */}
        <Text style={styles.sectionLabel}>CHỌN LEVEL CẤP ĐỘ:</Text>
        <View style={styles.cefrRow}>
          {CEFR_LEVELS.map((lvl) => (
            <TouchableOpacity 
              key={lvl} 
              style={[styles.cefrBadge, cefrLevel === lvl && styles.cefrBadgeActive]} 
              onPress={() => setCefrLevel(lvl)}
            >
              <Text style={[styles.cefrText, cefrLevel === lvl && styles.cefrTextActive]}>{lvl}</Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Chọn Chế độ thi đấu */}
        <View style={styles.modeRow}>
          <TouchableOpacity 
            style={[styles.modeBtn, mode === 'solo' && styles.modeBtnActive]} 
            onPress={() => setMode('solo')}
          >
            <Text style={[styles.modeText, mode === 'solo' && styles.modeTextActive]}>🎯 SOLO</Text>
          </TouchableOpacity>

          <TouchableOpacity 
            style={[styles.modeBtn, mode === 'relay' && styles.modeBtnActive]} 
            onPress={() => setMode('relay')}
          >
            <Text style={[styles.modeText, mode === 'relay' && styles.modeTextActive]}>⚡ RELAY</Text>
          </TouchableOpacity>

          <TouchableOpacity 
            style={[styles.modeBtn, mode === 'roleplay' && styles.modeBtnActive]} 
            onPress={() => setMode('roleplay')}
          >
            <Text style={[styles.modeText, mode === 'roleplay' && styles.modeTextActive]}>🎭 ROLEPLAY</Text>
          </TouchableOpacity>
        </View>

        {/* BẢNG ĐỀ BÀI THI ĐẤU CHÍNH */}
        <View style={styles.box}>
          <Text style={styles.boxTitle}>📌 SÀN ĐẤU {mode.toUpperCase()} [{cefrLevel}]</Text>
          
          {exercise ? (
            <View style={{ width: '100%', alignItems: 'center' }}>
              <Text style={styles.scenarioTitle}>{exercise.title || `Thử thách ${mode.toUpperCase()}`}</Text>
              
              <Text style={styles.promptText}>
                🎯 "{getTargetText()}"
              </Text>
              
              {exercise.promptVi && (
                <Text style={styles.promptViText}>👉 Dịch: "{exercise.promptVi}"</Text>
              )}

              {/* 🔊 NÚT PHÁT ÂM HIỂN THỊ NỔI BẬT */}
              <TouchableOpacity 
                style={[styles.ttsBtn, isPlayingTTS && styles.ttsBtnActive]} 
                onPress={() => playPromptTTS(getTargetText())}
              >
                <Text style={[styles.ttsBtnText, isPlayingTTS && styles.ttsBtnTextActive]}>
                  {isPlayingTTS ? '🔊 ĐANG PHÁT GIỌNG ĐỌC...' : '🔊 NGHE TÌNH HUỐNG (NATURAL VOICE)'}
                </Text>
              </TouchableOpacity>
            </View>
          ) : (
            <ActivityIndicator size="small" color="#00FFFF" style={{ marginVertical: 15 }} />
          )}
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#05020D', padding: 20, paddingTop: 50 },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 15 },
  backBtn: { padding: 8, backgroundColor: '#0D0620', borderRadius: 8, borderWidth: 1, borderColor: '#00FFFF' },
  backText: { color: '#00FFFF', fontSize: 10, fontWeight: 'bold' },
  title: { color: '#00FFFF', fontSize: 12, fontWeight: '900' },
  sectionLabel: { color: '#FFD700', fontSize: 10, fontWeight: 'bold', alignSelf: 'flex-start', marginBottom: 6 },
  cefrRow: { flexDirection: 'row', justifyContent: 'space-between', width: '100%', marginBottom: 15 },
  cefrBadge: { backgroundColor: '#0D0620', paddingVertical: 6, paddingHorizontal: 10, borderRadius: 6, borderWidth: 1, borderColor: '#332255' },
  cefrBadgeActive: { backgroundColor: '#00FFFF', borderColor: '#00FFFF' },
  cefrText: { color: '#8888AA', fontSize: 10, fontWeight: 'bold' },
  cefrTextActive: { color: '#000' },
  modeRow: { flexDirection: 'row', justifyContent: 'space-between', width: '100%', marginBottom: 15 },
  modeBtn: { flex: 1, paddingVertical: 8, backgroundColor: '#0D0620', borderRadius: 8, borderWidth: 1, borderColor: '#332255', alignItems: 'center', marginHorizontal: 3 },
  modeBtnActive: { backgroundColor: '#39FF14', borderColor: '#39FF14' },
  modeText: { color: '#8888AA', fontSize: 10, fontWeight: 'bold' },
  modeTextActive: { color: '#000' },
  box: { backgroundColor: '#0D0620', padding: 18, borderRadius: 16, borderWidth: 2, borderColor: '#00FFFF', width: '100%', alignItems: 'center', marginBottom: 20 },
  boxTitle: { color: '#FFD700', fontSize: 11, fontWeight: '900', marginBottom: 12 },
  scenarioTitle: { color: '#39FF14', fontSize: 13, fontWeight: '900', marginBottom: 6 },
  promptText: { color: '#FFF', fontSize: 13, fontWeight: '800', textAlign: 'center', lineHeight: 18, marginBottom: 8 },
  promptViText: { color: '#FFD700', fontSize: 11, fontWeight: '600', textAlign: 'center', marginBottom: 10, fontStyle: 'italic' },
  ttsBtn: { backgroundColor: '#1A0B2E', paddingVertical: 12, paddingHorizontal: 16, borderRadius: 10, borderWidth: 2, borderColor: '#00FFFF', marginVertical: 12, alignItems: 'center', width: '100%' },
  ttsBtnActive: { backgroundColor: '#00FFFF', borderColor: '#00FFFF' },
  ttsBtnText: { color: '#00FFFF', fontSize: 11, fontWeight: '900' },
  ttsBtnTextActive: { color: '#000' }
});