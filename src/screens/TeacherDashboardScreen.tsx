// src/screens/TeacherDashboardScreen.tsx
import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, FlatList } from 'react-native';
import { getTeacherDashboardData, StudentStats } from '../services/teacherService';

interface Props {
  onBack: () => void;
}

export default function TeacherDashboardScreen({ onBack }: Props) {
  const { classes, students } = getTeacherDashboardData();
  const [selectedClass, setSelectedClass] = useState<string>('ALL');

  const filteredStudents = selectedClass === 'ALL' 
    ? students 
    : students.filter((s) => s.className === selectedClass);

  return (
    <View style={styles.container}>
      {/* Top Navigation */}
      <View style={styles.topBar}>
        <TouchableOpacity onPress={onBack} style={styles.backBtn}>
          <Text style={styles.backText}>🔙 QUAY LẠI MAP</Text>
        </TouchableOpacity>
        <Text style={styles.title}>📊 TEACHER DASHBOARD - QUẢN LÝ LỚP HỌC</Text>
      </View>

      <ScrollView contentContainerStyle={{ alignItems: 'center', width: '100%' }}>
        {/* Banner Tổng Quan */}
        <View style={styles.headerBanner}>
          <Text style={styles.bannerTag}>[ ACADEMIC MONITORING SYSTEM ]</Text>
          <Text style={styles.bannerTitle}>THỐNG KÊ LỚP HỌC & HUY HIỆU AI</Text>
          <Text style={styles.bannerSub}>Theo dõi thời lượng luyện nói, tỷ lệ thắng trận đấu và huy hiệu của học sinh.</Text>
        </View>

        {/* Bảng Tóm Tắt Theo Lớp */}
        <View style={styles.sectionBox}>
          <Text style={styles.sectionLabel}>🏫 TỔNG QUAN CÁC LỚP HỌC:</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ flexDirection: 'row' }}>
            <TouchableOpacity 
              style={[styles.classChip, selectedClass === 'ALL' && styles.activeChip]}
              onPress={() => setSelectedClass('ALL')}
            >
              <Text style={styles.chipText}>TẤT CẢ LỚP</Text>
            </TouchableOpacity>
            {classes.map((c) => (
              <TouchableOpacity 
                key={c.className}
                style={[styles.classChip, selectedClass === c.className && styles.activeChip]}
                onPress={() => setSelectedClass(c.className)}
              >
                <Text style={styles.chipText}>LỚP {c.className} ({c.avgScore}đ)</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>

        {/* Danh Sách Học Sinh */}
        <View style={styles.sectionBox}>
          <Text style={styles.sectionLabel}>🎓 DANH SÁCH HỌC SINH ({filteredStudents.length} BẠN):</Text>
          
          {filteredStudents.map((student) => (
            <View key={student.id} style={styles.studentCard}>
              <View style={styles.studentHeader}>
                <Text style={styles.studentName}>👤 {student.name} [{student.className}]</Text>
                <View style={styles.cefrBadge}>
                  <Text style={styles.cefrText}>{student.cefrLevel}</Text>
                </View>
              </View>

              <View style={styles.statsRow}>
                <Text style={styles.statText}>⏱️ Luyện: {student.totalMinutes} phút</Text>
                <Text style={styles.statText}>⚔️ Trận: {student.matchesPlayed}</Text>
                <Text style={styles.statText}>🏆 Thắng: {student.winRate}%</Text>
                <Text style={styles.statText}>📊 Điểm TB: {student.avgScore}</Text>
              </View>

              {/* Dải Huy Hiệu AI */}
              <Text style={styles.badgeLabel}>🎖️ Huy hiệu AI vinh danh:</Text>
              <View style={styles.badgeContainer}>
                {student.badges.map((badge, idx) => (
                  <View key={idx} style={styles.badgeTag}>
                    <Text style={styles.badgeText}>{badge}</Text>
                  </View>
                ))}
              </View>
            </View>
          ))}
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0A0518', padding: 16, paddingTop: 40 },
  topBar: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 15 },
  backBtn: { paddingHorizontal: 10, paddingVertical: 5, backgroundColor: '#160933', borderRadius: 6, borderWidth: 1, borderColor: '#FF007F' },
  backText: { color: '#FF007F', fontSize: 11, fontWeight: 'bold' },
  title: { color: '#FFF', fontSize: 12, fontWeight: '900' },

  headerBanner: { width: '100%', alignItems: 'center', marginBottom: 15, padding: 12, backgroundColor: '#120826', borderRadius: 12, borderWidth: 1, borderColor: '#3A1559' },
  bannerTag: { color: '#00FFCC', fontSize: 10, fontWeight: 'bold' },
  bannerTitle: { color: '#FFD700', fontSize: 15, fontWeight: '900', marginVertical: 4 },
  bannerSub: { color: '#AAAABB', fontSize: 11, textAlign: 'center' },

  sectionBox: { width: '100%', marginBottom: 15, backgroundColor: '#120826', padding: 12, borderRadius: 12, borderWidth: 1, borderColor: '#2A1040' },
  sectionLabel: { color: '#00FFCC', fontSize: 11, fontWeight: 'bold', marginBottom: 8 },

  classChip: { paddingHorizontal: 12, paddingVertical: 6, backgroundColor: '#1A0B36', borderRadius: 16, borderWidth: 1, borderColor: '#3A1559', marginRight: 8 },
  activeChip: { backgroundColor: '#FF007F', borderColor: '#FF007F' },
  chipText: { color: '#FFF', fontSize: 10, fontWeight: 'bold' },

  studentCard: { backgroundColor: '#0A0518', padding: 10, borderRadius: 10, borderWidth: 1, borderColor: '#3A1559', marginBottom: 10 },
  studentHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 },
  studentName: { color: '#FFF', fontSize: 13, fontWeight: 'bold' },
  cefrBadge: { backgroundColor: '#003344', paddingHorizontal: 8, paddingVertical: 2, borderRadius: 4, borderWidth: 1, borderColor: '#00FFCC' },
  cefrText: { color: '#00FFCC', fontSize: 10, fontWeight: '900' },

  statsRow: { flexDirection: 'row', justifyContent: 'space-between', marginVertical: 4, backgroundColor: '#120826', padding: 6, borderRadius: 6 },
  statText: { color: '#AAAABB', fontSize: 10 },

  badgeLabel: { color: '#FFD700', fontSize: 9, fontWeight: 'bold', marginTop: 4, marginBottom: 2 },
  badgeContainer: { flexDirection: 'row', flexWrap: 'wrap' },
  badgeTag: { backgroundColor: '#2A1040', paddingHorizontal: 8, paddingVertical: 3, borderRadius: 12, borderWidth: 1, borderColor: '#FF007F', marginRight: 4, marginTop: 4 },
  badgeText: { color: '#FF007F', fontSize: 9, fontWeight: 'bold' }
});