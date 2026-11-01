// src/screens/TeacherDashboardScreen.tsx
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  TextInput
} from 'react-native';
import { supabase } from '../utils/supabase';
import { exportSubmissionsToExcel, exportSubmissionsToCSV } from '../utils/exportExcelHelper';

interface Props {
  onBack: () => void;
}

export default function TeacherDashboardScreen({ onBack }: Props) {
  const [submissions, setSubmissions] = useState<any[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [filterClass, setFilterClass] = useState<string>('ALL');
  const [searchKeyword, setSearchKeyword] = useState<string>('');
  const [classList, setClassList] = useState<string[]>([]);

  useEffect(() => {
    fetchTeacherData();
  }, []);

  const fetchTeacherData = async () => {
    setLoading(true);
    try {
      if (supabase) {
        const { data, error } = await supabase
          .from('submissions')
          .select('*')
          .order('created_at', { ascending: false })
          .limit(200);

        if (!error && data) {
          setSubmissions(data);

          // Trích xuất danh sách lớp duy nhất
          const classes = Array.from(
            new Set(data.map((item: any) => item.className).filter(Boolean))
          ) as string[];
          setClassList(classes);
        }
      }
    } catch (err) {
      console.warn('Lỗi lấy dữ liệu Teacher Dashboard:', err);
    } finally {
      setLoading(false);
    }
  };

  // Lọc dữ liệu theo Lớp và Từ khóa tìm kiếm
  const filteredSubmissions = submissions.filter((sub) => {
    const matchClass = filterClass === 'ALL' || (sub.className || 'LỚP CHUNG') === filterClass;
    const matchKeyword =
      !searchKeyword.trim() ||
      (sub.studentName || '').toLowerCase().includes(searchKeyword.toLowerCase()) ||
      (sub.transcript || '').toLowerCase().includes(searchKeyword.toLowerCase());
    return matchClass && matchKeyword;
  });

  // Tính toán chỉ số thống kê
  const totalSubmissions = filteredSubmissions.length;
  const passCount = filteredSubmissions.filter((s) => (Number(s.score) || 0) >= 70).length;
  const avgScore =
    totalSubmissions > 0
      ? Math.round(
          filteredSubmissions.reduce((acc, curr) => acc + (Number(curr.score) || 0), 0) /
            totalSubmissions
        )
      : 0;

  return (
    <View style={styles.container}>
      {/* HEADER */}
      <View style={styles.headerRow}>
        <TouchableOpacity onPress={onBack} style={styles.backBtn}>
          <Text style={styles.backText}>🔙 QUAY LẠI MAP</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>👨‍🏫 TEACHER DASHBOARD & QUẢN LÝ LỚP</Text>
        <TouchableOpacity onPress={fetchTeacherData} style={styles.refreshBtn}>
          <Text style={styles.refreshBtnText}>🔄 LÀM MỚI</Text>
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={{ paddingBottom: 40 }} showsVerticalScrollIndicator={false}>
        {/* THANH THỐNG KÊ TỔNG QUAN */}
        <View style={styles.statsCard}>
          <View style={styles.statItem}>
            <Text style={styles.statValue}>{totalSubmissions}</Text>
            <Text style={styles.statLabel}>Tổng bài nộp</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statItem}>
            <Text style={[styles.statValue, { color: avgScore >= 70 ? '#39FF14' : '#FF0055' }]}>
              {avgScore}đ
            </Text>
            <Text style={styles.statLabel}>Điểm trung bình</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statItem}>
            <Text style={[styles.statValue, { color: '#00FFFF' }]}>{passCount}</Text>
            <Text style={styles.statLabel}>Đạt chuẩn (≥70đ)</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statItem}>
            <Text style={[styles.statValue, { color: '#FFD700' }]}>
              {totalSubmissions > 0 ? Math.round((passCount / totalSubmissions) * 100) : 0}%
            </Text>
            <Text style={styles.statLabel}>Tỷ lệ Đạt</Text>
          </View>
        </View>

        {/* KHU VỰC BỘ LỌC & NÚT XUẤT BÁO CÁO EXCEL */}
        <View style={styles.filterCard}>
          <Text style={styles.filterTitle}>🎯 LỌC DỮ LIỆU & XUẤT BÁO CÁO:</Text>

          {/* Tìm kiếm tên học viên */}
          <TextInput
            style={styles.searchInput}
            placeholder="🔍 Tìm tên học viên hoặc MSSV..."
            placeholderTextColor="#666688"
            value={searchKeyword}
            onChangeText={setSearchKeyword}
          />

          {/* Lọc theo lớp học */}
          <Text style={styles.classLabel}>Lọc theo mã lớp:</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.classScroll}>
            <TouchableOpacity
              style={[styles.classChip, filterClass === 'ALL' && styles.classChipActive]}
              onPress={() => setFilterClass('ALL')}
            >
              <Text style={[styles.classChipText, filterClass === 'ALL' && styles.classChipTextActive]}>
                Tất cả các lớp
              </Text>
            </TouchableOpacity>
            {classList.map((cls) => (
              <TouchableOpacity
                key={cls}
                style={[styles.classChip, filterClass === cls && styles.classChipActive]}
                onPress={() => setFilterClass(cls)}
              >
                <Text style={[styles.classChipText, filterClass === cls && styles.classChipTextActive]}>
                  {cls}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>

          {/* 📥 CỤM NÚT XUẤT FILE EXCEL / CSV */}
          <View style={styles.exportBtnRow}>
            <TouchableOpacity
              style={styles.exportExcelBtn}
              onPress={() => exportSubmissionsToExcel(filteredSubmissions, filterClass)}
            >
              <Text style={styles.exportExcelText}>📥 XUẤT EXCEL BÁO CÁO (.XLSX)</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.exportCsvBtn}
              onPress={() => exportSubmissionsToCSV(filteredSubmissions, filterClass)}
            >
              <Text style={styles.exportCsvText}>📄 XUẤT CSV</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* DANH SÁCH BÀI LÀM CHI TIẾT */}
        <Text style={styles.listSectionTitle}>
          📋 DANH SÁCH CHI TIẾT ({filteredSubmissions.length} BÀI NỘP):
        </Text>

        {loading ? (
          <ActivityIndicator size="large" color="#00FFFF" style={{ marginVertical: 30 }} />
        ) : filteredSubmissions.length === 0 ? (
          <View style={styles.emptyBox}>
            <Text style={styles.emptyText}>⚠️ Không tìm thấy bài nộp nào phù hợp với bộ lọc.</Text>
          </View>
        ) : (
          filteredSubmissions.map((sub, idx) => {
            const isPass = (Number(sub.score) || 0) >= 70;
            return (
              <View
                key={sub.id || idx}
                style={[styles.subCard, { borderColor: isPass ? '#39FF14' : '#FF0055' }]}
              >
                <View style={styles.subHeader}>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.subStudentName}>
                      👤 {sub.studentName || 'Chưa đặt tên'}
                    </Text>
                    <Text style={styles.subMeta}>
                      🏫 Lớp: <Text style={{ color: '#FFD700' }}>{sub.className || 'LỚP CHUNG'}</Text> | Chế độ:{' '}
                      <Text style={{ color: '#00FFFF' }}>{sub.mode || 'SPEAKING'}</Text>{' '}
                      {sub.cefrLevel ? `[${sub.cefrLevel}]` : ''}
                    </Text>
                  </View>
                  <View style={[styles.scoreBadge, isPass ? styles.passBadge : styles.failBadge]}>
                    <Text style={styles.scoreBadgeText}>{sub.score || 0}đ</Text>
                  </View>
                </View>

                {sub.transcript ? (
                  <Text style={styles.subTranscript}>💬 "{sub.transcript}"</Text>
                ) : null}

                {sub.feedback ? (
                  <Text style={styles.subFeedback}>💡 {sub.feedback}</Text>
                ) : null}

                {/* Trình phát âm thanh bài nộp */}
                {sub.audioUrl ? (
                  <View
                    style={styles.audioWrapper}
                    // @ts-ignore
                    onStartShouldSetResponder={() => false}
                    onMoveShouldSetResponder={() => false}
                  >
                    {React.createElement('audio', {
                      controls: true,
                      playsInline: true,
                      src: sub.audioUrl,
                      style: { width: '100%', height: 32, marginTop: 6, touchAction: 'manipulation' }
                    })}
                  </View>
                ) : null}

                <Text style={styles.subDate}>
                  ⏱{' '}
                  {sub.created_at
                    ? new Date(sub.created_at).toLocaleString('vi-VN')
                    : sub.timestamp || ''}
                </Text>
              </View>
            );
          })
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#05020D', padding: 18, paddingTop: 40 },
  headerRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 15 },
  backBtn: { padding: 8, backgroundColor: '#0D0620', borderRadius: 8, borderWidth: 1, borderColor: '#00FFFF' },
  backText: { color: '#00FFFF', fontSize: 10, fontWeight: 'bold' },
  headerTitle: { color: '#FFD700', fontSize: 12, fontWeight: '900', textAlign: 'center', flex: 1 },
  refreshBtn: { padding: 8, backgroundColor: '#1A0B2E', borderRadius: 8, borderWidth: 1, borderColor: '#FFD700' },
  refreshBtnText: { color: '#FFD700', fontSize: 10, fontWeight: 'bold' },

  statsCard: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    backgroundColor: '#0D0620',
    borderWidth: 1.5,
    borderColor: '#332255',
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 10,
    marginBottom: 15
  },
  statItem: { flex: 1, alignItems: 'center' },
  statValue: { color: '#FFF', fontSize: 16, fontWeight: '900' },
  statLabel: { color: '#8888AA', fontSize: 9, marginTop: 2 },
  statDivider: { width: 1, backgroundColor: '#332255', height: '80%', alignSelf: 'center' },

  filterCard: {
    backgroundColor: '#120826',
    borderWidth: 1.5,
    borderColor: '#00FFFF',
    borderRadius: 14,
    padding: 14,
    marginBottom: 16
  },
  filterTitle: { color: '#00FFFF', fontSize: 11, fontWeight: '900', marginBottom: 8 },
  searchInput: {
    backgroundColor: '#0D0620',
    color: '#FFF',
    borderWidth: 1,
    borderColor: '#332255',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    fontSize: 11,
    marginBottom: 10
  },
  classLabel: { color: '#FFD700', fontSize: 10, fontWeight: 'bold', marginBottom: 6 },
  classScroll: { flexDirection: 'row', marginBottom: 12 },
  classChip: {
    backgroundColor: '#0D0620',
    borderWidth: 1,
    borderColor: '#332255',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 6,
    marginRight: 6
  },
  classChipActive: { backgroundColor: '#00FFFF', borderColor: '#00FFFF' },
  classChipText: { color: '#8888AA', fontSize: 10, fontWeight: 'bold' },
  classChipTextActive: { color: '#000' },

  exportBtnRow: { flexDirection: 'row', gap: 8, marginTop: 4 },
  exportExcelBtn: {
    flex: 1.5,
    backgroundColor: '#39FF14',
    paddingVertical: 10,
    borderRadius: 8,
    alignItems: 'center'
  },
  exportExcelText: { color: '#000', fontSize: 10, fontWeight: '900' },
  exportCsvBtn: {
    flex: 0.8,
    backgroundColor: '#1A0B2E',
    borderWidth: 1,
    borderColor: '#39FF14',
    paddingVertical: 10,
    borderRadius: 8,
    alignItems: 'center'
  },
  exportCsvText: { color: '#39FF14', fontSize: 10, fontWeight: '900' },

  listSectionTitle: { color: '#FFF', fontSize: 12, fontWeight: '900', marginBottom: 10 },
  emptyBox: { backgroundColor: '#130A2A', padding: 20, borderRadius: 12, alignItems: 'center', marginTop: 10 },
  emptyText: { color: '#FF0055', fontSize: 11, fontWeight: 'bold' },

  subCard: {
    backgroundColor: '#120826',
    borderLeftWidth: 4,
    borderWidth: 1,
    borderRadius: 10,
    padding: 12,
    marginBottom: 10
  },
  subHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  subStudentName: { color: '#FFF', fontSize: 13, fontWeight: '900' },
  subMeta: { color: '#AAAABB', fontSize: 10, marginTop: 3 },
  scoreBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 6 },
  passBadge: { backgroundColor: 'rgba(57, 255, 20, 0.2)', borderWidth: 1, borderColor: '#39FF14' },
  failBadge: { backgroundColor: 'rgba(255, 0, 85, 0.2)', borderWidth: 1, borderColor: '#FF0055' },
  scoreBadgeText: { color: '#FFF', fontSize: 12, fontWeight: '900' },
  subTranscript: { color: '#EEE', fontSize: 10, fontStyle: 'italic', marginVertical: 6 },
  subFeedback: { color: '#FFD700', fontSize: 9, marginBottom: 4 },
  audioWrapper: { width: '100%', marginTop: 4 },
  subDate: { color: '#666688', fontSize: 8, marginTop: 6, alignSelf: 'flex-end' }
});