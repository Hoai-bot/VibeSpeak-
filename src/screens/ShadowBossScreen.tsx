// src/screens/ShadowBossScreen.tsx
import React, { useState, useEffect, useRef } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView, ActivityIndicator, Alert } from 'react-native';
import { BOSS_SCENARIOS_DATA, BossScenarioItem } from '../data/station3/bossScenarios';
import { updateUserProgress } from '../services/userService';
import { playBossVoice } from '../services/bossTtsService';
import { evaluateSpeaking } from '../services/arena/assessmentService';
import LeaderboardScreen from './LeaderboardScreen';

interface Props {
  onBack: () => void;
}

// 🎯 HÀM DÒ TÌM MIME TYPE THU ÂM CHUẨN XÁC THEO TỪNG HỆ ĐIỀU HÀNH
const getSupportedAudioMimeType = (): { mimeType: string; extension: string } => {
  if (typeof window === 'undefined' || !(window as any).MediaRecorder) {
    return { mimeType: '', extension: 'webm' };
  }
  const MediaRecorderClass = (window as any).MediaRecorder;

  if (typeof MediaRecorderClass.isTypeSupported === 'function') {
    if (MediaRecorderClass.isTypeSupported('audio/webm;codecs=opus')) {
      return { mimeType: 'audio/webm;codecs=opus', extension: 'webm' };
    }
    if (MediaRecorderClass.isTypeSupported('audio/webm')) {
      return { mimeType: 'audio/webm', extension: 'webm' };
    }
    if (MediaRecorderClass.isTypeSupported('audio/mp4')) {
      return { mimeType: 'audio/mp4', extension: 'mp4' };
    }
    if (MediaRecorderClass.isTypeSupported('audio/aac')) {
      return { mimeType: 'audio/aac', extension: 'aac' };
    }
  }

  return { mimeType: '', extension: 'webm' };
};

