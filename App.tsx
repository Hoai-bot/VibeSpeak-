import React, { useState, useEffect, useRef } from 'react';
import { View, Text, TouchableOpacity, ActivityIndicator, ScrollView, TextInput, Platform } from 'react-native';
// Đường dẫn ĐÃ CHUẨN HOÁ chữ thường toàn bộ
import { analyzeAndSaveSpeech } from './src/services/aiService'; 
import SubwayMapScreen from './src/screens/SubwayMapScreen';
// Đã thêm import cho Trạm Đấu Trường
import AllInArenaScreen from './src/screens/AllInArenaScreen'; 
// Đã thêm import cho Trạm Bóng Ma (Shadow Boss)
import ShadowBossScreen from './src/screens/ShadowBossScreen';
// Đã thêm import cho Trạm Cứu Trợ Oasis (MỚI THÊM)
import OasisReliefScreen from './src/screens/OasisReliefScreen';

// ==========================================
// MÀN HÌNH 2: TRẠM TÂN BINH (GIAO DIỆN AI)
// ==========================================
function TerminalScreen({ onBack }: { onBack: () => void }) {
  const [loading, setLoading] = useState(false);
  const [inputText, setInputText] = useState<string>('');
  const [isRecording, setIsRecording] = useState(false);
  const [aiData, setAiData] = useState<any>(null);
  const [statusMessage, setStatusMessage] = useState<string>('Hệ thống AI đã sẵn sàng! Gõ hoặc đọc tiếng Anh để bắt đầu.');
  const [isContinuous, setIsContinuous] = useState(false);
  const recognitionRef = useRef<any>(null);

  useEffect(() => {
    if (Platform.OS === 'web' && 'speechSynthesis' in window) {
      window.speechSynthesis.getVoices();
    }
  }, []);

  const toggleRecording = () => {
    if (Platform.OS !== 'web') {
      setStatusMessage('⚠️ Tính năng thu âm hiện chỉ hỗ trợ trên web!');
      return;
    }
    if (isRecording && recognitionRef.current) {
      recognitionRef.current.stop();
      setStatusMessage('🛑 Đã dừng ghi âm thủ công.');
      return;
    }
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) {
      setStatusMessage('❌ Trình duyệt không hỗ trợ thu âm!');
      return;
    }
    const recognition = new SpeechRecognition();
    recognition.lang = 'en-US';
    recognition.continuous = isContinuous; 
    recognition.interimResults = false;

    recognition.onstart = () => {
      setIsRecording(true);
      setStatusMessage(isContinuous ? '🎙️ ĐANG NGHE LIÊN TỤC... (Bấm Dừng khi xong)' : '🎙️ ĐANG NGHE... (Nói xong tự ngắt)');
    };
    recognition.onresult = (event: any) => {
      let currentTranscript = '';
      for (let i = event.resultIndex; i < event.results.length; i++) {
        currentTranscript += event.results[i][0].transcript;
      }
      if (isContinuous) {
        setInputText((prev) => (prev ? prev + ' ' + currentTranscript.trim() : currentTranscript.trim()));
      } else {
        setInputText(currentTranscript.trim());
      }
      setStatusMessage('✅ Đã nhận diện xong văn bản!');
    };
    recognition.onerror = () => setIsRecording(false);
    recognition.onend = () => setIsRecording(false);
    
    recognitionRef.current = recognition;
    recognition.start();
  };

  const speakText = (text: string) => {
    if (Platform.OS === 'web' && 'speechSynthesis' in window) {
      window.speechSynthesis.cancel(); 
      const utterance = new SpeechSynthesisUtterance(text);
      const voices = window.speechSynthesis.getVoices();
      const bestVoice = voices.find(v => v.lang.includes('en-US') && v.name.includes('Natural')) 
                     || voices.find(v => v.lang.includes('en-US') && v.name.includes('Google'))
                     || voices.find(v => v.lang.includes('en-US'));
      if (bestVoice) utterance.voice = bestVoice;
      utterance.lang = 'en-US'; 
      utterance.rate = 0.9; 
      window.speechSynthesis.speak(utterance);
    }
  };

  const handleTestAI = async () => {
    if (!inputText.trim()) {
      setStatusMessage('⚠️ Vui lòng nhập hoặc nói tiếng Anh!');
      return;
    }
    setLoading(true);
    setAiData(null);
    setStatusMessage('Đang gửi dữ liệu lên Giám khảo AI...');
    const DUMMY_USER_ID = '123e4567-e89b-12d3-a456-426614174000';
    const aiResponse = await analyzeAndSaveSpeech(DUMMY_USER_ID, inputText);
    if (aiResponse) {
      setAiData(aiResponse); 
      setStatusMessage('✅ ĐÃ PHÂN TÍCH XONG!');
    } else {
      setStatusMessage('❌ Lỗi kết nối AI hoặc Database!'); 
    }
    setLoading(false);
  };

  return (
    <View style={{ flex: 1, backgroundColor: '#0A051B', padding: 20, paddingTop: 40 }}> 
      <TouchableOpacity onPress={onBack} style={{ marginBottom: 15, alignSelf: 'flex-start', padding: 10, backgroundColor: '#120B2C', borderRadius: 8, borderWidth: 1, borderColor: '#00FFFF' }}>
        <Text style={{ color: '#00FFFF', fontSize: 14, fontWeight: 'bold' }}>🔙 RỜI KHỎI TRẠM</Text>
      </TouchableOpacity>

      <Text style={{ color: '#00FFFF', fontSize: 20, fontWeight: 'bold', marginBottom: 10, textAlign: 'center' }}>[ TRẠM TÂN BINH: SHADOWING ]</Text>
      <Text style={{ color: '#FF007F', fontSize: 14, marginBottom: 15, textAlign: 'center' }}>{statusMessage}</Text>

      <View style={{ flexDirection: 'row', justifyContent: 'center', marginBottom: 15 }}>
        <TouchableOpacity onPress={() => setIsContinuous(false)} style={{ padding: 8, borderWidth: 1, borderColor: !isContinuous ? '#39FF14' : '#555', backgroundColor: !isContinuous ? '#120B2C' : 'transparent', borderTopLeftRadius: 5, borderBottomLeftRadius: 5 }}>
          <Text style={{ color: !isContinuous ? '#39FF14' : '#888', fontWeight: 'bold' }}>Từng Câu</Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={() => setIsContinuous(true)} style={{ padding: 8, borderWidth: 1, borderColor: isContinuous ? '#FFD700' : '#555', backgroundColor: isContinuous ? '#120B2C' : 'transparent', borderTopRightRadius: 5, borderBottomRightRadius: 5 }}>
          <Text style={{ color: isContinuous ? '#FFD700' : '#888', fontWeight: 'bold' }}>Đoạn Dài</Text>
        </TouchableOpacity>
      </View>

      <TextInput
        style={{ backgroundColor: '#120B2C', color: '#39FF14', padding: 15, borderRadius: 8, borderWidth: 1, borderColor: '#FF007F', marginBottom: 20, fontFamily: 'Courier New', fontSize: 16, minHeight: 80, textAlignVertical: 'top' }}
        placeholder="Gõ hoặc đọc tiếng Anh..."
        placeholderTextColor="#555"
        value={inputText}
        onChangeText={setInputText}
        multiline
      />

      <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 20 }}>
        <TouchableOpacity onPress={toggleRecording} disabled={loading} style={{ flex: 1, backgroundColor: isRecording ? '#FF4500' : '#4B0082', padding: 15, borderRadius: 8, alignItems: 'center', marginRight: 10, borderWidth: 1, borderColor: '#FFF' }}>
          <Text style={{ color: '#FFF', fontWeight: 'bold', fontSize: 14 }}>{isRecording ? '🛑 DỪNG GHI' : '🎙️ CHẠM ĐỂ NÓI'}</Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={handleTestAI} disabled={loading || isRecording} style={{ flex: 1, backgroundColor: (loading || isRecording) ? '#555' : '#FF007F', padding: 15, borderRadius: 8, alignItems: 'center', marginLeft: 10, borderWidth: 1, borderColor: '#FFF' }}>
          <Text style={{ color: '#FFF', fontWeight: 'bold', fontSize: 14 }}>{loading ? 'ĐANG XỬ LÝ...' : '🧠 PHÂN TÍCH'}</Text>
        </TouchableOpacity>
      </View>

      {loading && <ActivityIndicator size="large" color="#00FFFF" style={{ marginBottom: 20 }} />} 

      <ScrollView style={{ flex: 1 }}>
        {aiData && (
          <View style={{ backgroundColor: '#120B2C', padding: 15, borderRadius: 8, borderWidth: 1, borderColor: '#00FFFF' }}>
            <Text style={{ color: '#FFF', fontSize: 18, fontWeight: 'bold', marginBottom: 15 }}>Điểm: <Text style={{ color: aiData.score > 70 ? '#39FF14' : '#FF4500' }}>{aiData.score}/100</Text></Text>
            
            <View style={{ marginBottom: 15, borderLeftWidth: 3, borderLeftColor: '#FFD700', paddingLeft: 10 }}>
              <Text style={{ color: '#FFD700', fontWeight: 'bold', marginBottom: 5 }}>📘 Đúng Ngữ Pháp:</Text>
              <Text style={{ color: '#FFF', fontSize: 16, marginBottom: 10 }}>{aiData.corrected_grammar}</Text>
              <TouchableOpacity onPress={() => speakText(aiData.corrected_grammar)} style={{ backgroundColor: '#FFD700', padding: 8, borderRadius: 5, alignItems: 'center', width: 140 }}>
                <Text style={{ color: '#000', fontWeight: 'bold', fontSize: 12 }}>🔊 NGHE PHÁT ÂM</Text>
              </TouchableOpacity>
            </View>

            <View style={{ marginBottom: 15, borderLeftWidth: 3, borderLeftColor: '#00FFFF', paddingLeft: 10 }}>
              <Text style={{ color: '#00FFFF', fontWeight: 'bold', marginBottom: 5 }}>📗 Tự Nhiên:</Text>
              <Text style={{ color: '#FFF', fontSize: 16, marginBottom: 10 }}>{aiData.corrected_natural}</Text>
              <TouchableOpacity onPress={() => speakText(aiData.corrected_natural)} style={{ backgroundColor: '#00FFFF', padding: 8, borderRadius: 5, alignItems: 'center', width: 140 }}>
                <Text style={{ color: '#000', fontWeight: 'bold', fontSize: 12 }}>🔊 NGHE PHÁT ÂM</Text>
              </TouchableOpacity>
            </View>
            
            <View style={{ backgroundColor: '#2A1B54', padding: 12, borderRadius: 5, marginBottom: 15, borderLeftWidth: 3, borderLeftColor: '#39FF14' }}>
              <Text style={{ color: '#39FF14', fontWeight: 'bold', marginBottom: 5 }}>🔥 Chuẩn Bản Xứ:</Text>
              <Text style={{ color: '#FFF', fontSize: 16, marginBottom: 10, fontStyle: 'italic' }}>"{aiData.corrected_native}"</Text>
              <TouchableOpacity onPress={() => speakText(aiData.corrected_native)} style={{ backgroundColor: '#39FF14', padding: 8, borderRadius: 5, alignItems: 'center', width: 140 }}>
                <Text style={{ color: '#000', fontWeight: 'bold', fontSize: 12 }}>🔊 NGHE PHÁT ÂM</Text>
              </TouchableOpacity>
            </View>

            <Text style={{ color: '#FF007F', fontWeight: 'bold', marginBottom: 5 }}>🤖 Nhận xét:</Text>
            <Text style={{ color: '#FFF', lineHeight: 22 }}>{aiData.explanation}</Text>
          </View>
        )}
      </ScrollView>
    </View>
  );
}

