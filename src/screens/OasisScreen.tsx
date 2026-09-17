import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';

interface OasisProps {
  targetWord?: string;
  meaning?: string;
  phonetics?: string;
  tip?: string;
  tier?: 1 | 2 | 3;
  onBackToBeat: () => void;
}

export function OasisScreen({ 
  targetWord = "Seat Sheet", 
  meaning = "", 
  phonetics = "/siːt ʃiːt/",
  tip = "",
  tier = 1,
  onBackToBeat 
}: OasisProps) {

  const playSpeech = (text: string, rate: number = 0.75) => {
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      window.speechSynthesis.cancel();

      const voices = window.speechSynthesis.getVoices();
      const highQualityVoice = voices.find(
        (v) =>
          v.lang.includes('en') &&
          (v.name.includes('Google US English') ||
           v.name.includes('Microsoft Jenny Online') ||
           v.name.includes('Microsoft Guy Online') ||
           v.name.includes('Natural') ||
           v.name.includes('Neural'))
      ) || voices.find((v) => v.lang === 'en-US') || voices.find((v) => v.lang.startsWith('en'));

      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = 'en-US';
      utterance.rate = rate;
      if (highQualityVoice) utterance.voice = highQualityVoice;

      window.speechSynthesis.speak(utterance);
    }
  };

  const handleBack = () => {
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      window.speechSynthesis.cancel();
    }
    if (onBackToBeat) {
      onBackToBeat();
    }
  };

  // Tiêu đề & Hướng dẫn phân tầng chi tiết
  const getTierHeader = () => {
    if (tier === 1) return { tag: "TẦNG 1: PAIR DRILL", title: "🎯 CHI TIẾT ĐẶT KHẨU HÌNH & CHỈNH RĂNG/MÔI" };
    if (tier === 2) return { tag: "TẦNG 2: LINKING DRILL", title: "🔗 QUY TẮC NỐI ÂM CONSONANT-TO-VOWEL" };
    return { tag: "TẦNG 3: SPEED DRILL", title: "⚡ MẸO KIỂM SOÁT HƠI & PHẢN XẠ UỐN LƯỠI TỐC ĐỘ" };
  };

  const headerInfo = getTierHeader();

  return (
    <View style={styles.container}>
      <Text style={styles.oasisTag}>🌴 TRẠM CỨU HỘ OASIS - {headerInfo.tag}</Text>
      <Text style={styles.oasisTitle}>✨ AI PHONETIC COACHING</Text>

      <View style={styles.card}>
        {meaning ? (
          <Text style={styles.meaningText}>🇻🇳 Dịch nghĩa: {meaning}</Text>
        ) : null}

        <Text style={styles.sectionHeader}>🌱 LUYỆN PHÁT ÂM CHẬM MẪU (0.75x):</Text>

        <TouchableOpacity style={styles.audioBox} onPress={() => playSpeech(targetWord, 0.75)}>
          <Text style={styles.sampleText}>"{targetWord}" 🔊</Text>
          <Text style={styles.playHint}>(Chạm để nghe phát âm chuẩn 0.75x)</Text>
        </TouchableOpacity>

        <Text style={styles.phoneticText}>🗣️ IPA: {phonetics}</Text>

        {/* Khung hướng dẫn theo từng Tầng */}
        <View style={styles.coachingBox}>
          <Text style={styles.coachingTitle}>{headerInfo.title}:</Text>
          <Text style={styles.coachingText}>
            {tip || (tier === 1 ? "Đặt vị trí đầu lưỡi chính xác và chú ý luồng hơi thoát ra giữa răng/môi." : tier === 2 ? "Nối phụ âm kết thúc của từ trước liền mạch sang nguyên âm của từ tiếp theo." : "Thả lỏng cơ hàm, lấy hơi sâu từ bụng để phát âm liên tục không ngắt quãng.")}
          </Text>
        </View>

        <View style={styles.divider} />

        <Text style={styles.sectionHeader}>🚀 LUYỆN TỐC ĐỘ PHẢN XẠ CHUẨN (1.05x):</Text>
        <TouchableOpacity style={styles.audioBox} onPress={() => playSpeech(targetWord, 1.05)}>
          <Text style={styles.sampleText}>"{targetWord}" 🔊</Text>
          <Text style={styles.playHint}>(Chạm để nghe phát âm tốc độ chuẩn 1.05x)</Text>
        </TouchableOpacity>
      </View>

      <TouchableOpacity style={styles.backBtn} onPress={handleBack}>
        <Text style={styles.backBtnText}>⚡ ĐÃ HIỂU MẸO - QUAY LẠI THỬ THÁCH BEAT</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#031E21', padding: 20, paddingTop: 40, alignItems: 'center' },
  oasisTag: { color: '#00FFCC', fontSize: 11, fontWeight: 'bold', fontFamily: 'Courier New', marginBottom: 4 },
  oasisTitle: { color: '#FFF', fontSize: 16, fontWeight: '900', fontFamily: 'Courier New', marginBottom: 16 },
  card: { backgroundColor: '#052C30', padding: 18, borderRadius: 16, borderWidth: 1.5, borderColor: '#00FFCC', width: '100%', marginBottom: 20 },
  meaningText: { color: '#FFD700', fontSize: 13, fontFamily: 'Courier New', fontWeight: 'bold', marginBottom: 12 },
  sectionHeader: { color: '#FFD700', fontSize: 11, fontWeight: 'bold', fontFamily: 'Courier New', marginTop: 4, marginBottom: 6 },
  audioBox: { backgroundColor: '#02181B', padding: 10, borderRadius: 8, borderWidth: 1, borderColor: '#00FFCC', marginBottom: 8 },
  sampleText: { color: '#FFF', fontSize: 15, fontWeight: 'bold', fontFamily: 'Courier New', marginBottom: 2 },
  playHint: { color: '#00FFCC', fontSize: 10, fontFamily: 'Courier New', fontStyle: 'italic' },
  phoneticText: { color: '#39FF14', fontSize: 13, fontFamily: 'Courier New', marginBottom: 8 },
  coachingBox: { backgroundColor: '#021316', padding: 12, borderRadius: 8, borderWidth: 1, borderColor: '#00A896', marginBottom: 6 },
  coachingTitle: { color: '#FF0055', fontSize: 11, fontWeight: 'bold', fontFamily: 'Courier New', marginBottom: 4 },
  coachingText: { color: '#00FFCC', fontSize: 12, fontFamily: 'Courier New', lineHeight: 18 },
  divider: { height: 1, backgroundColor: '#00A896', marginVertical: 12 },
  backBtn: { backgroundColor: '#00FFCC', paddingVertical: 14, paddingHorizontal: 20, borderRadius: 12, width: '100%', alignItems: 'center' },
  backBtnText: { color: '#000', fontSize: 12, fontWeight: '900', fontFamily: 'Courier New' }
});

export default OasisScreen;