export default function ShadowBossScreen({ onBack }: Props) {
  const [cefrLevel, setCefrLevel] = useState<string>('B2');
  const [currentHp, setCurrentHp] = useState<number>(180);
  const [isPlayingAudio, setIsPlayingAudio] = useState<boolean>(false);
  const [showLeaderboard, setShowLeaderboard] = useState<boolean>(false);

  // 🎯 QUẢN LÝ ĐỀ BÀI VÀ HÀNG ĐỢI NẠP BÙ AI NGẦM (0MS LATENCY)
  const [bossIndex, setBossIndex] = useState<number>(0);
  const [aiQueue, setAiQueue] = useState<BossScenarioItem[]>([]);
  const isFetchingAiRef = useRef<boolean>(false);

  const getInitialBossForLevel = (lvl: string): BossScenarioItem => {
    const list = BOSS_SCENARIOS_DATA.filter(item => item.level === lvl);
    if (list.length > 0) return list[0];
    return {
      id: `fallback_boss_${lvl}_0`,
      level: lvl as any,
      bossName: 'Shadow Sovereign',
      bossTitle: 'Chúa Tể Bóng Đêm',
      bossAvatar: '👹',
      maxHp: 150,
      timeLimitSeconds: 40,
      bossChallengeEn: "You dare enter my dominion? Demonstrate your fluency to survive!",
      bossChallengeVi: "Ngươi dám bước vào lãnh địa của ta sao? Hãy chứng minh độ lưu loát để sống sót!",
      expectedResponsePromptEn: "Shadow the boss's sentence clearly.",
      keyTargetPhrases: ["dominion", "fluency", "survive"]
    };
  };

  const [bossData, setBossData] = useState<BossScenarioItem>(() => getInitialBossForLevel('B2'));

  // QUẢN LÝ MICRO & CỜ BẢO VỆ GHI ÂM TẠI TRẬN HIỆN TẠI
  const [isRecording, setIsRecording] = useState<boolean>(false);
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null);
  const [hasRecordedCurrentSession, setHasRecordedCurrentSession] = useState<boolean>(false);
  const [isAnalyzing, setIsAnalyzing] = useState<boolean>(false);
  const [lastDamage, setLastDamage] = useState<number | null>(null);
  const [lastFeedback, setLastFeedback] = useState<string>('');

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const activeMimeTypeRef = useRef<{ mimeType: string; extension: string }>({ mimeType: '', extension: 'webm' });

  const CEFR_LEVELS = ['A1', 'A2', 'B1', 'B2', 'C1', 'C2'];

  const stopAllAudio = () => {
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      window.speechSynthesis.cancel();
    }
    setIsPlayingAudio(false);
  };

  const resetBossSession = () => {
    stopAllAudio();
    if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
      try { mediaRecorderRef.current.stop(); } catch (e) {}
    }
    setIsRecording(false);
    setAudioBlob(null);
    setHasRecordedCurrentSession(false);
    setLastDamage(null);
    setLastFeedback('');
    audioChunksRef.current = [];
  };

  // 🔊 BỘ PHÁT ÂM TỰ NHIÊN ĐA NỀN TẢNG (GIỌNG TRẦM UY LỰC CHO SHADOW BOSS)
  const getBestBossVoice = (): SpeechSynthesisVoice | null => {
    if (typeof window === 'undefined' || !('speechSynthesis' in window)) return null;
    const voices = window.speechSynthesis.getVoices();
    if (!voices || voices.length === 0) return null;

    const deepVoices = ['Guy', 'Aaron', 'Daniel', 'Google US English', 'Natural'];
    for (const name of deepVoices) {
      const match = voices.find(v => v.lang.startsWith('en') && v.name.includes(name));
      if (match) return match;
    }
    return voices.find(v => v.lang === 'en-US') || voices.find(v => v.lang.startsWith('en')) || null;
  };

  const playNaturalBossTTS = (text: string) => {
    if (typeof window === 'undefined' || !('speechSynthesis' in window)) {
      setIsPlayingAudio(false);
      return;
    }
    const synth = window.speechSynthesis;
    synth.cancel();

    const utterance = new SpeechSynthesisUtterance(text.replace(/["']/g, '').trim());
    const voice = getBestBossVoice();
    if (voice) utterance.voice = voice;
    utterance.lang = 'en-US';
    utterance.rate = 0.88;
    utterance.pitch = 0.85;

    utterance.onstart = () => setIsPlayingAudio(true);
    utterance.onend = () => setIsPlayingAudio(false);
    utterance.onerror = () => setIsPlayingAudio(false);

    synth.speak(utterance);
  };

  // 🤖 TIẾN TRÌNH NẠP BÙ AI NGẦM CHO TRẠM 3 (CHẠY HẬU CẢNH - KHÔNG ĐƠ GIAO DIỆN)
  const triggerBackgroundAiRefill = async (level: string) => {
    const apiKey = process.env.EXPO_PUBLIC_GROQ_API_KEY;
    if (!apiKey || isFetchingAiRef.current) return;

    try {
      isFetchingAiRef.current = true;
      const promptInstruction = `Create 1 UNIQUE epic gaming boss battle challenge for English speaking Station 3 Shadow Boss Raid at CEFR level ${level}.
Output ONLY raw JSON (no markdown):
{
  "bossName": "Epic Boss Name",
  "bossTitle": "Title in Vietnamese (e.g. Chúa Tể Hư Không)",
  "bossAvatar": "1 single evil monster/boss emoji (e.g. 🐉, 👹, 💀, 🧙‍♂, 🤖)",
  "maxHp": 150,
  "bossChallengeEn": "An intimidating, dramatic 1-2 sentence English combat challenge to shadow",
  "bossChallengeVi": "Vietnamese translation of the challenge",
  "expectedResponsePromptEn": "What the player needs to shadow",
  "keyTargetPhrases": ["phrase 1", "phrase 2", "phrase 3"]
}`;

      const res = await fetch('https://api.groq.com/openai/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
          model: 'llama-3.3-70b-versatile',
          messages: [{ role: 'user', content: promptInstruction }],
          temperature: 1.0,
          response_format: { type: 'json_object' },
        }),
      });

      if (res.ok) {
        const data = await res.json();
        const content = JSON.parse(data.choices[0].message.content);
        const newAiBoss: BossScenarioItem = {
          id: `ai_boss_${Date.now()}_${Math.random()}`,
          level: level as any,
          bossName: `🤖 ${content.bossName}`,
          bossTitle: content.bossTitle || 'Thủ Lĩnh AI',
          bossAvatar: content.bossAvatar || '👾',
          maxHp: content.maxHp || 150,
          timeLimitSeconds: 40,
          bossChallengeEn: content.bossChallengeEn,
          bossChallengeVi: content.bossChallengeVi || '',
          expectedResponsePromptEn: content.expectedResponsePromptEn || 'Shadow the boss challenge phrase.',
          keyTargetPhrases: content.keyTargetPhrases || [],
        };
        setAiQueue(prev => [...prev, newAiBoss]);
      }
    } catch (e) {
      console.warn("AI ngầm Trạm 3 tạm dừng:", e);
    } finally {
      isFetchingAiRef.current = false;
    }
  };

  // ⚡ ĐỔI BOSS TỨC THÌ 0MS + TỰ ĐỘNG NẠP BÙ AI NGẦM
  const handleNextBoss = () => {
    resetBossSession();
    const nextIdx = bossIndex + 1;
    setBossIndex(nextIdx);

    // 1. Nếu có Boss trong hàng đợi AI ngầm -> Đưa ra khiêu chiến ngay trong 0ms!
    if (aiQueue.length > 0) {
      const [nextAiBoss, ...restQueue] = aiQueue;
      setAiQueue(restQueue);
      setBossData(nextAiBoss);
      setCurrentHp(nextAiBoss.maxHp || 150);
      triggerBackgroundAiRefill(cefrLevel);
      return;
    }

    // 2. Lấy ngay từ kho dữ liệu BOSS_SCENARIOS_DATA trong 0ms
    const list = BOSS_SCENARIOS_DATA.filter(item => item.level === cefrLevel);
    if (list.length > 0) {
      const picked = list[nextIdx % list.length];
      const loopNum = Math.floor(nextIdx / list.length) + 1;
      const formattedBoss: BossScenarioItem = {
        ...picked,
        bossName: loopNum > 1 ? `${picked.bossName} (#${loopNum})` : picked.bossName,
      };
      setBossData(formattedBoss);
      setCurrentHp(picked.maxHp || 120);
    }

    // 3. Tự động kích hoạt nạp bù Boss AI ở hậu cảnh
    triggerBackgroundAiRefill(cefrLevel);
  };

  const handleLevelChange = (newLevel: string) => {
    if (newLevel === cefrLevel) return;
    resetBossSession();
    setCefrLevel(newLevel);
    setBossIndex(0);
    setAiQueue([]);

    const initial = getInitialBossForLevel(newLevel);
    setBossData(initial);
    setCurrentHp(initial.maxHp || 120);

    triggerBackgroundAiRefill(newLevel);
  };

  useEffect(() => {
    const initial = getInitialBossForLevel(cefrLevel);
    setBossData(initial);
    setCurrentHp(initial.maxHp || 120);
    triggerBackgroundAiRefill(cefrLevel);
    return () => resetBossSession();
  }, []);

  // 📢 PHÁT GIỌNG NÓI MẪU AI CỦA SHADOW BOSS
  const handlePlaySample = async () => {
    if (!bossData || !bossData.bossChallengeEn) return;
    setIsPlayingAudio(true);
    try {
      await playBossVoice(bossData.bossChallengeEn, 'onyx');
    } catch {
      playNaturalBossTTS(bossData.bossChallengeEn);
    } finally {
      setIsPlayingAudio(false);
    }
  };

  const handleBossAttack = (bossDialogueText: string) => {
    try {
      playBossVoice(bossDialogueText, 'onyx');
    } catch {
      playNaturalBossTTS(bossDialogueText);
    }
  };

  // 🎙️ Thu âm đa nền tảng
  const handleToggleRecord = async () => {
    stopAllAudio();

    if (!isRecording) {
      try {
        if (typeof navigator !== 'undefined' && navigator.mediaDevices) {
          const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
          
          const detectedFormat = getSupportedAudioMimeType();
          activeMimeTypeRef.current = detectedFormat;

          const options: any = detectedFormat.mimeType ? { mimeType: detectedFormat.mimeType } : undefined;
          const mediaRecorder = new MediaRecorder(stream, options);
          mediaRecorderRef.current = mediaRecorder;
          audioChunksRef.current = [];

          mediaRecorder.ondataavailable = (e) => {
            if (e.data && e.data.size > 0) audioChunksRef.current.push(e.data);
          };

          mediaRecorder.onstop = () => {
            const { mimeType } = activeMimeTypeRef.current;
            const blob = new Blob(audioChunksRef.current, mimeType ? { type: mimeType } : undefined);
            
            if (blob.size > 800) {
              setAudioBlob(blob);
              setHasRecordedCurrentSession(true);
            } else {
              setAudioBlob(null);
              setHasRecordedCurrentSession(false);
              Alert.alert("Thông báo", "⚠️ Bạn chưa nói hoặc bản thu quá ngắn! Vui lòng bấm giữ nút và Shadowing rõ ràng.");
            }
            stream.getTracks().forEach(t => t.stop());
          };

          mediaRecorder.start(100);
          setIsRecording(true);
          setAudioBlob(null);
          setHasRecordedCurrentSession(false);
        }
      } catch {
        Alert.alert("Lỗi Micro", "🔒 Vui lòng cấp quyền Microphone trên trình duyệt để Shadowing!");
      }
    } else {
      setIsRecording(false);
      if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
        mediaRecorderRef.current.stop();
      }
    }
  };

  const handleAttackBoss = async () => {
    if (!hasRecordedCurrentSession || !audioBlob || audioBlob.size <= 800) {
      Alert.alert("Bảo vệ tấn công", "🔒 Bạn chưa thu âm giọng nói Shadowing! Hãy bấm nút Micro để nói đuổi theo câu thoại trước.");
      return;
    }

    setIsAnalyzing(true);
    setLastFeedback('');

    try {
      const promptTarget = `Shadowing phrase: ${bossData?.bossChallengeEn || ''}`;
      const evalResult = await evaluateSpeaking(audioBlob, cefrLevel, '3', promptTarget);

      if (!evalResult.transcript || evalResult.score === 0) {
        setLastDamage(0);
        setLastFeedback("❌ AI không nghe rõ câu Shadowing. Vui lòng đọc to và rõ ràng hơn!");
        Alert.alert("Tấn công thất bại", "🛡 Bạn chưa đọc rõ câu thoại Shadowing! Vui lòng bấm micro và đọc lại.");
      } else {
        const damage = evalResult.score;

        if (damage < 30) {
          setLastDamage(0);
          setLastFeedback("❌ Phát âm chưa đạt chuẩn! Boss không bị mất máu.");
        } else {
          const newHp = Math.max(0, currentHp - damage);
          setCurrentHp(newHp);
          setLastDamage(damage);
          setLastFeedback(evalResult.detailedFeedback || "Bài Shadowing tốt!");

          if (newHp === 0) {
            updateUserProgress(3, 100, true);
            handleBossAttack("Argh... You have defeated me with perfect shadowing!");
          }
        }
      }
    } catch (err) {
      console.error("Lỗi chấm điểm Shadowing Trạm 3:", err);
      Alert.alert("Lỗi kết nối", "⚠️ Không thể phân tích bài nói lúc này. Vui lòng thử lại!");
    } finally {
      setIsAnalyzing(false);
      setAudioBlob(null);
      setHasRecordedCurrentSession(false);
    }
  };

  // 🏆 BẢNG XẾP HẠNG
  if (showLeaderboard) {
    return (
      <LeaderboardScreen 
        onBack={() => setShowLeaderboard(false)} 
      />
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={onBack} style={styles.backBtn}>
          <Text style={styles.backText}>🔙 MAP</Text>
        </TouchableOpacity>
        
        <Text style={styles.title}>👹 TRẠM 3: SHADOW BOSS RAID</Text>

        <TouchableOpacity onPress={() => setShowLeaderboard(true)} style={styles.leaderboardHeaderBtn}>
          <Text style={styles.leaderboardHeaderText}>🏆 TOP</Text>
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={{ alignItems: 'center', width: '100%', paddingBottom: 30 }}>
        {/* 🎯 THANH CHỌN LEVEL ĐỒNG BỘ CÁC TRẠM */}
        <Text style={styles.sectionLabel}>CHỌN LEVEL CẤP ĐỘ:</Text>
        <View style={styles.cefrRow}>
          {CEFR_LEVELS.map((lvl) => (
            <TouchableOpacity 
              key={lvl} 
              style={[styles.cefrBadge, cefrLevel === lvl && styles.cefrBadgeActive]} 
              onPress={() => handleLevelChange(lvl)}
            >
              <Text style={[styles.cefrText, cefrLevel === lvl && styles.cefrTextActive]}>{lvl}</Text>
            </TouchableOpacity>
          ))}
        </View>

        {bossData ? (
          <>
            {/* THANH MÁU BOSS & NÚT ĐỔI BOSS 0MS */}
            <View style={styles.bossCard}>
              <View style={styles.bossHeaderRow}>
                <Text style={styles.bossName}>{bossData.bossAvatar} {bossData.bossName} ({bossData.bossTitle}) [{cefrLevel}]</Text>
                <TouchableOpacity style={styles.switchBossBtn} onPress={handleNextBoss} activeOpacity={0.7}>
                  <Text style={styles.switchBossBtnText}>🔄 ĐỔI BOSS (0MS)</Text>
                </TouchableOpacity>
              </View>

              <View style={styles.hpBarBg}>
                <View style={[styles.hpBarFill, { width: `${(currentHp / (bossData.maxHp || 100)) * 100}%` }]} />
              </View>

              <Text style={styles.hpText}>
                {currentHp > 0 ? `HP: ${currentHp} / ${bossData.maxHp || 100}` : '☠ BOSS ĐÃ BỊ HẠ GỤC! (+100 XP)'}
              </Text>
            </View>

            {/* CÂU HỎI SHADOWING */}
            <View style={styles.phraseCard}>
              <Text style={styles.phraseText}>"{bossData.bossChallengeEn}"</Text>
              {bossData.bossChallengeVi && (
                <Text style={styles.promptViText}>👉 Dịch: "{bossData.bossChallengeVi}"</Text>
              )}
              <Text style={styles.tipText}>📌 Từ khóa ghi điểm: {bossData.keyTargetPhrases?.join(', ')}</Text>

              <TouchableOpacity 
                style={[styles.audioBtn, isPlayingAudio && styles.audioBtnPlaying]} 
                onPress={handlePlaySample}
                disabled={isPlayingAudio}
              >
                <Text style={styles.audioBtnText}>
                  {isPlayingAudio ? '🔊 SHADOW BOSS ĐANG PHÁT ÂM...' : '📢 NGHE GIỌNG MẪU CHUẨN AI'}
                </Text>
              </TouchableOpacity>
            </View>

            {currentHp > 0 ? (
              <View style={{ width: '100%', marginBottom: 15 }}>
                <TouchableOpacity 
                  style={[styles.recordBtn, isRecording && styles.recordBtnActive]} 
                  onPress={handleToggleRecord}
                >
                  <Text style={styles.recordText}>
                    {isRecording 
                      ? '🔴 ĐANG SHADOWING... (BẤM DỪNG HOẶC CHỜ)' 
                      : hasRecordedCurrentSession 
                      ? '✅ ĐÃ CÓ BẢN SHADOWING (BẤM ĐỂ THU LẠI)' 
                      : '🎙️ BẤM THU ÂM SHADOWING'}
                  </Text>
                </TouchableOpacity>

                {isAnalyzing ? (
                  <View style={{ alignItems: 'center', marginVertical: 10 }}>
                    <ActivityIndicator size="large" color="#39FF14" />
                    <Text style={{ color: '#39FF14', fontSize: 10, marginTop: 4, fontWeight: 'bold' }}>
                      ⚡ AI ĐANG PHÂN TÍCH GIỌNG SHADOWING...
                    </Text>
                  </View>
                ) : (
                  <TouchableOpacity 
                    style={[styles.attackBtn, (!hasRecordedCurrentSession || isRecording) && styles.attackBtnDisabled]} 
                    onPress={handleAttackBoss}
                    disabled={!hasRecordedCurrentSession || isRecording}
                  >
                    <Text style={styles.attackBtnText}>
                      {hasRecordedCurrentSession ? '⚔ TẤN CÔNG BOSS AI (CHẤM ĐIỂM GIỌNG)' : '🔒 BẮT BUỘC THU ÂM ĐỂ TẤN CÔNG'}
                    </Text>
                  </TouchableOpacity>
                )}

                {lastDamage !== null && (
                  <View style={{ marginTop: 12, alignItems: 'center' }}>
                    <Text style={styles.damageText}>
                      {lastDamage > 0 ? `💥 TẤN CÔNG THÀNH CÔNG: SÁT THƯƠNG -${lastDamage} HP!` : `🛡️ BOSS ĐÃ ĐỠ ĐƯỢC ĐÒN!`}
                    </Text>
                    {lastFeedback ? <Text style={styles.feedbackText}>💡 Nhận xét AI: {lastFeedback}</Text> : null}
                  </View>
                )}
              </View>
            ) : (
              <TouchableOpacity style={styles.refreshBtn} onPress={handleNextBoss}>
                <Text style={styles.refreshText}>🔄 THÁCH ĐẤU BOSS TIẾP THEO ({cefrLevel})</Text>
              </TouchableOpacity>
            )}
          </>
        ) : (
          <ActivityIndicator size="large" color="#FF007F" style={{ marginTop: 40 }} />
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#05020D', padding: 20, paddingTop: 50 },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 15 },
  backBtn: { padding: 8, backgroundColor: '#0D0620', borderRadius: 8, borderWidth: 1, borderColor: '#FF007F' },
  backText: { color: '#FF007F', fontSize: 10, fontWeight: 'bold' },
  title: { color: '#FF007F', fontSize: 12, fontWeight: '900' },
  leaderboardHeaderBtn: { paddingVertical: 6, paddingHorizontal: 10, backgroundColor: '#1A0B2E', borderRadius: 8, borderWidth: 1, borderColor: '#FFD700' },
  leaderboardHeaderText: { color: '#FFD700', fontSize: 10, fontWeight: '900' },
  sectionLabel: { color: '#FFD700', fontSize: 10, fontWeight: 'bold', alignSelf: 'flex-start', marginBottom: 6 },
  cefrRow: { flexDirection: 'row', justifyContent: 'space-between', width: '100%', marginBottom: 15 },
  cefrBadge: { backgroundColor: '#0D0620', paddingVertical: 6, paddingHorizontal: 10, borderRadius: 6, borderWidth: 1, borderColor: '#332255' },
  cefrBadgeActive: { backgroundColor: '#39FF14', borderColor: '#39FF14' },
  cefrText: { color: '#8888AA', fontSize: 10, fontWeight: 'bold' },
  cefrTextActive: { color: '#000' },
  bossCard: { backgroundColor: '#1A0B2E', padding: 16, borderRadius: 16, borderWidth: 2, borderColor: '#FF007F', width: '100%', alignItems: 'center', marginBottom: 15 },
  bossHeaderRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', width: '100%', marginBottom: 8 },
  bossName: { color: '#FFD700', fontSize: 13, fontWeight: '900', flex: 1, marginRight: 6 },
  switchBossBtn: { backgroundColor: '#0D0620', paddingVertical: 4, paddingHorizontal: 8, borderRadius: 6, borderWidth: 1, borderColor: '#00FFFF' },
  switchBossBtnText: { color: '#00FFFF', fontSize: 8.5, fontWeight: 'bold' },
  hpBarBg: { width: '100%', height: 12, backgroundColor: '#331122', borderRadius: 6, overflow: 'hidden', marginBottom: 6 },
  hpBarFill: { height: '100%', backgroundColor: '#FF0055' },
  hpText: { color: '#FFF', fontSize: 11, fontWeight: 'bold' },
  phraseCard: { backgroundColor: '#0D0620', padding: 18, borderRadius: 16, borderWidth: 2, borderColor: '#00FFFF', width: '100%', alignItems: 'center', marginBottom: 15 },
  phraseText: { color: '#FFF', fontSize: 15, fontWeight: '800', textAlign: 'center', lineHeight: 22, marginBottom: 8 },
  promptViText: { color: '#FFD700', fontSize: 11, fontWeight: '600', textAlign: 'center', marginBottom: 8, fontStyle: 'italic' },
  tipText: { color: '#39FF14', fontSize: 10, textAlign: 'center', marginBottom: 12, fontWeight: 'bold' },
  audioBtn: { backgroundColor: '#1A0B2E', paddingVertical: 10, paddingHorizontal: 16, borderRadius: 8, borderWidth: 1, borderColor: '#00FFFF' },
  audioBtnPlaying: { backgroundColor: '#00FFFF' },
  audioBtnText: { color: '#00FFFF', fontSize: 10, fontWeight: '900' },
  recordBtn: { backgroundColor: '#1A0B2E', padding: 12, borderRadius: 10, borderWidth: 2, borderColor: '#FF007F', width: '100%', alignItems: 'center', marginBottom: 10 },
  recordBtnActive: { backgroundColor: '#FF0055' },
  recordText: { color: '#FFF', fontSize: 10, fontWeight: '900' },
  attackBtn: { backgroundColor: '#FF007F', padding: 14, borderRadius: 12, width: '100%', alignItems: 'center' },
  attackBtnDisabled: { backgroundColor: '#331122', opacity: 0.2 },
  attackBtnText: { color: '#FFF', fontSize: 11, fontWeight: '900' },
  damageText: { color: '#FFD700', fontSize: 12, fontWeight: '900', textAlign: 'center' },
  feedbackText: { color: '#00FFFF', fontSize: 10, marginTop: 4, textAlign: 'center', fontStyle: 'italic' },
  refreshBtn: { backgroundColor: '#39FF14', padding: 14, borderRadius: 12, width: '100%', alignItems: 'center' },
  refreshText: { color: '#000', fontSize: 11, fontWeight: '900' }
});