// ==========================================
// MÀN HÌNH 1: BẢN ĐỒ TÀU ĐIỆN (ROOT COMPONENT)
// ==========================================
export default function App() {
  // Đã thêm trạng thái 'OASIS' vào danh sách
  const [currentScreen, setCurrentScreen] = useState<'MAP' | 'TERMINAL' | 'ARENA' | 'SHADOW' | 'OASIS'>('MAP');

  return (
    <View style={{ flex: 1 }}>
      {currentScreen === 'MAP' && (
        <SubwayMapScreen onSelectStation={(id) => {
          if (id === 1) setCurrentScreen('TERMINAL');
          if (id === 2) setCurrentScreen('ARENA'); 
          if (id === 3) setCurrentScreen('SHADOW'); 
          if (id === 4) setCurrentScreen('OASIS'); // Bấm Trạm 4 thì gọi Oasis
        }} />
      )}
      
      {currentScreen === 'TERMINAL' && (
        <TerminalScreen onBack={() => setCurrentScreen('MAP')} />
      )}

      {currentScreen === 'ARENA' && (
        <AllInArenaScreen onBack={() => setCurrentScreen('MAP')} />
      )}

      {currentScreen === 'SHADOW' && (
        <ShadowBossScreen onBack={() => setCurrentScreen('MAP')} />
      )}

      {/* Kết nối màn hình Oasis */}
      {currentScreen === 'OASIS' && (
        <OasisReliefScreen onBack={() => setCurrentScreen('MAP')} />
      )}
    </View>
  );
}