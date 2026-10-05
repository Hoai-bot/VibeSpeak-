// src/screens/ShadowBossScreen.tsx
import React, { useState, useEffect, useRef } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView, ActivityIndicator } from 'react-native';
import { generateShadowBoss, ShadowBossItem } from '../services/drills/station3Service';
import { updateUserProgress } from '../services/userService';
import { playBossVoice } from '../services/bossTtsService';
import { evaluateSpeaking } from '../services/arena/assessmentService';

interface Props {
  onBack: () => void;
}

export default function ShadowBossScreen({ onBack }: Props) {
  const [bossData, setBossData] = useState<ShadowBossItem | null>(null);
  const [currentHp, setCurrentHp] = useState<number>(100);
  const [loading, setLoading] = useState<boolean>(false);
  const [isPlayingAudio, setIsPlayingAudio] = useState<boolean>(false);

  // QUẢN LÝ MICRO & CỜ BẢO VỆ GHI ÂM TẠI TRẬN HIỆN TẠI
  const [isRecording, setIsRecording] = useState<boolean>(false);
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null);
  const [hasRecordedCurrentSession, setHasRecordedCurrentSession] = useState<boolean>(false);
  const [isAnalyzing, setIsAnalyzing] = useState<boolean>(false);
  const [lastDamage, setLastDamage] = useState<number | null>(null);
  const [lastFeedback, setLastFeedback] = useState<string>('');

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);

  const resetBossSession = () => {
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

  const loadBoss = async () => {
    setLoading(true);
    resetBossSession();
    const data = await generateShadowBoss('B2');
    setBossData(data);
    setCurrentHp(data.bossHp || 100);
    setLoading(false);
  };

  useEffect(() => {
    loadBoss();
    return () => resetBossSession();
  }, []);

  const handlePlaySample = async () => {
    if (!bossData) return;
    setIsPlayingAudio(true);
    try {
      await playBossVoice(bossData.phrase, 'onyx');
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
            
            // 🎯 ĐÃ FIX: Hạ ngưỡng size Blob xuống 800 bytes cho bài Shadowing câu ngắn
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

  // ⚔️ TẤN CÔNG BOSS DỰA TRÊN ĐIỂM CHẤM THỰC TẾ
  const handleAttackBoss = async () => {
    if (!hasRecordedCurrentSession || !audioBlob || audioBlob.size <= 800) {
      alert("🔒 BẢO VỆ TẤN CÔNG: Bạn chưa thu âm giọng nói Shadowing! Hãy bấm nút Micro để nói đuổi theo câu thoại trước.");
      return;
    }

    setIsAnalyzing(true);
    setLastFeedback('');

    try {
      // 🎯 ĐÃ FIX: Chỉ truyền DUY NHẤT câu thoại mẫu của Boss
      const promptTarget = (bossData?.phrase || '').trim();
      const evalResult = await evaluateSpeaking(audioBlob, 'B2', undefined, promptTarget);

      if (!evalResult.transcript || evalResult.score === 0) {
        setLastDamage(0);
        setLastFeedback("❌ AI không nghe rõ câu Shadowing. Vui lòng đọc to và rõ ràng hơn!");
        alert("🛡️️ TẤN CÔNG THẤT BẠI: Bạn chưa đọc rõ câu thoại Shadowing! Vui lòng bấm micro và đọc lại.");
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

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={onBack} style={styles.backBtn}>
          <Text style={styles.backText}>🔙 MAP</Text>
        </TouchableOpacity>
        <Text style={styles.title}>👹 TRẠM 3: SHADOW BOSS RAID</Text>
      </View>

      <ScrollView contentContainerStyle={{ alignItems: 'center', width: '100%', paddingBottom: 30 }}>
        {loading ? (
          <ActivityIndicator size="large" color="#FF007F" style={{ marginTop: 40 }} />
        ) : bossData ? (
          <>
            {/* THANH MÁU BOSS */}
            <View style={styles.bossCard}>
              <Text style={styles.bossName}>{bossData.bossName}</Text>
              <View style={styles.hpBarBg}>
                <View style={[styles.hpBarFill, { width: `${currentHp}%` }]} />
              </View>

              <Text style={styles.hpText}>
                {currentHp > 0 ? `HP: ${currentHp} / 100` : '☠ BOSS ĐÃ BỊ HẠ GỤC! (+100 XP)'}
              </Text>
            </View>

            {/* CÂU HỎI SHADOWING */}
            <View style={styles.phraseCard}>
              <Text style={styles.phraseText}>"{bossData.phrase}"</Text>
              <Text style={styles.ipaText}>🔊 IPA: {bossData.phonetics}</Text>
              <Text style={styles.tipText}>📌 Nhịp điệu: {bossData.rhythmTip}</Text>

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
                      {hasRecordedCurrentSession ? '⚔️ TẤN CÔNG BOSS AI (CHẤM ĐIỂM GIỌNG)' : '🔒 BẮT BUỘC THU ÂM ĐỂ TẤN CÔNG'}
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
              <TouchableOpacity style={styles.refreshBtn} onPress={loadBoss}>
                <Text style={styles.refreshText}>🔄 THÁCH ĐẤU BOSS MỚI</Text>
              </TouchableOpacity>
            )}
          </>
        ) : null}
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
  bossCard: { backgroundColor: '#1A0B2E', padding: 16, borderRadius: 16, borderWidth: 2, borderColor: '#FF007F', width: '100%', alignItems: 'center', marginBottom: 15 },
  bossName: { color: '#FFD700', fontSize: 14, fontWeight: '900', marginBottom: 8 },
  hpBarBg: { width: '100%', height: 12, backgroundColor: '#331122', borderRadius: 6, overflow: 'hidden', marginBottom: 6 },
  hpBarFill: { height: '100%', backgroundColor: '#FF0055' },
  hpText: { color: '#FFF', fontSize: 11, fontWeight: 'bold' },
  phraseCard: { backgroundColor: '#0D0620', padding: 18, borderRadius: 16, borderWidth: 2, borderColor: '#00FFFF', width: '100%', alignItems: 'center', marginBottom: 15 },
  phraseText: { color: '#FFF', fontSize: 15, fontWeight: '800', textAlign: 'center', lineHeight: 22, marginBottom: 8 },
  ipaText: { color: '#39FF14', fontSize: 11, fontWeight: 'bold', marginBottom: 6 },
  tipText: { color: '#AAAABB', fontSize: 10, textAlign: 'center', marginBottom: 12 },
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