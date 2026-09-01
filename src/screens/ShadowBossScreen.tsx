import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView } from 'react-native';

export default function ShadowBossScreen({ onBack }: { onBack: () => void }) {
  const [isRecording, setIsRecording] = useState(false);
  const [logs, setLogs] = useState<string[]>([
    '> Đang truy xuất tệp hồ sơ tuyệt mật...',
    '> [CẢNH BÁO] Phát hiện dữ liệu Bóng Ma (Shadow Boss)...',
  ]);

  // Dữ liệu giả lập của Boss tuần trước
  const bossData = {
    name: 'Phantom_V',
    score: 98,
    sentence: "The neon lights in this sector always glitch when the rain is heavy.",
  };

  const handleChallenge = () => {
    setIsRecording(true);
    setLogs(prev => [...prev, '> Hệ thống ghi âm đang kích hoạt...']);
    setLogs(prev => [...prev, '> Hãy đọc to câu trên để soán ngôi Boss!']);
    
    // Giả lập ghi âm 3 giây
    setTimeout(() => {
      setIsRecording(false);
      setLogs(prev => [...prev, '> [ĐÃ LƯU] Đang gửi dữ liệu lên AI so khớp điểm số...']);
    }, 3000);
  };

  return (
    <View style={styles.container}>
      <TouchableOpacity onPress={onBack} style={styles.backButton}>
        <Text style={styles.backText}>🔙 RỜI KHỎI KHU VỰC TỐI</Text>
      </TouchableOpacity>

      <Text style={styles.header}>[ HỒ SƠ BÓNG MA ]</Text>
      <Text style={styles.subHeader}>Kẻ thống trị tuần trước. Hãy đánh bại cái bóng của hắn.</Text>

      <View style={styles.bossBox}>
        <Text style={styles.bossTitle}>👑 BÓNG MA TUẦN TRƯỚC 👑</Text>
        <Text style={styles.bossName}>{bossData.name}</Text>
        <Text style={styles.bossScore}>Điểm Kỷ Lục: <Text style={styles.highlight}>{bossData.score}/100</Text></Text>
        
        <View style={styles.sentenceBox}>
          <Text style={styles.label}>Câu thoại thách đấu:</Text>
          <Text style={styles.sentenceText}>"{bossData.sentence}"</Text>
        </View>

        <TouchableOpacity style={styles.listenButton}>
          <Text style={styles.buttonText}>🔊 NGHE LẠI GIỌNG BOSS</Text>
        </TouchableOpacity>
      </View>

      <TouchableOpacity 
        style={[styles.recordButton, isRecording && styles.recordingButton]} 
        onPress={handleChallenge}
        disabled={isRecording}
      >
        <Text style={styles.buttonText}>
          {isRecording ? '🎙️ ĐANG THU ÂM TRẢ LỜI...' : '⚔️ THÁCH ĐẤU BÓNG MA ⚔️'}
        </Text>
      </TouchableOpacity>

      <ScrollView style={styles.logBox}>
        {logs.map((log, index) => (
          <Text key={index} style={[styles.logText, log.includes('[CẢNH BÁO]') && { color: '#FF4500' }]}>
            {log}
          </Text>
        ))}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0D0814', padding: 20, paddingTop: 60 },
  backButton: { marginBottom: 20, alignSelf: 'flex-start', padding: 10, backgroundColor: '#1A1100', borderRadius: 8, borderWidth: 1, borderColor: '#FFD700' },
  backText: { color: '#FFD700', fontSize: 14, fontWeight: 'bold' },
  header: { color: '#FFD700', fontSize: 24, fontWeight: 'bold', textAlign: 'center', marginBottom: 5, fontFamily: 'Courier New', textShadowColor: '#FFD700', textShadowRadius: 10 },
  subHeader: { color: '#AAA', fontSize: 14, textAlign: 'center', marginBottom: 20, fontStyle: 'italic' },
  
  bossBox: { backgroundColor: '#1A1100', padding: 20, borderRadius: 12, borderWidth: 2, borderColor: '#FFD700', alignItems: 'center', marginBottom: 20 },
  bossTitle: { color: '#FFD700', fontSize: 16, fontWeight: 'bold', marginBottom: 10 },
  bossName: { color: '#FFF', fontSize: 28, fontWeight: '900', fontStyle: 'italic', marginBottom: 5 },
  bossScore: { color: '#FFF', fontSize: 16, marginBottom: 20 },
  highlight: { color: '#39FF14', fontSize: 22, fontWeight: 'bold' },
  
  sentenceBox: { backgroundColor: '#000', padding: 15, borderRadius: 8, width: '100%', marginBottom: 15, borderWidth: 1, borderColor: '#555' },
  label: { color: '#888', fontSize: 12, marginBottom: 5 },
  sentenceText: { color: '#00FFFF', fontSize: 16, fontStyle: 'italic', textAlign: 'center' },
  
  listenButton: { backgroundColor: '#555', padding: 12, borderRadius: 8, width: '100%', alignItems: 'center', borderWidth: 1, borderColor: '#FFF' },
  
  recordButton: { backgroundColor: '#FF007F', padding: 15, borderRadius: 8, width: '100%', alignItems: 'center', marginBottom: 20 },
  recordingButton: { backgroundColor: '#FF4500' },
  buttonText: { color: '#FFF', fontSize: 16, fontWeight: 'bold' },
  
  logBox: { flex: 1, backgroundColor: '#000', padding: 15, borderRadius: 8, borderWidth: 1, borderColor: '#333' },
  logText: { color: '#39FF14', fontFamily: 'Courier New', fontSize: 12, marginBottom: 5 }
});