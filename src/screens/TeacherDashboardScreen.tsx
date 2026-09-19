// src/screens/TeacherDashboardScreen.tsx
import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, TextInput, Modal, Alert } from 'react-native';

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
  specialtyTopic: string;
  targetScore: number;
  deadline: string;
}

export default function TeacherDashboardScreen({ onBack }: { onBack: () => void }) {
  const [activeTab, setActiveTab] = useState<'students' | 'assignments'>('students');

  // 1. STATE QUẢN LÝ LỚP HỌC LINH HOẠT
  const [classList, setClassList] = useState<string[]>(['Lớp 8A1', 'Lớp 10T1', 'Lớp CNTT-K18']);
  const [selectedClass, setSelectedClass] = useState<string>('Lớp 8A1');
  const [showAddClassModal, setShowAddClassModal] = useState<boolean>(false);
  const [newClassNameInput, setNewClassNameInput] = useState<string>('');

  // 2. STATE QUẢN LÝ HỌC SINH
  const [newStudentName, setNewStudentName] = useState<string>('');
  const [students, setStudents] = useState<Student[]>([
    { id: '1', name: 'Nguyễn Văn An', exp: 1250, streak: 5, avgScore: 88 },
    { id: '2', name: 'Trần Thị Bích', exp: 980, streak: 3, avgScore: 79 },
    { id: '3', name: 'Lê Hoàng Cường', exp: 1420, streak: 7, avgScore: 92 },
  ]);

  // 3. STATE QUẢN LÝ CHỦ ĐỀ CHUYÊN NGÀNH (ESP) LINH HOẠT
  const [topicList, setTopicList] = useState<string[]>([
    'CNTT / IT', 'Y Khoa', 'Du lịch - Khách sạn', 'Thương mại', 'Giao tiếp chung'
  ]);
  const [targetStation, setTargetStation] = useState<string>('Trạm 3: Boss Raid');
  const [targetCEFR, setTargetCEFR] = useState<string>('A2');
  const [specialtyTopic, setSpecialtyTopic] = useState<string>('CNTT / IT');
  const [targetScore, setTargetScore] = useState<string>('80');

  const [showAddTopicModal, setShowAddTopicModal] = useState<boolean>(false);
  const [newTopicInput, setNewTopicInput] = useState<string>('');

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

  // Thêm Lớp mới linh hoạt
  const handleCreateNewClass = () => {
    if (!newClassNameInput.trim()) return;
    const name = newClassNameInput.trim();
    if (classList.includes(name)) {
      alert('Lớp này đã tồn tại trong danh sách!');
      return;
    }
    setClassList([...classList, name]);
    setSelectedClass(name);
    setNewClassNameInput('');
    setShowAddClassModal(false);
  };

  // Thêm Chủ đề Chuyên ngành mới linh hoạt
  const handleCreateNewTopic = () => {
    if (!newTopicInput.trim()) return;
    const topic = newTopicInput.trim();
    if (!topicList.includes(topic)) {
      setTopicList([...topicList, topic]);
    }
    setSpecialtyTopic(topic);
    setNewTopicInput('');
    setShowAddTopicModal(false);
  };

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

  // Export danh sách học sinh ra CSV
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

  // Giao bài tập chuyên ngành
  const handleCreateAssignment = () => {
    const newAssign: Assignment = {
      id: Date.now().toString(),
      className: selectedClass,
      stationName: targetStation,
      cefrLevel: targetCEFR,
      specialtyTopic: specialtyTopic || 'Giao tiếp chung',
      targetScore: parseInt(targetScore) || 75,
      deadline: '2026-09-30',
    };
    setAssignments([newAssign, ...assignments]);
    alert(`Đã giao bài tập chuyên ngành [${newAssign.specialtyTopic}] cho ${selectedClass}!`);
  };

  return (
    <View style={styles.container}>
      {/* Top Bar */}
      <View style={styles.topBar}>
        <TouchableOpacity onPress={onBack} style={styles.backBtn}>
          <Text style={styles.backText}>🔙 BẢN ĐỒ MAP</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>🏫 TEACHER DASHBOARD</Text>
      </View>

      {/* Selector chọn Lớp + Nút Nút Thêm Lớp Mới */}
      <View style={styles.classSelectorRow}>
        <Text style={styles.selectorLabel}>📌 QUẢN LÝ LỚP:</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ flex: 1 }}>
          {classList.map((c) => (
            <TouchableOpacity
              key={c}
              style={[styles.classTab, selectedClass === c && styles.activeClassTab]}
              onPress={() => setSelectedClass(c)}
            >
              <Text style={[styles.classTabText, selectedClass === c && styles.activeClassText]}>{c}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
        {/* NÚT THÊM LỚP MỚI LINH HOẠT */}
        <TouchableOpacity style={styles.addClassBtn} onPress={() => setShowAddClassModal(true)}>
          <Text style={styles.addClassBtnText}>➕ TẠO LỚP</Text>
        </TouchableOpacity>
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
        {/* TAB 1: DANH SÁCH HỌC SINH */}
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

        {/* TAB 2: GIAO BÀI TẬP CHUYÊN NGÀNH */}
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

              {/* 🎯 NÂNG CẤP: CHỌN VÀ THÊM CHỦ ĐỀ CHUYÊN NGÀNH LINH HOẠT */}
              <View style={styles.labelRow}>
                <Text style={styles.fieldLabel}>3. Chủ đề Tiếng Anh Chuyên ngành (ESP):</Text>
                <TouchableOpacity onPress={() => setShowAddTopicModal(true)}>
                  <Text style={styles.addTopicLink}>➕ Thêm ngành mới</Text>
                </TouchableOpacity>
              </View>

              <View style={styles.optionRow}>
                {topicList.map((topic) => (
                  <TouchableOpacity
                    key={topic}
                    style={[styles.topicChip, specialtyTopic === topic && styles.activeTopicChip]}
                    onPress={() => setSpecialtyTopic(topic)}
                  >
                    <Text style={[styles.chipText, specialtyTopic === topic && styles.activeChipText]}>{topic}</Text>
                  </TouchableOpacity>
                ))}
              </View>

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
                <Text style={styles.createAssignText}>🚀 GIAO BÀI TẬP CHUYÊN NGÀNH CHO LỚP</Text>
              </TouchableOpacity>
            </View>

            {/* Danh sách bài tập */}
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

      {/* 📌 MODAL THÊM LỚP MỚI LINH HOẠT */}
      <Modal visible={showAddClassModal} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>🏫 THÊM LỚP HỌC MỚI</Text>
            <Text style={styles.modalDesc}>Nhập tên lớp học mới để đưa vào danh sách quản lý:</Text>
            <TextInput
              style={styles.modalInput}
              placeholder="VD: Lớp 11A3, Lớp Y-Khoa K21..."
              placeholderTextColor="#8888AA"
              value={newClassNameInput}
              onChangeText={setNewClassNameInput}
            />
            <View style={styles.modalActionRow}>
              <TouchableOpacity style={styles.modalConfirmBtn} onPress={handleCreateNewClass}>
                <Text style={styles.modalConfirmText}>TẠO LỚP</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.modalCancelBtn} onPress={() => setShowAddClassModal(false)}>
                <Text style={styles.modalCancelText}>HỦY BỎ</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* 📌 MODAL THÊM CHỦ ĐỀ CHUYÊN NGÀNH MỚI LINH HOẠT */}
      <Modal visible={showAddTopicModal} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>💡 THÊM CHỦ ĐỀ CHUYÊN NGÀNH MỚI</Text>
            <Text style={styles.modalDesc}>Nhập tên ngành học / từ khóa chuyên sâu để lưu vào hệ thống:</Text>
            <TextInput
              style={styles.modalInput}
              placeholder="VD: Ô tô, Logistics, Hàng không, Xây dựng..."
              placeholderTextColor="#8888AA"
              value={newTopicInput}
              onChangeText={setNewTopicInput}
            />
            <View style={styles.modalActionRow}>
              <TouchableOpacity style={styles.modalConfirmBtn} onPress={handleCreateNewTopic}>
                <Text style={styles.modalConfirmText}>LƯU CHỦ ĐỀ</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.modalCancelBtn} onPress={() => setShowAddTopicModal(false)}>
                <Text style={styles.modalCancelText}>HỦY BỎ</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
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
  addClassBtn: { backgroundColor: '#39FF14', paddingVertical: 5, paddingHorizontal: 10, borderRadius: 6, marginLeft: 6 },
  addClassBtnText: { color: '#000', fontSize: 10, fontWeight: '900' },

  tabContainer: { flexDirection: 'row', marginBottom: 15 },
  tabBtn: { flex: 1, paddingVertical: 10, alignItems: 'center', backgroundColor: '#120826', borderRadius: 8, marginHorizontal: 2, borderWidth: 1, borderColor: '#2A1040' },
  activeTabBtn: { backgroundColor: '#00FFCC', borderColor: '#00FFCC' },
  tabBtnText: { color: '#8888CC', fontSize: 11, fontWeight: 'bold' },
  activeTabText: { color: '#000000', fontWeight: '900' },

  sectionContainer: { width: '100%' },
  actionCard: { backgroundColor: '#0D0620', padding: 16, borderRadius: 12, borderWidth: 1, borderColor: '#00FFCC', marginBottom: 20 },
  cardTitle: { color: '#00FFCC', fontSize: 12, fontWeight: '900', marginBottom: 12 },

  inputRow: { flexDirection: 'row', marginBottom: 10 },
  input: { flex: 1, backgroundColor: '#120826', borderRadius: 8, paddingHorizontal: 12, paddingVertical: 8, color: '#FFF', fontSize: 12, borderWidth: 1, borderColor: '#3A1559' },
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

  labelRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 10, marginBottom: 6 },
  fieldLabel: { color: '#AAAABB', fontSize: 10, fontWeight: 'bold' },
  addTopicLink: { color: '#39FF14', fontSize: 10, fontWeight: 'bold', textDecorationLine: 'underline' },

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
  statusText: { color: '#39FF14', fontSize: 8, fontWeight: 'bold' },

  // STYLES MODAL
  modalOverlay: { flex: 1, backgroundColor: 'rgba(5, 2, 13, 0.85)', justifyContent: 'center', alignItems: 'center', padding: 20 },
  modalCard: { backgroundColor: '#0D0620', padding: 20, borderRadius: 16, borderWidth: 2, borderColor: '#00FFCC', width: '100%', alignItems: 'center' },
  modalTitle: { color: '#00FFCC', fontSize: 14, fontWeight: '900', marginBottom: 8 },
  modalDesc: { color: '#AAAABB', fontSize: 11, textAlign: 'center', marginBottom: 15 },
  modalInput: { backgroundColor: '#120826', width: '100%', borderRadius: 8, paddingHorizontal: 12, paddingVertical: 10, color: '#FFF', fontSize: 12, borderWidth: 1, borderColor: '#3A1559', marginBottom: 15 },
  modalActionRow: { flexDirection: 'row', width: '100%', justifyContent: 'space-between' },
  modalConfirmBtn: { flex: 1, backgroundColor: '#39FF14', paddingVertical: 10, borderRadius: 8, alignItems: 'center', marginRight: 6 },
  modalConfirmText: { color: '#000', fontSize: 11, fontWeight: '900' },
  modalCancelBtn: { flex: 1, backgroundColor: '#221133', paddingVertical: 10, borderRadius: 8, alignItems: 'center', marginLeft: 6, borderWidth: 1, borderColor: '#FF0055' },
  modalCancelText: { color: '#FF0055', fontSize: 11, fontWeight: 'bold' }
});