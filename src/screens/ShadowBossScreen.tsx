// src/screens/ShadowBossScreen.tsx
import React, { useState, useEffect, useRef } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView, ActivityIndicator } from 'react-native';
import { 
  generateShadowBoss, 
  getInstantShadowBoss, 
  clearStation3History 
} from '../services/drills/station3Service';
import { BossScenarioItem } from '../data/station3/bossScenarios';
import { updateUserProgress } from '../services/userService';
import { playBossVoice } from '../services/bossTtsService';
import { evaluateSpeaking } from '../services/arena/assessmentService';
import LeaderboardScreen from './LeaderboardScreen';

interface Props {
  onBack: () => void;
}

export default function ShadowBossScreen({ onBack }: Props) {
  const [cefrLevel, setCefrLevel] = useState<string>('B2');
  const [bossData, setBossData] = useState<BossScenarioItem | null>(null);
  const [currentHp, setCurrentHp] = useState<number>(100);
  const [loading, setLoading] = useState<boolean>(false);
  const [isPlayingAudio, setIsPlayingAudio] = useState<boolean>(false);
  const [showLeaderboard, setShowLeaderboard] = useState<boolean>(false);

  // QUẢN LÝ MICRO & CỜ BẢO VỆ GHI ÂM TẠI TRẬN HIỆN TẠI
  const [isRecording, setIsRecording] = useState<boolean>(false);
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null);
  const [hasRecordedCurrentSession, setHasRecordedCurrentSession] = useState<boolean>(false);
  const [isAnalyzing, setIsAnalyzing] = useState<boolean>(false);
  const [lastDamage, setLastDamage] = useState<number | null>(null);
  const [lastFeedback, setLastFeedback] = useState<string>('');

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);

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

  const loadBoss = async (level: string) => {
    resetBossSession();

    // 1. Nạp ngay Flash Data Local để giao diện có ngay dữ liệu (0ms delay)
    const instantBoss = getInstantShadowBoss(level);
    setBossData(instantBoss);
    setCurrentHp(instantBoss.maxHp || 100);

    // 2. Gọi AI tạo ngầm Boss mới
    setLoading(true);
    try {
      const aiBoss = await generateShadowBoss(level);
      if (aiBoss && aiBoss.bossChallengeEn) {
        setBossData(aiBoss);
        setCurrentHp(aiBoss.maxHp || 100);
      }
    } catch (err) {
      console.warn("Dùng Flash Boss cho Trạm 3:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleLevelChange = (newLevel: string) => {
    if (newLevel === cefrLevel) return;
    clearStation3History();
    setCefrLevel(newLevel);
  };

  useEffect(() => {
    loadBoss(cefrLevel);
    return () => resetBossSession();
  }, [cefrLevel]);

  // 📢 PHÁT GIỌNG NÓI MẪU AI
  const handlePlaySample = async () => {
    if (!bossData || !bossData.bossChallengeEn) return;
    setIsPlayingAudio(true);
    try {
      await playBossVoice(bossData.bossChallengeEn, 'onyx');
    } catch (error) {
      console.error("Lỗi phát audio Boss:", error);
    } finally {
      setIsPlayingAudio(false);
    }
  };

  const handleBossAttack = (bossDialogueText: string) => {
    playBossVoice(bossDialogueText, 'onyx');
  };

  const handleToggleRecord = async () => {
    stopAllAudio();

    if (!isRecording) {
      try {
        if (typeof navigator !== 'undefined' && navigator.mediaDevices) {
          const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
          
          let options = {};
          if (typeof MediaRecorder !== 'undefined') {
            if (MediaRecorder.isTypeSupported('audio/webm;codecs=opus')) {
              options = { mimeType: 'audio/webm;codecs=opus' };
            } else if (MediaRecorder.isTypeSupported('audio/mp4')) {
              options = { mimeType: 'audio/mp4' };
            }
          }

          const mediaRecorder = new MediaRecorder(stream, options);
          mediaRecorderRef.current = mediaRecorder;
          audioChunksRef.current = [];

          mediaRecorder.ondataavailable = (e) => {
            if (e.data && e.data.size > 0) audioChunksRef.current.push(e.data);
          };

          mediaRecorder.onstop = () => {
            const mimeType = mediaRecorder.mimeType || 'audio/webm';
            const blob = new Blob(audioChunksRef.current, { type: mimeType });
            
            if (blob.size > 800) {
              setAudioBlob(blob);
              setHasRecordedCurrentSession(true);
            } else {
              setAudioBlob(null);
              setHasRecordedCurrentSession(false);
              alert("⚠️ Bạn chưa nói hoặc bản thu quá ngắn! Vui lòng bấm giữ nút và Shadowing rõ ràng.");
            }
            stream.getTracks().forEach(t => t.stop());
          };

          mediaRecorder.start(100);
          setIsRecording(true);
          setAudioBlob(null);
          setHasRecordedCurrentSession(false);
        }
      } catch {
        alert("🔒 Lỗi Micro: Hãy cấp quyền Microphone trên trình duyệt để Shadowing!");
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
      alert("🔒 BẢO VỆ TẤN CÔNG: Bạn chưa thu âm giọng nói Shadowing! Hãy bấm nút Micro để nói đuổi theo câu thoại trước.");
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
        alert("🛡 TẤN CÔNG THẤT BẠI: Bạn chưa đọc rõ câu thoại Shadowing! Vui lòng bấm micro và đọc lại.");
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
      alert("⚠️ Lỗi kết nối mạng khi chấm điểm Shadowing. Vui lòng thử lại!");
    } finally {
      setIsAnalyzing(false);
      setAudioBlob(null);
      setHasRecordedCurrentSession(false);
    }
  };

  // 🏆 ĐIỀU KIỆN RENDER MÀN HÌNH BẢNG XẾP HẠNG
  if (showLeaderboard) {
    const userDamage = bossData ? ((bossData.maxHp || 100) - currentHp) * 50 : 3500;
    return (
      <LeaderboardScreen 
        onBack={() => setShowLeaderboard(false)} 
        userXp={userDamage > 0 ? userDamage : 3500} 
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
            {/* THANH MÁU BOSS */}
            <View style={styles.bossCard}>
              <Text style={styles.bossName}>{bossData.bossAvatar} {bossData.bossName} ({bossData.bossTitle}) [{cefrLevel}]</Text>
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
              <TouchableOpacity style={styles.refreshBtn} onPress={() => loadBoss(cefrLevel)}>
                <Text style={styles.refreshText}>🔄 THÁCH ĐẤU BOSS MỚI ({cefrLevel})</Text>
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
  bossName: { color: '#FFD700', fontSize: 14, fontWeight: '900', marginBottom: 8 },
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