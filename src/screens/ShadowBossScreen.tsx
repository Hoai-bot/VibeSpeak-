// src/screens/ShadowBossScreen.tsx
import React, { useState, useEffect, useRef } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView, ActivityIndicator, Alert } from 'react-native';
import { generateShadowBoss, ShadowBossItem } from '../services/drills/station3Service';
import { updateUserProgress } from '../services/userService';

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
  const [hasRecordedCurrentSession, setHasRecordedCurrentSession] = useState<boolean>(false); // CỜ BẢO VỆ CHẶT CHẼ
  const [isAnalyzing, setIsAnalyzing] = useState<boolean>(false);
  const [lastDamage, setLastDamage] = useState<number | null>(null);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);

  // RESET SẠCH DỮ LIỆU KHI TẢI BOSS MỚI
  const resetBossSession = () => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
      try { mediaRecorderRef.current.stop(); } catch (e) {}
    }
    setIsRecording(false);
    setAudioBlob(null);
    setHasRecordedCurrentSession(false); // HUỶ CỜ BẢN THU
    setLastDamage(null);
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

  // 🔊 PHÁT ÂM MẪU AI TỰ NHIÊN (LỌC GIỌNG HIGH-QUALITY & TỐC ĐỘ 0.8)
  const handlePlaySample = () => {
    if (!bossData) return;
    setIsPlayingAudio(true);

    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      const voices = window.speechSynthesis.getVoices();

      // Lọc giọng tiếng Anh chuẩn tự nhiên
      const selectedVoice = voices.find(v => 
        v.lang.startsWith('en') && (
          v.name.includes('Natural') || 
          v.name.includes('Google US English') || 
          v.name.includes('Jenny') || 
          v.name.includes('Samantha') || 
          v.name.includes('Ava')
        )
      ) || voices.find(v => v.lang === 'en-US' || v.lang === 'en-GB') || voices[0];

      const utt = new SpeechSynthesisUtterance(bossData.phrase);
      utt.lang = 'en-US';
      utt.rate = 0.82; // Tốc độ tự nhiên cho bài Shadowing
      utt.pitch = 1.0;
      if (selectedVoice) utt.voice = selectedVoice;

      utt.onend = () => setIsPlayingAudio(false);
      utt.onerror = () => setIsPlayingAudio(false);
      window.speechSynthesis.speak(utt);
    } else {
      setTimeout(() => setIsPlayingAudio(false), 1200);
    }
  };

  // 🎙️ QUẢN LÝ MICRO THU ÂM THỰC TẾ
  const handleToggleRecord = async () => {
    if (!isRecording) {
      try {
        if (typeof navigator !== 'undefined' && navigator.mediaDevices) {
          const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
          const mediaRecorder = new MediaRecorder(stream);
          mediaRecorderRef.current = mediaRecorder;
          audioChunksRef.current = [];

          mediaRecorder.ondataavailable = (e) => {
            if (e.data && e.data.size > 0) audioChunksRef.current.push(e.data);
          };

          mediaRecorder.onstop = () => {
            const blob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
            
            // BẮT BỘC DUNG LƯỢNG FILE ÂM THANH THẬT > 4000 BYTES
            if (blob.size > 4000) {
              setAudioBlob(blob);
              setHasRecordedCurrentSession(true); // BẬT CỜ BẢN THU HỢP LỆ
            } else {
              setAudioBlob(null);
              setHasRecordedCurrentSession(false);
              if (typeof window !== 'undefined') {
                alert("⚠️ Bản thu âm quá ngắn hoặc chưa phát ra tiếng! Vui lòng Shadowing rõ ràng hơn.");
              }
            }
            stream.getTracks().forEach(t => t.stop());
          };

          mediaRecorder.start();
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

  // ⚔️ TẤN CÔNG BOSS (BẢO VỆ BẰNG CỜ XÁC NHẬN)
  const handleAttackBoss = () => {
    // 🛑 KHÓA TUYỆT ĐỐI NẾU CHƯA CÓ BẢN THU THỰC TẾ
    if (!hasRecordedCurrentSession || !audioBlob || audioBlob.size <= 4000) {
      if (typeof window !== 'undefined') {
        alert("🔒 KHÔNG THỂ TẤN CÔNG: Bạn chưa thực hiện thu âm Shadowing! Hãy bấm nút Micro để nói đuổi theo trước.");
      }
      return; // NGẮT LẬP TỨC
    }

    setIsAnalyzing(true);
    setTimeout(() => {
      const damage = Math.floor(Math.random() * 25) + 25;
      const newHp = Math.max(0, currentHp - damage);
      setCurrentHp(newHp);
      setLastDamage(damage);
      setIsAnalyzing(false);
      
      // Xóa cờ bản thu cũ sau lượt tấn công để bắt buộc thu lượt mới
      setAudioBlob(null);
      setHasRecordedCurrentSession(false);

      if (newHp === 0) {
        updateUserProgress(3, 100, true);
      }
    }, 1500);
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
                {currentHp > 0 ? `HP: ${currentHp} / 100` : '☠️️ BOSS ĐÃ BỊ HẠ GỤC! (+100 XP)'}
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
                  {isPlayingAudio ? '🔊 AI ĐANG ĐỌC MẪU...' : '📢 NGHE GIỌNG MẪU CHUẨN AI'}
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
                      ? '🔴 ĐANG SHADOWING... (BẤM DỪNG)' 
                      : hasRecordedCurrentSession 
                      ? '✅ ĐÃ CÓ BẢN SHADOWING (BẤM THU LẠI)' 
                      : '🎙️ BẤM THU ÂM SHADOWING'}
                  </Text>
                </TouchableOpacity>

                {isAnalyzing ? (
                  <ActivityIndicator size="large" color="#39FF14" style={{ marginVertical: 10 }} />
                ) : (
                  <TouchableOpacity 
                    style={[styles.attackBtn, (!hasRecordedCurrentSession || isRecording) && styles.attackBtnDisabled]} 
                    onPress={handleAttackBoss}
                    disabled={!hasRecordedCurrentSession || isRecording}
                  >
                    <Text style={styles.attackBtnText}>
                      {hasRecordedCurrentSession ? '⚔️ TẤN CÔNG BOSS AI' : '🔒 THU ÂM ĐỂ TẤN CÔNG'}
                    </Text>
                  </TouchableOpacity>
                )}

                {lastDamage !== null && (
                  <Text style={styles.damageText}>💥 BẠN ĐÃ GÂY {lastDamage} SÁT THƯƠNG!</Text>
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
  damageText: { color: '#FFD700', fontSize: 12, fontWeight: '900', marginTop: 10, textAlign: 'center' },
  refreshBtn: { backgroundColor: '#39FF14', padding: 14, borderRadius: 12, width: '100%', alignItems: 'center' },
  refreshText: { color: '#000', fontSize: 11, fontWeight: '900' }
});