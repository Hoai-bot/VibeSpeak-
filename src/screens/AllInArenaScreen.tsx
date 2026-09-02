import React, { useState, useRef, useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ActivityIndicator } from 'react-native';
import { useSupabaseRealtime } from '../hooks/useSupabaseRealtime';
import { transcribeAndGradeAudio } from '../services/groqClient';

export default function AllInArenaScreen({ onBack }: { onBack: () => void }) {
  const [betAmount, setBetAmount] = useState<number>(100);
  const userIdRef = useRef('runner_' + Math.floor(Math.random() * 100000));
  const DUMMY_USER_ID = userIdRef.current;

  const { findMatch, submitScore, matchStatus, opponent, opponentScore, userExp, updateUserExp } =
    useSupabaseRealtime(DUMMY_USER_ID, betAmount);

  const [isRecording, setIsRecording] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [myResult, setMyResult] = useState<{ text: string; score: number } | null>(null);
  const [expProcessed, setExpProcessed] = useState(false);

  const mediaRecorderRef = useRef<any>(null);
  const audioChunksRef = useRef<any[]>([]);

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      mediaRecorderRef.current = new MediaRecorder(stream);
      audioChunksRef.current = [];

      mediaRecorderRef.current.ondataavailable = (event: any) => {
        if (event.data.size > 0) audioChunksRef.current.push(event.data);
      };

      mediaRecorderRef.current.start();
      setIsRecording(true);
    } catch (err) {
      alert('Không thể truy cập Micro!');
    }
  };

  const stopRecording = () => {
    if (!mediaRecorderRef.current) return;
    setIsRecording(false);
    setIsAnalyzing(true);

    mediaRecorderRef.current.onstop = async () => {
      const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/wav' });
      const res = await transcribeAndGradeAudio(audioBlob);
      setMyResult(res);
      setIsAnalyzing(false);

      submitScore(res.score);

      if (mediaRecorderRef.current?.stream) {
        mediaRecorderRef.current.stream.getTracks().forEach((track: any) => track.stop());
      }
    };

    mediaRecorderRef.current.stop();
  };

  // Xác định thắng thua
  const getGameResult = () => {
    if (!myResult || opponentScore === null) return null;
    if (myResult.score > opponentScore) return { status: '🏆 VICTORY', color: '#39FF14', expChange: betAmount };
    if (myResult.score < opponentScore) return { status: '💀 DEFEAT', color: '#FF0055', expChange: -betAmount };
    return { status: '🤝 DRAW', color: '#00FFFF', expChange: 0 };
  };

  const gameResult = getGameResult();

  // Tự động cộng/trừ EXP vào Supabase
  useEffect(() => {
    if (gameResult && !expProcessed) {
      updateUserExp(gameResult.expChange);
      setExpProcessed(true);
    }
  }, [gameResult, expProcessed]);

  return (
    <View style={styles.container}>
      <TouchableOpacity onPress={onBack} style={styles.backButton}>
        <Text style={styles.backText}>🔙 RỜI KHỎI ĐẤU TRƯỜNG</Text>
      </TouchableOpacity>

      <Text style={styles.header}>[ ĐẤU TRƯỜNG TẤT TAY ]</Text>

      {/* THẺ EXP HỒ SƠ RUNNER */}
      <View style={styles.profileBadge}>
        <Text style={styles.profileText}>👤 RUNNER: {DUMMY_USER_ID}</Text>
        <Text style={styles.expBadgeText}>💎 EXP TÍCH LŨY: {userExp}</Text>
      </View>

      {matchStatus === 'idle' && (
        <View style={styles.box}>
          <Text style={styles.label}>CHỌN MỨC CƯỢC EXP:</Text>
          <View style={styles.betRow}>
            {[50, 100, 500].map((amount) => (
              <TouchableOpacity
                key={amount}
                style={[styles.betBtn, betAmount === amount && styles.activeBet]}
                onPress={() => setBetAmount(amount)}
              >
                <Text style={styles.betText}>{amount} EXP</Text>
              </TouchableOpacity>
            ))}
          </View>
          <TouchableOpacity style={styles.matchBtn} onPress={findMatch}>
            <Text style={styles.matchText}>🔥 TẤT TAY (TÌM ĐỐI THỦ)</Text>
          </TouchableOpacity>
        </View>
      )}

      {matchStatus === 'searching' && (
        <View style={styles.box}>
          <ActivityIndicator size="large" color="#FF007F" style={{ marginBottom: 15 }} />
          <Text style={styles.statusText}>> Đang quét mạng lưới tìm đối thủ...</Text>
        </View>
      )}

      {matchStatus === 'found' && (
        <View style={[styles.box, { borderColor: gameResult ? gameResult.color : '#39FF14' }]}>
          <Text style={styles.vsTitle}>⚡ ĐỐI THỦ: {opponent} ⚡</Text>
          <Text style={{ color: '#FFD700', marginBottom: 20 }}>Tổng hũ: {betAmount * 2} EXP</Text>

          {!myResult ? (
            isAnalyzing ? (
              <ActivityIndicator size="large" color="#00FFFF" />
            ) : (
              <TouchableOpacity
                style={[styles.recordBtn, isRecording && { backgroundColor: '#FF0000' }]}
                onPress={isRecording ? stopRecording : startRecording}
              >
                <Text style={styles.recordText}>{isRecording ? '⏹️ DỪNG & GỬI BÀI' : '🎙️ BẮT ĐẦU NÓI'}</Text>
              </TouchableOpacity>
            )
          ) : (
            <View style={{ alignItems: 'center', width: '100%' }}>
              <Text style={{ color: '#FFF' }}>Điểm của bạn: <Text style={{ color: '#39FF14', fontWeight: 'bold' }}>{myResult.score}</Text></Text>
              <Text style={{ color: '#FFF', marginTop: 5 }}>
                Điểm đối thủ: {opponentScore !== null ? <Text style={{ color: '#FF007F', fontWeight: 'bold' }}>{opponentScore}</Text> : '⏳ Đang nói...'}
              </Text>

              {gameResult && (
                <View style={{ marginTop: 20, alignItems: 'center' }}>
                  <Text style={{ color: gameResult.color, fontSize: 28, fontWeight: 'bold' }}>{gameResult.status}</Text>
                  <Text style={{ color: gameResult.color, fontSize: 20, marginTop: 5 }}>
                    {gameResult.expChange >= 0 ? `+${gameResult.expChange}` : gameResult.expChange} EXP
                  </Text>
                </View>
              )}
            </View>
          )}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0A051B', padding: 20, paddingTop: 60 },
  backButton: { marginBottom: 20, alignSelf: 'flex-start', padding: 10, backgroundColor: '#120B2C', borderRadius: 8, borderWidth: 1, borderColor: '#FF007F' },
  backText: { color: '#FF007F', fontSize: 14, fontWeight: 'bold' },
  header: { color: '#FF007F', fontSize: 24, fontWeight: 'bold', textAlign: 'center', marginBottom: 15 },
  profileBadge: { backgroundColor: '#120B2C', padding: 12, borderRadius: 8, borderWidth: 1, borderColor: '#00FFFF', marginBottom: 20, flexDirection: 'row', justifyContent: 'space-between' },
  profileText: { color: '#FFF', fontWeight: 'bold', fontSize: 13 },
  expBadgeText: { color: '#39FF14', fontWeight: 'bold', fontSize: 13 },
  box: { backgroundColor: '#120B2C', padding: 20, borderRadius: 12, borderWidth: 2, borderColor: '#FF007F', alignItems: 'center' },
  label: { color: '#00FFFF', fontSize: 14, fontWeight: 'bold', marginBottom: 15 },
  betRow: { flexDirection: 'row', justifyContent: 'space-between', width: '100%', marginBottom: 25 },
  betBtn: { flex: 1, padding: 12, borderWidth: 1, borderColor: '#555', borderRadius: 8, alignItems: 'center', marginHorizontal: 5 },
  activeBet: { borderColor: '#39FF14', backgroundColor: '#051A12' },
  betText: { color: '#FFF', fontWeight: 'bold' },
  matchBtn: { backgroundColor: '#FF007F', padding: 15, borderRadius: 8, width: '100%', alignItems: 'center' },
  recordBtn: { backgroundColor: '#39FF14', padding: 15, borderRadius: 8, width: '100%', alignItems: 'center' },
  matchText: { color: '#FFF', fontSize: 16, fontWeight: 'bold' },
  recordText: { color: '#000', fontSize: 16, fontWeight: 'bold' },
  statusText: { color: '#39FF14', fontSize: 14 },
  vsTitle: { color: '#39FF14', fontSize: 18, fontWeight: 'bold', marginBottom: 5 }
});