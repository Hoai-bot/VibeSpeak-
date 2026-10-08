// src/screens/TeacherDashboardScreen.tsx
import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView, TextInput, Alert } from 'react-native';
import { getSubmissionsForTeacher, clearTeacherSubmissions, RoleplaySubmission } from '../services/userService';

interface Props {
  onBack: () => void;
}

export default function TeacherDashboardScreen({ onBack }: Props) {
  const [pin, setPin] = useState<string>('');
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [submissions, setSubmissions] = useState<RoleplaySubmission[]>([]);
  const [filterMode, setFilterMode] = useState<string>('all');

  const TEACHER_PIN = '2026';

  useEffect(() => {
    if (isAuthenticated) {
      loadData();
    }
  }, [isAuthenticated]);

  const loadData = () => {
    const data = getSubmissionsForTeacher();
    setSubmissions(data);
  };

  const handleVerifyPin = () => {
    if (pin === TEACHER_PIN) {
      setIsAuthenticated(true);
    } else {
      alert('❌ Mã PIN không chính xác! Vui lòng thử lại.');
    }
  };

  const handleExportCSV = () => {
    if (submissions.length === 0) {
      alert('Chưa có dữ liệu bài làm để xuất!');
      return;
    }

    let csvContent = 'data:text/csv;charset=utf-8,STT,Thoi Gian,Nguoi Choi / Cap Dau,Che Do,Level,Diem So,Nhan Xet AI\n';
    submissions.forEach((item, index) => {
      const row = `"${index + 1}","${item.timestamp}","${item.pairName || item.studentName}","${item.mode}","${item.cefrLevel}","${item.score}","${item.feedback.replace(/"/g, '""')}"`;
      csvContent += row + '\n';
    });

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `Bang_Diem_VibeSpeak_Lop_Culinary_${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  if (!isAuthenticated) {
    return (
      <View style={styles.loginContainer}>
        <TouchableOpacity onPress={onBack} style={styles.backBtnHeader}>
          <Text style={styles.backText}>🔙 QUAY LẠI APP</Text>
        </TouchableOpacity>
        <Text style={styles.loginTitle}>🔐 ĐẦU VÀO GIÁO VIÊN & QUẢN LÝ</Text>
        <Text style={styles.loginSub}>Nhập mã PIN để xem Bảng điểm và Quản lý Lớp học:</Text>
        
        <TextInput
          style={styles.pinInput}
          placeholder="Nhập mã PIN (Mặc định: 2026)"
          placeholderTextColor="#666688"
          secureTextEntry
          keyboardType="numeric"
          value={pin}
          onChangeText={setPin}
        />

        <TouchableOpacity style={styles.loginBtn} onPress={handleVerifyPin}>
          <Text style={styles.loginBtnText}>🔓 XÁC NHẬN TRUY CẬP</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const filteredData = filterMode === 'all' 
    ? submissions 
    : submissions.filter(s => s.mode.toLowerCase() === filterMode.toLowerCase());

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={onBack} style={styles.backBtn}>
          <Text style={styles.backText}>🔙 MAP chính</Text>
        </TouchableOpacity>
        <Text style={styles.title}>📊 BẢNG ĐIỂM GIÁO VIÊN (24 SV)</Text>
      </View>

      <View style={styles.actionBar}>
        <View style={styles.filterGroup}>
          <TouchableOpacity 
            style={[styles.filterBtn, filterMode === 'all' && styles.filterBtnActive]} 
            onPress={() => setFilterMode('all')}
          >
            <Text style={styles.filterText}>Tất cả ({submissions.length})</Text>
          </TouchableOpacity>
          <TouchableOpacity 
            style={[styles.filterBtn, filterMode === 'roleplay' && styles.filterBtnActive]} 
            onPress={() => setFilterMode('roleplay')}
          >
            <Text style={styles.filterText}>Roleplay</Text>
          </TouchableOpacity>
        </View>

        <TouchableOpacity style={styles.exportBtn} onPress={handleExportCSV}>
          <Text style={styles.exportBtnText}>📥 XUẤT EXCEL / CSV</Text>
        </TouchableOpacity>
      </View>

      <ScrollView style={{ width: '100%' }} contentContainerStyle={{ paddingBottom: 30 }}>
        {filteredData.length === 0 ? (
          <View style={styles.emptyBox}>
            <Text style={styles.emptyText}>📋 Chưa có bài nộp nào từ sinh viên.</Text>
          </View>
        ) : (
          filteredData.map((item, index) => (
            <View key={item.id || index} style={styles.scoreCard}>
              <View style={styles.cardHeader}>
                <Text style={styles.studentName}>👤 {item.pairName || item.studentName || 'Cặp Sinh Viên'}</Text>
                <Text style={styles.scoreBadge}>{item.score} ĐIỂM</Text>
              </View>

              <View style={styles.infoRow}>
                <Text style={styles.metaText}>⏱ {item.timestamp}</Text>
                <Text style={styles.levelTag}>[CHẾ ĐỘ: {item.mode.toUpperCase()} - {item.cefrLevel}]</Text>
              </View>

              <Text style={styles.transcriptLabel}>💬 Lời thoại ghi nhận:</Text>
              <Text style={styles.transcriptText}>"{item.transcript}"</Text>

              {item.audioUrl && (
                <View style={styles.audioContainer}>
                  <Text style={styles.audioTitle}>🎧 Nghe lại bài thu âm hội thoại:</Text>
                  {React.createElement('audio', {
                    controls: true,
                    src: item.audioUrl,
                    style: { width: '100%', marginTop: '4px' }
                  })}
                </View>
              )}

              <Text style={styles.feedbackText}>💡 AI Đánh giá: {item.feedback}</Text>
            </View>
          ))
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#05020D', padding: 20, paddingTop: 50 },
  loginContainer: { flex: 1, backgroundColor: '#05020D', justifyContent: 'center', alignItems: 'center', padding: 20 },
  backBtnHeader: { position: 'absolute', top: 50, left: 20, padding: 8, backgroundColor: '#0D0620', borderRadius: 8 },
  loginTitle: { color: '#00FFFF', fontSize: 14, fontWeight: '900', marginBottom: 10 },
  loginSub: { color: '#AAAABB', fontSize: 11, textAlign: 'center', marginBottom: 20 },
  pinInput: { backgroundColor: '#130A2A', borderWidth: 1, borderColor: '#00FFFF', borderRadius: 8, padding: 12, color: '#FFF', width: '80%', textAlign: 'center', fontSize: 14, marginBottom: 15 },
  loginBtn: { backgroundColor: '#FF007F', paddingVertical: 12, paddingHorizontal: 30, borderRadius: 8 },
  loginBtnText: { color: '#FFF', fontSize: 11, fontWeight: '900' },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 15 },
  backBtn: { padding: 8, backgroundColor: '#0D0620', borderRadius: 8, borderWidth: 1, borderColor: '#FF007F' },
  backText: { color: '#FF007F', fontSize: 10, fontWeight: 'bold' },
  title: { color: '#00FFFF', fontSize: 12, fontWeight: '900' },
  actionBar: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 15, width: '100%' },
  filterGroup: { flexDirection: 'row' },
  filterBtn: { backgroundColor: '#130A2A', paddingVertical: 6, paddingHorizontal: 10, borderRadius: 6, marginRight: 6, borderWidth: 1, borderColor: '#332255' },
  filterBtnActive: { backgroundColor: '#FF007F', borderColor: '#FF007F' },
  filterText: { color: '#FFF', fontSize: 9, fontWeight: 'bold' },
  exportBtn: { backgroundColor: '#39FF14', paddingVertical: 8, paddingHorizontal: 12, borderRadius: 6 },
  exportBtnText: { color: '#000', fontSize: 9, fontWeight: '900' },
  emptyBox: { backgroundColor: '#0D0620', padding: 30, borderRadius: 12, width: '100%', alignItems: 'center', marginTop: 20 },
  emptyText: { color: '#8888AA', fontSize: 11 },
  scoreCard: { backgroundColor: '#0D0620', padding: 14, borderRadius: 12, borderWidth: 1, borderColor: '#332255', marginBottom: 12, width: '100%' },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 },
  studentName: { color: '#00FFFF', fontSize: 12, fontWeight: '900' },
  scoreBadge: { color: '#39FF14', fontSize: 12, fontWeight: '900' },
  infoRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 },
  metaText: { color: '#8888AA', fontSize: 9 },
  levelTag: { color: '#FFD700', fontSize: 9, fontWeight: 'bold' },
  transcriptLabel: { color: '#AAAABB', fontSize: 9, fontWeight: 'bold' },
  transcriptText: { color: '#FFF', fontSize: 10, fontStyle: 'italic', marginVertical: 4 },
  audioContainer: { backgroundColor: '#130A2A', padding: 8, borderRadius: 8, marginTop: 6, marginBottom: 8 },
  audioTitle: { color: '#00FFFF', fontSize: 9, fontWeight: 'bold' },
  feedbackText: { color: '#FFD700', fontSize: 9, lineHeight: 14 }
});