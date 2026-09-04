import React, { useState, useRef } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ActivityIndicator, Modal } from 'react-native';
import confetti from 'canvas-confetti';
import { useBossRaidRealtime } from '../hooks/useBossRaidRealtime';
import { transcribeAndGradeAudio } from '../services/groqClient';

const SHADOW_PROMPT = "The neon lights in this sector always glitch when the rain is heavy.";

interface Props {
  onBack: () => void;
  onNavigateToOasis?: (bossSentence: string) => void;
}

export default function BossRaidScreen({ onBack, onNavigateToOasis }: Props) {
  const { bossName, maxHp, currentHp, isDefeated, attackBoss } = useBossRaidRealtime();

  const [isRecording, setIsRecording] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [lastDamage, setLastDamage] = useState<{ score: number; isCrit: boolean; text: string } | null>(null);

  // 🎯 STATE CỨU HỘ OASIS TẠI TRẠM BOSS RAID
  const [missCount, setMissCount] = useState<number>(0);
  const [showOasisModal, setShowOasisModal] = useState<boolean>(false);

  const mediaRecorderRef = useRef<any>(null);
  const audioChunksRef = useRef<any[]>([]);

  // 🔊 1. Phát âm thanh câu mẫu Bóng Ma Ma Mị (Cyberpunk Voice Engine)
  const playBossVoice = () => {
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(SHADOW_PROMPT);
      utterance.lang = 'en-US';
      utterance.rate = 0.82; // Chậm rãi ma mị
      utterance.pitch = 0.65; // Trầm giọng xuống

      const voices = window.speechSynthesis.getVoices();
      const ghostVoice = voices.find(
        (v) =>
          v.lang.includes('en') &&
          (v.name.includes('Natural') ||
           v.name.includes('Neural') ||
           v.name.includes('Google') ||
           v.name.includes('Premium'))
      ) || voices.find((v) => v.lang.startsWith('en'));

      if (ghostVoice) utterance.voice = ghostVoice;
      window.speechSynthesis.speak(utterance);
    } else {
      alert('Trình duyệt của bạn không hỗ trợ phát âm thanh AI!');
    }
  };

  // 🎙️ 2. Khởi tạo thiết bị ghi âm
  const startRecording = async () => {
    try {
      if (typeof navigator === 'undefined' || !navigator.mediaDevices) {
        alert('Trình duyệt không hỗ trợ ghi âm!');
        return;
      }
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mimeType = MediaRecorder.isTypeSupported('audio/webm') ? 'audio/webm' : 'audio/mp4';
      mediaRecorderRef.current = new MediaRecorder(stream, { mimeType });
      audioChunksRef.current = [];

      mediaRecorderRef.current.ondataavailable = (event: any) => {
        if (event.data && event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorderRef.current.start(100);
      setIsRecording(true);
    } catch (err) {
      alert('Không thể truy cập Micro! Vui lòng kiểm tra quyền trình duyệt.');
    }
  };

  // ⏹️ 3. Dừng ghi âm & Xử lý AI (Bọc Promise Async chuẩn hóa)
  const stopRecording = async () => {
    const mediaRecorder = mediaRecorderRef.current;
    if (!mediaRecorder || mediaRecorder.state === 'inactive') return;

    setIsRecording(false);
    setIsAnalyzing(true);

    // Chờ sự kiện onstop trả về dữ liệu âm thanh dạng Blob
    const processAudio = new Promise<Blob>((resolve) => {
      mediaRecorder.onstop = () => {
        const audioBlob = new Blob(audioChunksRef.current, {
          type: mediaRecorder.mimeType || 'audio/webm',
        });
        resolve(audioBlob);
      };
      mediaRecorder.stop();
    });

    try {
      // Giải phóng tài nguyên Micro
      if (mediaRecorder.stream) {
        mediaRecorder.stream.getTracks().forEach((track: any) => track.stop());
      }

      // Đợi dữ liệu Blob và gửi lên Groq AI
      const audioBlob = await processAudio;
      const res = await transcribeAndGradeAudio(audioBlob, SHADOW_PROMPT);

      // Tính sát thương & Critical Hit
      const isCrit = res.score >= 85;
      const damageDealt = isCrit ? res.score * 2 : res.score;

      setLastDamage({ score: damageDealt, isCrit, text: res.text });
      await attackBoss(damageDealt);

      if (isCrit) {
        confetti({
          particleCount: 100,
          spread: 70,
          origin: { y: 0.6 },
          colors: ['#FF0055', '#FFD700', '#39FF14'],
        });
      }

      // 🎯 KÍCH HOẠT POPUP CỨU HỘ KHI ĐIỂM < 50 TRONG 2 LẦN LÊN TIẾP
      if (res.score < 50) {
        setMissCount((prev) => {
          const next = prev + 1;
          if (next >= 2) {
            setShowOasisModal(true);
          }
          return next;
        });
      } else {
        setMissCount(0);
      }
    } catch (error) {
      console.error('❌ Lỗi xử lý thu âm:', error);
      alert('Có lỗi khi phân tích giọng nói. Vui lòng thử lại!');
    } finally {
      setIsAnalyzing(false);
    }
  };

  const hpPercent = Math.max(0, Math.min(100, (currentHp / maxHp) * 100));

  return (
    <View style={styles.container}>
      <TouchableOpacity onPress={onBack} style={styles.backButton}>
        <Text style={styles.backText}>🔙 QUAY LẠI SẢNH CHÍNH</Text>
      </TouchableOpacity>

      <Text style={styles.header}>👾 TRẠM 3: CYBER BOSS RAID 👾</Text>

      {/* THẺ BOSS BÓNG MA */}
      <View style={styles.bossCard}>
        <Text style={styles.bossTitle}>{bossName}</Text>
        <Text style={styles.hpText}>HP: {currentHp} / {maxHp}</Text>
        
        <View style={styles.hpBarBg}>
          <View style={[styles.hpBarFill, { width: `${hpPercent}%` }]} />
        </View>
      </View>

      {/* NHIỆM VỤ THÁCH ĐẤU BÓNG MA */}
      <View style={styles.promptBox}>
        <Text style={styles.promptLabel}>📜 CÂU THOẠI BÓNG MA (READ ALOUD):</Text>
        <Text style={styles.promptText}>"{SHADOW_PROMPT}"</Text>

        <TouchableOpacity style={styles.listenBtn} onPress={playBossVoice}>
          <Text style={styles.listenText}>🔊 NGHE GIỌNG MẪU BÓNG MA</Text>
        </TouchableOpacity>
      </View>

      {/* KHU VỰC THU ÂM & TẤN CÔNG */}
      {!isDefeated ? (
        <View style={styles.actionBox}>
          {isAnalyzing ? (
            <View style={{ alignItems: 'center' }}>
              <ActivityIndicator size="large" color="#FF007F" />
              <Text style={styles.analyzingText}>> Đang gửi dữ liệu lên AI so khớp điểm số...</Text>
            </View>
          ) : (
            <TouchableOpacity
              style={[styles.attackBtn, isRecording && styles.recordingActive]}
              onPress={isRecording ? stopRecording : startRecording}
            >
              <Text style={styles.attackText}>
                {isRecording ? '⏹️ DỪNG & SO KẾT QUẢ' : '🎙️ THÁCH ĐẤU BÓNG MA'}
              </Text>
            </TouchableOpacity>
          )}

          {lastDamage && !isAnalyzing && (
            <View style={styles.resultBox}>
              <Text style={{ color: '#00FFFF', fontSize: 13, marginBottom: 5 }}>
                AI Nhận diện: "{lastDamage.text}"
              </Text>
              <Text style={{ color: lastDamage.isCrit ? '#FFD700' : '#39FF14', fontSize: 18, fontWeight: 'bold' }}>
                {lastDamage.isCrit ? '💥 CRITICAL HIT!' : '⚔️ SÁT THƯƠNG:'} -{lastDamage.score} HP
              </Text>
            </View>
          )}
        </View>
      ) : (
        <View style={styles.victoryBox}>
          <Text style={{ color: '#39FF14', fontSize: 26, fontWeight: 'bold' }}>🎉 BOSS SLAIN!</Text>
          <Text style={{ color: '#FFD700', marginTop: 10, fontSize: 15 }}>BẠN ĐÃ SOÁN NGÔI THÀNH CÔNG BÓNG MA!</Text>
        </View>
      )}

      {/* 🌴 MODAL CỨU HỘ OASIS CHO TRẠM BOSS RAID */}
      <Modal visible={showOasisModal} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTag}>🚨 TÍN HIỆU CẤP CỨU (LOW DAMAGE)</Text>
            <Text style={styles.modalTitle}>🌴 OASIS: TẬP PHÁT ÂM MẬT LỆNH</Text>
            <Text style={styles.modalDesc}>
              Sát thương tạo ra chưa đủ lớn để hạ gục Boss? Hãy sang Trạm Oasis để luyện tập lại khẩu hình và ngữ điệu cho câu lệnh này nhé!
            </Text>

            <TouchableOpacity
              style={styles.modalOasisBtn}
              onPress={() => {
                setShowOasisModal(false);
                setMissCount(0);
                if (onNavigateToOasis) {
                  onNavigateToOasis(`Ghost Shadowing: ${SHADOW_PROMPT}`);
                }
              }}
            >
              <Text style={styles.modalOasisBtnText}>🌴 CHUYỂN SANG OASIS CỨU HỘ</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.modalCancelBtn}
              onPress={() => {
                setShowOasisModal(false);
                setMissCount(0);
              }}
            >
              <Text style={styles.modalCancelText}>Ở lại tiếp tục chiến Boss</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#05020D', padding: 20, paddingTop: 40 },
  backButton: { marginBottom: 15, alignSelf: 'flex-start', padding: 8, backgroundColor: '#0D0620', borderRadius: 6, borderWidth: 1, borderColor: '#FF007F' },
  backText: { color: '#FF007F', fontSize: 12, fontWeight: 'bold', fontFamily: 'Courier New' },
  header: { color: '#FF007F', fontSize: 18, fontWeight: 'bold', textAlign: 'center', marginBottom: 15, fontFamily: 'Courier New' },
  bossCard: { backgroundColor: '#0D0620', padding: 15, borderRadius: 12, borderWidth: 2, borderColor: '#FF0055', alignItems: 'center', marginBottom: 15 },
  bossTitle: { color: '#FF0055', fontSize: 20, fontWeight: 'bold', marginBottom: 5, fontFamily: 'Courier New' },
  hpText: { color: '#FFF', fontSize: 13, fontWeight: 'bold', marginBottom: 8, fontFamily: 'Courier New' },
  hpBarBg: { width: '100%', height: 16, backgroundColor: '#220011', borderRadius: 8, overflow: 'hidden', borderWidth: 1, borderColor: '#FF0055' },
  hpBarFill: { height: '100%', backgroundColor: '#FF0055' },
  promptBox: { backgroundColor: '#0D0620', padding: 15, borderRadius: 10, borderWidth: 1, borderColor: '#00FFFF', marginBottom: 15, alignItems: 'center' },
  promptLabel: { color: '#00FFFF', fontSize: 12, fontWeight: 'bold', marginBottom: 6, fontFamily: 'Courier New' },
  promptText: { color: '#FFF', fontSize: 15, fontWeight: 'bold', textAlign: 'center', fontStyle: 'italic', marginBottom: 12 },
  listenBtn: { backgroundColor: '#120B2C', paddingHorizontal: 15, paddingVertical: 8, borderRadius: 6, borderWidth: 1, borderColor: '#39FF14' },
  listenText: { color: '#39FF14', fontSize: 12, fontWeight: 'bold', fontFamily: 'Courier New' },
  actionBox: { backgroundColor: '#0D0620', padding: 15, borderRadius: 12, borderWidth: 1, borderColor: '#FF007F', alignItems: 'center' },
  attackBtn: { backgroundColor: '#39FF14', padding: 15, borderRadius: 8, width: '100%', alignItems: 'center' },
  recordingActive: { backgroundColor: '#FF0055' },
  attackText: { color: '#000', fontSize: 15, fontWeight: 'bold', fontFamily: 'Courier New' },
  analyzingText: { color: '#FF007F', marginTop: 10, fontSize: 12, fontFamily: 'Courier New' },
  resultBox: { marginTop: 12, alignItems: 'center' },
  victoryBox: { backgroundColor: '#0D0620', padding: 25, borderRadius: 12, borderWidth: 2, borderColor: '#39FF14', alignItems: 'center' },
  
  // MODAL STYLES
  modalOverlay: { flex: 1, backgroundColor: 'rgba(5, 2, 13, 0.85)', justifyContent: 'center', alignItems: 'center', padding: 20 },
  modalContent: { backgroundColor: '#052C30', padding: 24, borderRadius: 20, borderWidth: 2, borderColor: '#00FFCC', width: '100%', alignItems: 'center' },
  modalTag: { color: '#FF0055', fontSize: 11, fontWeight: 'bold', marginBottom: 6 },
  modalTitle: { color: '#00FFCC', fontSize: 18, fontWeight: '900', marginBottom: 12, textAlign: 'center' },
  modalDesc: { color: '#A0E0E0', fontSize: 12, textAlign: 'center', lineHeight: 18, marginBottom: 20 },
  modalOasisBtn: { backgroundColor: '#00FFCC', paddingVertical: 14, paddingHorizontal: 20, borderRadius: 10, width: '100%', alignItems: 'center', marginBottom: 10 },
  modalOasisBtnText: { color: '#000', fontSize: 13, fontWeight: '900' },
  modalCancelBtn: { paddingVertical: 10 },
  modalCancelText: { color: '#8888AA', fontSize: 11, textDecorationLine: 'underline' }
});