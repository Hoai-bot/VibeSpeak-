// src/screens/Station4Screen.tsx
import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView } from 'react-native';
import AntiCheatSpeakingSession from '../components/AntiCheatSpeakingSession';
import { analyzeSpeechSpontaneity } from '../utils/spontaneityDetector';
import { supabase } from '../utils/supabase';

interface Props {
  onBack: () => void;
}

interface ExpressTopic {
  id: string;
  topic: string;
  prompt: string;
  keywords: string[];
  level: string;
}

const EXPRESS_TOPICS: ExpressTopic[] = [
  {
    id: 't1',
    topic: 'Trí tuệ nhân tạo & Thị trường lao động',
    prompt: 'Do you believe artificial intelligence will displace more jobs than it creates in the next decade? Provide one concrete argument.',
    keywords: ['Automation', 'Displacement', 'Adaptability', 'Productivity'],
    level: 'B2 - C1'
  },
  {
    id: 't2',
    topic: 'Năng lượng tái tạo & Chính sách kinh tế',
    prompt: 'Should developing countries prioritize rapid economic growth over strict environmental regulations? Justify your stance.',
    keywords: ['Sustainable growth', 'Emissions', 'Trade-off', 'Incentives'],
    level: 'C1 - C2'
  },
  {
    id: 't3',
    topic: 'Làm việc từ xa & Văn hóa doanh nghiệp',
    prompt: 'How does remote work impact spontaneous collaboration and corporate identity in global enterprises?',
    keywords: ['Virtual bonding', 'Autonomy', 'Cohesion', 'Asynchronous'],
    level: 'C1 - C2'
  }
];

