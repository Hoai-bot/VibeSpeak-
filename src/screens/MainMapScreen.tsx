// src/screens/MainMapScreen.tsx
import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView } from 'react-native';
import StreakBadge from '../components/StreakBadge';
import NotificationToggle from '../components/NotificationToggle';
import AuthModal from '../components/AuthModal';
import { supabase } from '../utils/supabase';

interface Props {
  onSelectStation: (stationId: string | number) => void;
  onOpenProfile: () => void;
}

export default function MainMapScreen({ onSelectStation, onOpenProfile }: Props) {
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [showAuthModal, setShowAuthModal] = useState<boolean>(false);

  useEffect(() => {
    // 1. Kiểm tra session hiện tại khi vào app
    if (supabase) {
      supabase.auth.getUser().then(({ data }: any) => {
        if (data?.user) setCurrentUser(data.user);
      });

      // 2. Lắng nghe thay đổi trạng thái đăng nhập
      const { data: authListener } = supabase.auth.onAuthStateChange((_event: any, session: any) => {
        setCurrentUser(session?.user || null);
      });

      return () => {
        if (authListener?.subscription) {
          authListener.subscription.unsubscribe();
        }
      };
    }
  }, []);

  const handleLogout = async () => {
    if (supabase) {
      await supabase.auth.signOut();
      setCurrentUser(null);
    }
  };

  const displayName = currentUser?.user_metadata?.full_name 
    || currentUser?.email?.split('@')[0] 
    || 'GUEST';

  return (
    <View style={styles.container}>
      {/* HEADER GIAO DIỆN CHÍNH: USER AUTH, STREAK, NOTIFICATION, TEACHER */}
      <View style={styles.header}>
        {currentUser ? (
          <TouchableOpacity style={styles.userBadge} onPress={onOpenProfile}>
            {/* ✅ ĐÃ LOẠI BỎ .slice(0, 10) ĐỂ HIỂN THỊ ĐẦY ĐỦ TÊN HỌC VIÊN */}
            <Text numberOfLines={1} ellipsizeMode="tail" style={styles.userBadgeText}>
              👤 {displayName}
            </Text>
            <TouchableOpacity onPress={handleLogout} style={styles.logoutMiniBtn}>
              <Text style={styles.logoutMiniText}>🚪</Text>
            </TouchableOpacity>
          </TouchableOpacity>
        ) : (
          <TouchableOpacity style={styles.loginBtn} onPress={() => setShowAuthModal(true)}>
            <Text style={styles.loginBtnText}>🔑 ĐĂNG NHẬP</Text>
          </TouchableOpacity>
        )}

        {/* HUY HIỆU NGỌN LỬA CHUỖI NGÀY HỌC */}
        <StreakBadge />

        {/* NÚT THÔNG BÁO NHẮC HỌC THÔNG MINH */}
        <NotificationToggle />

        <TouchableOpacity 
          style={styles.teacherBtn} 
          onPress={() => onSelectStation('teacher')}
        >
          <Text style={styles.teacherBtnText}>📊 BẢNG ĐIỂM</Text>
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.mapContainer}>
        <Text style={styles.mapTitle}>🗺 BẢN ĐỒ ĐẤU TRƯỜNG VIBESPEAK</Text>
        <Text style={styles.mapSubtitle}>Luyện Phản Xạ Phát Âm Tiếng Anh Chuẩn CEFR (A1 - C2)</Text>

        <TouchableOpacity style={styles.stationCard} onPress={() => onSelectStation(1)}>
          <Text style={styles.stationTitle}>🔥 TRẠM 1: DRILL ARENA (A1 - A2)</Text>
          <Text style={styles.stationDesc}>Luyện từ vựng, âm tiết & mẫu câu giao tiếp căn bản chuẩn phát âm</Text>
        </TouchableOpacity>

        <TouchableOpacity style={[styles.stationCard, styles.station2Card]} onPress={() => onSelectStation(2)}>
          <Text style={styles.stationTitle}>⚔️ TRẠM 2: ALL-IN ARENA (SOLO / RELAY / ROLEPLAY)</Text>
          <Text style={styles.stationDesc}>Thi đấu hội thoại phản xạ cặp đôi & Tự do đóng vai tình huống mở (A1 - C2)</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.stationCard} onPress={() => onSelectStation(3)}>
          <Text style={styles.stationTitle}>👑 TRẠM 3: SHADOW BOSS RAID (B1 - B2)</Text>
          <Text style={styles.stationDesc}>Luyện Shadowing khớp nhịp điệu, ngữ điệu và tốc độ nói tự nhiên</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.stationCard} onPress={() => onSelectStation(4)}>
          <Text style={styles.stationTitle}>⚡ TRẠM 4: SPEAKING EXPRESS (B2 - C2)</Text>
          <Text style={styles.stationDesc}>Phản xạ nhanh tình huống giao tiếp phức tạp & lập luận chuyên sâu</Text>
        </TouchableOpacity>
      </ScrollView>

      {/* POPUP ĐĂNG NHẬP AUTH */}
      <AuthModal 
        visible={showAuthModal} 
        onClose={() => setShowAuthModal(false)}
        onSuccess={(user) => setCurrentUser(user)}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#05020D', padding: 18, paddingTop: 45 },
  header: { 
    flexDirection: 'row', 
    justifyContent: 'space-between', 
    alignItems: 'center', 
    marginBottom: 15,
    gap: 6,
  },
  loginBtn: { backgroundColor: '#1A0B2E', paddingVertical: 7, paddingHorizontal: 9, borderRadius: 8, borderWidth: 1, borderColor: '#00FFFF' },
  loginBtnText: { color: '#00FFFF', fontSize: 10, fontWeight: '900' },
  userBadge: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    backgroundColor: '#1A0B2E', 
    paddingVertical: 5, 
    paddingHorizontal: 8, 
    borderRadius: 8, 
    borderWidth: 1, 
    borderColor: '#39FF14', 
    gap: 6,
    maxWidth: 160, 
    flexShrink: 1,
  },
  userBadgeText: { 
    color: '#39FF14', 
    fontSize: 10, 
    fontWeight: 'bold',
    flexShrink: 1, 
  },
  logoutMiniBtn: { padding: 2 },
  logoutMiniText: { fontSize: 10 },
  teacherBtn: { backgroundColor: '#39FF14', paddingVertical: 7, paddingHorizontal: 9, borderRadius: 8, borderWidth: 1, borderColor: '#39FF14' },
  teacherBtnText: { color: '#000', fontSize: 10, fontWeight: '900' },
  mapContainer: { alignItems: 'center', paddingBottom: 30 },
  mapTitle: { color: '#FF007F', fontSize: 15, fontWeight: '900', marginBottom: 4 },
  mapSubtitle: { color: '#FFD700', fontSize: 10, marginBottom: 20 },
  stationCard: { backgroundColor: '#0D0620', padding: 16, borderRadius: 12, borderWidth: 1, borderColor: '#332255', width: '100%', marginBottom: 12 },
  station2Card: { borderColor: '#FF007F', borderWidth: 2, backgroundColor: '#130628' },
  stationTitle: { color: '#00FFFF', fontSize: 12, fontWeight: '900', marginBottom: 4 },
  stationDesc: { color: '#AAAABB', fontSize: 10, lineHeight: 15 },
});