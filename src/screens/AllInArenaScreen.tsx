import React, { useState, useRef, useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ActivityIndicator, ScrollView } from 'react-native';
import confetti from 'canvas-confetti';
import { useSupabaseRealtime } from '../hooks/useSupabaseRealtime';
import { transcribeAndGradeAudio } from '../services/groqClient';
import { supabase } from '../services/supabaseClient';

export default function AllInArenaScreen({ 
  onBack, 
  customUserId 
}: { 
  onBack: () => void; 
  customUserId?: string 
}) {
  const [betAmount, setBetAmount] = useState<number>(100);
  const [activeTab, setActiveTab] = useState<'arena' | 'leaderboard'>('arena');
  const [leaderboardData, setLeaderboardData] = useState<any[]>([]);

  const userIdRef = useRef(customUserId || 'runner_' + Math.floor(Math.random() * 1000000));
  const DUMMY_USER_ID = userIdRef.current;

  const { findMatch, submitScore, matchStatus, opponent, opponentScore, userExp, updateUserExp } =
    useSupabaseRealtime(DUMMY_USER_ID, betAmount);

  const [isRecording, setIsRecording] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [myResult, setMyResult] = useState<{ text: string; score: number } | null>(null);

  const mediaRecorderRef = useRef<any>(null);
  const audioChunksRef = useRef<any[]>([]);

  // Tải dữ liệu Bảng xếp hạng khi đổi Tab
  useEffect(() => {
    if (activeTab === 'leaderboard') {
      fetchLeaderboard();
    }
  }, [activeTab]);

  const fetchLeaderboard = async () => {
    const { data } = await supabase.from('arena_leaderboard').select('*');
    if (data) setLeaderboardData(data);
  };

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mimeType = MediaRecorder.isTypeSupported('audio/webm') ? 'audio/webm' : 'audio/mp4';
      mediaRecorderRef.current = new MediaRecorder(stream, { mimeType });
      audioChunksRef.current = [];

      mediaRecorderRef.current.ondataavailable = (event: any) => {
        if (event.data && event.data.size > 0) audioChunksRef.current.push(event.data);
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
      const res = await transcribeAndGradeAudio(audioBlob);
      setMyResult(res);
      if (res.score > 0) await submitScore(res.score);
    } catch (error) {
      alert('Lỗi phân tích bài nói!');
    } finally {
      setIsAnalyzing(false);
    }
  };

  return (
    <View style={styles.container}>
      {/* HEADER & TABS */}
      <View style={styles.topBar}>
        <TouchableOpacity onPress={onBack} style={styles.backButton}>
          <Text style={styles.backText}>🔙 EXIT</Text>
        </TouchableOpacity>
        <View style={styles.tabGroup}>
          <TouchableOpacity 
            style={[styles.tabBtn, activeTab === 'arena' && styles.activeTabBtn]} 
            onPress={() => setActiveTab('arena')}
          >
            <Text style={[styles.tabText, activeTab === 'arena' && styles.activeTabText]}>⚔️ ARENA</Text>
          </TouchableOpacity>
          <TouchableOpacity 
            style={[styles.tabBtn, activeTab === 'leaderboard' && styles.activeTabBtn]} 
            onPress={() => setActiveTab('leaderboard')}
          >
            <Text style={[styles.tabText, activeTab === 'leaderboard' && styles.activeTabText]}>🏆 TOP RUNNERS</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* TẠM THỜI CHỌN TÍNH NĂNG THEO TAB */}
      {activeTab === 'leaderboard' ? (
        <View style={styles.leaderboardBox}>
          <Text style={styles.lbHeader}>⚡ HALL OF FAME ⚡</Text>
          <ScrollView style={{ width: '100%' }}>
            {leaderboardData.map((item, index) => (
              <View key={index} style={styles.lbRow}>
                <Text style={styles.lbRank}>#{index + 1}</Text>
                <Text style={styles.lbName}>{item.runner_id}</Text>
                <Text style={styles.lbScore}>+{item.total_profit} EXP</Text>
              </View>
            ))}
          </ScrollView>
        </View>
      ) : (
        <>
          {/* BADGE PLAYER */}
          <View style={styles.profileBadge}>
            <Text style={styles.profileText}>👤 RUNNER: <Text style={{ color: '#00FFFF' }}>{DUMMY_USER_ID}</Text></Text>
            <Text style={styles.expBadgeText}>💎 {userExp} EXP</Text>
          </View>

          {/* CHỌN MỨC CƯỢC */}
          {matchStatus === 'idle' && (
            <View style={styles.box}>
              <Text style={styles.label}>[ CHỌN HŨ CƯỢC EXP ]</Text>
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

          {/* DOWNTIME SCANNING */}
          {matchStatus === 'searching' && (
            <View style={styles.box}>
              <ActivityIndicator size="large" color="#FF007F" style={{ marginBottom: 15 }} />
              <Text style={styles.statusText}>> SCANNING CYBERNETIC GRID FOR OPPONENT...</Text>
            </View>
          )}

          {/* TRẬN ĐẤU */}
          {matchStatus === 'found' && (
            <View style={styles.box}>
              <Text style={styles.vsTitle}>⚡ TARGET: {opponent} ⚡</Text>
              <Text style={styles.potText}>💰 TOTAL POT: {betAmount * 2} EXP</Text>

              {!myResult ? (
                isAnalyzing ? (
                  <ActivityIndicator size="large" color="#00FFFF" />
                ) : (
                  <TouchableOpacity
                    style={[styles.recordBtn, isRecording && styles.recordingActive]}
                    onPress={isRecording ? stopRecording : startRecording}
                  >
                    <Text style={styles.recordText}>{isRecording ? '⏹️ STOP & SUBMIT' : '🎙️ TRANSMIT VOICE'}</Text>
                  </TouchableOpacity>
                )
              ) : (
                <View style={{ width: '100%', alignItems: 'center' }}>
                  <Text style={{ color: '#00FFFF', marginBottom: 10 }}>MY VOICE: "{myResult.text}"</Text>
                  {/* THANH THANG ĐIỂM CYBER */}
                  <View style={styles.scoreGauge}>
                    <View style={[styles.scoreBar, { width: `${myResult.score}%`, backgroundColor: '#39FF14' }]} />
                  </View>
                  <Text style={{ color: '#39FF14', fontWeight: 'bold' }}>MY SCORE: {myResult.score}/100</Text>
                  <Text style={{ color: '#FF007F', marginTop: 10 }}>OPPONENT SCORE: {opponentScore ?? '⏳ SPEECH IN PROGRESS...'}</Text>
                </View>
              )}
            </View>
          )}
        </>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#05020D', padding: 20, paddingTop: 40 },
  topBar: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
  backButton: { paddingHorizontal: 10, paddingVertical: 6, backgroundColor: '#0D0620', borderRadius: 6, borderWidth: 1, borderColor: '#FF007F' },
  backText: { color: '#FF007F', fontSize: 11, fontWeight: 'bold', fontFamily: 'Courier New' },
  tabGroup: { flexDirection: 'row' },
  tabBtn: { paddingHorizontal: 12, paddingVertical: 6, marginHorizontal: 2, borderRadius: 6, backgroundColor: '#0D0620' },
  activeTabBtn: { backgroundColor: '#FF007F' },
  tabText: { color: '#8888AA', fontSize: 11, fontWeight: 'bold', fontFamily: 'Courier New' },
  activeTabText: { color: '#FFF' },
  profileBadge: { backgroundColor: '#0D0620', padding: 14, borderRadius: 10, borderWidth: 1.5, borderColor: '#00FFFF', marginBottom: 20, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  profileText: { color: '#FFF', fontWeight: 'bold', fontSize: 12, fontFamily: 'Courier New' },
  expBadgeText: { color: '#39FF14', fontWeight: '900', fontSize: 15, fontFamily: 'Courier New' },
  box: { backgroundColor: '#0D0620', padding: 20, borderRadius: 16, borderWidth: 2, borderColor: '#FF007F', alignItems: 'center' },
  label: { color: '#00FFFF', fontSize: 12, fontWeight: 'bold', marginBottom: 15, fontFamily: 'Courier New' },
  betRow: { flexDirection: 'row', justifyContent: 'space-between', width: '100%', marginBottom: 20 },
  betBtn: { flex: 1, padding: 12, borderWidth: 1, borderColor: '#332255', borderRadius: 8, alignItems: 'center', marginHorizontal: 3, backgroundColor: '#080314' },
  activeBet: { borderColor: '#39FF14', backgroundColor: '#052212' },
  betText: { color: '#8888AA', fontWeight: 'bold', fontFamily: 'Courier New' },
  matchBtn: { backgroundColor: '#FF007F', padding: 14, borderRadius: 10, width: '100%', alignItems: 'center' },
  recordBtn: { backgroundColor: '#39FF14', padding: 14, borderRadius: 10, width: '100%', alignItems: 'center' },
  recordingActive: { backgroundColor: '#FF0055' },
  matchText: { color: '#FFF', fontSize: 14, fontWeight: '900', fontFamily: 'Courier New' },
  recordText: { color: '#000', fontSize: 14, fontWeight: '900', fontFamily: 'Courier New' },
  statusText: { color: '#39FF14', fontSize: 12, fontFamily: 'Courier New' },
  vsTitle: { color: '#39FF14', fontSize: 16, fontWeight: '900', marginBottom: 4, fontFamily: 'Courier New' },
  potText: { color: '#FFD700', fontSize: 13, fontWeight: 'bold', marginBottom: 15, fontFamily: 'Courier New' },
  scoreGauge: { width: '100%', height: 10, backgroundColor: '#222', borderRadius: 5, overflow: 'hidden', marginVertical: 8 },
  scoreBar: { height: '100%' },
  leaderboardBox: { flex: 1, backgroundColor: '#0D0620', padding: 20, borderRadius: 16, borderWidth: 2, borderColor: '#00FFFF', alignItems: 'center' },
  lbHeader: { color: '#00FFFF', fontSize: 18, fontWeight: '900', marginBottom: 15, fontFamily: 'Courier New' },
  lbRow: { flexDirection: 'row', justifyContent: 'space-between', width: '100%', paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: '#221144' },
  lbRank: { color: '#FFD700', fontWeight: 'bold', fontFamily: 'Courier New', width: 35 },
  lbName: { color: '#FFF', flex: 1, fontFamily: 'Courier New' },
  lbScore: { color: '#39FF14', fontWeight: 'bold', fontFamily: 'Courier New' },
});