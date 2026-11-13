// src/screens/TeacherDashboardScreen.tsx
import React, { useState, useEffect, useMemo } from 'react';
import { 
  View, 
  Text, 
  TouchableOpacity, 
  StyleSheet, 
  ScrollView, 
  ActivityIndicator, 
  Modal, 
  TextInput, 
  Alert 
} from 'react-native';
import { supabase } from '../utils/supabase';

interface Props {
  onBack: () => void;
}

interface SubmissionRecord {
  id: string;
  student_code: string;
  student_name: string;
  class_code?: string;
  class_name: string;
  score: number;
  manual_score: number | null;
  teacher_feedback: string | null;
  mode: string;
  cefr_level: string;
  transcript: string;
  audio_url: string;
  feedback: string;
  created_at: string;
}

interface ClassItem {
  id: string;
  code: string;
  name: string;
  tenant_id: string;
}

export default function TeacherDashboardScreen({ onBack }: Props) {
  // 🔐 TRẠNG THÁI XÁC THỰC GIẢNG VIÊN (AUTH GUARD)
  const [isCheckingAuth, setIsCheckingAuth] = useState<boolean>(true);
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [loginEmail, setLoginEmail] = useState<string>('');
  const [loginPassword, setLoginPassword] = useState<string>('');
  const [isLoggingIn, setIsLoggingIn] = useState<boolean>(false);
  const [authErrorMsg, setAuthErrorMsg] = useState<string>('');

  const [submissions, setSubmissions] = useState<SubmissionRecord[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [selectedClass, setSelectedClass] = useState<string>('ALL');
  const [classList, setClassList] = useState<ClassItem[]>([]);
  const [currentPlayingAudio, setCurrentPlayingAudio] = useState<string | null>(null);

  // Quản lý Phân quyền (RBAC) & Context
  const [userRole, setUserRole] = useState<string>('INSTRUCTOR');
  const [currentInstructorId, setCurrentInstructorId] = useState<string | null>(null);
  const [currentTenantId, setCurrentTenantId] = useState<string>('11111111-1111-1111-1111-111111111111');

  // 1. Quản lý Modal ghi đè điểm & nhận xét
  const [editingItem, setEditingItem] = useState<SubmissionRecord | null>(null);
  const [overrideScoreInput, setOverrideScoreInput] = useState<string>('');
  const [teacherCommentInput, setTeacherCommentInput] = useState<string>('');
  const [isSavingScore, setIsSavingScore] = useState<boolean>(false);

  // 2. Quản lý Modal tạo bài tập mới (Kèm Mã lớp class_code)
  const [showCreateAssignmentModal, setShowCreateAssignmentModal] = useState<boolean>(false);
  const [assignTitle, setAssignTitle] = useState<string>('');
  const [assignPrompt, setAssignPrompt] = useState<string>('');
  const [assignDescription, setAssignDescription] = useState<string>('');
  const [assignStation, setAssignStation] = useState<string>('STATION_2');
  const [assignCefr, setAssignCefr] = useState<string>('B1');
  const [assignClassId, setAssignClassId] = useState<string>('');
  const [assignClassCodeInput, setAssignClassCodeInput] = useState<string>('ENG_K24_ADV');
  const [assignDeadline, setAssignDeadline] = useState<string>('2026-12-31T23:59');
  const [isSubmittingAssign, setIsSubmittingAssign] = useState<boolean>(false);

  // 3. Quản lý Modal Bulk Import sinh viên
  const [showImportModal, setShowImportModal] = useState<boolean>(false);
  const [importClassId, setImportClassId] = useState<string>('');
  const [importCsvText, setImportCsvText] = useState<string>('');
  const [isImporting, setIsImporting] = useState<boolean>(false);

  // 4. Quản lý Modal Hướng dẫn Giảng viên (Teacher Guidelines)
  const [showGuideModal, setShowGuideModal] = useState<boolean>(false);

  // 🔍 KIỂM TRA PHIÊN ĐĂNG NHẬP & QUYỀN GIẢNG VIÊN KHI MỞ TRANG
  const verifyInstructorSession = async () => {
    setIsCheckingAuth(true);
    setAuthErrorMsg('');
    try {
      if (!supabase) {
        setAuthErrorMsg('Lỗi cấu hình kết nối máy chủ Supabase.');
        setIsAuthenticated(false);
        return;
      }

      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.user) {
        setIsAuthenticated(false);
        return;
      }

      // Kiểm tra role trong bảng profiles
      const { data: profile, error: profileErr } = await supabase
        .from('profiles')
        .select('role, tenant_id, full_name')
        .eq('id', session.user.id)
        .single();

      if (profileErr || !profile || (profile.role !== 'INSTRUCTOR' && profile.role !== 'SUPER_ADMIN')) {
        await supabase.auth.signOut();
        setIsAuthenticated(false);
        setAuthErrorMsg('⛔ Tài khoản này chưa được cấp quyền Giảng viên (INSTRUCTOR).');
        return;
      }

      setCurrentInstructorId(session.user.id);
      setUserRole(profile.role);
      if (profile.tenant_id) {
        setCurrentTenantId(profile.tenant_id);
      }

      setIsAuthenticated(true);
      await fetchDashboardData(profile.tenant_id, profile.role);
    } catch (err) {
      console.warn('Lỗi kiểm tra phiên đăng nhập:', err);
      setIsAuthenticated(false);
    } finally {
      setIsCheckingAuth(false);
    }
  };

  useEffect(() => {
    verifyInstructorSession();
  }, []);

  // 🔑 XỬ LÝ ĐĂNG NHẬP EMAIL / MẬT KHẨU
  const handleInstructorLogin = async () => {
    if (!loginEmail.trim() || !loginPassword.trim()) {
      setAuthErrorMsg('Vui lòng nhập đầy đủ Email và Mật khẩu giảng viên!');
      return;
    }

    setIsLoggingIn(true);
    setAuthErrorMsg('');
    try {
      if (!supabase) return;

      const { data, error } = await supabase.auth.signInWithPassword({
        email: loginEmail.trim(),
        password: loginPassword,
      });

      if (error) {
        setAuthErrorMsg('❌ Email hoặc mật khẩu không chính xác.');
        return;
      }

      if (data?.user) {
        await verifyInstructorSession();
      }
    } catch (err: any) {
      setAuthErrorMsg(err.message || 'Đăng nhập thất bại. Vui lòng thử lại.');
    } finally {
      setIsLoggingIn(false);
    }
  };

  // 🚪 XỬ LÝ ĐĂNG XUẤT
  const handleInstructorLogout = async () => {
    if (supabase) {
      await supabase.auth.signOut();
    }
    setIsAuthenticated(false);
    setLoginPassword('');
    setSubmissions([]);
  };

  const fetchDashboardData = async (overrideTenantId?: string, overrideRole?: string) => {
    setLoading(true);
    try {
      if (!supabase) {
        Alert.alert("Thông báo", "Supabase client chưa được cấu hình.");
        setLoading(false);
        return;
      }

      const activeTenantId = overrideTenantId || currentTenantId;
      const activeRole = overrideRole || userRole;

      // 1. Tải danh sách lớp thuộc TRƯỜNG của giảng viên
      let classQuery = supabase.from('classes').select('id, code, name, tenant_id');
      if (activeTenantId && activeRole !== 'SUPER_ADMIN') {
        classQuery = classQuery.eq('tenant_id', activeTenantId);
      }
      const { data: classesData, error: classErr } = await classQuery.order('name', { ascending: true });

      if (classErr) {
        console.warn("Lỗi tải classes:", classErr.message);
      }

      if (classesData && classesData.length > 0) {
        setClassList(classesData);
        setAssignClassId(classesData[0].id);
        setAssignClassCodeInput(classesData[0].code || 'PUBLIC');
        setImportClassId(classesData[0].id);
      } else {
        const defaultClass = [
          { id: '22222222-2222-2222-2222-222222222222', code: 'ENG_K24_ADV', name: 'Anh văn Nâng cao K24', tenant_id: activeTenantId }
        ];
        setClassList(defaultClass);
        setAssignClassId(defaultClass[0].id);
        setAssignClassCodeInput(defaultClass[0].code);
        setImportClassId(defaultClass[0].id);
      }

      // 2. Lấy danh sách bài nộp (Submissions)
      let subQuery = supabase.from('submissions').select('*').order('created_at', { ascending: false });
      if (activeTenantId && activeRole !== 'SUPER_ADMIN') {
        subQuery = subQuery.eq('tenant_id', activeTenantId);
      }
      const { data: subData, error: subErr } = await subQuery.limit(150);

      if (subErr) {
        console.warn("Lỗi tải submissions:", subErr.message);
      } else if (subData) {
        setSubmissions(subData as SubmissionRecord[]);
      }
    } catch (err) {
      console.error("Lỗi khi kết nối lấy dữ liệu Dashboard:", err);
    } finally {
      setLoading(false);
    }
  };

  // Tổng hợp danh sách Mã lớp từ cả bảng classes và thực tế bài nộp sinh viên gửi lên
  const availableFilterCodes = useMemo(() => {
    const codeSet = new Set<string>();
    classList.forEach(c => {
      if (c.code) codeSet.add(c.code.toUpperCase().trim());
    });
    submissions.forEach(s => {
      if (s.class_code) codeSet.add(s.class_code.toUpperCase().trim());
      // Trích xuất mã lớp dạng [ENG101_K18] từ class_name nếu bản ghi cũ chưa có class_code
      const match = (s.class_name || '').match(/^\[([A-Z0-9_-]+)\]/i);
      if (match && match[1]) {
        codeSet.add(match[1].toUpperCase());
      }
    });
    return Array.from(codeSet);
  }, [classList, submissions]);

  // Hàm lấy mã lớp chuẩn hóa của từng bài nộp
  const extractSubmissionClassCode = (s: SubmissionRecord): string => {
    if (s.class_code && s.class_code.trim()) {
      return s.class_code.toUpperCase().trim();
    }
    const match = (s.class_name || '').match(/^\[([A-Z0-9_-]+)\]/i);
    if (match && match[1]) {
      return match[1].toUpperCase();
    }
    return 'PUBLIC';
  };

  // Lọc theo Mã lớp
  const filteredSubmissions = selectedClass === 'ALL'
    ? submissions
    : submissions.filter(s => extractSubmissionClassCode(s) === selectedClass);

  // Thống kê
  const totalSubmissions = filteredSubmissions.length;
  const getFinalScore = (s: SubmissionRecord) => (s.manual_score !== null && s.manual_score !== undefined) ? Number(s.manual_score) : Number(s.score);

  const avgScore = totalSubmissions > 0
    ? Math.round(filteredSubmissions.reduce((acc, curr) => acc + getFinalScore(curr), 0) / totalSubmissions)
    : 0;

  const passRate = totalSubmissions > 0
    ? Math.round((filteredSubmissions.filter(s => getFinalScore(s) >= 70).length / totalSubmissions) * 100)
    : 0;

  // Xử lý lưu điểm ghi đè
  const handleOpenOverrideModal = (item: SubmissionRecord) => {
    setEditingItem(item);
    setOverrideScoreInput(item.manual_score !== null ? String(item.manual_score) : String(item.score));
    setTeacherCommentInput(item.teacher_feedback || '');
  };

  const handleSaveOverride = async () => {
    if (!editingItem) return;
    const parsedScore = parseFloat(overrideScoreInput);
    if (isNaN(parsedScore) || parsedScore < 0 || parsedScore > 100) {
      Alert.alert("Lỗi", "Điểm số phải từ 0 đến 100!");
      return;
    }

    setIsSavingScore(true);
    try {
      if (supabase) {
        const { error } = await supabase
          .from('submissions')
          .update({
            manual_score: parsedScore,
            teacher_feedback: teacherCommentInput.trim(),
            reviewed_by: currentInstructorId,
            reviewed_at: new Date().toISOString()
          })
          .eq('id', editingItem.id);

        if (error) {
          Alert.alert("Lỗi cập nhật", error.message);
        } else {
          setSubmissions(prev => prev.map(s => {
            if (s.id === editingItem.id) {
              return {
                ...s,
                manual_score: parsedScore,
                teacher_feedback: teacherCommentInput.trim()
              };
            }
            return s;
          }));
          setEditingItem(null);
          Alert.alert("Thành công", "Đã cập nhật điểm và nhận xét của Giảng viên!");
        }
      }
    } catch (e: any) {
      Alert.alert("Lỗi", e.message || "Không thể lưu điểm");
    } finally {
      setIsSavingScore(false);
    }
  };

  // 📝 TÍNH NĂNG 1: GIẢNG VIÊN TỰ TẠO BÀI TẬP MỚI (ĐỒNG BỘ CLASS_CODE)
  const handleCreateAssignment = async () => {
    if (!assignTitle.trim() || !assignPrompt.trim()) {
      Alert.alert("Lỗi", "Vui lòng nhập đầy đủ tiêu đề và nội dung câu mẫu/đề bài!");
      return;
    }

    const normalizedClassCode = (assignClassCodeInput || 'PUBLIC').toUpperCase().trim();

    setIsSubmittingAssign(true);
    try {
      if (supabase) {
        const selectedClassObj = classList.find(c => c.id === assignClassId);
        const { error } = await supabase.from('assignments').insert([{
          tenant_id: selectedClassObj?.tenant_id || currentTenantId,
          class_id: selectedClassObj ? assignClassId : null,
          class_code: normalizedClassCode,
          created_by: currentInstructorId,
          title: assignTitle.trim(),
          description: assignDescription.trim() || `Bài tập giao cho lớp ${normalizedClassCode}`,
          station_type: assignStation,
          target_prompt: assignPrompt.trim(),
          cefr_level: assignCefr.toUpperCase().trim(),
          deadline_at: new Date(assignDeadline).toISOString(),
          status: 'PUBLISHED'
        }]);

        if (error) {
          Alert.alert("Lỗi tạo bài tập", error.message);
        } else {
          Alert.alert(
            "Giao bài thành công",
            `✅ Đã phát hành bài tập "${assignTitle}" cho mã lớp [${normalizedClassCode}]. Sinh viên chỉ cần nhập mã lớp này để nhận bài!`
          );
          setShowCreateAssignmentModal(false);
          setAssignTitle('');
          setAssignPrompt('');
          setAssignDescription('');
        }
      }
    } catch (err: any) {
      Alert.alert("Lỗi", err.message || "Không thể tạo bài tập.");
    } finally {
      setIsSubmittingAssign(false);
    }
  };

  // 👥 TÍNH NĂNG 2: BULK IMPORT SINH VIÊN BẰNG FILE CSV / EXCEL
  const handleBulkImportStudents = async () => {
    if (!importCsvText.trim()) {
      Alert.alert("Lỗi", "Vui lòng nhập hoặc dán nội dung CSV danh sách sinh viên!");
      return;
    }

    setIsImporting(true);
    try {
      const lines = importCsvText.trim().split('\n');
      const studentsToInsert: any[] = [];
      const selectedClassObj = classList.find(c => c.id === importClassId);

      for (let i = 0; i < lines.length; i++) {
        const line = lines[i].trim();
        if (!line || (i === 0 && line.toLowerCase().includes('mssv'))) continue;

        const parts = line.split(',').map(p => p.trim().replace(/^["']|["']$/g, ''));
        if (parts.length >= 2) {
          const studentCode = parts[0];
          const fullName = parts[1];
          const email = parts[2] || `${studentCode.toLowerCase()}@student.vibespeak.edu.vn`;

          studentsToInsert.push({
            tenant_id: selectedClassObj?.tenant_id || currentTenantId,
            class_id: importClassId,
            student_id: studentCode,
            full_name: fullName,
            email: email,
            role: 'STUDENT'
          });
        }
      }

      if (studentsToInsert.length === 0) {
        Alert.alert("Lỗi", "Không tìm thấy dữ liệu sinh viên hợp lệ trong nội dung CSV!");
        setIsImporting(false);
        return;
      }

      if (supabase) {
        const { error } = await supabase.from('profiles').upsert(studentsToInsert, { onConflict: 'id' });
        if (error) {
          Alert.alert("Lỗi đồng bộ hồ sơ", error.message);
        } else {
          Alert.alert("Thành công", `Đã nhập và cấp quyền thành công cho ${studentsToInsert.length} sinh viên vào lớp!`);
          setShowImportModal(false);
          setImportCsvText('');
        }
      }
    } catch (err: any) {
      Alert.alert("Lỗi", err.message || "Quá trình nhập danh sách gặp lỗi.");
    } finally {
      setIsImporting(false);
    }
  };

  // Tải file mẫu CSV
  const handleDownloadSampleCsv = () => {
    const sample = "MSSV,HoVaTen,Email\nSV2026001,Nguyen Van An,an.nv@student.vibespeak.edu.vn\nSV2026002,Tran Thi Mai,mai.tt@student.vibespeak.edu.vn\nSV2026003,Le Hoang Nam,nam.lh@student.vibespeak.edu.vn";
    setImportCsvText(sample);
    Alert.alert("Đã tải mẫu", "Đã điền sẵn cấu trúc mẫu vào khung nhập liệu bên dưới.");
  };

  // Xuất file CSV báo cáo điểm (Kèm cột Mã Lớp)
  const handleExportCSV = () => {
    if (filteredSubmissions.length === 0) {
      Alert.alert("Thông báo", "Không có dữ liệu bài nộp để xuất!");
      return;
    }

    const headers = ["MSSV", "Ho va Ten", "Ma Lop", "Chi Tiet Tram", "Diem AI", "Diem Giang Vien", "Diem Chot", "Nhan Xet Giang Vien", "Cap Do", "Ky Nang", "Thoi Gian"];
    const rows = filteredSubmissions.map(s => {
      const finalScore = getFinalScore(s);
      const code = extractSubmissionClassCode(s);
      return [
        `"${s.student_code || 'GUEST'}"`,
        `"${s.student_name || 'N/A'}"`,
        `"${code}"`,
        `"${s.class_name || 'Lop Chung'}"`,
        s.score,
        s.manual_score !== null ? s.manual_score : 'Chua sua',
        finalScore,
        `"${(s.teacher_feedback || '').replace(/"/g, '""')}"`,
        `"${s.cefr_level || 'B1'}"`,
        `"${s.mode || 'SPEAKING'}"`,
        `"${new Date(s.created_at).toLocaleString('vi-VN')}"`
      ];
    });

    const csvContent = "data:text/csv;charset=utf-8,\uFEFF" 
      + [headers.join(","), ...rows.map(e => e.join(","))].join("\n");

    if (typeof window !== 'undefined') {
      const encodedUri = encodeURI(csvContent);
      const link = document.createElement("a");
      link.setAttribute("href", encodedUri);
      link.setAttribute("download", `Bang_Diem_${selectedClass}_${Date.now()}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } else {
      Alert.alert("Xuất dữ liệu", "Đã tạo bảng điểm CSV.");
    }
  };

  // =========================================================================
  // MÀN HÌNH CHỜ KIỂM TRA QUYỀN & CỔNG ĐĂNG NHẬP GIẢNG VIÊN
  // =========================================================================
  if (isCheckingAuth) {
    return (
      <View style={[styles.container, { justifyContent: 'center', alignItems: 'center' }]}>
        <ActivityIndicator size="large" color="#00FFFF" />
        <Text style={{ color: '#00FFFF', fontSize: 11, fontWeight: 'bold', marginTop: 12 }}>
          🔐 ĐANG XÁC THỰC QUYỀN TRUY CẬP GIẢNG VIÊN...
        </Text>
      </View>
    );
  }

  if (!isAuthenticated) {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={onBack} style={styles.backBtn}>
            <Text style={styles.backBtnText}>🔙 BẢN ĐỒ</Text>
          </TouchableOpacity>
          <Text style={styles.headerTitle}>🔐 XÁC THỰC GIẢNG VIÊN</Text>
          <View style={{ width: 60 }} />
        </View>

        <View style={styles.loginWrapper}>
          <View style={styles.loginCard}>
            <Text style={styles.loginIcon}>🏫</Text>
            <Text style={styles.loginTitle}>CỔNG QUẢN TRỊ GIẢNG VIÊN</Text>
            <Text style={styles.loginSubtitle}>
              Khu vực dành riêng cho Giảng viên & Cán bộ đào tạo. Vui lòng đăng nhập để giao bài và quản lý bảng điểm.
            </Text>

            {authErrorMsg ? (
              <View style={styles.errorBanner}>
                <Text style={styles.errorBannerText}>{authErrorMsg}</Text>
              </View>
            ) : null}

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Email Giảng viên (*):</Text>
              <TextInput
                style={styles.loginInput}
                placeholder="vi-du: hoai.gv@truong.edu.vn"
                placeholderTextColor="#666688"
                keyboardType="email-address"
                autoCapitalize="none"
                value={loginEmail}
                onChangeText={setLoginEmail}
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Mật khẩu (*):</Text>
              <TextInput
                style={styles.loginInput}
                placeholder="Nhập mật khẩu đăng nhập..."
                placeholderTextColor="#666688"
                secureTextEntry
                value={loginPassword}
                onChangeText={setLoginPassword}
              />
            </View>

            <TouchableOpacity
              style={[styles.loginSubmitBtn, isLoggingIn && { opacity: 0.6 }]}
              onPress={handleInstructorLogin}
              disabled={isLoggingIn}
            >
              {isLoggingIn ? (
                <ActivityIndicator size="small" color="#000" />
              ) : (
                <Text style={styles.loginSubmitText}>🔓 ĐĂNG NHẬP VÀO CỔNG QUẢN LÝ</Text>
              )}
            </TouchableOpacity>

            <Text style={styles.loginHelperNote}>
              💡 Chưa có tài khoản? Liên hệ Quản trị viên IT của trường để cấp tài khoản quyền INSTRUCTOR.
            </Text>
          </View>
        </View>
      </View>
    );
  }

  // =========================================================================
  // GIAO DIỆN CHÍNH CỦA CỔNG GIẢNG VIÊN (SAU KHI ĐĂNG NHẬP THÀNH CÔNG)
  // =========================================================================
  return (
    <View style={styles.container}>
      {/* Top Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={onBack} style={styles.backBtn}>
          <Text style={styles.backBtnText}>🔙 BẢN ĐỒ</Text>
        </TouchableOpacity>
        <View style={{ flex: 1, alignItems: 'center' }}>
          <Text style={styles.headerTitle}>🏫 CỔNG GIẢNG VIÊN & ĐÀO TẠO</Text>
          <Text style={styles.roleBadge}>Quyền: {userRole}</Text>
        </View>
        <View style={styles.actionBtnGroup}>
          <TouchableOpacity onPress={() => setShowGuideModal(true)} style={styles.guideBtn}>
            <Text style={styles.guideBtnText}>📖 HƯỚNG DẪN</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={() => fetchDashboardData()} style={styles.refreshIconBtn}>
            <Text style={styles.exportBtnText}>🔄</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={handleExportCSV} style={styles.exportBtn}>
            <Text style={styles.exportBtnText}>📥 EXCEL</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={handleInstructorLogout} style={styles.logoutBtn}>
            <Text style={styles.logoutBtnText}>🚪 THOÁT</Text>
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView contentContainerStyle={{ paddingBottom: 40 }}>
        {/* NÚT TÁC VỤ SƯ PHẠM B2B (GIAO BÀI & BULK IMPORT) */}
        <View style={styles.managementActionRow}>
          <TouchableOpacity 
            style={styles.newAssignmentBtn}
            onPress={() => setShowCreateAssignmentModal(true)}
          >
            <Text style={styles.newAssignmentBtnText}>➕ GIAO BÀI THEO MÃ LỚP</Text>
          </TouchableOpacity>
          <TouchableOpacity 
            style={styles.bulkImportBtn}
            onPress={() => setShowImportModal(true)}
          >
            <Text style={styles.bulkImportBtnText}>👥 IMPORT SINH VIÊN (CSV)</Text>
          </TouchableOpacity>
        </View>

        {/* Khối Thống Kê Tổng Quan */}
        <View style={styles.statsRow}>
          <View style={styles.statCard}>
            <Text style={styles.statLabel}>SỐ BÀI NỘP</Text>
            <Text style={styles.statValue}>{totalSubmissions}</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statLabel}>ĐIỂM TRUNG BÌNH</Text>
            <Text style={[styles.statValue, { color: avgScore >= 70 ? '#39FF14' : '#FFD700' }]}>
              {avgScore}đ
            </Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statLabel}>TỶ LỆ ĐẠT CHUẨN</Text>
            <Text style={[styles.statValue, { color: passRate >= 75 ? '#00FFFF' : '#FF0055' }]}>
              {passRate}%
            </Text>
          </View>
        </View>

        {/* Thanh lọc theo Mã lớp (Class Code) */}
        <View style={styles.filterSection}>
          <Text style={styles.filterLabel}>📌 LỌC BÀI NỘP THEO MÃ LỚP HỌC PHẦN:</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filterScroll}>
            <TouchableOpacity 
              style={[styles.filterChip, selectedClass === 'ALL' && styles.filterChipActive]}
              onPress={() => setSelectedClass('ALL')}
            >
              <Text style={[styles.filterChipText, selectedClass === 'ALL' && styles.filterChipTextActive]}>
                Tất Cả Lớp ({submissions.length})
              </Text>
            </TouchableOpacity>
            {availableFilterCodes.map((code) => (
              <TouchableOpacity 
                key={code} 
                style={[styles.filterChip, selectedClass === code && styles.filterChipActive]}
                onPress={() => setSelectedClass(code)}
              >
                <Text style={[styles.filterChipText, selectedClass === code && styles.filterChipTextActive]}>
                  🏫 {code}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>

        {/* Danh sách bảng điểm sinh viên */}
        <View style={styles.tableBox}>
          <View style={styles.tableHeaderRow}>
            <Text style={[styles.thText, { flex: 1.2 }]}>SINH VIÊN</Text>
            <Text style={[styles.thText, { flex: 1 }]}>MÃ LỚP / TRẠM</Text>
            <Text style={[styles.thText, { flex: 0.9, textAlign: 'center' }]}>ĐIỂM CHỐT</Text>
            <Text style={[styles.thText, { flex: 1.2, textAlign: 'right' }]}>THAO TÁC</Text>
          </View>

          {loading ? (
            <ActivityIndicator size="large" color="#00FFFF" style={{ marginVertical: 30 }} />
          ) : filteredSubmissions.length === 0 ? (
            <Text style={styles.emptyText}>Chưa có bài nộp nào thuộc mã lớp "{selectedClass}".</Text>
          ) : (
            filteredSubmissions.map((item) => {
              const finalScore = getFinalScore(item);
              const isPass = finalScore >= 70;
              const hasOverride = item.manual_score !== null && item.manual_score !== undefined;
              const rowClassCode = extractSubmissionClassCode(item);

              return (
                <View key={item.id} style={styles.tableRow}>
                  {/* Cột 1: Thông tin sinh viên */}
                  <View style={{ flex: 1.2 }}>
                    <Text style={styles.studentNameText} numberOfLines={1}>
                      {item.student_name || 'Học viên VipeSpeak'}
                    </Text>
                    <Text style={styles.studentCodeText}>
                      MSSV: {item.student_code || 'GUEST'}
                    </Text>
                    {item.teacher_feedback && (
                      <Text style={styles.teacherNoteText} numberOfLines={2}>
                        💬 GV: {item.teacher_feedback}
                      </Text>
                    )}
                  </View>

                  {/* Cột 2: Mã lớp & Kỹ năng */}
                  <View style={{ flex: 1 }}>
                    <View style={styles.classCodeTag}>
                      <Text style={styles.classCodeTagText}>{rowClassCode}</Text>
                    </View>
                    <Text style={styles.modeText} numberOfLines={1}>{item.mode || 'STATION_1'} • {item.cefr_level || 'B1'}</Text>
                  </View>

                  {/* Cột 3: Điểm số */}
                  <View style={{ flex: 0.9, alignItems: 'center' }}>
                    <Text style={[styles.scoreBadge, { color: isPass ? '#39FF14' : '#FF0055' }]}>
                      {finalScore}đ
                    </Text>
                    <Text style={styles.statusText}>
                      {hasOverride ? '✍️ ĐÃ CHẤM LẠI' : '🤖 AI CHẤM'}
                    </Text>
                  </View>

                  {/* Cột 4: Thao tác (Chấm lại & Nghe Audio) */}
                  <View style={{ flex: 1.2, alignItems: 'flex-end', justifyContent: 'center', gap: 4 }}>
                    <TouchableOpacity 
                      style={styles.overrideBtn}
                      onPress={() => handleOpenOverrideModal(item)}
                    >
                      <Text style={styles.overrideBtnText}>✏️ ĐỔI ĐIỂM</Text>
                    </TouchableOpacity>

                    {item.audio_url ? (
                      <TouchableOpacity 
                        style={styles.listenBtn}
                        onPress={() => setCurrentPlayingAudio(currentPlayingAudio === item.audio_url ? null : item.audio_url)}
                      >
                        <Text style={styles.listenBtnText}>
                          {currentPlayingAudio === item.audio_url ? '⏹ DỪNG' : '🎧 NGHE'}
                        </Text>
                      </TouchableOpacity>
                    ) : (
                      <Text style={{ color: '#666688', fontSize: 8, fontStyle: 'italic' }}>
                        📦 Không có audio
                      </Text>
                    )}
                  </View>
                </View>
              );
            })
          )}
        </View>

        {/* Khung Audio Player nổi */}
        {currentPlayingAudio && (
          <View style={styles.floatingAudioPlayer}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 6 }}>
              <Text style={styles.floatingPlayerTitle}>🎧 ĐANG NGHE BẢN THU CỦA HỌC VIÊN:</Text>
              <TouchableOpacity onPress={() => setCurrentPlayingAudio(null)}>
                <Text style={{ color: '#FF0055', fontWeight: 'bold' }}>✕ ĐÓNG</Text>
              </TouchableOpacity>
            </View>
            {React.createElement(
              'div',
              {
                style: { width: '100%' },
                onMouseDown: (e: any) => e.stopPropagation(),
                onTouchStart: (e: any) => e.stopPropagation(),
                onMouseUp: (e: any) => e.stopPropagation(),
                onTouchEnd: (e: any) => e.stopPropagation(),
              },
              React.createElement('audio', {
                autoPlay: true,
                controls: true,
                src: currentPlayingAudio,
                style: { width: '100%', height: 35 }
              })
            )}
          </View>
        )}
      </ScrollView>

      {/* ========================================================================= */}
      {/* MODAL 1: TẠO BÀI TẬP MỚI (GẮN MÃ LỚP CLASS_CODE CHO SINH VIÊN NHẬP) */}
      {/* ========================================================================= */}
      <Modal visible={showCreateAssignmentModal} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { maxWidth: 500 }]}>
            <Text style={styles.modalTitle}>📝 GIAO BÀI TẬP THEO MÃ LỚP</Text>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Chọn nhanh lớp có sẵn (hoặc gõ mã lớp mới bên dưới):</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ flexDirection: 'row', marginBottom: 6 }}>
                {classList.map(c => (
                  <TouchableOpacity
                    key={c.id}
                    style={[styles.smallChip, assignClassId === c.id && styles.smallChipActive]}
                    onPress={() => {
                      setAssignClassId(c.id);
                      setAssignClassCodeInput(c.code || 'PUBLIC');
                    }}
                  >
                    <Text style={[styles.smallChipText, assignClassId === c.id && styles.smallChipTextActive]}>
                      {c.code} - {c.name}
                    </Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>

              <Text style={styles.inputLabel}>Mã lớp cấp cho sinh viên (*):</Text>
              <TextInput 
                style={[styles.textInput, { borderColor: '#00FFFF', fontWeight: 'bold' }]}
                value={assignClassCodeInput}
                onChangeText={(val) => setAssignClassCodeInput(val.toUpperCase())}
                autoCapitalize="characters"
                placeholder="Ví dụ: ENG101_K18"
                placeholderTextColor="#666"
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Trạm luyện tập (Station):</Text>
              <View style={{ flexDirection: 'row', gap: 6 }}>
                {['STATION_1', 'STATION_2', 'STATION_3', 'STATION_4'].map(st => (
                  <TouchableOpacity
                    key={st}
                    style={[styles.smallChip, assignStation === st && styles.smallChipActive]}
                    onPress={() => setAssignStation(st)}
                  >
                    <Text style={[styles.smallChipText, assignStation === st && styles.smallChipTextActive]}>
                      Trạm {st.split('_')[1]}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Tiêu đề bài tập / Kỳ thi (*):</Text>
              <TextInput 
                style={styles.textInput}
                value={assignTitle}
                onChangeText={setAssignTitle}
                placeholder="Ví dụ: [ROLEPLAY] Kiểm tra phản xạ tình huống Unit 3"
                placeholderTextColor="#666"
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Mô tả bối cảnh tiếng Việt (Gợi ý cho sinh viên):</Text>
              <TextInput 
                style={styles.textInput}
                value={assignDescription}
                onChangeText={setAssignDescription}
                placeholder="Ví dụ: Bạn đang thương lượng dời lịch họp với đối tác nước ngoài..."
                placeholderTextColor="#666"
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Câu mẫu / Đề bài tiếng Anh mục tiêu (*):</Text>
              <TextInput 
                style={[styles.textInput, { height: 65, textAlignVertical: 'top' }]}
                multiline
                value={assignPrompt}
                onChangeText={setAssignPrompt}
                placeholder="Ví dụ: Could we reschedule our meeting to tomorrow afternoon due to an urgent server update?"
                placeholderTextColor="#666"
              />
            </View>

            <View style={styles.inputRowGroup}>
              <View style={{ flex: 1 }}>
                <Text style={styles.inputLabel}>Chuẩn CEFR:</Text>
                <TextInput 
                  style={styles.textInput}
                  value={assignCefr}
                  onChangeText={setAssignCefr}
                  placeholder="A2, B1, B2..."
                  placeholderTextColor="#666"
                />
              </View>
              <View style={{ flex: 1.5 }}>
                <Text style={styles.inputLabel}>Hạn chót nộp bài:</Text>
                <TextInput 
                  style={styles.textInput}
                  value={assignDeadline}
                  onChangeText={setAssignDeadline}
                  placeholder="YYYY-MM-DDTHH:mm"
                  placeholderTextColor="#666"
                />
              </View>
            </View>

            <View style={styles.modalBtnRow}>
              <TouchableOpacity 
                style={styles.modalCancelBtn} 
                onPress={() => setShowCreateAssignmentModal(false)}
                disabled={isSubmittingAssign}
              >
                <Text style={styles.modalCancelText}>HỦY BỎ</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={styles.modalSaveBtn} 
                onPress={handleCreateAssignment}
                disabled={isSubmittingAssign}
              >
                {isSubmittingAssign ? (
                  <ActivityIndicator size="small" color="#000" />
                ) : (
                  <Text style={styles.modalSaveText}>PHÁT HÀNH ĐỀ</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* ========================================================================= */}
      {/* MODAL 2: BULK IMPORT SINH VIÊN QUA FILE CSV / EXCEL */}
      {/* ========================================================================= */}
      <Modal visible={showImportModal} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { maxWidth: 520 }]}>
            <Text style={styles.modalTitle}>👥 NHẬP DANH SÁCH SINH VIÊN VÀO LỚP</Text>
            <Text style={styles.modalSubtitle}>Định dạng: MSSV, Họ và Tên, Email (Mỗi sinh viên một dòng)</Text>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Chọn lớp học để xếp sinh viên:</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ flexDirection: 'row' }}>
                {classList.map(c => (
                  <TouchableOpacity
                    key={c.id}
                    style={[styles.smallChip, importClassId === c.id && styles.smallChipActive]}
                    onPress={() => setImportClassId(c.id)}
                  >
                    <Text style={[styles.smallChipText, importClassId === c.id && styles.smallChipTextActive]}>
                      {c.code} - {c.name}
                    </Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>

            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
              <Text style={styles.inputLabel}>Nội dung danh sách CSV:</Text>
              <TouchableOpacity onPress={handleDownloadSampleCsv}>
                <Text style={{ color: '#00FFFF', fontSize: 9, fontWeight: 'bold' }}>📥 DÁN DỮ LIỆU MẪU</Text>
              </TouchableOpacity>
            </View>

            <TextInput 
              style={[styles.textInput, { height: 110, textAlignVertical: 'top', fontFamily: 'monospace' }]}
              multiline
              value={importCsvText}
              onChangeText={setImportCsvText}
              placeholder="SV2026001, Nguyen Van An, an.nv@student.vibespeak.edu.vn
SV2026002, Tran Thi Mai, mai.tt@student.vibespeak.edu.vn"
              placeholderTextColor="#666"
            />

            <View style={styles.modalBtnRow}>
              <TouchableOpacity 
                style={styles.modalCancelBtn} 
                onPress={() => setShowImportModal(false)}
                disabled={isImporting}
              >
                <Text style={styles.modalCancelText}>HỦY BỎ</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={styles.modalSaveBtn} 
                onPress={handleBulkImportStudents}
                disabled={isImporting}
              >
                {isImporting ? (
                  <ActivityIndicator size="small" color="#000" />
                ) : (
                  <Text style={styles.modalSaveText}>NẠP SINH VIÊN VÀO LỚP</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* ========================================================================= */}
      {/* MODAL 3: GHI ĐÈ ĐIỂM & NHẬN XÉT GIẢNG VIÊN (MANUAL OVERRIDE) */}
      {/* ========================================================================= */}
      <Modal visible={editingItem !== null} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>✍️ ĐIỀU CHỈNH ĐIỂM & NHẬN XÉT</Text>
            <Text style={styles.modalSubtitle}>
              Sinh viên: {editingItem?.student_name} ({editingItem?.student_code})
            </Text>
            <Text style={styles.modalAiScore}>
              Điểm AI ban đầu: <Text style={{ color: '#00FFFF', fontWeight: 'bold' }}>{editingItem?.score}đ</Text>
            </Text>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Điểm số mới của Giảng viên (0 - 100):</Text>
              <TextInput 
                style={styles.textInput}
                keyboardType="numeric"
                value={overrideScoreInput}
                onChangeText={setOverrideScoreInput}
                placeholder="Nhập điểm..."
                placeholderTextColor="#666"
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Nhận xét của Giảng viên gửi sinh viên:</Text>
              <TextInput 
                style={[styles.textInput, { height: 75, textAlignVertical: 'top' }]}
                multiline
                value={teacherCommentInput}
                onChangeText={setTeacherCommentInput}
                placeholder="Nhập lưu ý, sửa lỗi phát âm hoặc lời khen..."
                placeholderTextColor="#666"
              />
            </View>

            <View style={styles.modalBtnRow}>
              <TouchableOpacity 
                style={styles.modalCancelBtn} 
                onPress={() => setEditingItem(null)}
                disabled={isSavingScore}
              >
                <Text style={styles.modalCancelText}>HỦY BỎ</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={styles.modalSaveBtn} 
                onPress={handleSaveOverride}
                disabled={isSavingScore}
              >
                {isSavingScore ? (
                  <ActivityIndicator size="small" color="#000" />
                ) : (
                  <Text style={styles.modalSaveText}>LƯU ĐIỂM CHỐT</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* ========================================================================= */}
      {/* MODAL 4: HƯỚNG DẪN SỬ DỤNG DÀNH CHO GIẢNG VIÊN (TEACHER GUIDELINES) */}
      {/* ========================================================================= */}
      <Modal visible={showGuideModal} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { maxWidth: 540, maxHeight: '85%' }]}>
            <Text style={styles.modalTitle}>📖 HƯỚNG DẪN VẬN HÀNH CỔNG GIẢNG VIÊN</Text>
            <Text style={styles.modalSubtitle}>Quy trình 4 bước giao bài, quản lý lớp và chốt điểm trên VipeSpeak</Text>

            <ScrollView style={{ width: '100%', marginVertical: 8 }} showsVerticalScrollIndicator={false}>
              {/* BƯỚC 1 */}
              <View style={styles.guideStepBox}>
                <Text style={styles.guideStepTitle}>1️⃣ Tạo và Giao Bài Tập Theo Mã Lớp (Class Code)</Text>
                <Text style={styles.guideStepDesc}>
                  • Bấm nút <Text style={{ color: '#FF007F', fontWeight: 'bold' }}>➕ GIAO BÀI THEO MÃ LỚP</Text>.{'\n'}
                  • Nhập <Text style={{ color: '#00FFFF', fontWeight: 'bold' }}>Mã lớp</Text> riêng cho học phần của bạn (ví dụ: <Text style={{ color: '#FFD700' }}>ENG101_K18</Text>).{'\n'}
                  • Chọn Trạm luyện tập (Trạm 1: Ngữ âm IPA, Trạm 2: Phản xạ tình huống, Trạm 3: Đọc đuổi tốc độ, Trạm 4: Độc thoại WPM), nhập đề bài tiếng Anh và bấm <Text style={{ color: '#39FF14', fontWeight: 'bold' }}>PHÁT HÀNH ĐỀ</Text>.
                </Text>
              </View>

              {/* BƯỚC 2 */}
              <View style={styles.guideStepBox}>
                <Text style={styles.guideStepTitle}>2️⃣ Phổ Biến Quy Trình Cho Sinh Viên</Text>
                <Text style={styles.guideStepDesc}>
                  • Sinh viên không cần tạo tài khoản phức tạp. Khi vào Trạm 2 hoặc Trạm 4, sinh viên chỉ cần bấm <Text style={{ color: '#FFD700', fontWeight: 'bold' }}>✏️ Nhập Mã Lớp / Tên</Text> ở thanh trên cùng và điền: <Text style={{ color: '#FFF', fontWeight: 'bold' }}>Họ tên + MSSV + Mã lớp</Text>.{'\n'}
                  • Hệ thống tự động lưu thông tin này trên thiết bị của sinh viên cho các lần làm bài sau.{'\n'}
                  • Sinh viên chọn tab <Text style={{ color: '#00FFFF', fontWeight: 'bold' }}>🏫 GIẢNG VIÊN GIAO</Text> để làm đúng đề bài của lớp mình.
                </Text>
              </View>

              {/* BƯỚC 3 */}
              <View style={styles.guideStepBox}>
                <Text style={styles.guideStepTitle}>3️⃣ Thẩm Định Ghi Âm & Điều Chỉnh Điểm</Text>
                <Text style={styles.guideStepDesc}>
                  • Trên thanh lọc phía trên bảng điểm, chọn thẻ <Text style={{ color: '#00FFFF', fontWeight: 'bold' }}>🏫 [Mã Lớp]</Text> để xem riêng bài nộp của lớp mình.{'\n'}
                  • Bấm <Text style={{ color: '#00FFFF', fontWeight: 'bold' }}>🎧 NGHE</Text> để nghe trực tiếp file ghi âm gốc của sinh viên.{'\n'}
                  • Nếu muốn điều chỉnh điểm AI chấm tự động hoặc ghi chú sửa lỗi phát âm, bấm <Text style={{ color: '#FF007F', fontWeight: 'bold' }}>✏️ ĐỔI ĐIỂM</Text> để nhập điểm chốt mới.
                </Text>
              </View>

              {/* BƯỚC 4 */}
              <View style={styles.guideStepBox}>
                <Text style={styles.guideStepTitle}>4️⃣ Xuất Bảng Điểm Tổng Kết & Lưu Ý Thiết Bị</Text>
                <Text style={styles.guideStepDesc}>
                  • Sau khi lọc đúng Mã lớp, bấm <Text style={{ color: '#39FF14', fontWeight: 'bold' }}>📥 EXCEL</Text> ở góc trên bên phải để tải file bảng điểm CSV đầy đủ (bao gồm MSSV, Họ tên, Điểm AI, Điểm Giảng viên chốt và Nhận xét).{'\n'}
                  • <Text style={{ color: '#FFD700', fontWeight: 'bold' }}>Lưu ý khi sinh viên dùng iPhone/iPad:</Text> Nhắc sinh viên gạt nút chuông bên sườn máy sang chế độ bật tiếng và cấp quyền Micro cho trình duyệt Safari/Chrome.
                </Text>
              </View>
            </ScrollView>

            <TouchableOpacity 
              style={[styles.modalSaveBtn, { width: '100%', flex: undefined, marginTop: 8 }]} 
              onPress={() => setShowGuideModal(false)}
            >
              <Text style={styles.modalSaveText}>✅ ĐÃ HIỂU & ĐÓNG HƯỚNG DẪN</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#05020D', padding: 18, paddingTop: 45 },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 },
  backBtn: { padding: 8, backgroundColor: '#0D0620', borderRadius: 8, borderWidth: 1, borderColor: '#00FFFF' },
  backBtnText: { color: '#00FFFF', fontSize: 10, fontWeight: 'bold' },
  headerTitle: { color: '#FFD700', fontSize: 12, fontWeight: '900', textAlign: 'center' },
  roleBadge: { color: '#39FF14', fontSize: 9, fontWeight: 'bold', marginTop: 2 },
  actionBtnGroup: { flexDirection: 'row', gap: 5 },
  guideBtn: { padding: 8, backgroundColor: '#FFD700', borderRadius: 8 },
  guideBtnText: { color: '#000', fontSize: 10, fontWeight: '900' },
  refreshIconBtn: { padding: 8, backgroundColor: '#1A0B2E', borderRadius: 8, borderWidth: 1, borderColor: '#FFD700' },
  exportBtn: { padding: 8, backgroundColor: '#39FF14', borderRadius: 8 },
  exportBtnText: { color: '#000', fontSize: 10, fontWeight: '900' },
  logoutBtn: { padding: 8, backgroundColor: '#FF0055', borderRadius: 8 },
  logoutBtnText: { color: '#FFF', fontSize: 10, fontWeight: '900' },

  loginWrapper: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 10,
  },
  loginCard: {
    width: '100%',
    maxWidth: 420,
    backgroundColor: '#0D0620',
    padding: 22,
    borderRadius: 16,
    borderWidth: 2,
    borderColor: '#00FFFF',
  },
  loginIcon: {
    fontSize: 36,
    textAlign: 'center',
    marginBottom: 8,
  },
  loginTitle: {
    color: '#FFD700',
    fontSize: 15,
    fontWeight: '900',
    textAlign: 'center',
    marginBottom: 6,
  },
  loginSubtitle: {
    color: '#AAAABB',
    fontSize: 10.5,
    textAlign: 'center',
    lineHeight: 16,
    marginBottom: 16,
  },
  errorBanner: {
    backgroundColor: 'rgba(255, 0, 85, 0.15)',
    borderWidth: 1,
    borderColor: '#FF0055',
    padding: 10,
    borderRadius: 8,
    marginBottom: 12,
  },
  errorBannerText: {
    color: '#FF0055',
    fontSize: 10.5,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  loginInput: {
    backgroundColor: '#070212',
    color: '#FFF',
    borderRadius: 8,
    borderWidth: 1.5,
    borderColor: '#332255',
    padding: 11,
    fontSize: 12,
  },
  loginSubmitBtn: {
    backgroundColor: '#39FF14',
    paddingVertical: 13,
    borderRadius: 10,
    alignItems: 'center',
    marginTop: 8,
  },
  loginSubmitText: {
    color: '#000',
    fontSize: 11.5,
    fontWeight: '900',
  },
  loginHelperNote: {
    color: '#8888AA',
    fontSize: 9.5,
    textAlign: 'center',
    marginTop: 14,
    fontStyle: 'italic',
    lineHeight: 14,
  },

  managementActionRow: { flexDirection: 'row', gap: 10, marginBottom: 14 },
  newAssignmentBtn: { flex: 1, backgroundColor: '#FF007F', paddingVertical: 10, borderRadius: 8, alignItems: 'center' },
  newAssignmentBtnText: { color: '#FFF', fontSize: 10, fontWeight: '900' },
  bulkImportBtn: { flex: 1, backgroundColor: '#1A0B2E', paddingVertical: 10, borderRadius: 8, alignItems: 'center', borderWidth: 1.5, borderColor: '#39FF14' },
  bulkImportBtnText: { color: '#39FF14', fontSize: 10, fontWeight: '900' },
  
  statsRow: { flexDirection: 'row', gap: 10, marginBottom: 16 },
  statCard: { flex: 1, backgroundColor: '#0D0620', padding: 12, borderRadius: 12, borderWidth: 1, borderColor: '#221133', alignItems: 'center' },
  statLabel: { color: '#8888AA', fontSize: 8, fontWeight: 'bold', marginBottom: 4 },
  statValue: { color: '#FFF', fontSize: 16, fontWeight: '900' },

  filterSection: { marginBottom: 14 },
  filterLabel: { color: '#00FFFF', fontSize: 9, fontWeight: '900', marginBottom: 6 },
  filterScroll: { flexDirection: 'row' },
  filterChip: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20, backgroundColor: '#1A0B2E', marginRight: 8, borderWidth: 1, borderColor: '#332255' },
  filterChipActive: { backgroundColor: '#FF007F', borderColor: '#FF007F' },
  filterChipText: { color: '#AAAABB', fontSize: 10, fontWeight: 'bold' },
  filterChipTextActive: { color: '#FFF' },

  tableBox: { backgroundColor: '#0D0620', borderRadius: 14, borderWidth: 1.5, borderColor: '#00FFFF', padding: 10 },
  tableHeaderRow: { flexDirection: 'row', borderBottomWidth: 1, borderBottomColor: '#332255', paddingBottom: 8, marginBottom: 6 },
  thText: { color: '#FFD700', fontSize: 9, fontWeight: '900' },
  tableRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: '#1A0B2E' },
  studentNameText: { color: '#FFF', fontSize: 11, fontWeight: 'bold' },
  studentCodeText: { color: '#8888AA', fontSize: 9 },
  teacherNoteText: { color: '#FFD700', fontSize: 8, fontStyle: 'italic', marginTop: 2 },
  classCodeTag: { alignSelf: 'flex-start', backgroundColor: '#0B192C', borderWidth: 1, borderColor: '#00FFFF', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4, marginBottom: 2 },
  classCodeTagText: { color: '#00FFFF', fontSize: 8.5, fontWeight: '900' },
  modeText: { color: '#AAAABB', fontSize: 8 },
  scoreBadge: { fontSize: 13, fontWeight: '900' },
  statusText: { fontSize: 7, color: '#8888AA', fontWeight: 'bold' },
  
  overrideBtn: { backgroundColor: '#FF007F', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6 },
  overrideBtnText: { color: '#FFF', fontSize: 8, fontWeight: 'bold' },
  listenBtn: { backgroundColor: '#1A0B2E', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6, borderWidth: 1, borderColor: '#00FFFF' },
  listenBtnText: { color: '#00FFFF', fontSize: 8, fontWeight: '900' },
  emptyText: { color: '#8888AA', fontSize: 11, textAlign: 'center', marginVertical: 20 },

  floatingAudioPlayer: { marginTop: 15, backgroundColor: '#070212', borderRadius: 12, borderWidth: 1.5, borderColor: '#39FF14', padding: 12 },
  floatingPlayerTitle: { color: '#39FF14', fontSize: 9, fontWeight: '900' },

  modalOverlay: { flex: 1, backgroundColor: 'rgba(5, 2, 13, 0.88)', justifyContent: 'center', alignItems: 'center', padding: 16 },
  modalContent: { backgroundColor: '#0D0620', padding: 18, borderRadius: 16, borderWidth: 2, borderColor: '#FF007F', width: '100%' },
  modalTitle: { color: '#FF007F', fontSize: 13, fontWeight: '900', textAlign: 'center', marginBottom: 4 },
  modalSubtitle: { color: '#8888AA', fontSize: 10, textAlign: 'center', marginBottom: 12 },
  modalAiScore: { color: '#AAAABB', fontSize: 10, textAlign: 'center', marginBottom: 12 },
  inputGroup: { marginBottom: 10 },
  inputRowGroup: { flexDirection: 'row', gap: 10, marginBottom: 10 },
  inputLabel: { color: '#00FFFF', fontSize: 9, fontWeight: 'bold', marginBottom: 4 },
  textInput: { backgroundColor: '#1A0B2E', color: '#FFF', borderRadius: 8, borderWidth: 1, borderColor: '#332255', padding: 8, fontSize: 11 },
  smallChip: { paddingHorizontal: 10, paddingVertical: 5, borderRadius: 6, backgroundColor: '#1A0B2E', marginRight: 6, borderWidth: 1, borderColor: '#332255' },
  smallChipActive: { backgroundColor: '#39FF14', borderColor: '#39FF14' },
  smallChipText: { color: '#AAAABB', fontSize: 9, fontWeight: 'bold' },
  smallChipTextActive: { color: '#000' },
  modalBtnRow: { flexDirection: 'row', gap: 10, marginTop: 10 },
  modalCancelBtn: { flex: 1, padding: 10, borderRadius: 8, borderWidth: 1, borderColor: '#8888AA', alignItems: 'center' },
  modalCancelText: { color: '#8888AA', fontSize: 10, fontWeight: 'bold' },
  modalSaveBtn: { flex: 1, padding: 10, borderRadius: 8, backgroundColor: '#39FF14', alignItems: 'center' },
  modalSaveText: { color: '#000', fontSize: 10, fontWeight: '900' },

  guideStepBox: {
    backgroundColor: '#130628',
    padding: 12,
    borderRadius: 10,
    borderLeftWidth: 3,
    borderLeftColor: '#00FFFF',
    marginBottom: 10,
  },
  guideStepTitle: {
    color: '#FFD700',
    fontSize: 11,
    fontWeight: '900',
    marginBottom: 4,
  },
  guideStepDesc: {
    color: '#E0E0F0',
    fontSize: 10,
    lineHeight: 16,
  },
});