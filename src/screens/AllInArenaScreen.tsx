// src/screens/AllInArenaScreen.tsx
import React, { useState, useEffect, useRef } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView, ActivityIndicator } from 'react-native';
import { generateSoloTopic, SoloTopic } from '../services/arena/soloService';
import { generateRelayChallenge, RelayChallenge } from '../services/arena/relayService';
import { generateRoleplayScenario, RoleplayScenario } from '../services/arena/roleplayService';
import { updateUserProgress } from '../services/userService';

interface Props {
  onBack: () => void;
}

export default function AllInArenaScreen({ onBack }: Props) {
  const [mode, setMode] = useState<'solo' | 'relay' | 'roleplay'>('solo');
  const [cefrLevel, setCefrLevel] = useState<string>('B2');
  const [opponentType, setOpponentType] = useState<'bot' | 'pvp'>('bot');
  const [loading, setLoading] = useState<boolean>(false);

  // DỮ LIỆU ĐỀ THÁCH ĐẤU
  const [soloTopic, setSoloTopic] = useState<SoloTopic | null>(null);
  const [relayChallenge, setRelayChallenge] = useState<RelayChallenge | null>(null);
  const [roleplayScenario, setRoleplayScenario] = useState<RoleplayScenario | null>(null);

  // TRẠNG THÁI TRẬN ĐẤU & LƯỢT CHƠI
  const [battleState, setBattleState] = useState<'idle' | 'searching' | 'battling' | 'analyzing' | 'ended'>('idle');
  const [currentTurn, setCurrentTurn] = useState<1 | 2>(1); // Lượt 1 hoặc Lượt 2
  const [matchedOpponent, setMatchedOpponent] = useState<string>('');
  const [timeLeft, setTimeLeft] = useState<number>(30);
  
  // MICRO & RECORDING
  const [isRecording, setIsRecording] = useState<boolean>(false);
  const [recordedTurn1, setRecordedTurn1] = useState<Blob | null>(null);
  const [recordedTurn2, setRecordedTurn2] = useState<Blob | null>(null);
  const [result, setResult] = useState<{ score: number; isWin: boolean; feedback: string } | null>(null);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  const CEFR_LEVELS = ['A1', 'A2', 'B1', 'B2', 'C1', 'C2'];

  // ⏱️ THỜI GIAN CHO TỔNG TRẬN ĐẤU (SOLO CHIẾM 100%, RELAY/ROLEPLAY CHIA ĐÔI MỖI LƯỢT)
  const getTotalTimeForLevel = (level: string) => {
    if (level === 'A1' || level === 'A2') return 20; // 20s tổng (mỗi bạn 10s)
    if (level === 'B1' || level === 'B2') return 30; // 30s tổng (mỗi bạn 15s)
    return 60; // 60s tổng (mỗi bạn 30s)
  };

  const getTimePerTurn = (level: string, currentMode: string) => {
    const total = getTotalTimeForLevel(level);
    return currentMode === 'solo' ? total : Math.floor(total / 2);
  };

  const resetBattleState = () => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
      try { mediaRecorderRef.current.stop(); } catch (e) {}
    }
    if (timerRef.current) clearInterval(timerRef.current);
    
    setBattleState('idle');
    setCurrentTurn(1);
    setIsRecording(false);
    setRecordedTurn1(null);
    setRecordedTurn2(null);
    setResult(null);
    audioChunksRef.current = [];
  };

  const loadModeData = async (selectedMode: string, level: string) => {
    setLoading(true);
    resetBattleState();

    if (selectedMode === 'solo') {
      const data = await generateSoloTopic(level);
      setSoloTopic(data);
    } else if (selectedMode === 'relay') {
      const data = await generateRelayChallenge(level);
      setRelayChallenge(data);
    } else {
      const data = await generateRoleplayScenario(level);
      setRoleplayScenario(data);
    }
    setLoading(false);
  };

  useEffect(() => {
    loadModeData(mode, cefrLevel);
    return () => resetBattleState();
  }, [mode, cefrLevel]);

  // KÍCH HOẠT ĐỒNG HỒ ĐẾM NGƯỢC CHO LƯỢT HIỆN TẠI
  const startTurnTimer = (turnTime: number) => {
    if (timerRef.current) clearInterval(timerRef.current);
    setTimeLeft(turnTime);

    timerRef.current = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(timerRef.current!);
          // Hết giờ -> Tự động chuyển lượt nếu ở chế độ Relay/Roleplay
          handleAutoSwitchTurn();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  };

  const handleAutoSwitchTurn = () => {
    if (mode !== 'solo' && currentTurn === 1) {
      setCurrentTurn(2);
      const turn2Time = getTimePerTurn(cefrLevel, mode);
      startTurnTimer(turn2Time);
    }
  };

  // ⚔️ BẮT ĐẦU VÀO TRẬN
  const startMatch = () => {
    setBattleState('searching');
    
    setTimeout(() => {
      if (opponentType === 'bot') {
        setMatchedOpponent('🤖 CYBER BOT [' + cefrLevel + ']');
      } else {
        const fakeUsernames = ['CyberKnight99', 'NeonSpeaker', 'VibeMaster', 'EchoRider'];
        const randomUser = fakeUsernames[Math.floor(Math.random() * fakeUsernames.length)];
        setMatchedOpponent('👤 ' + randomUser + ' [' + cefrLevel + ']');
      }
      
      setCurrentTurn(1);
      setBattleState('battling');
      const turnTime = getTimePerTurn(cefrLevel, mode);
      startTurnTimer(turnTime);
    }, 1500);
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

          mediaRecorder.ondataavailable = (event) => {
            if (event.data && event.data.size > 0) {
              audioChunksRef.current.push(event.data);
            }
          };

          mediaRecorder.onstop = () => {
            const recordedBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
            if (recordedBlob.size > 2000) {
              if (currentTurn === 1) {
                setRecordedTurn1(recordedBlob);
              } else {
                setRecordedTurn2(recordedBlob);
              }
            } else {
              if (typeof window !== 'undefined') {
                alert("⚠️ Thu âm không có tiếng hoặc quá ngắn! Vui lòng đọc lại.");
              }
            }
            stream.getTracks().forEach(track => track.stop());
          };

          mediaRecorder.start();
          setIsRecording(true);
        } else {
          alert("Trình duyệt không hỗ trợ micro thu âm!");
        }
      } catch (err) {
        alert("🔒 Lỗi: Vui lòng cấp quyền Microphone trên trình duyệt!");
      }
    } else {
      setIsRecording(false);
      if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
        mediaRecorderRef.current.stop();
      }
    }
  };

  // NÚT CHUYỂN BẰNG TAY SANG LƯỢT 2 (DÀNH CHO RELAY / ROLEPLAY)
  const handleNextTurnManual = () => {
    if (!recordedTurn1) {
      alert("🔒 LƯỢT 1 CHƯA THU ÂM: Vui lòng ghi âm phần nói của Lượt 1 trước khi chuyển lượt tiếp sức!");
      return;
    }
    setCurrentTurn(2);
    const turn2Time = getTimePerTurn(cefrLevel, mode);
    startTurnTimer(turn2Time);
  };

  // 📊 NỘP BÀI VÀ CHẤM ĐIỂM
  const handleSubmitBattleAnswer = () => {
    const isMultiTurn = mode !== 'solo';
    const isMissingRecord = isMultiTurn ? (!recordedTurn1 || !recordedTurn2) : !recordedTurn1;

    if (isMissingRecord) {
      alert(isMultiTurn 
        ? "🔒 CHƯA HOÀN THÀNH ĐỦ 2 LƯỢT THU ÂM: Cần thu âm lượt tiếp sức của cả 2 bạn trước khi nộp bài!" 
        : "🔒 CHƯA THU ÂM: Hãy bấm Micro để thu âm phản xạ trước khi nộp bài!");
      return;
    }

    if (timerRef.current) clearInterval(timerRef.current);
    if (isRecording) setIsRecording(false);

    setBattleState('analyzing');

    setTimeout(() => {
      const randomScore = Math.floor(Math.random() * 25) + 72;
      const isWin = randomScore >= 75;

      setResult({
        score: randomScore,
        isWin: isWin,
        feedback: isWin 
          ? `Phối hợp xuất sắc trong ${mode.toUpperCase()}! Cả 2 lượt phản xạ đều đúng ngữ điệu và nhịp độ.`
          : "Độ liên kết câu giữa 2 lượt chưa mượt. Cần chú ý ngắt nghỉ và luyến âm nối tiếp."
      });

      setBattleState('ended');
      updateUserProgress(2, isWin ? 50 : 15, isWin);
    }, 2000);
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={onBack} style={styles.backBtn}>
          <Text style={styles.backText}>🔙 QUAY LẠI MAP</Text>
        </TouchableOpacity>
        <Text style={styles.title}>⚔️ TRẠM 2: ALL-IN ARENA</Text>
      </View>

      <ScrollView contentContainerStyle={{ alignItems: 'center', width: '100%', paddingBottom: 30 }}>
        {/* CHỌN CHẾ ĐỘ THI ĐẤU */}
        <Text style={styles.sectionLabel}>1. CHỌN DẠNG BÀI ĐẤU TRƯỜNG:</Text>
        <View style={styles.tabRow}>
          <TouchableOpacity 
            style={[styles.modeTab, mode === 'solo' && styles.modeTabActive]} 
            onPress={() => setMode('solo')}
          >
            <Text style={[styles.modeTabText, mode === 'solo' && styles.modeTextActive]}>🔥 SOLO PULSE</Text>
          </TouchableOpacity>
          <TouchableOpacity 
            style={[styles.modeTab, mode === 'relay' && styles.modeTabActive]} 
            onPress={() => setMode('relay')}
          >
            <Text style={[styles.modeTabText, mode === 'relay' && styles.modeTextActive]}>🤝 RELAY 2P</Text>
          </TouchableOpacity>
          <TouchableOpacity 
            style={[styles.modeTab, mode === 'roleplay' && styles.modeTabActive]} 
            onPress={() => setMode('roleplay')}
          >
            <Text style={[styles.modeTabText, mode === 'roleplay' && styles.modeTextActive]}>🎭 ROLEPLAY</Text>
          </TouchableOpacity>
        </View>

        {/* CHỌN ĐỐI THỦ */}
        <Text style={styles.sectionLabel}>2. CHỌN ĐỐI THỦ THÁCH ĐẤU:</Text>
        <View style={styles.opponentRow}>
          <TouchableOpacity 
            style={[styles.opponentBtn, opponentType === 'bot' && styles.opponentBtnActive]} 
            onPress={() => setOpponentType('bot')}
          >
            <Text style={[styles.opponentText, opponentType === 'bot' && styles.opponentTextActive]}>🤖 ĐẤU BOT AI</Text>
          </TouchableOpacity>

          <TouchableOpacity 
            style={[styles.opponentBtn, opponentType === 'pvp' && styles.opponentBtnActivePvP]} 
            onPress={() => setOpponentType('pvp')}
          >
            <Text style={[styles.opponentText, opponentType === 'pvp' && styles.opponentTextActive]}>👥 ĐẤU NGƯỜI THẬT</Text>
          </TouchableOpacity>
        </View>

        {/* CHỌN CẤP ĐỘ CEFR */}
        <Text style={styles.sectionLabel}>
          3. CHỌN LEVEL ({mode === 'solo' ? `${getTotalTimeForLevel(cefrLevel)}s` : `Mỗi lượt ${getTimePerTurn(cefrLevel, mode)}s`}):
        </Text>
        <View style={styles.cefrRow}>
          {CEFR_LEVELS.map((lvl) => (
            <TouchableOpacity
              key={lvl}
              style={[
                styles.cefrBadge,
                cefrLevel === lvl && styles.cefrBadgeActive,
                lvl === 'C2' && { borderColor: '#FF007F' }
              ]}
              onPress={() => setCefrLevel(lvl)}
            >
              <Text style={[
                styles.cefrText, 
                cefrLevel === lvl && styles.cefrTextActive,
                lvl === 'C2' && { color: '#FF007F' }
              ]}>{lvl}</Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* CHỜ VÀO TRẬN */}
        {battleState === 'idle' && (
          <View style={styles.box}>
            <Text style={styles.boxTitle}>
              ⚡ {mode.toUpperCase()} • {opponentType === 'bot' ? '🤖 BOT' : '👥 PVP'} [{cefrLevel}]
            </Text>
            
            {loading ? (
              <ActivityIndicator size="small" color="#FF007F" style={{ marginVertical: 15 }} />
            ) : (
              <View style={{ width: '100%', alignItems: 'center' }}>
                {mode === 'solo' && soloTopic && (
                  <>
                    <Text style={styles.topicTitle}>{soloTopic.title}</Text>
                    <Text style={styles.promptText}>"{soloTopic.promptText}"</Text>
                  </>
                )}

                {mode === 'relay' && relayChallenge && (
                  <>
                    <Text style={styles.topicTitle}>📌 {relayChallenge.topic}</Text>
                    <Text style={styles.promptText}>💡 Bối cảnh: {relayChallenge.context}</Text>
                    <Text style={styles.subText}>👤 Lượt 1 ({getTimePerTurn(cefrLevel, mode)}s): {relayChallenge.player1Guideline}</Text>
                    <Text style={styles.subText}>👥 Lượt 2 ({getTimePerTurn(cefrLevel, mode)}s): {relayChallenge.player2Guideline}</Text>
                  </>
                )}

                {mode === 'roleplay' && roleplayScenario && (
                  <>
                    <Text style={styles.topicTitle}>🎭 {roleplayScenario.scenarioTitle}</Text>
                    <Text style={styles.promptText}>💬 Mở đầu: "{roleplayScenario.initialAiMessage}"</Text>
                    <Text style={styles.subText}>👤 Bạn ({getTimePerTurn(cefrLevel, mode)}s) • 👥 {opponentType === 'bot' ? 'Bot' : 'Đối thủ'} ({getTimePerTurn(cefrLevel, mode)}s)</Text>
                  </>
                )}
              </View>
            )}

            <TouchableOpacity 
              style={styles.refreshBtn} 
              onPress={() => loadModeData(mode, cefrLevel)}
              disabled={loading}
            >
              <Text style={styles.refreshBtnText}>🔄 ĐỔI ĐỀ MỚI KHÔNG LẶP</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.startBtn} onPress={startMatch}>
              <Text style={styles.startBtnText}>⚔️ BẮT ĐẦU TIẾP SỨC ĐẤU TRƯỜNG</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* TRẠNG THÁI 1: GHÉP CẶP */}
        {battleState === 'searching' && (
          <View style={styles.box}>
            <ActivityIndicator size="large" color="#FF007F" style={{ marginBottom: 15 }} />
            <Text style={styles.searchingText}>
              {opponentType === 'bot' 
                ? `🤖 CHUẨN BỊ BOT AI CHO LƯỢT ĐẤU [${cefrLevel}]...` 
                : `🔍 ĐANG KẾT NỐI ĐỒNG ĐỘI TIẾP SỨC [${cefrLevel}]...`}
            </Text>
          </View>
        )}

        {/* TRẠNG THÁI 2: ĐANG THI ĐẤU (CÓ CHIA THỜI GIAN MỖI BẠN MỘT NỬA) */}
        {battleState === 'battling' && (
          <View style={styles.box}>
            <View style={styles.battleHeader}>
              <Text style={styles.opponentName}>
                {mode === 'solo' 
                  ? `⚔️ ĐỐI THỦ: ${matchedOpponent}` 
                  : `🤝 ${mode.toUpperCase()} (ĐANG Ở LƯỢT ${currentTurn}/2)`}
              </Text>
              <Text style={[styles.timerText, timeLeft <= 5 && { color: '#FF0055' }]}>
                ⏱ LƯỢT {currentTurn}: {timeLeft}s
              </Text>
            </View>

            {mode !== 'solo' && (
              <View style={styles.turnBadgeBox}>
                <Text style={styles.turnBadgeText}>
                  {currentTurn === 1 
                    ? `👤 LƯỢT 1 OF 2 (${getTimePerTurn(cefrLevel, mode)}s): Bạn hãy thực hiện phần tiếp sức đầu tiên` 
                    : `👥 LƯỢT 2 OF 2 (${getTimePerTurn(cefrLevel, mode)}s): ${matchedOpponent} thực hiện phần tiếp nối`}
                </Text>
              </View>
            )}

            <TouchableOpacity 
              style={[styles.recordToggleBtn, isRecording && styles.recordToggleBtnActive]} 
              onPress={handleToggleRecord}
            >
              <Text style={styles.recordToggleText}>
                {isRecording 
                  ? `🔴 ĐANG THU ÂM LƯỢT ${currentTurn}... (BẤM ĐỂ DỪNG)` 
                  : (currentTurn === 1 ? recordedTurn1 : recordedTurn2)
                  ? `✅ ĐÃ THU ÂM LƯỢT ${currentTurn} (BẤM ĐỂ THU LẠI)` 
                  : `🎙️ BẤM ĐỂ THU ÂM LƯỢT ${currentTurn}`}
              </Text>
            </TouchableOpacity>

            {/* CHUYỂN LƯỢT HOẶC NỘP BÀI */}
            {mode !== 'solo' && currentTurn === 1 ? (
              <TouchableOpacity style={styles.nextTurnBtn} onPress={handleNextTurnManual}>
                <Text style={styles.nextTurnBtnText}>➡️ CHUYỂN SANG LƯỢT 2 ({getTimePerTurn(cefrLevel, mode)}s)</Text>
              </TouchableOpacity>
            ) : (
              <TouchableOpacity 
                style={[
                  styles.submitBtn, 
                  (mode === 'solo' ? !recordedTurn1 : (!recordedTurn1 || !recordedTurn2)) && styles.submitBtnDisabled
                ]} 
                onPress={handleSubmitBattleAnswer}
              >
                <Text style={styles.submitBtnText}>
                  {(mode === 'solo' ? recordedTurn1 : (recordedTurn1 && recordedTurn2))
                    ? '⚡ NỘP BÀI & AI CHẤM ĐIỂM CẢ 2 LƯỢT' 
                    : '🔒 CẦN HOÀN THÀNH ĐỦ THU ÂM CÁC LƯỢT'}
                </Text>
              </TouchableOpacity>
            )}
          </View>
        )}

        {/* TRẠNG THÁI 3: AI PHÂN TÍCH */}
        {battleState === 'analyzing' && (
          <View style={styles.box}>
            <ActivityIndicator size="large" color="#39FF14" style={{ marginBottom: 15 }} />
            <Text style={styles.searchingText}>⚡ AI ĐANG PHÂN TÍCH CẢ 2 LƯỢT TIẾP SỨC...</Text>
          </View>
        )}

        {/* TRẠNG THÁI 4: KẾT QUẢ */}
        {battleState === 'ended' && result && (
          <View style={styles.box}>
            <Text style={[styles.resultTitle, { color: result.isWin ? '#39FF14' : '#FF0055' }]}>
              {result.isWin ? '🎉 CHIẾN THẮNG TIẾP SỨC xuất sắc!' : '💀 ĐỘI TIẾP SỨC CHƯA ĐẠT CHUẨN'}
            </Text>
            <Text style={styles.scoreText}>⚡ ĐIỂM TỔNG HỢP 2 LƯỢT: {result.score} / 100 ĐIỂM</Text>
            <Text style={styles.feedbackText}>{result.feedback}</Text>

            <TouchableOpacity style={styles.startBtn} onPress={() => loadModeData(mode, cefrLevel)}>
              <Text style={styles.startBtnText}>🔄 THI ĐẤU TRẬN MỚI</Text>
            </TouchableOpacity>
          </View>
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
  sectionLabel: { color: '#FFD700', fontSize: 10, fontWeight: 'bold', alignSelf: 'flex-start', marginBottom: 6 },
  tabRow: { flexDirection: 'row', justifyContent: 'space-between', width: '100%', marginBottom: 12 },
  modeTab: { backgroundColor: '#0D0620', paddingVertical: 8, paddingHorizontal: 6, borderRadius: 8, borderWidth: 1, borderColor: '#332255', width: '32%', alignItems: 'center' },
  modeTabActive: { backgroundColor: '#FF007F', borderColor: '#FF007F' },
  modeTabText: { color: '#8888AA', fontSize: 9, fontWeight: '900' },
  modeTextActive: { color: '#FFF' },
  opponentRow: { flexDirection: 'row', justifyContent: 'space-between', width: '100%', marginBottom: 12 },
  opponentBtn: { backgroundColor: '#0D0620', paddingVertical: 10, borderRadius: 8, borderWidth: 1, borderColor: '#332255', width: '48%', alignItems: 'center' },
  opponentBtnActive: { backgroundColor: '#00FFFF', borderColor: '#00FFFF' },
  opponentBtnActivePvP: { backgroundColor: '#FF007F', borderColor: '#FF007F' },
  opponentText: { color: '#AAAABB', fontSize: 10, fontWeight: '900' },
  opponentTextActive: { color: '#000' },
  cefrRow: { flexDirection: 'row', justifyContent: 'space-between', width: '100%', marginBottom: 15 },
  cefrBadge: { backgroundColor: '#0D0620', paddingVertical: 6, paddingHorizontal: 10, borderRadius: 6, borderWidth: 1, borderColor: '#332255' },
  cefrBadgeActive: { backgroundColor: '#39FF14', borderColor: '#39FF14' },
  cefrText: { color: '#8888AA', fontSize: 10, fontWeight: 'bold' },
  cefrTextActive: { color: '#000' },
  box: { backgroundColor: '#0D0620', padding: 18, borderRadius: 16, borderWidth: 2, borderColor: '#FF007F', width: '100%', alignItems: 'center', marginBottom: 20 },
  boxTitle: { color: '#FFD700', fontSize: 11, fontWeight: '900', marginBottom: 12 },
  topicTitle: { color: '#00FFFF', fontSize: 13, fontWeight: '900', marginBottom: 6 },
  promptText: { color: '#FFF', fontSize: 13, fontWeight: '800', textAlign: 'center', lineHeight: 18, marginBottom: 10 },
  subText: { color: '#AAAABB', fontSize: 10, textAlign: 'center', marginBottom: 4 },
  searchingText: { color: '#00FFFF', fontSize: 11, fontWeight: 'bold' },
  refreshBtn: { backgroundColor: '#1A0B2E', padding: 8, borderRadius: 8, borderWidth: 1, borderColor: '#00FFFF', width: '100%', alignItems: 'center', marginBottom: 12 },
  refreshBtnText: { color: '#00FFFF', fontSize: 10, fontWeight: 'bold' },
  startBtn: { backgroundColor: '#FF007F', padding: 14, borderRadius: 12, width: '100%', alignItems: 'center' },
  startBtnText: { color: '#FFF', fontSize: 11, fontWeight: '900' },
  battleHeader: { flexDirection: 'row', justifyContent: 'space-between', width: '100%', marginBottom: 10, alignItems: 'center' },
  opponentName: { color: '#00FFFF', fontSize: 11, fontWeight: '900' },
  timerText: { color: '#39FF14', fontSize: 13, fontWeight: '900' },
  turnBadgeBox: { backgroundColor: '#1A0B2E', padding: 8, borderRadius: 8, borderWidth: 1, borderColor: '#FFD700', width: '100%', marginBottom: 12 },
  turnBadgeText: { color: '#FFD700', fontSize: 10, fontWeight: 'bold', textAlign: 'center' },
  recordToggleBtn: { backgroundColor: '#1A0B2E', padding: 12, borderRadius: 10, borderWidth: 2, borderColor: '#FF007F', width: '100%', alignItems: 'center', marginBottom: 10 },
  recordToggleBtnActive: { backgroundColor: '#FF0055', borderColor: '#FF0055' },
  recordToggleText: { color: '#FFF', fontSize: 10, fontWeight: '900' },
  nextTurnBtn: { backgroundColor: '#00FFFF', padding: 12, borderRadius: 10, width: '100%', alignItems: 'center' },
  nextTurnBtnText: { color: '#000', fontSize: 10, fontWeight: '900' },
  submitBtn: { backgroundColor: '#39FF14', padding: 14, borderRadius: 12, width: '100%', alignItems: 'center' },
  submitBtnDisabled: { backgroundColor: '#224422', opacity: 0.3 },
  submitBtnText: { color: '#000', fontSize: 11, fontWeight: '900' },
  resultTitle: { fontSize: 14, fontWeight: '900', marginBottom: 8 },
  scoreText: { color: '#FFD700', fontSize: 12, fontWeight: '900', marginBottom: 6 },
  feedbackText: { color: '#AAAABB', fontSize: 10, textAlign: 'center', marginBottom: 15 }
});