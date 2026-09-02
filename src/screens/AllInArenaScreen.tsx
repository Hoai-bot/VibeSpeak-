import React, { useState, useRef } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ActivityIndicator, Alert } from 'react-native';
import { useSupabaseRealtime } from '../hooks/useSupabaseRealtime';
import { transcribeAndGradeAudio } from '../services/groqClient';

export default function AllInArenaScreen({ onBack }: { onBack: () => void }) {
  const [betAmount, setBetAmount] = useState<number>(100);
  const userIdRef = useRef('runner_' + Math.floor(Math.random() * 100000));
  const DUMMY_USER_ID = userIdRef.current;

  const { findMatch, matchStatus, opponent } = useSupabaseRealtime(DUMMY_USER_ID, betAmount);

  // State Web Recording
  const [isRecording, setIsRecording] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [result, setResult] = useState<{ text: string; score: number } | null>(null);

  const mediaRecorderRef = useRef<any>(null);
  const audioChunksRef = useRef<any[]>([]);

  // Bắt đầu thu âm Web
  const startRecording = async () => {
    try {
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        alert('Trình duyệt của bạn không hỗ trợ thu âm trực tiếp!');
        return;
      }

      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      mediaRecorderRef.current = new MediaRecorder(stream);
      audioChunksRef.current = [];

      mediaRecorderRef.current.ondataavailable = (event: any) => {
        if (event.data && event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorderRef.current.start();
      setIsRecording(true);
    } catch (err: any) {
      console.error('Lỗi Micro:', err);
      alert('Không thể mở Micro! Vui lòng cho phép quyền truy cập Micro trên trình duyệt.');
    }
  };

  // Dừng thu âm & Phân tích
  const stopRecording = () => {
    try {
      if (!mediaRecorderRef.current) return;

      setIsRecording(false);
      setIsAnalyzing(true);

      mediaRecorderRef.current.onstop = async () => {
        try {
          const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/wav' });
          const res = await transcribeAndGradeAudio(audioBlob);
          setResult(res);
        } catch (error) {
          console.error('Lỗi phân tích:', error);
          setResult({ text: 'Lỗi trong quá trình xử lý audio', score: 0 });
        } finally {
          setIsAnalyzing(false);
          // Tắt các track mic để giải phóng thiết bị
          if (mediaRecorderRef.current?.stream) {
            mediaRecorderRef.current.stream.getTracks().forEach((track: any) => track.stop());
          }
        }
      };

      mediaRecorderRef.current.stop();
    } catch (err) {
      console.error('Lỗi dừng ghi âm:', err);
      setIsAnalyzing(false);
      setIsRecording(false);
    }
  };

  return (
    <View style={styles.container}>
      <TouchableOpacity onPress={onBack} style={styles.backButton}>
        <Text style={styles.backText}>🔙 RỜI KHỎI ĐẤU TRƯỜNG</Text>
      </TouchableOpacity>

      <Text style={styles.header}>[ ĐẤU TRƯỜNG TẤT TAY ]</Text>

      {/* CHỜ GHÉP CẶP */}
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

      {/* ĐANG QUÉT */}
      {matchStatus === 'searching' && (
        <View style={styles.box}>
          <ActivityIndicator size="large" color="#FF007F" style={{ marginBottom: 15 }} />
          <Text style={styles.statusText}>> Đang quét mạng lưới tìm đối thủ...</Text>
        </View>
      )}

      {/* MÀN HÌNH ĐẤU */}
      {matchStatus === 'found' && (
        <View style={[styles.box, { borderColor: '#39FF14' }]}>
          <Text style={styles.vsTitle}>⚡ ĐỐI THỦ: {opponent} ⚡</Text>
          <Text style={{ color: '#FFD700', marginBottom: 20 }}>Tổng hũ: {betAmount * 2} EXP</Text>

          {!result ? (
            <>
              {isAnalyzing ? (
                <View style={{ alignItems: 'center' }}>
                  <ActivityIndicator size="large" color="#00FFFF" />
                  <Text style={{ color: '#00FFFF', marginTop: 10 }}>Groq AI đang phân tích giọng nói...</Text>
                </View>
              ) : (
                <TouchableOpacity
                  style={[styles.recordBtn, isRecording && { backgroundColor: '#FF0000' }]}
                  onPress={isRecording ? stopRecording : startRecording}
                >
                  <Text style={styles.recordText}>
                    {isRecording ? '⏹️ DỪNG & GỬI BÀI' : '🎙️ BẮT ĐẦU NÓI (THU ÂM)'}
                  </Text>
                </TouchableOpacity>
              )}
            </>
          ) : (
            <View style={{ alignItems: 'center', width: '100%' }}>
              <Text style={{ color: '#FFF', fontSize: 16 }}>Văn bản nhận diện:</Text>
              <Text style={{ color: '#00FFFF', fontStyle: 'italic', marginVertical: 8 }}>"{result.text}"</Text>
              <Text style={{ color: '#39FF14', fontSize: 24, fontWeight: 'bold' }}>
                ĐIỂM SỐ: {result.score} / 100
              </Text>
              <TouchableOpacity 
                style={[styles.matchBtn, { marginTop: 15, backgroundColor: '#00FFFF' }]}
                onPress={() => setResult(null)}
              >
                <Text style={[styles.recordText, { color: '#000' }]}>🔄 THỬ LẠI</Text>
              </TouchableOpacity>
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
  header: { color: '#FF007F', fontSize: 24, fontWeight: 'bold', textAlign: 'center', marginBottom: 30, fontFamily: 'Courier New' },
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
  statusText: { color: '#39FF14', fontFamily: 'Courier New', fontSize: 14 },
  vsTitle: { color: '#39FF14', fontSize: 18, fontWeight: 'bold', marginBottom: 5 }
});