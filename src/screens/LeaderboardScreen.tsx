// src/screens/LeaderboardScreen.tsx
import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView, ActivityIndicator } from 'react-native';
import { fetchSubmissionsFromCloud, RoleplaySubmission } from '../services/userService';

interface Props {
  onBack: () => void;
}

interface LeaderboardEntry {
  rank: number;
  name: string;
  className: string;
  score: number;
  mode: string;
  cefrLevel: string;
  date: string;
}

export default function LeaderboardScreen({ onBack }: Props) {
  const [allSubmissions, setAllSubmissions] = useState<RoleplaySubmission[]>([]);
  const [selectedClass, setSelectedClass] = useState<string>('ALL');
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    loadLeaderboardData();
  }, []);

  const loadLeaderboardData = async () => {
    setLoading(true);
    try {
      const data = await fetchSubmissionsFromCloud('ALL');
      setAllSubmissions(data || []);
    } catch (e) {
      console.warn("Lỗi tải Bảng Vàng:", e);
    } finally {
      setLoading(false);
    }
  };

  // Làm sạch tên lớp để tránh bị lặp tiền tố "CLASS:"
  const cleanClassName = (rawClass?: string) => {
    if (!rawClass) return 'LỚP CHUNG';
    let cls = rawClass.trim();
    if (cls.toUpperCase().startsWith('CLASS:')) {
      cls = cls.substring(6).trim();
    }
    return cls || 'LỚP CHUNG';
  };

  // Trích xuất danh sách các Mã Lớp duy nhất
  const availableClasses = Array.from(
    new Set(allSubmissions.map((s) => cleanClassName(s.className)))
  );

  // Lọc dữ liệu theo Lớp đã chọn & Sắp xếp điểm từ Cao xuống Thấp
  const filteredSubmissions = (selectedClass === 'ALL'
    ? allSubmissions
    : allSubmissions.filter((s) => cleanClassName(s.className).toUpperCase() === selectedClass.toUpperCase())
  ).sort((a, b) => b.score - a.score);

  // Tạo danh sách Bảng Vàng có Xếp Hạng (Rank 1, 2, 3...)
  const leaderboardList: LeaderboardEntry[] = filteredSubmissions.map((item, index) => ({
    rank: index + 1,
    name: item.studentName || item.pairName || 'Chiến binh',
    className: cleanClassName(item.className),
    score: item.score,
    mode: item.mode || 'SOLO',
    cefrLevel: item.cefrLevel || 'A1',
    date: item.timestamp || '',
  }));

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={onBack} style={styles.backBtn}>
          <Text style={styles.backText}>🔙 QUAY LẠI MAP</Text>
        </TouchableOpacity>
        <Text style={styles.title}>🏆 BẢNG VÀNG CYBER KNIGHT</Text>
      </View>

      <ScrollView contentContainerStyle={{ alignItems: 'center', paddingBottom: 30 }}>
        {/* KHU VỰC CHỌN MÃ LỚP ĐỂ XEM THỨ HẠNG CỦA LỚP */}
        <View style={styles.filterBox}>
          <Text style={styles.filterLabel}>🏫 CHỌN LỚP ĐỂ XEM XẾP HẠNG HỌC VIÊN:</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ flexDirection: 'row', marginTop: 8 }}>
            <TouchableOpacity
              style={[styles.classChip, selectedClass === 'ALL' && styles.classChipActive]}
              onPress={() => setSelectedClass('ALL')}
            >
              <Text style={[styles.chipText, selectedClass === 'ALL' && styles.chipTextActive]}>🌐 TOÀN TRƯỜNG</Text>
            </TouchableOpacity>

            {availableClasses.map((clsName) => (
              <TouchableOpacity
                key={clsName}
                style={[styles.classChip, selectedClass === clsName && styles.classChipActive]}
                onPress={() => setSelectedClass(clsName)}
              >
                <Text style={[styles.chipText, selectedClass === clsName && styles.chipTextActive]}>🏫 LỚP: {clsName}</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>

        {/* NÚT LÀM MỚI BẢNG VÀNG */}
        <TouchableOpacity style={styles.refreshBtn} onPress={loadLeaderboardData}>
          <Text style={styles.refreshBtnText}>🔄 CẬP NHẬT THỨ HẠNG MỚI NHẤT</Text>
        </TouchableOpacity>

        {loading ? (
          <ActivityIndicator size="large" color="#FFD700" style={{ marginVertical: 30 }} />
        ) : leaderboardList.length === 0 ? (
          <Text style={styles.emptyText}>Chưa có dữ liệu xếp hạng cho lớp này.</Text>
        ) : (
          /* DANH SÁCH BẢNG VÀNG XẾP HẠNG THỨ TỰ */
          <View style={{ width: '100%' }}>
            {leaderboardList.map((entry) => {
              let rankBadge = `#${entry.rank}`;
              let cardBorderColor = '#332255';
              let rankColor = '#FFF';

              if (entry.rank === 1) {
                rankBadge = '🥇 TOP 1';
                cardBorderColor = '#FFD700';
                rankColor = '#FFD700';
              } else if (entry.rank === 2) {
                rankBadge = '🥈 TOP 2';
                cardBorderColor = '#C0C0C0';
                rankColor = '#C0C0C0';
              } else if (entry.rank === 3) {
                rankBadge = '🥉 TOP 3';
                cardBorderColor = '#CD7F32';
                rankColor = '#CD7F32';
              }

              return (
                <View key={entry.rank + entry.name} style={[styles.rankCard, { borderColor: cardBorderColor }]}>
                  <View style={styles.rankBadgeBox}>
                    <Text style={[styles.rankBadgeText, { color: rankColor }]}>{rankBadge}</Text>
                  </View>

                  <View style={{ flex: 1, paddingHorizontal: 10 }}>
                    <Text style={styles.studentName}>{entry.name}</Text>
                    <Text style={styles.subMeta}>
                      🏫 {entry.className} | [{entry.mode} - LEVEL {entry.cefrLevel}]
                    </Text>
                    <Text style={styles.dateText}>⏱ {entry.date}</Text>
                  </View>

                  <View style={styles.scoreBox}>
                    <Text style={styles.scoreNumber}>{entry.score}</Text>
                    <Text style={styles.scoreLabel}>ĐIỂM</Text>
                  </View>
                </View>
              );
            })}
          </View>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#05020D', padding: 20, paddingTop: 50 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 15 },
  backBtn: { padding: 8, backgroundColor: '#0D0620', borderRadius: 8, borderWidth: 1, borderColor: '#00FFFF' },
  backText: { color: '#00FFFF', fontSize: 10, fontWeight: 'bold' },
  title: { color: '#FFD700', fontSize: 13, fontWeight: '900' },
  filterBox: { backgroundColor: '#130A2A', padding: 12, borderRadius: 12, borderWidth: 1, borderColor: '#FFD700', width: '100%', marginBottom: 12 },
  filterLabel: { color: '#FFD700', fontSize: 10, fontWeight: '900' },
  classChip: { backgroundColor: '#0D0620', paddingVertical: 6, paddingHorizontal: 12, borderRadius: 6, borderWidth: 1, borderColor: '#332255', marginRight: 6 },
  classChipActive: { backgroundColor: '#FFD700', borderColor: '#FFD700' },
  chipText: { color: '#AAAABB', fontSize: 9, fontWeight: 'bold' },
  chipTextActive: { color: '#000' },
  refreshBtn: { backgroundColor: '#00FFFF', padding: 10, borderRadius: 8, width: '100%', alignItems: 'center', marginBottom: 15 },
  refreshBtnText: { color: '#000', fontSize: 10, fontWeight: '900' },
  emptyText: { color: '#AAAABB', fontSize: 10, textAlign: 'center', marginVertical: 20 },
  rankCard: { backgroundColor: '#130A2A', padding: 12, borderRadius: 12, borderWidth: 1, flexDirection: 'row', alignItems: 'center', marginBottom: 10 },
  rankBadgeBox: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6, backgroundColor: '#0D0620', alignItems: 'center', justifyContent: 'center', minWidth: 55 },
  rankBadgeText: { fontSize: 10, fontWeight: '900' },
  studentName: { color: '#00FFFF', fontSize: 11, fontWeight: '900' },
  subMeta: { color: '#FF007F', fontSize: 8, fontWeight: 'bold', marginTop: 2 },
  dateText: { color: '#8888AA', fontSize: 8, marginTop: 2 },
  scoreBox: { alignItems: 'center', justifyContent: 'center', backgroundColor: '#0D0620', padding: 8, borderRadius: 8, borderWidth: 1, borderColor: '#39FF14', minWidth: 50 },
  scoreNumber: { color: '#39FF14', fontSize: 14, fontWeight: '900' },
  scoreLabel: { color: '#39FF14', fontSize: 7, fontWeight: 'bold' }
});