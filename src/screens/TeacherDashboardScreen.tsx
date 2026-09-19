// src/screens/TeacherDashboardScreen.tsx
import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, TextInput, Alert } from 'react-native';

interface Student {
  id: string;
  name: string;
  exp: number;
  streak: number;
  avgScore: number;
}

interface Assignment {
  id: string;
  className: string;
  stationName: string;
  cefrLevel: string;
  specialtyTopic: string; // 🎯 Chủ đề chuyên ngành
  targetScore: number;
  deadline: string;
}

export default function TeacherDashboardScreen({ onBack }: { onBack: () => void }) {
  const [activeTab, setActiveTab] = useState<'students' | 'assignments'>('students');
  const [selectedClass, setSelectedClass] = useState<string>('Lớp 8A1');

  // 1. STATE QUẢN LÝ HỌC SINH
  const [newStudentName, setNewStudentName] = useState<string>('');
  const [students, setStudents] = useState<Student[]>([
    { id: '1', name: 'Nguyễn Văn An', exp: 1250, streak: 5, avgScore: 88 },
    { id: '2', name: 'Trần Thị Bích', exp: 980, streak: 3, avgScore: 79 },
    { id: '3', name: 'Lê Hoàng Cường', exp: 1420, streak: 7, avgScore: 92 },
  ]);

  // 2. STATE GIAO BÀI TẬP VÀ CHUYÊN NGÀNH
  const [targetStation, setTargetStation] = useState<string>('Trạm 3: Boss Raid');
  const [targetCEFR, setTargetCEFR] = useState<string>('A2');
  const [specialtyTopic, setSpecialtyTopic] = useState<string>('CNTT / IT Helpdesk'); // 🎯 State chủ đề chuyên ngành
  const [targetScore, setTargetScore] = useState<string>('80');
  const [assignments, setAssignments] = useState<Assignment[]>([
    { 
      id: '101', 
      className: 'Lớp 8A1', 
      stationName: 'Trạm 3: Boss Raid', 
      cefrLevel: 'A2', 
      specialtyTopic: 'Giao tiếp hằng ngày', 
      targetScore: 80, 
      deadline: '2026-09-25' 
    }
  ]);

  // Thêm học sinh mới vào lớp
  const handleAddStudent = () => {
    if (!newStudentName.trim()) return;
    const newStudent: Student = {
      id: Date.now().toString(),
      name: newStudentName.trim(),
      exp: 0,
      streak: 0,
      avgScore: 0,
    };
    setStudents([...students, newStudent]);
    setNewStudentName('');
  };

  // Tải/Xuất danh sách học sinh dạng CSV
  const handleExportCSV = () => {
    const headers = "ID,Họ và Tên,Điểm EXP,Chuỗi Ngày (Streak),Điểm Trung Bình\n";
    const rows = students.map(s => `${s.id},"${s.name}",${s.exp},${s.streak},${s.avgScore}`).join("\n");
    const blob = new Blob([headers + rows], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", `Danh_Sach_${selectedClass.replace(/\s+/g, '_')}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Giao bài tập mới kèm chuyên ngành
  const handleCreateAssignment = () => {
    const newAssign: Assignment = {
      id: Date.now().toString(),
      className: selectedClass,
      stationName: targetStation,
      cefrLevel: targetCEFR,
      specialtyTopic: specialtyTopic.trim() || 'Giao tiếp chung',
      targetScore: parseInt(targetScore) || 75,
      deadline: '2026-09-30',
    };
    setAssignments([newAssign, ...assignments]);
    alert(`Đã giao bài tập [${newAssign.specialtyTopic}] cho ${selectedClass}!`);
  };

  return (
    <View style={styles.container}>
      {/* Thanh điều hướng trên */}
      <View style={styles.topBar}>
        <TouchableOpacity onPress={onBack} style={styles.backBtn}>
          <Text style={styles.backText}>🔙 BẢN ĐỒ MAP</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>🏫 TEACHER DASHBOARD</Text>
      </View>

      {/* Selector chọn lớp học */}
      <View style={styles.classSelectorRow}>
        <Text style={styles.selectorLabel}>📌 ĐANG QUẢN LÝ:</Text>
        {['Lớp 8A1', 'Lớp 10T1', 'Lớp CNTT-K18', 'Lớp Y-Dược K20'].map((c) => (
          <TouchableOpacity
            key={c}
            style={[styles.classTab, selectedClass === c && styles.activeClassTab]}
            onPress={() => setSelectedClass(c)}
          >
            <Text style={[styles.classTabText, selectedClass === c && styles.activeClassText]}>{c}</Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Tabs tính năng chính */}
      <View style={styles.tabContainer}>
        <TouchableOpacity
          style={[styles.tabBtn, activeTab === 'students' && styles.activeTabBtn]}
          onPress={() => setActiveTab('students')}
        >
          <Text style={[styles.tabBtnText, activeTab === 'students' && styles.activeTabText]}>
            👥 DANH SÁCH LỚP ({students.length})
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.tabBtn, activeTab === 'assignments' && styles.activeTabBtn]}
          onPress={() => setActiveTab('assignments')}
        >
          <Text style={[styles.tabBtnText, activeTab === 'assignments' && styles.activeTabText]}>
            🎯 GIAO BÀI TẬP ({assignments.length})
          </Text>
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={{ paddingBottom: 30 }}>
        {/* TÍNH NĂNG 1: QUẢN LÝ DANH SÁCH HỌC SINH */}
        {activeTab === 'students' && (
          <View style={styles.sectionContainer}>
            <View style={styles.actionCard}>
              <Text style={styles.cardTitle}>➕ THÊM HỌC SINH VÀO {selectedClass.toUpperCase()}</Text>
              <View style={styles.inputRow}>
                <TextInput
                  style={styles.input}
                  placeholder="Nhập họ và tên học sinh..."
                  placeholderTextColor="#8888AA"
                  value={newStudentName}
                  onChangeText={setNewStudentName}
                />
                <TouchableOpacity style={styles.addBtn} onPress={handleAddStudent}>
                  <Text style={styles.addBtnText}>THÊM</Text>
                </TouchableOpacity>
              </View>

              <TouchableOpacity style={styles.exportBtn} onPress={handleExportCSV}>
                <Text style={styles.exportBtnText}>📥 TẢI XUẤT FILE DANH SÁCH (.CSV)</Text>
              </TouchableOpacity>
            </View>

            <Text style={styles.subTitle}>📊 BẢNG THEO DÕI NĂNG LỰC HỌC SINH</Text>
            {students.map((s, index) => (
              <View key={s.id} style={styles.studentCard}>
                <View style={styles.studentInfo}>
                  <Text style={styles.studentRank}>#{index + 1}</Text>
                  <View>
                    <Text style={styles.studentName}>{s.name}</Text>
                    <Text style={styles.studentSub}>EXP: {s.exp} | Streak: {s.streak} ngày 🔥</Text>
                  </View>
                </View>
                <View style={styles.scoreBadge}>
                  <Text style={styles.scoreText}>{s.avgScore} ĐIỂM</Text>
                  <Text style={styles.scoreLabel}>Trung bình AI</Text>
                </View>
              </View>
            ))}
          </View>
        )}

        {/* TÍNH NĂNG 2: GIAO BÀI TẬP CHUYÊN NGÀNH */}
        {activeTab === 'assignments' && (
          <View style={styles.sectionContainer}>
            <View style={styles.actionCard}>
              <Text style={styles.cardTitle}>📝 GIAO NHIỆM VỤ CHO {selectedClass.toUpperCase()}</Text>

              <Text style={styles.fieldLabel}>1. Chọn Trạm bài tập:</Text>
              <View style={styles.optionRow}>
                {['Trạm 1: Neon Beat', 'Trạm 2: Arena', 'Trạm 3: Boss Raid', 'Trạm 4: Listen'].map((st) => (
                  <TouchableOpacity
                    key={st}
                    style={[styles.optionChip, targetStation === st && styles.activeChip]}
                    onPress={() => setTargetStation(st)}
                  >
                    <Text style={[styles.chipText, targetStation === st && styles.activeChipText]}>{st}</Text>
                  </TouchableOpacity>
                ))}
              </View>

              <Text style={styles.fieldLabel}>2. Chọn Cấp độ CEFR áp dụng:</Text>
              <View style={styles.optionRow}>
                {['A1', 'A2', 'B1', 'B2', 'C1'].map((lvl) => (
                  <TouchableOpacity
                    key={lvl}
                    style={[styles.levelChip, targetCEFR === lvl && styles.activeLevelChip]}
                    onPress={() => setTargetCEFR(lvl)}
                  >
                    <Text style={[styles.chipText, targetCEFR === lvl && styles.activeChipText]}>{lvl}</Text>
                  </TouchableOpacity>
                ))}
              </View>

              {/* 🎯 TÍNH NĂNG MỚI: CHỌN CHỦ ĐỀ CHUYÊN NGÀNH */}
              <Text style={styles.fieldLabel}>3. Chủ đề Chuyên ngành / Từ khóa linh hoạt:</Text>
              <View style={styles.optionRow}>
                {['CNTT / IT', 'Y Khoa', 'Du lịch - Khách sạn', 'Thương mại', 'Giao tiếp chung'].map((topic) => (
                  <TouchableOpacity
                    key={topic}
                    style={[styles.topicChip, specialtyTopic === topic && styles.activeTopicChip]}
                    onPress={() => setSpecialtyTopic(topic)}
                  >
                    <Text style={[styles.chipText, specialtyTopic === topic && styles.activeChipText]}>{topic}</Text>
                  </TouchableOpacity>
                ))}
              </View>
              <TextInput
                style={[styles.input, { marginTop: 4 }]}
                value={specialtyTopic}
                onChangeText={setSpecialtyTopic}
                placeholder="Hoặc tự gõ chủ đề chuyên ngành riêng..."
                placeholderTextColor="#8888AA"
              />

              <Text style={styles.fieldLabel}>4. Yêu cầu điểm số tối thiểu:</Text>
              <TextInput
                style={styles.input}
                keyboardType="numeric"
                value={targetScore}
                onChangeText={setTargetScore}
                placeholder="VD: 80"
                placeholderTextColor="#8888AA"
              />

              <TouchableOpacity style={styles.createAssignBtn} onPress={handleCreateAssignment}>
                <Text style={styles.createAssignText}>🚀 GIAO BÀI TẬP CHUYÊN NGÀNH CHO CẢ LỚP</Text>
              </TouchableOpacity>
            </View>

            {/* Danh sách bài tập đã giao */}
            <Text style={styles.subTitle}>📋 NHIỆM VỤ ĐÃ GIAO GẦN ĐÂY</Text>
            {assignments.map((a) => (
              <View key={a.id} style={styles.assignmentCard}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.assignTag}>[{a.className}] • CEFR {a.cefrLevel}</Text>
                  <Text style={styles.assignTitle}>{a.stationName}</Text>
                  <Text style={styles.assignTopic}>🏷️ Chuyên ngành: {a.specialtyTopic}</Text>
                  <Text style={styles.assignSub}>Mục tiêu: Đạt ≥ {a.targetScore} điểm | Hạn: {a.deadline}</Text>
                </View>
                <View style={styles.statusBadge}>
                  <Text style={styles.statusText}>ĐANG MỞ</Text>
                </View>
              </View>
            ))}
          </View>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#05020D', padding: 16, paddingTop: 40 },
  topBar: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 15 },
  backBtn: { paddingHorizontal: 10, paddingVertical: 5, backgroundColor: '#0D0620', borderRadius: 6, borderWidth: 1, borderColor: '#00FFCC' },
  backText: { color: '#00FFCC', fontSize: 11, fontWeight: 'bold' },
  headerTitle: { color: '#00FFCC', fontSize: 14, fontWeight: '900' },

  classSelectorRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 15, backgroundColor: '#120826', padding: 8, borderRadius: 10 },
  selectorLabel: { color: '#FFD700', fontSize: 10, fontWeight: 'bold', marginRight: 8 },
  classTab: { paddingVertical: 5, paddingHorizontal: 10, backgroundColor: '#1A0B36', borderRadius: 6, marginHorizontal: 3 },
  activeClassTab: { backgroundColor: '#FF007F' },
  classTabText: { color: '#8888CC', fontSize: 10, fontWeight: 'bold' },
  activeClassText: { color: '#FFF' },

  tabContainer: { flexDirection: 'row', marginBottom: 15 },
  tabBtn: { flex: 1, paddingVertical: 10, alignItems: 'center', backgroundColor: '#120826', borderRadius: 8, marginHorizontal: 2, borderWidth: 1, borderColor: '#2A1040' },
  activeTabBtn: { backgroundColor: '#00FFCC', borderColor: '#00FFCC' },
  tabBtnText: { color: '#8888CC', fontSize: 11, fontWeight: 'bold' },
  activeTabText: { color: '#000000', fontWeight: '900' },

  sectionContainer: { width: '100%' },
  actionCard: { backgroundColor: '#0D0620', padding: 16, borderRadius: 12, borderWidth: 1, borderColor: '#00FFCC', marginBottom: 20 },
  cardTitle: { color: '#00FFCC', fontSize: 12, fontWeight: '900', marginBottom: 12 },

  inputRow: { flexDirection: 'row', marginBottom: 10 },
  input: { backgroundColor: '#120826', borderRadius: 8, paddingHorizontal: 12, paddingVertical: 8, color: '#FFF', fontSize: 12, borderWidth: 1, borderColor: '#3A1559' },
  addBtn: { backgroundColor: '#FF007F', paddingHorizontal: 16, justifyContent: 'center', borderRadius: 8, marginLeft: 8 },
  addBtnText: { color: '#FFF', fontSize: 11, fontWeight: 'bold' },

  exportBtn: { backgroundColor: '#110022', paddingVertical: 10, borderRadius: 8, borderWidth: 1, borderColor: '#FFD700', alignItems: 'center', marginTop: 5 },
  exportBtnText: { color: '#FFD700', fontSize: 11, fontWeight: 'bold' },

  subTitle: { color: '#FF007F', fontSize: 11, fontWeight: 'bold', marginBottom: 10 },
  studentCard: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', backgroundColor: '#120826', padding: 12, borderRadius: 10, marginBottom: 8, borderWidth: 1, borderColor: '#2A1040' },
  studentInfo: { flexDirection: 'row', alignItems: 'center' },
  studentRank: { color: '#FFD700', fontSize: 14, fontWeight: '900', marginRight: 12 },
  studentName: { color: '#FFF', fontSize: 13, fontWeight: 'bold' },
  studentSub: { color: '#8888CC', fontSize: 10, marginTop: 2 },
  scoreBadge: { backgroundColor: '#0A1A10', padding: 6, borderRadius: 8, borderWidth: 1, borderColor: '#39FF14', alignItems: 'center' },
  scoreText: { color: '#39FF14', fontSize: 11, fontWeight: '900' },
  scoreLabel: { color: '#AAAABB', fontSize: 8 },

  fieldLabel: { color: '#AAAABB', fontSize: 10, fontWeight: 'bold', marginTop: 10, marginBottom: 6 },
  optionRow: { flexDirection: 'row', flexWrap: 'wrap', marginBottom: 6 },
  optionChip: { backgroundColor: '#120826', paddingVertical: 6, paddingHorizontal: 10, borderRadius: 6, borderWidth: 1, borderColor: '#3A1559', marginRight: 6, marginBottom: 6 },
  activeChip: { backgroundColor: '#00FFCC', borderColor: '#00FFCC' },
  levelChip: { backgroundColor: '#120826', paddingVertical: 6, paddingHorizontal: 12, borderRadius: 6, borderWidth: 1, borderColor: '#3A1559', marginRight: 6, marginBottom: 6 },
  activeLevelChip: { backgroundColor: '#FF007F', borderColor: '#FF007F' },
  topicChip: { backgroundColor: '#120826', paddingVertical: 6, paddingHorizontal: 10, borderRadius: 6, borderWidth: 1, borderColor: '#FFD700', marginRight: 6, marginBottom: 6 },
  activeTopicChip: { backgroundColor: '#FFD700', borderColor: '#FFD700' },
  chipText: { color: '#8888CC', fontSize: 10, fontWeight: 'bold' },
  activeChipText: { color: '#000', fontWeight: '900' },

  createAssignBtn: { backgroundColor: '#39FF14', paddingVertical: 12, borderRadius: 8, alignItems: 'center', marginTop: 15 },
  createAssignText: { color: '#000', fontSize: 12, fontWeight: '900' },

  assignmentCard: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', backgroundColor: '#120826', padding: 12, borderRadius: 10, marginBottom: 8, borderWidth: 1, borderColor: '#2A1040' },
  assignTag: { color: '#00FFCC', fontSize: 9, fontWeight: 'bold' },
  assignTitle: { color: '#FFF', fontSize: 12, fontWeight: 'bold', marginVertical: 2 },
  assignTopic: { color: '#FFD700', fontSize: 10, fontWeight: 'bold', marginBottom: 2 },
  assignSub: { color: '#AAAABB', fontSize: 9 },
  statusBadge: { backgroundColor: '#0A1A10', padding: 6, borderRadius: 6, borderWidth: 1, borderColor: '#39FF14' },
  statusText: { color: '#39FF14', fontSize: 8, fontWeight: 'bold' }
});