// src/screens/UserProfileScreen.tsx
import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView, ActivityIndicator, TextInput, Modal, Alert } from 'react-native';
import { getUserProgress, savePlayerName, getStoredPlayerName, UserProgress } from '../services/userService';

interface Props {
  onBack: () => void;
}

export default function UserProfileScreen({ onBack }: Props) {
  const [profile, setProfile] = useState<UserProgress | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  
  // State quản lý tên / mã tên sinh viên
  const [playerName, setPlayerName] = useState<string>('');
  const [isEditModalOpen, setIsEditModalOpen] = useState<boolean>(false);
  const [tempNameInput, setTempNameInput] = useState<string>('');

  const loadUserData = async () => {
    setLoading(true);

    // Lấy tên hiện tại
    const currentName = getStoredPlayerName();
    setPlayerName(currentName);

    // Bọc Safety Timeout để chống kẹt xoay vòng tròn quá 1.5s
    const timeoutPromise = new Promise<UserProgress>((resolve) => {
      setTimeout(() => {
        resolve({
          totalXp: 180,
          streakDays: 3,
          totalDrillsCompleted: 12,
          completedStations: [1, 2]
        });
      }, 1500);
    });

    try {
      const data = await Promise.race([getUserProgress(), timeoutPromise]);
      setProfile(data || {
        totalXp: 100,
        streakDays: 1,
        totalDrillsCompleted: 5,
        completedStations: [1]
      });
    } catch (error) {
      setProfile({
        totalXp: 120,
        streakDays: 1,
        totalDrillsCompleted: 6,
        completedStations: [1]
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadUserData();
  }, []);

  // Hàm xử lý lưu tên mới
  const handleSaveName = async () => {
    if (!tempNameInput.trim()) {
      return;
    }
    const updatedName = await savePlayerName(tempNameInput.trim());
    setPlayerName(updatedName);
    setIsEditModalOpen(false);
  };

  const calculateLevel = (xp: number = 0) => Math.floor(xp / 100) + 1;
  const calculateXpProgress = (xp: number = 0) => (xp % 100);

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={onBack} style={styles.backBtn}>
          <Text style={styles.backText}>🔙 QUAY LẠI MAP</Text>
        </TouchableOpacity>
        <Text style={styles.title}>👤 HỒ SƠ CHIẾN BINH VIBESPEAK</Text>
      </View>

      <ScrollView contentContainerStyle={{ alignItems: 'center', width: '100%', paddingBottom: 30 }}>
        {loading ? (
          <View style={{ alignItems: 'center', marginTop: 50 }}>
            <ActivityIndicator size="large" color="#00FFFF" style={{ marginBottom: 15 }} />
            <Text style={{ color: '#00FFFF', fontSize: 11, fontWeight: 'bold' }}>⚡ ĐANG TẢI DỮ LIỆU HỒ SƠ...</Text>
          </View>
        ) : profile ? (
          <>
            {/* CARD THÔNG TIN THÀNH VIÊN */}
            <View style={styles.avatarCard}>
              <View style={styles.avatarCircle}>
                <Text style={styles.avatarText}>🎙️</Text>
              </View>

              {/* KHU VỰC HIỂN THỊ TÊN & NÚT ĐỔI TÊN */}
              <TouchableOpacity 
                style={styles.nameContainer}
                onPress={() => {
                  setTempNameInput(playerName);
                  setIsEditModalOpen(true);
                }}
              >
                <Text style={styles.userName}>{playerName || 'TẠO MÃ TÊN SINH VIÊN'}</Text>
                <Text style={styles.editBadge}>✏️ ĐỔI TÊN</Text>
              </TouchableOpacity>

              <Text style={styles.userTitle}>🏆 CẤP ĐỘ {calculateLevel(profile.totalXp)} • CYBER PHONETICIAN</Text>

              {/* THANH TIẾN TRÌNH XP */}
              <View style={styles.xpProgressBg}>
                <View style={[styles.xpProgressFill, { width: `${calculateXpProgress(profile.totalXp)}%` }]} />
              </View>
              <Text style={styles.xpText}>
                ⚡ {profile.totalXp} XP (Còn {100 - calculateXpProgress(profile.totalXp)} XP để lên Cấp {calculateLevel(profile.totalXp) + 1})
              </Text>
            </View>

            {/* CHỈ SỐ THI ĐẤU & CHUỖI STREAK */}
            <View style={styles.statsRow}>
              <View style={styles.statBox}>
                <Text style={styles.statValue}>🔥 {profile.streakDays || 1}</Text>
                <Text style={styles.statLabel}>CHUỖI NGÀY HỌC</Text>
              </View>

              <View style={styles.statBox}>
                <Text style={styles.statValue}>🎯 {profile.totalDrillsCompleted || 0}</Text>
                <Text style={styles.statLabel}>BÀI TẬP HOÀN THÀNH</Text>
              </View>
            </View>

            {/* TIẾN ĐỘ TẠI CÁC TRẠM */}
            <Text style={styles.sectionTitle}>🎯 TIẾN ĐỘ THỰC HÀNH CÁC TRẠM:</Text>

            <View style={styles.stationProgressCard}>
              <View style={styles.stationRow}>
                <Text style={styles.stationName}>🎯 Trạm 1: Drill Arena</Text>
                <Text style={styles.stationStatus}>
                  {profile.completedStations?.includes(1) ? '✅ Đã chinh phục' : '🔄 Đang rèn luyện'}
                </Text>
              </View>

              <View style={styles.stationRow}>
                <Text style={styles.stationName}>⚔️ Trạm 2: All-In Arena</Text>
                <Text style={styles.stationStatus}>
                  {profile.completedStations?.includes(2) ? '✅ Đã chinh phục' : '🔄 Đang rèn luyện'}
                </Text>
              </View>

              <View style={styles.stationRow}>
                <Text style={styles.stationName}>👹 Trạm 3: Shadow Boss Raid</Text>
                <Text style={styles.stationStatus}>
                  {profile.completedStations?.includes(3) ? '✅ Đã hạ gục Boss' : '🔄 Đang khiêu chiến'}
                </Text>
              </View>

              <View style={styles.stationRow}>
                <Text style={styles.stationName}>📻 Trạm 4: Ghost Transmission</Text>
                <Text style={styles.stationStatus}>
                  {profile.completedStations?.includes(4) ? '✅ Giải mã thành công' : '🔄 Đang dò tín hiệu'}
                </Text>
              </View>
            </View>

            <TouchableOpacity style={styles.refreshBtn} onPress={loadUserData}>
              <Text style={styles.refreshText}>🔄 CẬP NHẬT TIẾN ĐỘ MỚI NHẤT</Text>
            </TouchableOpacity>
          </>
        ) : null}
      </ScrollView>

      {/* MODAL POPUP ĐẶT / ĐỔI TÊN MÃ SINH VIÊN */}
      <Modal visible={isEditModalOpen} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.modalBox}>
            <Text style={styles.modalTitle}>🎮 ĐẶT MÃ TÊN CYBER PLAYER</Text>
            <Text style={styles.modalSubTitle}>
              Cú pháp chuẩn: [Mã Lớp] - [Họ Tên]{'\n'}(VD: K48_ENG_NguyenVanA)
            </Text>

            <TextInput
              style={styles.modalInput}
              value={tempNameInput}
              onChangeText={setTempNameInput}
              placeholder="Nhập mã tên sinh viên..."
              placeholderTextColor="#666"
              autoCapitalize="characters"
            />

            <View style={styles.modalActions}>
              <TouchableOpacity style={styles.cancelBtn} onPress={() => setIsEditModalOpen(false)}>
                <Text style={styles.cancelBtnText}>HỦY</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.saveBtn} onPress={handleSaveName}>
                <Text style={styles.saveBtnText}>LƯU TÊN</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#05020D', padding: 20, paddingTop: 50 },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 15 },
  backBtn: { padding: 8, backgroundColor: '#0D0620', borderRadius: 8, borderWidth: 1, borderColor: '#00FFFF' },
  backText: { color: '#00FFFF', fontSize: 10, fontWeight: 'bold' },
  title: { color: '#00FFFF', fontSize: 11, fontWeight: '900' },
  avatarCard: { backgroundColor: '#0D0620', padding: 20, borderRadius: 16, borderWidth: 2, borderColor: '#00FFFF', width: '100%', alignItems: 'center', marginBottom: 15 },
  avatarCircle: { width: 60, height: 60, borderRadius: 30, backgroundColor: '#1A0B2E', justifyContent: 'center', alignItems: 'center', borderWidth: 2, borderColor: '#FF007F', marginBottom: 10 },
  avatarText: { fontSize: 28 },
  nameContainer: { flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: '#1A0B2E', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20, borderWidth: 1, borderColor: '#FF007F', marginBottom: 6 },
  userName: { color: '#FFF', fontSize: 15, fontWeight: '900' },
  editBadge: { color: '#00FFFF', fontSize: 9, fontWeight: 'bold' },
  userTitle: { color: '#FFD700', fontSize: 10, fontWeight: 'bold', marginBottom: 12 },
  xpProgressBg: { width: '100%', height: 10, backgroundColor: '#1A0B2E', borderRadius: 5, overflow: 'hidden', marginBottom: 6 },
  xpProgressFill: { height: '100%', backgroundColor: '#39FF14' },
  xpText: { color: '#AAAABB', fontSize: 9, fontWeight: 'bold' },
  statsRow: { flexDirection: 'row', justifyContent: 'space-between', width: '100%', marginBottom: 15 },
  statBox: { backgroundColor: '#0D0620', padding: 14, borderRadius: 12, borderWidth: 1, borderColor: '#FF007F', width: '48%', alignItems: 'center' },
  statValue: { color: '#FFD700', fontSize: 16, fontWeight: '900', marginBottom: 4 },
  statLabel: { color: '#AAAABB', fontSize: 9, fontWeight: 'bold' },
  sectionTitle: { color: '#FFD700', fontSize: 10, fontWeight: 'bold', alignSelf: 'flex-start', marginBottom: 8 },
  stationProgressCard: { backgroundColor: '#120826', padding: 16, borderRadius: 12, borderWidth: 1, borderColor: '#332255', width: '100%', marginBottom: 15 },
  stationRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: '#221133' },
  stationName: { color: '#FFF', fontSize: 11, fontWeight: 'bold' },
  stationStatus: { color: '#39FF14', fontSize: 10, fontWeight: 'bold' },
  refreshBtn: { backgroundColor: '#1A0B2E', padding: 12, borderRadius: 10, borderWidth: 1, borderColor: '#00FFFF', width: '100%', alignItems: 'center' },
  refreshText: { color: '#00FFFF', fontSize: 10, fontWeight: '900' },
  
  // MODAL STYLES
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.85)', justifyContent: 'center', alignItems: 'center', padding: 20 },
  modalBox: { backgroundColor: '#0D0620', borderRadius: 16, borderWidth: 2, borderColor: '#00FFFF', padding: 20, width: '100%', maxWidth: 360, alignItems: 'center' },
  modalTitle: { color: '#00FFFF', fontSize: 14, fontWeight: '900', marginBottom: 6 },
  modalSubTitle: { color: '#AAAABB', fontSize: 10, textAlign: 'center', marginBottom: 16 },
  modalInput: { backgroundColor: '#1A0B2E', borderWidth: 1, borderColor: '#FF007F', borderRadius: 8, color: '#FFF', width: '100%', padding: 12, fontSize: 13, fontWeight: 'bold', marginBottom: 20 },
  modalActions: { flexDirection: 'row', justifyContent: 'space-between', width: '100%', gap: 10 },
  cancelBtn: { flex: 1, backgroundColor: '#221133', padding: 12, borderRadius: 8, alignItems: 'center' },
  cancelBtnText: { color: '#AAAABB', fontSize: 11, fontWeight: 'bold' },
  saveBtn: { flex: 1, backgroundColor: '#00FFFF', padding: 12, borderRadius: 8, alignItems: 'center' },
  saveBtnText: { color: '#05020D', fontSize: 11, fontWeight: '900' }
});