export default function Station4Screen({ onBack }: Props) {
  const [selectedTopic, setSelectedTopic] = useState<ExpressTopic | null>(null);
  const [isExamining, setIsExamining] = useState<boolean>(false);
  const [lastResult, setLastResult] = useState<any>(null);

  const handleStartExam = (topic: ExpressTopic) => {
    setSelectedTopic(topic);
    setIsExamining(true);
    setLastResult(null);
  };

  const handleRecordingComplete = async (audioBlob: Blob, pitchHistory: number[]) => {
    const spontaneity = analyzeSpeechSpontaneity(pitchHistory);

    let audioUrl = '';
    try {
      if (supabase) {
        const fileName = `station4_${Date.now()}_${Math.random().toString(36).substring(7)}.webm`;
        const { data: uploadData, error: uploadErr } = await supabase.storage
          .from('submissions')
          .upload(fileName, audioBlob, { contentType: 'audio/webm' });

        if (!uploadErr && uploadData) {
          const { data: urlData } = supabase.storage.from('submissions').getPublicUrl(fileName);
          audioUrl = urlData?.publicUrl || '';
        }

        const { data: authUser } = await supabase.auth.getUser();
        await supabase.from('submissions').insert([{
          student_name: authUser?.user?.user_metadata?.full_name || 'Chiến binh Trạm 4',
          student_code: authUser?.user?.email?.split('@')[0] || 'STU_S4',
          class_name: 'Trạm 4: Speaking Express',
          mode: 'STATION_4_EXPRESS',
          cefr_level: selectedTopic?.level || 'C1',
          score: Math.min(100, spontaneity.score + 5),
          manual_score: null,
          spontaneity_score: spontaneity.score,
          pitch_variance: spontaneity.pitchVariance,
          is_script_suspected: spontaneity.isScriptSuspected,
          audio_url: audioUrl,
          transcript: selectedTopic?.prompt || '',
          feedback: spontaneity.isScriptSuspected 
            ? '⚠️ Nghi vấn đọc kịch bản: Nhịp điệu đơn điệu, thiếu biến thiên ngữ điệu F0 khi lập luận.' 
            : '✅ Tư duy phản xạ học thuật xuất sắc: Ngữ điệu tự nhiên, ngắt nhịp tư duy logic.'
        }]);
      }
    } catch (err) {
      console.warn("Lỗi nộp bài Trạm 4:", err);
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
        <Text style={styles.title}>⚡ TRẠM 4: SPEAKING EXPRESS (B2 - C2)</Text>
      </View>

      <ScrollView contentContainerStyle={{ paddingBottom: 30 }}>
        {!isExamining && (
          <>
            <Text style={styles.subtitle}>
              Đấu trường phản biện cấp cao: Đề bài chỉ xuất hiện trong 5 giây đếm ngược để nắm ý chính, sau đó sẽ lập tức ẩn đi để chống chụp màn hình. Micro tự bật và engine F0 sẽ kiểm tra tính tự nhiên của giọng nói.
            </Text>

            {lastResult && (
              <View style={[styles.resultBox, lastResult.isScriptSuspected ? styles.resultBoxWarning : styles.resultBoxSuccess]}>
                <Text style={styles.resultTitle}>
                  {lastResult.isScriptSuspected ? '⚠️ PHÁT HIỆN DẤU HIỆU ĐỌC BÀI' : '🎉 BẢN THU PHẢN BIỆN TỰ NHIÊN'}
                </Text>
                <Text style={styles.resultText}>Điểm tự nhiên (Spontaneity): {lastResult.score}/100đ</Text>
                <Text style={styles.resultText}>Độ biến thiên cao độ F0: {lastResult.pitchVariance} Hz</Text>
                <Text style={styles.resultSubtext}>
                  {lastResult.isScriptSuspected 
                    ? 'Tần số F0 quá phẳng (<20 Hz). Dữ liệu này sẽ được gắn cờ báo cáo lên Cổng Giảng viên.' 
                    : 'Ngữ điệu linh hoạt, có sự nhấn nhá luận điểm chuẩn phong thái thuyết trình tự nhiên.'}
                </Text>
              </View>
            )}

            <Text style={styles.sectionHeader}>🔥 CHỦ ĐỀ PHẢN BIỆN CHUYÊN SÂU:</Text>
            {EXPRESS_TOPICS.map((top) => (
              <View key={top.id} style={styles.card}>
                <View style={styles.cardHeader}>
                  <Text style={styles.topicText}>💡 {top.topic}</Text>
                  <Text style={styles.levelBadge}>{top.level}</Text>
                </View>
                <Text style={styles.promptPreview}>Câu hỏi: {top.prompt}</Text>
                <View style={styles.keywordRow}>
                  {top.keywords.map((kw, idx) => (
                    <Text key={idx} style={styles.keywordBadge}>#{kw}</Text>
                  ))}
                </View>
                <TouchableOpacity style={styles.startBtn} onPress={() => handleStartExam(top)}>
                  <Text style={styles.startBtnText}>⚡ VÀO THI PHẢN BIỆN (5S PHẢN XẠ)</Text>
                </TouchableOpacity>
              </View>
            ))}
          </>
        )}

        {isExamining && selectedTopic && (
          <AntiCheatSpeakingSession
            promptText={selectedTopic.prompt}
            situationPrompt={`Từ khóa gợi ý: ${selectedTopic.keywords.join(', ')}`}
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
  title: { color: '#FFD700', fontSize: 13, fontWeight: '900', flexShrink: 1 },
  subtitle: { color: '#AAAABB', fontSize: 10, lineHeight: 16, marginBottom: 16 },
  sectionHeader: { color: '#00FFFF', fontSize: 11, fontWeight: '900', marginBottom: 10 },
  card: { backgroundColor: '#0D0620', padding: 16, borderRadius: 12, borderWidth: 1.5, borderColor: '#FF007F', marginBottom: 12 },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  topicText: { color: '#00FFFF', fontSize: 12, fontWeight: '900' },
  levelBadge: { color: '#000', backgroundColor: '#FFD700', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4, fontSize: 9, fontWeight: '900' },
  promptPreview: { color: '#FFF', fontSize: 11, lineHeight: 17, marginBottom: 10 },
  keywordRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginBottom: 14 },
  keywordBadge: { color: '#39FF14', backgroundColor: '#1A0B2E', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4, fontSize: 9, borderWidth: 1, borderColor: '#332255' },
  startBtn: { backgroundColor: '#39FF14', paddingVertical: 10, borderRadius: 8, alignItems: 'center' },
  startBtnText: { color: '#000', fontSize: 11, fontWeight: '900' },
  resultBox: { padding: 14, borderRadius: 10, borderWidth: 1.5, marginBottom: 16 },
  resultBoxSuccess: { backgroundColor: '#062013', borderColor: '#39FF14' },
  resultBoxWarning: { backgroundColor: '#280812', borderColor: '#FF0055' },
  resultTitle: { fontSize: 12, fontWeight: '900', marginBottom: 6, color: '#FFF' },
  resultText: { color: '#FFF', fontSize: 11, marginBottom: 3 },
  resultSubtext: { color: '#AAAABB', fontSize: 9, fontStyle: 'italic', marginTop: 4 }
});