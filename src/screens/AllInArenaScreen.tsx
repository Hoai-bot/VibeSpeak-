import React, { useState } from 'react';
import { View, Text, TouchableOpacity, TextInput, StyleSheet, ScrollView } from 'react-native';

export default function AllInArenaScreen({ onBack }: { onBack: () => void }) {
  const [betAmount, setBetAmount] = useState<string>('100');
  const [isSearching, setIsSearching] = useState(false);
  const [matchFound, setMatchFound] = useState(false); // Thêm state để chuyển sang màn hình VS
  const [logs, setLogs] = useState<string[]>([
    '> Khởi tạo kết nối mạng WebSocket...',
    '> Ping: 12ms (Ổn định)'
  ]);

  const addLog = (message: string) => {
    setLogs(prev => [...prev, message]);
  };

  const handleFindMatch = () => {
    setIsSearching(true);
    addLog('> Đang dò tìm người chơi trong khu vực...');
    
    // Giả lập tìm đối thủ trong 3 giây
    setTimeout(() => {
      setIsSearching(false);
      setMatchFound(true);
      addLog('> [THÀNH CÔNG] Đã khóa mục tiêu: Shadow_Ninja!');
      addLog('> Đang thiết lập kênh giao tiếp âm thanh mã hóa...');
    }, 3000);
  };

  return (
    <View style={styles.container}>
      <TouchableOpacity onPress={onBack} style={styles.backButton}>
        <Text style={styles.backText}>🔙 RỜI KHỎI ĐẤU TRƯỜNG</Text>
      </TouchableOpacity>

      <Text style={styles.header}>[ ĐẤU TRƯỜNG TẤT TAY ]</Text>
      <Text style={styles.subHeader}>Kẻ thắng lấy tất cả. Kẻ thua mất sạch EXP.</Text>

      {/* HIỂN THỊ KHU VỰC CƯỢC HOẶC KHU VỰC ĐỐI ĐẦU */}
      {!matchFound ? (
        <View style={styles.arenaBox}>
          <Text style={styles.balanceText}>EXP HIỆN CÓ: <Text style={styles.highlight}>1,500</Text></Text>
          
          <Text style={styles.label}>Nhập số EXP muốn cược:</Text>
          <TextInput
            style={styles.input}
            keyboardType="numeric"
            value={betAmount}
            onChangeText={setBetAmount}
            editable={!isSearching}
          />

          <TouchableOpacity 
            style={[styles.actionButton, isSearching && styles.disabledButton]} 
            onPress={handleFindMatch}
            disabled={isSearching}
          >
            <Text style={styles.actionText}>
              {isSearching ? '⏳ ĐANG QUÉT ĐỐI THỦ...' : '🔥 TẤT TAY (MATCH)'}
            </Text>
          </TouchableOpacity>
        </View>
      ) : (
        <View style={styles.matchupBox}>
          <Text style={styles.vsTitle}>VS</Text>
          <View style={styles.playerContainer}>
             <Text style={styles.playerText}>Bạn</Text>
             <Text style={styles.vsDivider}>⚡</Text>
             <Text style={styles.opponentText}>Shadow_Ninja</Text>
          </View>
          <Text style={styles.prizeText}>Tổng giải thưởng: <Text style={styles.highlight}>{parseInt(betAmount) * 2} EXP</Text></Text>
          
          <TouchableOpacity style={styles.recordButton}>
            <Text style={styles.actionText}>🎙️ BẮT ĐẦU THU ÂM TRẢ LỜI</Text>
          </TouchableOpacity>
        </View>
      )}
      
      {/* Khung log Terminal hiển thị trạng thái (Đã làm cho nó có thể tự động cuộn và cập nhật log) */}
      <ScrollView style={styles.logBox}>
        {logs.map((log, index) => (
          <Text key={index} style={[styles.logText, log.includes('[THÀNH CÔNG]') && { color: '#00FFFF' }]}>
            {log}
          </Text>
        ))}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#1A0505', padding: 20, paddingTop: 60 }, // Nền đỏ nguy hiểm của bạn
  backButton: { marginBottom: 20, alignSelf: 'flex-start', padding: 10, backgroundColor: '#330000', borderRadius: 8, borderWidth: 1, borderColor: '#FF007F' },
  backText: { color: '#FF007F', fontSize: 14, fontWeight: 'bold' },
  header: { color: '#FF007F', fontSize: 24, fontWeight: 'bold', textAlign: 'center', marginBottom: 5, fontFamily: 'Courier New' },
  subHeader: { color: '#AAA', fontSize: 14, textAlign: 'center', marginBottom: 30, fontStyle: 'italic' },
  
  // Khu vực Cược
  arenaBox: { backgroundColor: '#2A0000', padding: 20, borderRadius: 12, borderWidth: 2, borderColor: '#FF007F', alignItems: 'center', marginBottom: 20 },
  balanceText: { color: '#FFF', fontSize: 18, fontWeight: 'bold', marginBottom: 20 },
  highlight: { color: '#39FF14', fontSize: 22 },
  label: { color: '#FFD700', fontSize: 14, marginBottom: 10 },
  input: { backgroundColor: '#000', color: '#FF007F', fontSize: 24, fontWeight: 'bold', textAlign: 'center', width: '100%', padding: 15, borderRadius: 8, borderWidth: 1, borderColor: '#FF007F', marginBottom: 20 },
  actionButton: { backgroundColor: '#FF007F', padding: 15, borderRadius: 8, width: '100%', alignItems: 'center' },
  disabledButton: { backgroundColor: '#555', borderColor: '#333' },
  actionText: { color: '#FFF', fontSize: 16, fontWeight: 'bold' },
  
  // Khu vực Đối đầu (VS)
  matchupBox: { backgroundColor: '#2A0000', padding: 20, borderRadius: 12, borderWidth: 2, borderColor: '#00FFFF', alignItems: 'center', marginBottom: 20 },
  vsTitle: { fontSize: 40, color: '#FF007F', fontWeight: '900', fontStyle: 'italic', marginBottom: 10 },
  playerContainer: { flexDirection: 'row', alignItems: 'center', width: '100%', justifyContent: 'space-between', marginBottom: 15, backgroundColor: '#000', padding: 10, borderRadius: 8 },
  playerText: { color: '#39FF14', fontSize: 18, fontWeight: 'bold', flex: 1, textAlign: 'center' },
  vsDivider: { color: '#FFF', fontSize: 20, paddingHorizontal: 10 },
  opponentText: { color: '#FF4500', fontSize: 18, fontWeight: 'bold', flex: 1, textAlign: 'center' },
  prizeText: { color: '#FFF', fontSize: 16, marginBottom: 20, fontWeight: 'bold' },
  recordButton: { backgroundColor: '#39FF14', padding: 15, borderRadius: 8, width: '100%', alignItems: 'center' },

  // Khung Log Terminal
  logBox: { flex: 1, backgroundColor: '#000', padding: 15, borderRadius: 8, borderWidth: 1, borderColor: '#333' },
  logText: { color: '#39FF14', fontFamily: 'Courier New', fontSize: 12, marginBottom: 5 }
});