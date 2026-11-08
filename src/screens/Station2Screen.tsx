// src/screens/Station2Screen.tsx
import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView } from 'react-native';
import AntiCheatSpeakingSession from '../components/AntiCheatSpeakingSession';
import { analyzeSpeechSpontaneity } from '../utils/spontaneityDetector';
import { supabase } from '../utils/supabase';

interface Props {
  onBack: () => void;
}

interface Scenario {
  id: string;
  role: string;
  situation: string;
  prompt: string;
  level: string;
}

const SCENARIOS: Scenario[] = [
  {
    id: 's1',
    role: 'Khách hàng đổi trả đồ tại sân bay',
    situation: 'Bạn vừa mua một cốc cà phê nhưng bị nhầm loại và chuyến bay sắp cất cánh trong 15 phút.',
    prompt: 'Excuse me, I ordered an iced latte without sugar, but this seems to be hot cappuccino. Could you please replace it quickly as my boarding starts soon?',
    level: 'B1'
  },
  {
    id: 's2',
    role: 'Đàm phán lịch họp với đối tác',
    situation: 'Đối tác muốn dời lịch họp sang thứ 6 nhưng bạn bị trùng lịch công tác tại Đà Nẵng.',
    prompt: 'I am afraid Friday afternoon will not work for me due to an urgent business trip. Could we possibly reschedule it to next Monday morning instead?',
    level: 'B2'
  },
  {
    id: 's3',
    role: 'Giải quyết khiếu nại dịch vụ khách sạn',
    situation: 'Khách phàn nàn điều hòa hỏng lúc nửa đêm và yêu cầu đổi phòng ngay lập tức.',
    prompt: 'I sincerely apologize for the inconvenience regarding the air conditioner. Let me immediately arrange a room upgrade for you on the executive floor.',
    level: 'C1'
  }
];

