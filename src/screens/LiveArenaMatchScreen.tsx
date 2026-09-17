// src/screens/LiveArenaMatchScreen.tsx
import React, { useState, useRef, useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView, ActivityIndicator } from 'react-native';
import { gradeFlexibleArenaResponse } from '../services/groqClient';
import { saveMatchHistory, saveUserData } from '../services/userService';
import { auth } from '../services/firebaseClient';

interface Props {
  mode: 'SOLO_30S' | 'DUEL_60S' | 'ROLEPLAY_60S';
  opponent: { name: string; exp: number; avatar: string; tier: string };
  topic: { focus: string; topicTitle: string; situation: string; hint: string };
  roomId: string;
  isPvP?: boolean; // 🎯 Phân biệt phòng PvP hay đấu với Bot
  onExitArena: () => void;
  onNextMatch?: () => void;
}

export default function LiveArenaMatchScreen({ mode, opponent, topic, roomId, isPvP, onExitArena, onNextMatch }: Props) {
  const [timeLeft, setTimeLeft] = useState<number>(mode === 'SOLO_30S' ? 30 : 60);
  const [isRecording, setIsRecording] = useState<boolean>(false);
  const [isAnalyzing, setIsAnalyzing] = useState<boolean>(false);
  const [matchResult, setMatchResult] = useState<any>(null);

  const mediaRecorderRef = useRef<any>(null);
  const audioChunksRef = useRef<any[]>([]);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
    if (mediaRecorderRef.current && mediaRecorderRef.current.stream) {
      mediaRecorderRef.current.stream.getTracks().forEach((track: any) => track.stop());
    }

    setIsRecording(false);
    setIsAnalyzing(false);
    setMatchResult(null);
    setTimeLeft(mode === 'SOLO_30S' ? 30 : 60);
  }, [topic, mode]);

  useEffect(() => {
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
      if (mediaRecorderRef.current && mediaRecorderRef.current.stream) {
        mediaRecorderRef.current.stream.getTracks().forEach((track: any) => track.stop());
      }
    };
  }, []);

  const startRecording = async () => {
    try {
      if (typeof navigator === 'undefined' || !navigator.mediaDevices) {
        alert('Trình duyệt không hỗ trợ micro!');
        return;
      }

      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mimeType = MediaRecorder.isTypeSupported('audio/webm') ? 'audio/webm' : 'audio/mp4';
      
      mediaRecorderRef.current = new MediaRecorder(stream, { mimeType });
      audioChunksRef.current = [];

      mediaRecorderRef.current.ondataavailable = (e: any) => {
        if (e.data && e.data.size > 0) audioChunksRef.current.push(e.data);
      };

      mediaRecorderRef.current.start(100);
      setIsRecording(true);

      timerRef.current = setInterval(() => {
        setTimeLeft((prev) => {
          if (prev <= 1) {
            stopRecordingAndCalculateResult();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    } catch (err) {
      alert('Chưa cấp quyền Micro!');
    }
  };

  const stopRecordingAndCalculateResult = async () => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
    const mediaRecorder = mediaRecorderRef.current;
    if (!mediaRecorder || mediaRecorder.state === 'inactive') return;

    setIsRecording(false);
    setIsAnalyzing(true);

    const processAudio = new Promise<Blob>((resolve) => {
      mediaRecorder.onstop = () => {
        resolve(new Blob(audioChunksRef.current, { type: mediaRecorder.mimeType || 'audio/webm' }));
      };
      mediaRecorder.stop();
    });

    try {
      if (mediaRecorder.stream) {
        mediaRecorder.stream.getTracks().forEach((t: any) => t.stop());
      }
      const audioBlob = await processAudio;

      const userRes = await gradeFlexibleArenaResponse(audioBlob, topic?.situation || '');
      const simulatedOpponentScore = Math.floor(Math.random() * 25) + 70;

      const userScore = userRes.score || 0;
      const resultState: 'VICTORY' | 'DEFEATED' | 'DRAW' = 
        userScore > simulatedOpponentScore ? 'VICTORY' :
        userScore < simulatedOpponentScore ? 'DEFEATED' : 'DRAW';

      const safeFluency = userScore > 0 ? (userRes.fluencyScore > 0 ? userRes.fluencyScore : 75) : 0;
      const safeSemantic = userScore > 0 ? (userRes.semanticScore > 0 ? userRes.semanticScore : userScore) : 0;
      const safePhonetic = userScore > 0 ? (userRes.phoneticScore > 0 ? userRes.phoneticScore : userScore) : 0;

      setMatchResult({
        userScore,
        opponentScore: simulatedOpponentScore,
        transcribedText: userRes.transcribedText,
        fluencyScore: safeFluency,
        semanticScore: safeSemantic,
        phoneticScore: safePhonetic,
        feedback: userRes.feedback,
      });

      const currentUserId = auth.currentUser?.uid || 'GUEST_USER';
      const currentUsername = auth.currentUser?.displayName || 'Player_Vibe';

      await saveMatchHistory(currentUserId, {
        mode,
        userScore,
        opponentScore: simulatedOpponentScore,
        result: resultState,
        topic: topic?.topicTitle || 'Arena Match',
        transcribedText: userRes.transcribedText || ''
      });

      await saveUserData(currentUserId, currentUsername, 50);

    } catch (e) {
      console.error('Lỗi phân tích trận đấu:', e);
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleNextMatchPress = () => {
    setIsAnalyzing(false);
    setIsRecording(false);
    setMatchResult(null);

    if (onNextMatch) {
      onNextMatch();
    } else {
      onExitArena();
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.header}>
        {isPvP ? '⚔️ PHÒNG ĐẤU 2 NGƯỜI THẬT' : '🏛️ TRANG ĐẤU ẢO BOT REALTIME'} [{roomId || 'LIVE'}]
      </Text>
      
      {isPvP && (
        <View style={styles.roomTagBadge}>
          <Text style={styles.roomTagText}>🔑 MÃ PHÒNG CHIỂN DỤNG BẠN BÈ: {roomId}</Text>
        </View>
      )}

      <View style={styles.liveScoreBar}>
        <View style={styles.scoreItem}>
          <Text style={styles.scoreName}>👤 {auth.currentUser?.displayName || 'BẠN'}</Text>
          <Text style={[styles.scoreVal, { color: '#00FFFF' }]}>{isRecording ? '🎙️ Đang thu âm...' : 'Sẵn sàng'}</Text>
        </View>
        <Text style={styles.vsText}>VS</Text>
        <View style={styles.scoreItem}>
          <Text style={styles.scoreName}>{opponent?.avatar || '👤'} {opponent?.name || 'Đồng đội'}</Text>
          <Text style={[styles.scoreVal, { color: '#FFD700' }]}>{isPvP ? 'Đã vào phòng' : 'Sẵn sàng'}</Text>
        </View>
      </View>

      <ScrollView contentContainerStyle={{ alignItems: 'center', width: '100%' }}>
        <View style={styles.topicCard}>
          <Text style={styles.focusTag}>[ {topic?.focus || 'ĐẤU TRƯỜNG PHẢN XẠ'} ]</Text>
          <Text style={styles.topicTitleText}>📌 {topic?.topicTitle || 'Chủ đề thi đấu'}</Text>
          <Text style={styles.situationText}>"{topic?.situation || 'Đang tải đề bài...'}"</Text>
          <Text style={styles.hintText}>💡 Gợi ý: {topic?.hint || 'Tự do phát biểu ý tưởng bằng tiếng Anh.'}</Text>
        </View>

        <View style={styles.timerCard}>
          <Text style={[styles.timerText, timeLeft <= 5 && { color: '#FF0000' }]}>{timeLeft}s</Text>
          <Text style={styles.timerLabel}>
            {isRecording ? 'ĐỒNG HỒ ĐANG ĐẾM NGƯỢC! HÃY NÓI CÂU TRẢ LỜI CỦA BẠN' : 'BẤM MÍC DƯỚI ĐÂY ĐỂ MỞ MICRO & BẮT ĐẦU NÓI'}
          </Text>
        </View>

        {!matchResult ? (
          isAnalyzing ? (
            <ActivityIndicator size="large" color="#FF007F" style={{ marginVertical: 15 }} />
          ) : (
            <TouchableOpacity 
              style={[styles.recordBtn, isRecording && { backgroundColor: '#FF0055' }]}
              onPress={isRecording ? stopRecordingAndCalculateResult : startRecording}
            >
              <Text style={styles.recordBtnText}>
                {isRecording ? '⏹️ DỪNG & GỬI BÀI CHO AI CHẤM' : '🎙️ BẤM VÀO ĐÂY ĐỂ MỞ MICRO & THI ĐẤU'}
              </Text>
            </TouchableOpacity>
          )
        ) : (
          <View style={styles.resultBox}>
            <Text style={styles.resultTitle}>
              {matchResult.userScore > matchResult.opponentScore 
                ? '🎉 VICTORY! BẠN ĐÃ THẮNG!' 
                : matchResult.userScore < matchResult.opponentScore 
                ? '💀 DEFEATED! BẠN ĐÃ THUA!' 
                : '🤝 DRAW! HÒA ĐIỂM!'}
            </Text>
            <Text style={styles.scoreCompare}>
              BẠN: {matchResult.userScore}  VS  {opponent?.name || 'Đối thủ'}: {matchResult.opponentScore}
            </Text>

            <View style={styles.criteriaGrid}>
              <View style={styles.criteriaItem}>
                <Text style={styles.criteriaLabel}>⚡ Trôi Chảy</Text>
                <Text style={styles.criteriaVal}>{matchResult.fluencyScore}/100</Text>
              </View>
              <View style={styles.criteriaItem}>
                <Text style={styles.criteriaLabel}>🎯 Đúng Ý</Text>
                <Text style={styles.criteriaVal}>{matchResult.semanticScore}/100</Text>
              </View>
              <View style={styles.criteriaItem}>
                <Text style={styles.criteriaLabel}>🗣️ Phát Âm</Text>
                <Text style={styles.criteriaVal}>{matchResult.phoneticScore}/100</Text>
              </View>
            </View>

            <Text style={styles.transcribedText}>🗣️ AI Nghe: "{matchResult.transcribedText}"</Text>
            <Text style={styles.feedbackText}>💡 Đánh giá: {matchResult.feedback}</Text>

            <TouchableOpacity style={styles.playAgainBtn} onPress={handleNextMatchPress}>
              <Text style={styles.playAgainText}>🔄 THI ĐẤU TRẬN MỚI</Text>
            </TouchableOpacity>
          </View>
        )}

        <TouchableOpacity style={styles.exitBtn} onPress={onExitArena}>
          <Text style={styles.exitText}>👈 THOÁT TRANG ĐẤU ẢO</Text>
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#05020D', padding: 20, paddingTop: 50 },
  header: { color: '#00FFFF', fontSize: 13, fontWeight: '900', fontFamily: 'Courier New', textAlign: 'center', marginBottom: 4 },
  roomTagBadge: { backgroundColor: '#110022', padding: 6, borderRadius: 8, borderWidth: 1, borderColor: '#FF007F', marginBottom: 12, alignItems: 'center' },
  roomTagText: { color: '#FFD700', fontSize: 10, fontWeight: 'bold', fontFamily: 'Courier New' },
  liveScoreBar: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', backgroundColor: '#0D0620', padding: 12, borderRadius: 12, borderWidth: 1, borderColor: '#FF007F', width: '100%', marginBottom: 15 },
  scoreItem: { alignItems: 'center' },
  scoreName: { color: '#AAAABB', fontSize: 10, fontFamily: 'Courier New' },
  scoreVal: { fontSize: 12, fontWeight: 'bold', fontFamily: 'Courier New', marginTop: 2 },
  vsText: { color: '#FF007F', fontSize: 16, fontWeight: '900', fontFamily: 'Courier New' },
  topicCard: { backgroundColor: '#0D0620', padding: 18, borderRadius: 16, borderWidth: 2, borderColor: '#FFD700', width: '100%', alignItems: 'center', marginBottom: 15 },
  focusTag: { color: '#00FFFF', fontSize: 11, fontWeight: 'bold', fontFamily: 'Courier New', marginBottom: 6 },
  topicTitleText: { color: '#FFD700', fontSize: 15, fontWeight: 'bold', fontFamily: 'Courier New', marginBottom: 8 },
  situationText: { color: '#FFF', fontSize: 16, fontWeight: '900', fontFamily: 'Courier New', textAlign: 'center', marginBottom: 10, lineHeight: 22 },
  hintText: { color: '#39FF14', fontSize: 11, fontFamily: 'Courier New', textAlign: 'center' },
  timerCard: { backgroundColor: '#0D0620', padding: 10, borderRadius: 16, borderWidth: 2, borderColor: '#FF007F', alignItems: 'center', width: '100%', marginBottom: 15 },
  timerText: { color: '#FF007F', fontSize: 32, fontWeight: '900', fontFamily: 'Courier New' },
  timerLabel: { color: '#AAAABB', fontSize: 9, fontFamily: 'Courier New', marginTop: 2, textAlign: 'center' },
  recordBtn: { backgroundColor: '#39FF14', paddingVertical: 14, paddingHorizontal: 20, borderRadius: 12, width: '100%', alignItems: 'center', marginBottom: 15 },
  recordBtnText: { color: '#000', fontSize: 13, fontWeight: '900', fontFamily: 'Courier New' },
  resultBox: { backgroundColor: '#1A0B2E', padding: 20, borderRadius: 16, borderWidth: 2, borderColor: '#39FF14', width: '100%', alignItems: 'center', marginBottom: 15 },
  resultTitle: { color: '#39FF14', fontSize: 16, fontWeight: '900', fontFamily: 'Courier New', marginBottom: 8, textAlign: 'center' },
  scoreCompare: { color: '#FFD700', fontSize: 14, fontWeight: 'bold', fontFamily: 'Courier New', marginBottom: 12 },
  criteriaGrid: { flexDirection: 'row', justifyContent: 'space-between', width: '100%', marginBottom: 12 },
  criteriaItem: { backgroundColor: '#0D0620', padding: 8, borderRadius: 8, borderWidth: 1, borderColor: '#FFD700', width: '31%', alignItems: 'center' },
  criteriaLabel: { color: '#AAAABB', fontSize: 9, fontFamily: 'Courier New', marginBottom: 4 },
  criteriaVal: { color: '#FFD700', fontSize: 12, fontWeight: 'bold', fontFamily: 'Courier New' },
  transcribedText: { color: '#00FFFF', fontSize: 11, fontFamily: 'Courier New', textAlign: 'center', marginBottom: 6 },
  feedbackText: { color: '#AAAABB', fontSize: 11, fontFamily: 'Courier New', textAlign: 'center', marginBottom: 15 },
  playAgainBtn: { backgroundColor: '#39FF14', paddingVertical: 10, paddingHorizontal: 16, borderRadius: 8, width: '100%', alignItems: 'center', marginBottom: 10 },
  playAgainText: { color: '#000', fontSize: 12, fontWeight: '900', fontFamily: 'Courier New' },
  exitBtn: { paddingVertical: 10 },
  exitText: { color: '#8888AA', fontSize: 11, fontFamily: 'Courier New', textDecorationLine: 'underline' }
});