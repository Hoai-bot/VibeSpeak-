import React, { useState, useEffect, useRef } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ActivityIndicator, ScrollView } from 'react-native';
import { transcribeAndGradeAudio } from '../services/groqClient';

interface Props {
  onBack: () => void;
  recoveryWord?: string;
}

interface OasisCoachingData {
  keywords: { word: string; meaning: string }[];
  starters: string[];
  sampleAnswers: {
    basic: string;
    advanced: string;
  };
}

export function OasisScreen({ onBack, recoveryWord }: Props) {
  const [isRecording, setIsRecording] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [feedback, setFeedback] = useState<string | null>(null);

  // 🎯 HÀM LÀM SẠCH VĂN BẢN THÔNG MINH (XÓA DẤU CÂU & CHUYỂN THÀNH DANH TỪ TỰ NHIÊN)
  const cleanTopicText = (text: string) => {
    let cleaned = text
      .replace(/\[.*?\]/g, '') // Bỏ [RELAY], [SOLO]
      .replace(/in \d+ seconds/gi, '') // Bỏ 'in 30 seconds'
      .replace(/Describe your/gi, '') 
      .replace(/Describe/gi, '') 
      .replace(/Explain why/gi, '') 
      .replace(/Discuss/gi, '') 
      .replace(/Talk about/gi, '')
      .replace(/in the year \d+/gi, '') // Bỏ 'in the year 2099'
      .replace(/in \d+/gi, '')
      .replace(/[.,/#!$%^&*;:{}=\-_`~()]/g, "") // Bỏ toàn bộ dấu chấm phẩy thừa
      .trim();

    return cleaned.length > 0 ? cleaned : "cyberpunk city";
  };

  const rawTopic = recoveryWord && recoveryWord.trim().length > 0 
    ? recoveryWord 
    : "Ideal Cyberpunk City";

  const activeTopic = cleanTopicText(rawTopic);
  const isShadowingMode = rawTopic.toLowerCase().includes('ghost') || rawTopic.toLowerCase().includes('shadowing');

  // 🔊 HÀM TÌM GIỌNG NEURAL AI TỰ NHIÊN
  const speakText = (text: string, speed: number = 0.85) => {
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.rate = speed;
      utterance.pitch = 1.0;

      const voices = window.speechSynthesis.getVoices();
      const naturalVoice = voices.find(
        (v) =>
          v.lang.startsWith('en') &&
          (v.name.includes('Natural') ||
           v.name.includes('Google US English') ||
           v.name.includes('Neural') ||
           v.name.includes('Samantha') ||
           v.name.includes('Jenny'))
      ) || voices.find((v) => v.lang.startsWith('en'));

      if (naturalVoice) {
        utterance.voice = naturalVoice;
      }

      window.speechSynthesis.speak(utterance);
    } else {
      alert('Trình duyệt không hỗ trợ giọng đọc AI!');
    }
  };

  useEffect(() => {
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      window.speechSynthesis.onvoiceschanged = () => {
        window.speechSynthesis.getVoices();
      };
    }
  }, []);

  const [coachingData, setCoachingData] = useState<OasisCoachingData | null>(null);
  const [isLoadingCoach, setIsLoadingCoach] = useState<boolean>(true);

  const mediaRecorderRef = useRef<any>(null);
  const audioChunksRef = useRef<any[]>([]);

  useEffect(() => {
    generateTopicSpecificCoaching(activeTopic);
  }, [activeTopic]);

  // 🎯 HÀM GỌI AI VỚI FALLBACK CHUẨN NGỮ PHÁP TỰ NHIÊN
  const generateTopicSpecificCoaching = async (topic: string) => {
    setIsLoadingCoach(true);
    setCoachingData(null);
    
    // Fallback thông minh: Tạo câu nói tự nhiên, không lặp lại cụm từ máy móc
    const fallbackData: OasisCoachingData = {
      keywords: isShadowingMode ? [
        { word: "Connected Speech", meaning: "Kỹ thuật nối âm tự nhiên" },
        { word: "Sentence Stress", meaning: "Nhấn giọng vào từ mang nội dung" }
      ] : [
        { word: "Neon Skyscrapers", meaning: "Tòa nhà cao tầng đèn neon" },
        { word: "High-tech Vibe", meaning: "Không gian công nghệ cao" }
      ],
      starters: isShadowingMode ? [
        `Focus on linking final consonants to initial vowels.`,
        `Pause naturally between meaningful word chunks.`
      ] : [
        `When I imagine a futuristic city, I see...`,
        `In my vision of a cyberpunk metropolis, the key feature is...`
      ],
      sampleAnswers: {
        basic: isShadowingMode 
          ? topic 
          : `In my opinion, a futuristic cyberpunk city would be full of flying cars and neon lights.`,
        advanced: isShadowingMode 
          ? `Master the natural speech rhythm by connecting words smoothly without unnatural pauses.` 
          : `When envisioning a modern cyberpunk world, I see a high-tech metropolis where artificial intelligence and advanced technology dominate daily life.`
      }
    };

    try {
      const apiKey = process.env.EXPO_PUBLIC_GROQ_API_KEY;
      if (!apiKey) {
        setCoachingData(fallbackData);
        return;
      }

      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 5000);

      let prompt = isShadowingMode ? `
        You are an expert English Pronunciation Coach. Target sentence: "${topic}".
        Return ONLY a JSON object:
        {
          "keywords": [{"word": "Connected Speech", "meaning": "Nối âm tự nhiên"}, {"word": "Sentence Stress", "meaning": "Nhấn giọng vào từ chính"}],
          "starters": ["Mẹo 1: Ngắt nghỉ ở cụm nghĩa...", "Mẹo 2: Nối âm nhẹ nhàng..."],
          "sampleAnswers": {"basic": "${topic}", "advanced": "Master connected speech naturally."}
        }
      ` : `
        You are an English Speaking Coach. Topic context: "${topic}".
        Generate natural English vocabulary, sentence starters, and 2 sample draft answers (1 basic, 1 advanced).
        CRITICAL: Do NOT copy the topic phrase verbatim into sentences if it creates bad grammar. Make the sentences sound like a real native speaker answering the prompt naturally.

        Return ONLY a JSON object:
        {
          "keywords": [{"word": "keyword 1 related to ${topic}", "meaning": "Nghĩa tiếng Việt"}, {"word": "keyword 2 related to ${topic}", "meaning": "Nghĩa tiếng Việt"}],
          "starters": ["Natural sentence starter 1...", "Natural sentence starter 2..."],
          "sampleAnswers": {"basic": "Natural 1-sentence answer about ${topic}.", "advanced": "Natural 2-sentence advanced answer about ${topic}."}
        }
      `;

      const res = await fetch("https://api.groq.com/openai/v1/chat/completions", {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${apiKey}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          model: "llama-3.3-70b-versatile",
          messages: [{ role: "user", content: prompt }],
          temperature: 0.5,
          response_format: { type: "json_object" }
        }),
        signal: controller.signal
      });

      clearTimeout(timeoutId);

      const data = await res.json();
      const content = data?.choices?.[0]?.message?.content;
      if (content) {
        const parsed = JSON.parse(content);
        if (parsed.keywords && parsed.starters && parsed.sampleAnswers) {
          setCoachingData(parsed);
          return;
        }
      }
      setCoachingData(fallbackData);
    } catch (e) {
      console.warn("⚠️ API Timeout/Error - Using Natural Fallback Data");
      setCoachingData(fallbackData);
    } finally {
      setIsLoadingCoach(false);
    }
  };

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: { echoCancellation: true, noiseSuppression: true } });
      mediaRecorderRef.current = new MediaRecorder(stream);
      audioChunksRef.current = [];

      mediaRecorderRef.current.ondataavailable = (e: any) => {
        if (e.data && e.data.size > 0) audioChunksRef.current.push(e.data);
      };

      mediaRecorderRef.current.start(100);
      setIsRecording(true);
      setFeedback(null);
    } catch (err) {
      alert('Không thể truy cập Micro!');
    }
  };

  const stopRecording = async () => {
    const mediaRecorder = mediaRecorderRef.current;
    if (!mediaRecorder) return;

    setIsRecording(false);
    setIsAnalyzing(true);

    const processAudio = new Promise<Blob>((resolve) => {
      mediaRecorder.onstop = () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: mediaRecorder.mimeType || 'audio/webm' });
        resolve(audioBlob);
      };
      mediaRecorder.stop();
    });

    try {
      if (mediaRecorder.stream) mediaRecorder.stream.getTracks().forEach((t: any) => t.stop());
      const audioBlob = await processAudio;

      const res = await transcribeAndGradeAudio(audioBlob, activeTopic);
      setFeedback(res.text);
    } catch (e) {
      alert('Lỗi phân tích âm thanh tại Oasis!');
    } finally {
      setIsAnalyzing(false);
    }
  };

  return (
    <View style={styles.container}>
      {/* HEADER */}
      <View style={styles.header}>
        <TouchableOpacity onPress={onBack} style={styles.backBtn}>
          <Text style={styles.backText}>🔙 EXIT OASIS</Text>
        </TouchableOpacity>
        <Text style={styles.title}>🌴 OASIS SAFE SPACE</Text>
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.recoveryCard}>
          <Text style={styles.cardTag}>
            {isShadowingMode ? "👻 CỨU HỘ NGỮ ĐIỆU BÓNG MA" : "🚨 TRẠM CỨU HỘ CHỦ ĐỀ TẬP TRUNG"}
          </Text>
          <Text style={styles.targetWord}>📌 {activeTopic}</Text>

          {isLoadingCoach || !coachingData ? (
            <View style={{ padding: 20, alignItems: 'center' }}>
              <ActivityIndicator size="large" color="#00FFCC" />
              <Text style={{ color: '#00FFCC', marginTop: 10, fontSize: 12, fontFamily: 'Courier New' }}>
                > ĐANG TẢI DỮ LIỆU CỨU HỘ CHO CHỦ ĐỀ NÀY...
              </Text>
            </View>
          ) : (
            <>
              {/* 🎯 KHUNG 1: TỪ VỰNG CHÌA KHÓA */}
              <View style={styles.hintBox}>
                <Text style={styles.hintTitle}>
                  {isShadowingMode ? "🔑 KĨ THUẬT PHÁT ÂM CHỦ ĐỀ:" : "🔑 TỪ VỰNG CHÌA KHÓA (KEYWORDS):"}
                </Text>
                {coachingData.keywords.map((item, index) => (
                  <View key={index} style={styles.itemRow}>
                    <Text style={styles.keywordText}>
                      • <Text style={styles.boldWord}>{item.word}</Text>: {item.meaning}
                    </Text>
                    <TouchableOpacity onPress={() => speakText(item.word, 0.75)} style={styles.speakBtnMini}>
                      <Text style={styles.speakTextMini}>🔊</Text>
                    </TouchableOpacity>
                  </View>
                ))}
              </View>

              {/* 🎯 KHUNG 2: CẤU TRÚC CÂU MẪU */}
              <View style={[styles.hintBox, { marginTop: 12 }]}>
                <Text style={styles.hintTitle}>
                  {isShadowingMode ? "💡 MẸO LUYỆN ĐỌC SHADOWING:" : "💡 CẤU TRÚC CÂU MẪU (SENTENCE STARTERS):"}
                </Text>
                {coachingData.starters.map((starter, index) => (
                  <View key={index} style={styles.itemRow}>
                    <Text style={[styles.starterText, { flex: 1 }]}>👉 "{starter}"</Text>
                    <TouchableOpacity onPress={() => speakText(starter, 0.75)} style={styles.speakBtnMini}>
                      <Text style={styles.speakTextMini}>🔊</Text>
                    </TouchableOpacity>
                  </View>
                ))}
              </View>

              {/* 🎯 KHUNG 3: ĐÁP ÁN GỢI Ý KÈM NÚT ĐỌC AI MẪU */}
              <View style={[styles.hintBox, { marginTop: 12, borderColor: '#FFD700' }]}>
                <Text style={[styles.hintTitle, { color: '#FFD700' }]}>✨ CÂU MẪU LUYỆN TẬP (AI AUDIO COACH):</Text>

                {/* CƠ BẢN */}
                <View style={styles.sampleHeaderRow}>
                  <Text style={styles.sampleLabel}>{isShadowingMode ? "🌱 TỐC ĐỘ CHẬM (0.75x):" : "🌱 CƠ BẢN (BASIC):"}</Text>
                  <TouchableOpacity 
                    onPress={() => speakText(coachingData.sampleAnswers.basic, 0.75)}
                    style={styles.speakBtn}
                  >
                    <Text style={styles.speakBtnText}>🔊 NGHE CHẬM 0.75x</Text>
                  </TouchableOpacity>
                </View>
                <Text style={styles.sampleText}>"{coachingData.sampleAnswers.basic}"</Text>

                {/* BỨT PHÁ */}
                <View style={[styles.sampleHeaderRow, { marginTop: 10 }]}>
                  <Text style={styles.sampleLabel}>{isShadowingMode ? "🚀 TỐC ĐỘ CHUẨN (1.0x):" : "🚀 BỨT PHÁ (ADVANCED):"}</Text>
                  <TouchableOpacity 
                    onPress={() => speakText(coachingData.sampleAnswers.advanced, 1.0)}
                    style={[styles.speakBtn, { borderColor: '#39FF14' }]}
                  >
                    <Text style={[styles.speakBtnText, { color: '#39FF14' }]}>🔊 NGHE CHUẨN 1.0x</Text>
                  </TouchableOpacity>
                </View>
                <Text style={styles.sampleText}>"{coachingData.sampleAnswers.advanced}"</Text>
              </View>
            </>
          )}
        </View>

        {/* NÚT THU ÂM TỰ DO */}
        <View style={styles.actionBox}>
          {isAnalyzing ? (
            <ActivityIndicator size="large" color="#00FFCC" />
          ) : (
            <TouchableOpacity
              style={[styles.recordBtn, isRecording && styles.recordingActive]}
              onPress={isRecording ? stopRecording : startRecording}
            >
              <Text style={styles.recordBtnText}>
                {isRecording ? '⏹️ DỪNG & XEM KẾT QUẢ' : '🎙️ THỰC HÀNH NÓI TỰ DO'}
              </Text>
            </TouchableOpacity>
          )}
        </View>

        {/* KẾT QUẢ PHÂN TÍCH */}
        {feedback && (
          <View style={styles.feedbackCard}>
            <Text style={styles.feedbackTitle}>💬 AI COACH PHẢN HỒI:</Text>
            <Text style={styles.feedbackText}>"{feedback}"</Text>
            <Text style={styles.oasisTip}>
              ✨ Bạn đã phát âm rất tiến bộ! Thả lỏng khẩu hình và sẵn sàng quay lại thi đấu nhé!
            </Text>
          </View>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#021518', padding: 20, paddingTop: 40 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
  backBtn: { padding: 8, backgroundColor: '#052C30', borderRadius: 6, borderWidth: 1, borderColor: '#00FFCC' },
  backText: { color: '#00FFCC', fontSize: 11, fontWeight: 'bold' },
  title: { color: '#00FFCC', fontSize: 16, fontWeight: '900' },
  content: { alignItems: 'center', width: '100%' },
  recoveryCard: { backgroundColor: '#052C30', padding: 20, borderRadius: 16, borderWidth: 2, borderColor: '#00FFCC', width: '100%', alignItems: 'center', marginBottom: 20 },
  cardTag: { color: '#FFD700', fontSize: 11, fontWeight: 'bold', marginBottom: 8 },
  targetWord: { color: '#FFF', fontSize: 15, fontWeight: '900', marginBottom: 15, textAlign: 'center' },
  hintBox: { backgroundColor: '#021518', padding: 14, borderRadius: 10, width: '100%', borderWidth: 1, borderColor: '#00FFCC' },
  hintTitle: { color: '#00FFCC', fontSize: 11, fontWeight: 'bold', marginBottom: 10 },
  itemRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 },
  keywordText: { color: '#A0E0E0', fontSize: 12 },
  boldWord: { color: '#39FF14', fontWeight: 'bold' },
  starterText: { color: '#00FFCC', fontSize: 12, fontStyle: 'italic', lineHeight: 18 },
  sampleHeaderRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  sampleLabel: { color: '#FFD700', fontSize: 10, fontWeight: 'bold' },
  sampleText: { color: '#FFF', fontSize: 12, fontStyle: 'italic', lineHeight: 18, marginTop: 4 },
  speakBtn: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6, borderWidth: 1, borderColor: '#00FFCC', backgroundColor: '#021518' },
  speakBtnText: { color: '#00FFCC', fontSize: 10, fontWeight: 'bold' },
  speakBtnMini: { paddingHorizontal: 6, paddingVertical: 2 },
  speakTextMini: { fontSize: 12 },
  actionBox: { width: '100%', marginBottom: 20 },
  recordBtn: { backgroundColor: '#00FFCC', padding: 16, borderRadius: 12, alignItems: 'center' },
  recordingActive: { backgroundColor: '#FF0055' },
  recordBtnText: { color: '#000', fontWeight: '900', fontSize: 14 },
  feedbackCard: { backgroundColor: '#052C30', padding: 16, borderRadius: 12, borderWidth: 1, borderColor: '#00FFCC', width: '100%' },
  feedbackTitle: { color: '#FFD700', fontSize: 12, fontWeight: 'bold', marginBottom: 6 },
  feedbackText: { color: '#FFF', fontSize: 14, fontStyle: 'italic', marginBottom: 10 },
  oasisTip: { color: '#39FF14', fontSize: 11, lineHeight: 16 }
});

export default OasisScreen;