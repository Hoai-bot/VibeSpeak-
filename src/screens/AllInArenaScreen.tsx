import React, { useState, useRef, useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ActivityIndicator } from 'react-native';
import confetti from 'canvas-confetti';
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

  // 🔊 Phát âm thanh hiệu ứng bằng Web Audio API
  const playSoundEffect = (type: 'victory' | 'defeat') => {
    try {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioCtx) return;
      const ctx = new AudioCtx();

      if (type === 'victory') {
        // Tần số nốt nhạc chiến thắng (C5 -> E5 -> G5 -> C6)
        const notes = [523.25, 659.25, 783.99, 1046.5];
        notes.forEach((freq, idx) => {
          const osc = ctx.createOscillator();
          const gain = ctx.createGain();
          osc.type = 'triangle';
          osc.frequency.value = freq;
          gain.gain.setValueAtTime(0.3, ctx.currentTime + idx * 0.12);
          gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + idx * 0.12 + 0.3);
          osc.connect(gain);
          gain.connect(ctx.destination);
          osc.start(ctx.currentTime + idx * 0.12);
          osc.stop(ctx.currentTime + idx * 0.12 + 0.3);
        });
      } else {
        // Âm thanh trầm thất bại
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(180, ctx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(60, ctx.currentTime + 0.6);
        gain.gain.setValueAtTime(0.4, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.6);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start();
        osc.stop(ctx.currentTime + 0.6);
      }
    } catch (e) {
      console.log('Audio Context Error:', e);
    }
  };

  // 🎆 Bắn pháo hoa Neon rực rỡ
  const triggerVictoryConfetti = () => {
    confetti({
      particleCount: 120,
      spread: 80,
      origin: { y: 0.6 },
      colors: ['#39FF14', '#00FFFF', '#FF007F', '#FFD700'],
    });
  };

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

  const getGameResult = () => {
    if (!myResult || opponentScore === null) return null;
    if (myResult.score > opponentScore) return { status: '🏆 VICTORY', color: '#39FF14', expChange: betAmount, sound: 'victory' };
    if (myResult.score < opponentScore) return { status: '💀 DEFEAT', color: '#FF0055', expChange: -betAmount, sound: 'defeat' };
    return { status: '🤝 DRAW', color: '#00FFFF', expChange: 0, sound: 'draw' };
  };

  const gameResult = getGameResult();

  // Kích hoạt hiệu ứng khi có kết quả
  useEffect(() => {
    if (gameResult && !expProcessed) {
      updateUserExp(gameResult.expChange);
      setExpProcessed(true);

      if (gameResult.sound === 'victory') {
        triggerVictoryConfetti();
        playSoundEffect('victory');
      } else if (gameResult.sound === 'defeat') {
        playSoundEffect('defeat');
      }
    }
  }, [gameResult, expProcessed]);

  return (
    <View style={styles.container}>
      <TouchableOpacity onPress={onBack} style={styles.backButton}>
        <Text style={styles.backText}>🔙 RỜI KHỎI ĐẤU TRƯỜNG</Text>
      </TouchableOpacity>

      <Text style={styles.header}>⚡ VIBESPEAK CYBER ARENA ⚡</Text>

      {/* THẺ RUNNER HOLOGRAPHIC */}
      <View style={styles.profileBadge}>
        <Text style={styles.profileText}>👤 RUNNER: <Text style={{ color: '#00FFFF' }}>{DUMMY_USER_ID}</Text></Text>
        <Text style={styles.expBadgeText}>💎 {userExp} EXP</Text>
      </View>

      {matchStatus === 'idle' && (
        <View style={styles.box}>
          <Text style={styles.label}>[ CHỌN MỨC CƯỢC HŨ EXP ]</Text>
          <View style={styles.betRow}>
            {[50, 100, 500].map((amount) => (
              <TouchableOpacity
                key={amount}
                style={[styles.betBtn, betAmount === amount && styles.activeBet]}
                onPress={() => setBetAmount(amount)}
              >
                <Text style={[styles.betText, betAmount === amount && { color: '#39FF14' }]}>{amount} EXP</Text>
              </TouchableOpacity>
            ))}
          </View>
          <TouchableOpacity style={styles.matchBtn} onPress={findMatch}>
            <Text style={styles.matchText}>🔥 TẤT TAY (FIND MATCH)</Text>
          </TouchableOpacity>
        </View>
      )}

      {matchStatus === 'searching' && (
        <View style={styles.box}>
          <ActivityIndicator size="large" color="#FF007F" style={{ marginBottom: 15 }} />
          <Text style={styles.statusText}>> SCANNING CYBERNETIC GRID...</Text>
        </View>
      )}

      {matchStatus === 'found' && (
        <View style={[styles.box, { borderColor: gameResult ? gameResult.color : '#39FF14', shadowColor: gameResult ? gameResult.color : '#39FF14' }]}>
          <Text style={styles.vsTitle}>⚡ TARGET: {opponent} ⚡</Text>
          <Text style={styles.potText}>💰 TOTAL POT: {betAmount * 2} EXP</Text>

          {!myResult ? (
            isAnalyzing ? (
              <View style={{ alignItems: 'center' }}>
                <ActivityIndicator size="large" color="#00FFFF" />
                <Text style={{ color: '#00FFFF', marginTop: 10, fontFamily: 'Courier New' }}>GROQ AI NEURAL PROCESSING...</Text>
              </View>
            ) : (
              <TouchableOpacity
                style={[styles.recordBtn, isRecording && styles.recordingActive]}
                onPress={isRecording ? stopRecording : startRecording}
              >
                <Text style={styles.recordText}>{isRecording ? '⏹️ STOP & SUBMIT' : '🎙️ TRANSMIT VOICE'}</Text>
              </TouchableOpacity>
            )
          ) : (
            <View style={{ alignItems: 'center', width: '100%' }}>
              <Text style={styles.scoreDetail}>MY SCORE: <Text style={{ color: '#39FF14', fontSize: 20 }}>{myResult.score}</Text></Text>
              <Text style={styles.scoreDetail}>
                OPPONENT SCORE: {opponentScore !== null ? <Text style={{ color: '#FF007F', fontSize: 20 }}>{opponentScore}</Text> : '⏳ SPEECH IN PROGRESS...'}
              </Text>

              {gameResult && (
                <View style={styles.resultContainer}>
                  <Text style={[styles.resultTitle, { color: gameResult.color }]}>{gameResult.status}</Text>
                  <Text style={[styles.expResultText, { color: gameResult.color }]}>
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
  container: { flex: 1, backgroundColor: '#05020D', padding: 20, paddingTop: 50 },
  backButton: { marginBottom: 15, alignSelf: 'flex-start', paddingHorizontal: 12, paddingVertical: 8, backgroundColor: '#0D0620', borderRadius: 6, borderWidth: 1, borderColor: '#FF007F' },
  backText: { color: '#FF007F', fontSize: 12, fontWeight: 'bold', fontFamily: 'Courier New' },
  header: { color: '#FF007F', fontSize: 20, fontWeight: '900', textAlign: 'center', marginBottom: 20, fontFamily: 'Courier New', letterSpacing: 2 },
  profileBadge: { backgroundColor: '#0D0620', padding: 14, borderRadius: 10, borderWidth: 1.5, borderColor: '#00FFFF', marginBottom: 25, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  profileText: { color: '#FFF', fontWeight: 'bold', fontSize: 13, fontFamily: 'Courier New' },
  expBadgeText: { color: '#39FF14', fontWeight: '900', fontSize: 16, fontFamily: 'Courier New' },
  box: { backgroundColor: '#0D0620', padding: 25, borderRadius: 16, borderWidth: 2, borderColor: '#FF007F', alignItems: 'center', shadowOffset: { width: 0, height: 0 }, shadowOpacity: 0.8, shadowRadius: 15 },
  label: { color: '#00FFFF', fontSize: 13, fontWeight: 'bold', marginBottom: 18, fontFamily: 'Courier New' },
  betRow: { flexDirection: 'row', justifyContent: 'space-between', width: '100%', marginBottom: 25 },
  betBtn: { flex: 1, padding: 14, borderWidth: 1, borderColor: '#332255', borderRadius: 8, alignItems: 'center', marginHorizontal: 4, backgroundColor: '#080314' },
  activeBet: { borderColor: '#39FF14', backgroundColor: '#052212' },
  betText: { color: '#8888AA', fontWeight: 'bold', fontFamily: 'Courier New' },
  matchBtn: { backgroundColor: '#FF007F', padding: 16, borderRadius: 10, width: '100%', alignItems: 'center' },
  recordBtn: { backgroundColor: '#39FF14', padding: 16, borderRadius: 10, width: '100%', alignItems: 'center' },
  recordingActive: { backgroundColor: '#FF0055' },
  matchText: { color: '#FFF', fontSize: 15, fontWeight: '900', fontFamily: 'Courier New' },
  recordText: { color: '#000', fontSize: 15, fontWeight: '900', fontFamily: 'Courier New' },
  statusText: { color: '#39FF14', fontSize: 13, fontFamily: 'Courier New' },
  vsTitle: { color: '#39FF14', fontSize: 18, fontWeight: '900', marginBottom: 6, fontFamily: 'Courier New' },
  potText: { color: '#FFD700', fontSize: 14, fontWeight: 'bold', marginBottom: 20, fontFamily: 'Courier New' },
  scoreDetail: { color: '#AAAABB', fontSize: 14, marginVertical: 4, fontFamily: 'Courier New' },
  resultContainer: { marginTop: 20, alignItems: 'center' },
  resultTitle: { fontSize: 32, fontWeight: '900', fontFamily: 'Courier New', letterSpacing: 2 },
  expResultText: { fontSize: 22, fontWeight: 'bold', marginTop: 5, fontFamily: 'Courier New' },
});