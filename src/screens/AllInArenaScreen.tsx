import React, { useState, useRef } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ActivityIndicator, Modal, ScrollView } from 'react-native';
import { generateArenaTopic, transcribeAndGradeAudio } from '../services/groqClient';

interface Props {
  onBack: () => void;
  onNavigateToOasis?: (topic: string) => void;
}

type ArenaMode = 'SOLO' | 'RELAY' | 'ROLEPLAY';

export function AllInArenaScreen({ onBack, onNavigateToOasis }: Props) {
  const [selectedMode, setSelectedMode] = useState<ArenaMode>('SOLO');
  const [topic, setTopic] = useState<string>('');
  const [isMatching, setIsMatching] = useState<boolean>(false);
  const [inBattle, setInBattle] = useState<boolean>(false);
  const [opponentName, setOpponentName] = useState<string>('');
  
  const [isRecording, setIsRecording] = useState<boolean>(false);
  const [isAnalyzing, setIsAnalyzing] = useState<boolean>(false);
  const [userSpeech, setUserSpeech] = useState<string>('');
  const [score, setScore] = useState<number | null>(null);

  // 🎯 STATE CỨU HỘ OASIS TOÀN BỘ CÁC CHẾ ĐỘ
  const [arenaMissCount, setArenaMissCount] = useState<number>(0);
  const [showOasisModal, setShowOasisModal] = useState<boolean>(false);

  const mediaRecorderRef = useRef<any>(null);
  const audioChunksRef = useRef<any[]>([]);

  // 1. TÌM TRẬN CHO CẢ SOLO, RELAY VÀ ROLEPLAY
  const startMatch = async (mode: ArenaMode) => {
    setSelectedMode(mode);
    setIsMatching(true);
    setInBattle(false);
    setScore(null);
    setUserSpeech('');

    try {
      const promptMode = mode === 'RELAY' ? 'Relay Storytelling' : mode === 'ROLEPLAY' ? 'Cyberpunk Roleplay' : 'Solo Debate';
      const newTopic = await generateArenaTopic(promptMode);
      setTopic(newTopic);
    } catch (e) {
      setTopic(mode === 'ROLEPLAY' ? 'Negotiate with a Cyberpunk Hacker' : 'Continue the Relay story in 2099.');
    }

    setTimeout(() => {
      const botNames = {
        SOLO: '🤖 CyberBot_V3',
        RELAY: '🤝 Teammate_Neon',
        ROLEPLAY: '🎭 AI_Hacker_Zero'
      };
      setOpponentName(botNames[mode]);
      setIsMatching(false);
      setInBattle(true);
    }, 1500);
  };

  const startRecording = async () => {
    try {
      if (typeof navigator === 'undefined' || !navigator.mediaDevices) {
        alert('Trình duyệt không hỗ trợ micro!');
        return;
      }

      const stream = await navigator.mediaDevices.getUserMedia({ 
        audio: { echoCancellation: true, noiseSuppression: true, autoGainControl: true } 
      });

      const mimeType = MediaRecorder.isTypeSupported('audio/webm') ? 'audio/webm' : 'audio/mp4';
      mediaRecorderRef.current = new MediaRecorder(stream, { mimeType });
      audioChunksRef.current = [];

      mediaRecorderRef.current.ondataavailable = (e: any) => {
        if (e.data && e.data.size > 0) audioChunksRef.current.push(e.data);
      };

      mediaRecorderRef.current.start(100);
      setIsRecording(true);
    } catch (err) {
      alert('Không thể truy cập Micro!');
    }
  };

  const stopRecording = async () => {
    const mediaRecorder = mediaRecorderRef.current;
    if (!mediaRecorder || mediaRecorder.state === 'inactive') return;

    setIsRecording(false);
    setIsAnalyzing(true);

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
      if (mediaRecorder.stream) mediaRecorder.stream.getTracks().forEach((t: any) => t.stop());
      const audioBlob = await processAudio;

      const res = await transcribeAndGradeAudio(audioBlob, topic);
      setUserSpeech(res.text);
      setScore(res.score);

      // 🎯 KÍCH HOẠT POPUP CỨU HỘ OASIS KHI LỖI 2 LẦN LIÊN TIẾP (ÁP DỤNG SOLO, RELAY & ROLEPLAY)
      if (res.score < 50) {
        setArenaMissCount((prev) => {
          const nextCount = prev + 1;
          if (nextCount >= 2) {
            setShowOasisModal(true);
          }
          return nextCount;
        });
      } else {
        setArenaMissCount(0);
      }

    } catch (error) {
      alert('Lỗi phân tích giọng nói!');
    } finally {
      setIsAnalyzing(false);
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.topBar}>
        <TouchableOpacity onPress={onBack} style={styles.backBtn}>
          <Text style={styles.backText}>🔙 EXIT</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>⚔️ ALL-IN ARENA</Text>
      </View>

      <ScrollView contentContainerStyle={{ alignItems: 'center' }}>
        {!inBattle && !isMatching && (
          <View style={styles.startCard}>
            <Text style={styles.arenaTitle}>⚔️ ĐẤU TRƯỜNG TẤT TAY</Text>
            <Text style={styles.arenaDesc}>Chọn chế độ thi đấu để bắt đầu!</Text>
            
            <TouchableOpacity style={styles.matchBtn} onPress={() => startMatch('SOLO')}>
              <Text style={styles.matchBtnText}>🎮 SOLO DEBATE (1v1)</Text>
            </TouchableOpacity>
            
            <TouchableOpacity style={[styles.matchBtn, { backgroundColor: '#FFD700', marginTop: 10 }]} onPress={() => startMatch('RELAY')}>
              <Text style={[styles.matchBtnText, { color: '#000' }]}>🤝 RELAY STORYTELLING</Text>
            </TouchableOpacity>

            <TouchableOpacity style={[styles.matchBtn, { backgroundColor: '#00FFFF', marginTop: 10 }]} onPress={() => startMatch('ROLEPLAY')}>
              <Text style={[styles.matchBtnText, { color: '#000' }]}>🎭 CYBERPUNK ROLEPLAY</Text>
            </TouchableOpacity>
          </View>
        )}

        {isMatching && (
          <View style={styles.startCard}>
            <ActivityIndicator size="large" color="#FF007F" />
            <Text style={styles.matchingText}>> ĐANG KẾT NỐI CHẾ ĐỘ {selectedMode}...</Text>
          </View>
        )}

        {inBattle && (
          <View style={styles.battleCard}>
            <View style={styles.vsBox}>
              <Text style={styles.playerName}>YOU</Text>
              <Text style={styles.vsText}>VS</Text>
              <Text style={styles.botName}>{opponentName}</Text>
            </View>

            <Text style={styles.topicTag}>[ {selectedMode} CHALLENGE ]</Text>
            <Text style={styles.topicText}>{topic}</Text>

            <View style={styles.actionBox}>
              {isAnalyzing ? (
                <ActivityIndicator size="large" color="#00FFFF" />
              ) : (
                <TouchableOpacity
                  style={[styles.recordBtn, isRecording && styles.recordingActive]}
                  onPress={isRecording ? stopRecording : startRecording}
                >
                  <Text style={styles.recordBtnText}>
                    {isRecording ? '⏹️ DỪNG & GỬI BÀI' : '🎙️ THU ÂM PHÁT ÂM'}
                  </Text>
                </TouchableOpacity>
              )}
            </View>

            {score !== null && (
              <View style={styles.resultBox}>
                <Text style={styles.scoreText}>SCORE: {score} / 100</Text>
                <Text style={styles.speechText}>AI Nghe Được: "{userSpeech}"</Text>
                <TouchableOpacity style={styles.nextMatchBtn} onPress={() => startMatch(selectedMode)}>
                  <Text style={styles.nextMatchText}>⚡ TÁI ĐẤU MỚI</Text>
                </TouchableOpacity>
              </View>
            )}
          </View>
        )}
      </ScrollView>

      {/* 🌴 MODAL CỨU HỘ OASIS CHO CẢ 3 CHẾ ĐỘ */}
      <Modal visible={showOasisModal} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTag}>🚨 CỨU HỘ {selectedMode}</Text>
            <Text style={styles.modalTitle}>🌴 OASIS: HƯỚNG DẪN MẪU CÂU</Text>
            <Text style={styles.modalDesc}>
              Bạn gặp khó khăn trong chế độ {selectedMode} với chủ đề "{topic}"? Hãy sang Trạm Oasis để AI hỗ trợ từ vựng và mẫu câu giao tiếp tự do không áp lực!
            </Text>

            <TouchableOpacity
              style={styles.modalOasisBtn}
              onPress={() => {
                setShowOasisModal(false);
                setArenaMissCount(0);
                if (onNavigateToOasis) onNavigateToOasis(`[${selectedMode}] ${topic}`);
              }}
            >
              <Text style={styles.modalOasisBtnText}>🌴 CHUYỂN SANG OASIS CỨU HỘ</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.modalCancelBtn}
              onPress={() => {
                setShowOasisModal(false);
                setArenaMissCount(0);
              }}
            >
              <Text style={styles.modalCancelText}>Ở lại tiếp tục thi đấu</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#05020D', padding: 20, paddingTop: 40 },
  topBar: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
  backBtn: { paddingHorizontal: 10, paddingVertical: 6, backgroundColor: '#0D0620', borderRadius: 6, borderWidth: 1, borderColor: '#FF007F' },
  backText: { color: '#FF007F', fontSize: 11, fontWeight: 'bold', fontFamily: 'Courier New' },
  headerTitle: { color: '#FF007F', fontSize: 16, fontWeight: '900', fontFamily: 'Courier New' },
  startCard: { backgroundColor: '#0D0620', padding: 24, borderRadius: 16, borderWidth: 2, borderColor: '#FF007F', alignItems: 'center', width: '100%', marginTop: 20 },
  arenaTitle: { color: '#FF007F', fontSize: 18, fontWeight: '900', fontFamily: 'Courier New', marginBottom: 8, textAlign: 'center' },
  arenaDesc: { color: '#AAAABB', fontSize: 12, fontFamily: 'Courier New', textAlign: 'center', marginBottom: 20 },
  matchBtn: { backgroundColor: '#FF007F', paddingVertical: 14, paddingHorizontal: 24, borderRadius: 10, width: '100%', alignItems: 'center' },
  matchBtnText: { color: '#FFF', fontSize: 13, fontWeight: '900', fontFamily: 'Courier New' },
  matchingText: { color: '#FF007F', marginTop: 15, fontSize: 12, fontFamily: 'Courier New' },
  battleCard: { backgroundColor: '#0D0620', padding: 20, borderRadius: 16, borderWidth: 2, borderColor: '#FF007F', width: '100%', alignItems: 'center' },
  vsBox: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', width: '100%', marginBottom: 16, paddingHorizontal: 10 },
  playerName: { color: '#39FF14', fontSize: 14, fontWeight: '900', fontFamily: 'Courier New' },
  vsText: { color: '#FF0055', fontSize: 18, fontWeight: '900', fontFamily: 'Courier New' },
  botName: { color: '#00FFFF', fontSize: 14, fontWeight: '900', fontFamily: 'Courier New' },
  topicTag: { color: '#FFD700', fontSize: 11, fontWeight: 'bold', fontFamily: 'Courier New', marginBottom: 6 },
  topicText: { color: '#FFF', fontSize: 15, fontWeight: 'bold', fontFamily: 'Courier New', textAlign: 'center', marginBottom: 20 },
  actionBox: { width: '100%', marginBottom: 15 },
  recordBtn: { backgroundColor: '#39FF14', padding: 16, borderRadius: 12, alignItems: 'center' },
  recordingActive: { backgroundColor: '#FF0055' },
  recordBtnText: { color: '#000', fontSize: 13, fontWeight: '900', fontFamily: 'Courier New' },
  resultBox: { backgroundColor: '#05020D', padding: 14, borderRadius: 10, borderWidth: 1, borderColor: '#FF007F', width: '100%', alignItems: 'center' },
  scoreText: { color: '#39FF14', fontSize: 14, fontWeight: 'bold', fontFamily: 'Courier New', marginBottom: 4 },
  speechText: { color: '#AAAABB', fontSize: 12, fontFamily: 'Courier New', marginBottom: 10, textAlign: 'center' },
  nextMatchBtn: { backgroundColor: '#221144', paddingVertical: 8, paddingHorizontal: 16, borderRadius: 6, borderWidth: 1, borderColor: '#FF007F' },
  nextMatchText: { color: '#FF007F', fontSize: 11, fontWeight: 'bold', fontFamily: 'Courier New' },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(5, 2, 13, 0.85)', justifyContent: 'center', alignItems: 'center', padding: 20 },
  modalContent: { backgroundColor: '#052C30', padding: 24, borderRadius: 20, borderWidth: 2, borderColor: '#00FFCC', width: '100%', alignItems: 'center' },
  modalTag: { color: '#FF0055', fontSize: 11, fontWeight: 'bold', fontFamily: 'Courier New', marginBottom: 6 },
  modalTitle: { color: '#00FFCC', fontSize: 18, fontWeight: '900', fontFamily: 'Courier New', marginBottom: 12, textAlign: 'center' },
  modalDesc: { color: '#A0E0E0', fontSize: 12, fontFamily: 'Courier New', textAlign: 'center', lineHeight: 18, marginBottom: 20 },
  modalOasisBtn: { backgroundColor: '#00FFCC', paddingVertical: 14, paddingHorizontal: 20, borderRadius: 10, width: '100%', alignItems: 'center', marginBottom: 10 },
  modalOasisBtnText: { color: '#000', fontSize: 13, fontWeight: '900', fontFamily: 'Courier New' },
  modalCancelBtn: { paddingVertical: 10 },
  modalCancelText: { color: '#8888AA', fontSize: 11, fontFamily: 'Courier New', textDecorationLine: 'underline' }
});

export default AllInArenaScreen;