export default function Station2Screen({ onBack }: Props) {
  const [selectedScenario, setSelectedScenario] = useState<Scenario | null>(null);
  const [isExamining, setIsExamining] = useState<boolean>(false);
  const [lastResult, setLastResult] = useState<any>(null);

  const handleStartExam = (scenario: Scenario) => {
    setSelectedScenario(scenario);
    setIsExamining(true);
    setLastResult(null);
  };

  const handleRecordingComplete = async (audioBlob: Blob, pitchHistory: number[]) => {
    // Phân tích âm học F0 bằng Spontaneity Detector
    const spontaneity = analyzeSpeechSpontaneity(pitchHistory);

    let audioUrl = '';
    try {
      if (supabase) {
        const fileName = `station2_${Date.now()}_${Math.random().toString(36).substring(7)}.webm`;
        const { data: uploadData, error: uploadErr } = await supabase.storage
          .from('submissions')
          .upload(fileName, audioBlob, { contentType: 'audio/webm' });

        if (!uploadErr && uploadData) {
          const { data: urlData } = supabase.storage.from('submissions').getPublicUrl(fileName);
          audioUrl = urlData?.publicUrl || '';
        }

        const { data: authUser } = await supabase.auth.getUser();
        await supabase.from('submissions').insert([{
          student_name: authUser?.user?.user_metadata?.full_name || 'Học viên Trạm 2',
          student_code: authUser?.user?.email?.split('@')[0] || 'STU_S2',
          class_name: 'Trạm 2: Đấu trường Phản xạ',
          mode: 'STATION_2_ROLEPLAY',
          cefr_level: selectedScenario?.level || 'B2',
          score: Math.min(100, spontaneity.score + 10),
          manual_score: null,
          spontaneity_score: spontaneity.score,
          pitch_variance: spontaneity.pitchVariance,
          is_script_suspected: spontaneity.isScriptSuspected,
          audio_url: audioUrl,
          transcript: selectedScenario?.prompt || '',
          feedback: spontaneity.isScriptSuspected 
            ? '⚠️ Cảnh báo: Biến thiên âm vực F0 thấp, nghi vấn đọc tài liệu.' 
            : '✅ Biến thiên ngữ điệu tự nhiên, phản xạ tình huống xuất sắc.'
        }]);
      }
    } catch (err) {
      console.warn("Lỗi lưu kết quả bài nộp:", err);
    }

    setLastResult(spontaneity);
    setIsExamining(false);
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={onBack} style={styles.backBtn}>
          <Text style={styles.backBtnText}>🔙 MAP</Text>
        </TouchableOpacity>
        <Text style={styles.title}>⚔️ TRẠM 2: ALL-IN ARENA (ROLEPLAY PHẢN XẠ)</Text>
      </View>

      <ScrollView contentContainerStyle={{ paddingBottom: 30 }}>
        {!isExamining && (
          <>
            <Text style={styles.subtitle}>
              Chế độ chống gian lận 3 tầng: Đề bài chỉ hiển thị 5 giây chuẩn bị, sau đó sẽ biến mất và mic tự động bật. Thuật toán F0 sẽ phát hiện nếu bạn đọc theo kịch bản!
            </Text>

            {lastResult && (
              <View style={[styles.resultBox, lastResult.isScriptSuspected ? styles.resultBoxWarning : styles.resultBoxSuccess]}>
                <Text style={styles.resultTitle}>
                  {lastResult.isScriptSuspected ? '⚠️ KẾT QUẢ: NGHI VẤN ĐỌC KỊCH BẢN' : '🎉 KẾT QUẢ: NÓI PHẢN XẠ TỰ NHIÊN'}
                </Text>
                <Text style={styles.resultText}>Điểm phản xạ tự nhiên (Spontaneity): {lastResult.score}/100đ</Text>
                <Text style={styles.resultText}>Độ lệch chuẩn F0 (Pitch Variance): {lastResult.pitchVariance} Hz</Text>
                <Text style={styles.resultSubtext}>
                  {lastResult.isScriptSuspected 
                    ? 'Ngữ điệu quá đều đặn, không có đỉnh nhấn trọng âm cảm xúc của hội thoại thực tế.' 
                    : 'Ngữ điệu biến thiên sinh động, thể hiện rõ tư duy ngôn ngữ tại chỗ!'}
                </Text>
              </View>
            )}

            <Text style={styles.sectionHeader}>🎯 CHỌN TÌNH HUỐNG THỬ THÁCH:</Text>
            {SCENARIOS.map((sc) => (
              <View key={sc.id} style={styles.card}>
                <View style={styles.cardHeader}>
                  <Text style={styles.roleText}>🎭 {sc.role}</Text>
                  <Text style={styles.levelBadge}>{sc.level}</Text>
                </View>
                <Text style={styles.situationText}>Tình huống: {sc.situation}</Text>
                <TouchableOpacity style={styles.startBtn} onPress={() => handleStartExam(sc)}>
                  <Text style={styles.startBtnText}>⚡ BƯỚC VÀO PHÒNG ĐẤU (5S PHẢN XẠ)</Text>
                </TouchableOpacity>
              </View>
            ))}
          </>
        )}

        {isExamining && selectedScenario && (
          <AntiCheatSpeakingSession
            promptText={selectedScenario.prompt}
            situationPrompt={selectedScenario.situation}
            prepTimeSeconds={5}
            autoHidePrompt={true}
            onRecordingComplete={handleRecordingComplete}
            onCancel={() => setIsExamining(false)}
          />
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#05020D', padding: 18, paddingTop: 45 },
  header: { flexDirection: 'row', alignItems: 'center', marginBottom: 15, gap: 10 },
  backBtn: { padding: 8, backgroundColor: '#0D0620', borderRadius: 8, borderWidth: 1, borderColor: '#00FFFF' },
  backBtnText: { color: '#00FFFF', fontSize: 10, fontWeight: 'bold' },
  title: { color: '#FF007F', fontSize: 13, fontWeight: '900', flexShrink: 1 },
  subtitle: { color: '#AAAABB', fontSize: 10, lineHeight: 16, marginBottom: 16 },
  sectionHeader: { color: '#00FFFF', fontSize: 11, fontWeight: '900', marginBottom: 10 },
  card: { backgroundColor: '#130628', padding: 16, borderRadius: 12, borderWidth: 1.5, borderColor: '#332255', marginBottom: 12 },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  roleText: { color: '#FFD700', fontSize: 12, fontWeight: 'bold' },
  levelBadge: { color: '#000', backgroundColor: '#39FF14', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4, fontSize: 9, fontWeight: '900' },
  situationText: { color: '#FFF', fontSize: 11, lineHeight: 17, marginBottom: 14 },
  startBtn: { backgroundColor: '#FF007F', paddingVertical: 10, borderRadius: 8, alignItems: 'center' },
  startBtnText: { color: '#FFF', fontSize: 11, fontWeight: '900' },
  resultBox: { padding: 14, borderRadius: 10, borderWidth: 1.5, marginBottom: 16 },
  resultBoxSuccess: { backgroundColor: '#062013', borderColor: '#39FF14' },
  resultBoxWarning: { backgroundColor: '#280812', borderColor: '#FF0055' },
  resultTitle: { fontSize: 12, fontWeight: '900', marginBottom: 6, color: '#FFF' },
  resultText: { color: '#FFF', fontSize: 11, marginBottom: 3 },
  resultSubtext: { color: '#AAAABB', fontSize: 9, fontStyle: 'italic', marginTop: 4 }
});