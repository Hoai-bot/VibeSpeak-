import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView } from 'react-native';

export default function OasisReliefScreen({ onBack }: { onBack: () => void }) {
  const [isClaimed, setIsClaimed] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);

  const handleClaimExp = () => {
    setIsClaimed(true);
    // Sau này sẽ nối API Supabase để cộng thẳng vào Database
  };

  const toggleRadio = () => {
    setIsPlaying(!isPlaying);
  };

  return (
    <View style={styles.container}>
      <TouchableOpacity onPress={onBack} style={styles.backButton}>
        <Text style={styles.backText}>🔙 RỜI KHỎI KHU AN TOÀN</Text>
      </TouchableOpacity>

      <Text style={styles.header}>[ TRẠM CỨU TRỢ OASIS ]</Text>
      <Text style={styles.subHeader}>Khu phi quân sự. Hãy nạp lại năng lượng, Runner.</Text>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        
        {/* KHU VỰC NHẬN TRỢ CẤP */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>💊 TRỢ CẤP SINH TỒN HÀNG NGÀY</Text>
          <Text style={styles.cardDesc}>Liên minh mạng ngầm gửi cho bạn một ít tài nguyên để duy trì kết nối.</Text>
          
          <TouchableOpacity 
            style={[styles.claimButton, isClaimed && styles.claimedButton]} 
            onPress={handleClaimExp}
            disabled={isClaimed}
          >
            <Text style={styles.buttonText}>
              {isClaimed ? '✅ ĐÃ NHẬN (Gói 500 EXP)' : '🎁 NHẬN 500 EXP TRỢ CẤP'}
            </Text>
          </TouchableOpacity>
        </View>

        {/* KHU VỰC NGHE RADIO */}
        <View style={[styles.card, { borderColor: '#00FFFF' }]}>
          <Text style={[styles.cardTitle, { color: '#00FFFF' }]}>🎧 TẦN SỐ CYBER-LOFI 104.5 MHz</Text>
          <Text style={styles.cardDesc}>Thư giãn và luyện nghe thụ động với các mẩu tin tức đêm khuya của thành phố Night City.</Text>
          
          <View style={styles.radioControl}>
            <View style={styles.radioVisualizer}>
              <Text style={{ color: isPlaying ? '#00FFFF' : '#555', fontFamily: 'Courier New' }}>
                {isPlaying ? '|||/||/|/|/||/|/||' : '-----------------'}
              </Text>
            </View>
            <TouchableOpacity 
              style={[styles.playButton, isPlaying && styles.stopButton]} 
              onPress={toggleRadio}
            >
              <Text style={styles.buttonText}>
                {isPlaying ? '⏹ TẮT ĐÀI' : '▶ PHÁT SÓNG'}
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* KHU VỰC NHẬT KÝ */}
        <View style={[styles.card, { borderColor: '#FFD700' }]}>
          <Text style={[styles.cardTitle, { color: '#FFD700' }]}>📓 NHẬT KÝ HÀNH TRÌNH</Text>
          <Text style={styles.cardDesc}>"Những kẻ sống sót là những kẻ biết học từ sai lầm." - Dữ liệu của bạn được bảo mật tuyệt đối.</Text>
          <Text style={styles.logText}>{'>'} Không có ghi chú nào trong ngày hôm nay.</Text>
        </View>

      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#020D14', padding: 20, paddingTop: 60 }, // Nền ám xanh lá tối
  backButton: { marginBottom: 20, alignSelf: 'flex-start', padding: 10, backgroundColor: '#051A12', borderRadius: 8, borderWidth: 1, borderColor: '#39FF14' },
  backText: { color: '#39FF14', fontSize: 14, fontWeight: 'bold' },
  header: { color: '#39FF14', fontSize: 24, fontWeight: 'bold', textAlign: 'center', marginBottom: 5, fontFamily: 'Courier New', textShadowColor: '#39FF14', textShadowRadius: 10 },
  subHeader: { color: '#AAA', fontSize: 14, textAlign: 'center', marginBottom: 30, fontStyle: 'italic' },
  scrollContent: { paddingBottom: 40 },
  
  card: { backgroundColor: '#051A12', padding: 20, borderRadius: 12, borderWidth: 2, borderColor: '#39FF14', marginBottom: 20 },
  cardTitle: { color: '#39FF14', fontSize: 16, fontWeight: 'bold', marginBottom: 10 },
  cardDesc: { color: '#AAA', fontSize: 13, marginBottom: 20, lineHeight: 20 },
  
  claimButton: { backgroundColor: '#39FF14', padding: 15, borderRadius: 8, alignItems: 'center' },
  claimedButton: { backgroundColor: '#555' },
  buttonText: { color: '#000', fontSize: 14, fontWeight: 'bold' },

  radioControl: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', backgroundColor: '#000', padding: 10, borderRadius: 8, borderWidth: 1, borderColor: '#00FFFF' },
  radioVisualizer: { flex: 1, alignItems: 'center' },
  playButton: { backgroundColor: '#00FFFF', padding: 10, borderRadius: 8, marginLeft: 10 },
  stopButton: { backgroundColor: '#FF007F' },
  
  logText: { color: '#FFD700', fontFamily: 'Courier New', fontSize: 14, fontStyle: 'italic' }
});