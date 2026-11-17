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

// 🔐 MÃ MỜI NỘI BỘ DÀNH CHO GIẢNG VIÊN
const INSTRUCTOR_INVITE_CODE = 'VIBESPEAK2026';

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
  instructor_id?: string;
}

export default function TeacherDashboardScreen({ onBack }: Props) {
  // 🔐 TRẠNG THÁI XÁC THỰC GIẢNG VIÊN (AUTH GUARD)
  const [isCheckingAuth, setIsCheckingAuth] = useState<boolean>(true);
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [authMode, setAuthMode] = useState<'LOGIN' | 'REGISTER'>('LOGIN');

  // Form Đăng nhập / Đăng ký
  const [fullNameInput, setFullNameInput] = useState<string>('');
  const [loginEmail, setLoginEmail] = useState<string>('');
  const [loginPassword, setLoginPassword] = useState<string>('');
  const [inviteCodeInput, setInviteCodeInput] = useState<string>('');
  const [isLoggingIn, setIsLoggingIn] = useState<boolean>(false);
  const [authErrorMsg, setAuthErrorMsg] = useState<string>('');
  const [authSuccessMsg, setAuthSuccessMsg] = useState<string>('');

  // Thông báo trạng thái toàn trang (dành cho Web thay thế Alert.alert)
  const [toastBanner, setToastBanner] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const [submissions, setSubmissions] = useState<SubmissionRecord[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [selectedClass, setSelectedClass] = useState<string>('ALL');
  const [searchStudentQuery, setSearchStudentQuery] = useState<string>('');
  const [classList, setClassList] = useState<ClassItem[]>([]);
  const [assignedClassCodes, setAssignedClassCodes] = useState<string[]>([]);
  const [currentPlayingAudio, setCurrentPlayingAudio] = useState<string | null>(null);

  // Quản lý Phân quyền (RBAC) & Context
  const [userRole, setUserRole] = useState<string>('INSTRUCTOR');
  const [currentInstructorId, setCurrentInstructorId] = useState<string | null>(null);
  const [currentInstructorName, setCurrentInstructorName] = useState<string>('');
  const [currentTenantId, setCurrentTenantId] = useState<string>('11111111-1111-1111-1111-111111111111');

  // 1. Modal ghi đè điểm & xem chi tiết bài làm
  const [editingItem, setEditingItem] = useState<SubmissionRecord | null>(null);
  const [overrideScoreInput, setOverrideScoreInput] = useState<string>('');
  const [teacherCommentInput, setTeacherCommentInput] = useState<string>('');
  const [isSavingScore, setIsSavingScore] = useState<boolean>(false);

  // 2. Modal tạo lớp học phần riêng của Giảng viên
  const [showCreateClassModal, setShowCreateClassModal] = useState<boolean>(false);
  const [newClassCodeInput, setNewClassCodeInput] = useState<string>('');
  const [newClassNameInput, setNewClassNameInput] = useState<string>('');
  const [isCreatingClass, setIsCreatingClass] = useState<boolean>(false);
  const [createClassError, setCreateClassError] = useState<string>('');

  // 3. Modal tạo bài tập mới (Kèm Mã lớp class_code)
  const [showCreateAssignmentModal, setShowCreateAssignmentModal] = useState<boolean>(false);
  const [assignTitle, setAssignTitle] = useState<string>('');
  const [assignPrompt, setAssignPrompt] = useState<string>('');
  const [assignDescription, setAssignDescription] = useState<string>('');
  const [assignStation, setAssignStation] = useState<string>('STATION_2');
  const [assignCefr, setAssignCefr] = useState<string>('B1');
  const [assignClassId, setAssignClassId] = useState<string>('');
  const [assignClassCodeInput, setAssignClassCodeInput] = useState<string>('');
  const [assignDeadline, setAssignDeadline] = useState<string>('2026-12-31T23:59');
  const [isSubmittingAssign, setIsSubmittingAssign] = useState<boolean>(false);
  const [createAssignError, setCreateAssignError] = useState<string>('');

  // 4. Modal Bulk Import sinh viên
  const [showImportModal, setShowImportModal] = useState<boolean>(false);
  const [importClassId, setImportClassId] = useState<string>('');
  const [importCsvText, setImportCsvText] = useState<string>('');
  const [isImporting, setIsImporting] = useState<boolean>(false);

  // 5. Modal Hướng dẫn Giảng viên
  const [showGuideModal, setShowGuideModal] = useState<boolean>(false);

  const notifyUser = (type: 'success' | 'error', text: string) => {
    setToastBanner({ type, text });
    try {
      Alert.alert(type === 'success' ? 'Thành công' : 'Thông báo', text);
    } catch {}
    setTimeout(() => {
      setToastBanner((prev) => (prev?.text === text ? null : prev));
    }, 6000);
  };

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
      setCurrentInstructorName(profile.full_name || session.user.email || 'Giảng viên');
      setUserRole(profile.role);
      if (profile.tenant_id) {
        setCurrentTenantId(profile.tenant_id);
      }

      setIsAuthenticated(true);
      await fetchDashboardData(profile.tenant_id, profile.role, session.user.id);
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
    setAuthSuccessMsg('');
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

  // 📝 XỬ LÝ ĐĂNG KÝ TÀI KHOẢN GIẢNG VIÊN MỚI
  const handleInstructorRegister = async () => {
    setAuthErrorMsg('');
    setAuthSuccessMsg('');

    if (!fullNameInput.trim() || !loginEmail.trim() || !loginPassword.trim() || !inviteCodeInput.trim()) {
      setAuthErrorMsg('Vui lòng điền đầy đủ Họ tên, Email, Mật khẩu và Mã mời Giảng viên!');
      return;
    }

    if (loginPassword.length < 6) {
      setAuthErrorMsg('Mật khẩu phải có ít nhất 6 ký tự!');
      return;
    }

    if (inviteCodeInput.trim().toUpperCase() !== INSTRUCTOR_INVITE_CODE) {
      setAuthErrorMsg('⛔ Mã mời Giảng viên không chính xác! Vui lòng liên hệ Quản trị viên bộ môn.');
      return;
    }

    setIsLoggingIn(true);
    try {
      if (!supabase) return;

      const cleanEmail = loginEmail.trim().toLowerCase();
      const cleanName = fullNameInput.trim();

      const { data, error } = await supabase.auth.signUp({
        email: cleanEmail,
        password: loginPassword,
        options: {
          data: {
            full_name: cleanName,
            role: 'INSTRUCTOR',
          },
        },
      });

      if (error) {
        const detail = error.message || (error as any).error_description || JSON.stringify(error);
        setAuthErrorMsg(`❌ Đăng ký không thành công: ${detail === '{}' ? 'Lỗi cấu trúc bảng profiles trên Supabase.' : detail}`);
        return;
      }

      if (data?.user) {
        const generatedUsername = `${cleanEmail.split('@')[0]}_${data.user.id.slice(0, 4)}`;

        const { error: profileInsertErr } = await supabase
          .from('profiles')
          .upsert([
            {
              id: data.user.id,
              username: generatedUsername,
              email: cleanEmail,
              full_name: cleanName,
              role: 'INSTRUCTOR',
              tenant_id: currentTenantId,
            },
          ], { onConflict: 'id' });

        if (profileInsertErr) {
          setAuthErrorMsg(`⚠️ Đã tạo tài khoản nhưng chưa gán được quyền trong profiles: ${profileInsertErr.message}`);
          return;
        }

        if (data.session) {
          await verifyInstructorSession();
          notifyUser('success', `✅ Đăng ký thành công tài khoản ${cleanName}!`);
        } else {
          setAuthMode('LOGIN');
          setInviteCodeInput('');
          setAuthSuccessMsg('✅ Đã tạo tài khoản Giảng viên! Vui lòng kiểm tra hộp thư Email để bấm link kích hoạt rồi đăng nhập.');
        }
      }
    } catch (err: any) {
      setAuthErrorMsg(err.message || 'Lỗi kết nối khi đăng ký tài khoản.');
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
    setClassList([]);
    setAssignedClassCodes([]);
  };

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

  // 🔒 TẢI DỮ LIỆU TÁCH BIỆT THEO TỪNG GIẢNG VIÊN (INSTRUCTOR ISOLATION)
  const fetchDashboardData = async (
    overrideTenantId?: string,
    overrideRole?: string,
    overrideInstructorId?: string
  ) => {
    setLoading(true);
    try {
      if (!supabase) {
        setLoading(false);
        return;
      }

      const activeTenantId = overrideTenantId || currentTenantId;
      const activeRole = overrideRole || userRole;
      const activeInstructorId = overrideInstructorId || currentInstructorId;

      // 1. Tải danh sách LỚP HỌC PHẦN thuộc quyền quản lý của Giảng viên hiện tại
      let classesData: any[] | null = null;
      if (activeRole !== 'SUPER_ADMIN' && activeInstructorId) {
        const resByInstructor = await supabase
          .from('classes')
          .select('id, code, name, tenant_id, instructor_id')
          .eq('instructor_id', activeInstructorId)
          .order('name', { ascending: true });

        if (!resByInstructor.error) {
          classesData = resByInstructor.data;
        } else {
          // Dự phòng nếu bảng classes chưa có cột instructor_id
          const resFallback = await supabase
            .from('classes')
            .select('id, code, name, tenant_id')
            .eq('tenant_id', activeTenantId)
            .order('name', { ascending: true });
          classesData = resFallback.data;
        }
      } else {
        const resAll = await supabase
          .from('classes')
          .select('id, code, name, tenant_id')
          .order('name', { ascending: true });
        classesData = resAll.data;
      }

      const validClasses: ClassItem[] = Array.isArray(classesData) ? classesData : [];
      setClassList((prev) => {
        // Giữ lại cả lớp vừa tạo cục bộ nếu Supabase chưa kịp đồng bộ
        const merged = [...validClasses];
        prev.forEach((p) => {
          if (p.id.startsWith('local_') && !merged.some((m) => m.code === p.code)) {
            merged.push(p);
          }
        });
        return merged;
      });

      if (validClasses.length > 0) {
        setAssignClassId(validClasses[0].id);
        setAssignClassCodeInput(validClasses[0].code || '');
        setImportClassId(validClasses[0].id);
      }

      // 2. Tải danh sách BÀI TẬP (assignments) do chính Giảng viên này phát hành để đồng bộ mã lớp
      let assignQuery = supabase.from('assignments').select('class_code, created_by');
      if (activeRole !== 'SUPER_ADMIN' && activeInstructorId) {
        assignQuery = assignQuery.eq('created_by', activeInstructorId);
      }
      const { data: assignData } = await assignQuery;
      const instructorAssignCodes = (assignData || [])
        .map((a: any) => (a.class_code || '').toUpperCase().trim())
        .filter((c: string) => Boolean(c) && c !== 'PUBLIC');
      setAssignedClassCodes(Array.from(new Set(instructorAssignCodes)));

      // Tập hợp toàn bộ Mã lớp thuộc quyền Giảng viên hiện tại
      const ownedCodesSet = new Set<string>([
        ...validClasses.map((c) => (c.code || '').toUpperCase().trim()).filter(Boolean),
        ...instructorAssignCodes,
      ]);

      // 3. Lấy danh sách bài nộp (Submissions) và lọc chặt theo các lớp của Giảng viên
      const { data: subData, error: subErr } = await supabase
        .from('submissions')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(300);

      if (subErr) {
        console.warn("Lỗi tải submissions:", subErr.message);
      } else if (subData) {
        const allSubs = subData as SubmissionRecord[];
        if (activeRole === 'SUPER_ADMIN') {
          setSubmissions(allSubs);
        } else if (ownedCodesSet.size === 0) {
          setSubmissions([]);
        } else {
          const myClassSubs = allSubs.filter((s) => ownedCodesSet.has(extractSubmissionClassCode(s)));
          setSubmissions(myClassSubs);
        }
      }
    } catch (err) {
      console.error("Lỗi khi kết nối lấy dữ liệu Dashboard:", err);
    } finally {
      setLoading(false);
    }
  };

  // Danh sách các Mã lớp thuộc quyền Giảng viên để hiện trên thanh lọc
  const availableFilterCodes = useMemo(() => {
    const codeSet = new Set<string>();
    classList.forEach(c => {
      if (c.code) codeSet.add(c.code.toUpperCase().trim());
    });
    assignedClassCodes.forEach(c => {
      if (c) codeSet.add(c.toUpperCase().trim());
    });
    submissions.forEach(s => {
      const code = extractSubmissionClassCode(s);
      if (code && code !== 'PUBLIC') codeSet.add(code);
    });
    return Array.from(codeSet);
  }, [classList, assignedClassCodes, submissions]);

  // Lọc theo Mã lớp + Tìm kiếm theo Tên / MSSV
  const filteredSubmissions = useMemo(() => {
    const q = searchStudentQuery.trim().toLowerCase();
    return submissions.filter(s => {
      const matchClass = selectedClass === 'ALL' || extractSubmissionClassCode(s) === selectedClass;
      if (!matchClass) return false;
      if (!q) return true;
      const nameMatch = (s.student_name || '').toLowerCase().includes(q);
      const codeMatch = (s.student_code || '').toLowerCase().includes(q);
      return nameMatch || codeMatch;
    });
  }, [submissions, selectedClass, searchStudentQuery]);

  // Thống kê theo lớp đang chọn
  const totalSubmissions = filteredSubmissions.length;
  const getFinalScore = (s: SubmissionRecord) => (s.manual_score !== null && s.manual_score !== undefined) ? Number(s.manual_score) : Number(s.score);

  const avgScore = totalSubmissions > 0
    ? Math.round(filteredSubmissions.reduce((acc, curr) => acc + getFinalScore(curr), 0) / totalSubmissions)
    : 0;

  const passRate = totalSubmissions > 0
    ? Math.round((filteredSubmissions.filter(s => getFinalScore(s) >= 70).length / totalSubmissions) * 100)
    : 0;

  // 🏫 TẠO LỚP HỌC PHẦN RIÊNG CỦA GIẢNG VIÊN (CÓ FALLBACK & THÔNG BÁO TRỰC QUAN TRÊN WEB)
  const handleCreateClass = async () => {
    setCreateClassError('');
    const cleanCode = newClassCodeInput.toUpperCase().trim().replace(/\s+/g, '_');
    const cleanName = newClassNameInput.trim();

    if (!cleanCode || !cleanName) {
      setCreateClassError('⚠️ Vui lòng nhập đầy đủ Mã lớp (VD: TCCNTT) và Tên lớp học phần!');
      return;
    }

    if (cleanCode === 'PUBLIC') {
      setCreateClassError('⚠️ Vui lòng đặt mã lớp riêng thay vì PUBLIC.');
      return;
    }

    setIsCreatingClass(true);
    try {
      if (!supabase) {
        setCreateClassError('❌ Lỗi kết nối máy chủ Supabase.');
        return;
      }

      // Lần 1: Thử lưu đầy đủ kèm instructor_id
      let { data, error } = await supabase
        .from('classes')
        .insert([{
          code: cleanCode,
          name: cleanName,
          tenant_id: currentTenantId,
          instructor_id: currentInstructorId,
        }])
        .select('id, code, name, tenant_id')
        .single();

      // Lần 2 (Dự phòng): Nếu bảng classes chưa có cột instructor_id
      if (error && error.message?.includes('instructor_id')) {
        const retryWithoutInstructor = await supabase
          .from('classes')
          .insert([{
            code: cleanCode,
            name: cleanName,
            tenant_id: currentTenantId,
          }])
          .select('id, code, name, tenant_id')
          .single();
        data = retryWithoutInstructor.data;
        error = retryWithoutInstructor.error;
      }

      // Lần 3 (Dự phòng): Nếu bảng classes chỉ có cột code & name (không có tenant_id hoặc lỗi FK)
      if (error && (error.message?.includes('tenant_id') || error.message?.includes('foreign key'))) {
        const retryMinimal = await supabase
          .from('classes')
          .insert([{
            code: cleanCode,
            name: cleanName,
          }])
          .select('id, code, name')
          .single();
        data = retryMinimal.data as any;
        error = retryMinimal.error;
      }

      if (error) {
        setCreateClassError(`❌ Supabase từ chối lưu lớp: ${error.message}`);
        return;
      }

      const createdItem: ClassItem = data || {
        id: `local_${Date.now()}`,
        code: cleanCode,
        name: cleanName,
        tenant_id: currentTenantId,
        instructor_id: currentInstructorId || undefined,
      };

      setClassList((prev) => [createdItem, ...prev.filter((c) => c.code !== cleanCode)]);
      setAssignClassId(createdItem.id);
      setAssignClassCodeInput(cleanCode);
      setSelectedClass(cleanCode);

      setShowCreateClassModal(false);
      setNewClassCodeInput('');
      setNewClassNameInput('');
      setCreateClassError('');

      notifyUser(
        'success',
        `✅ Đã tạo lớp "${cleanName}" với Mã lớp [${cleanCode}]. Sinh viên nhập mã [${cleanCode}] sẽ tự động nộp bài vào bảng điểm này!`
      );

      await fetchDashboardData();
    } catch (err: any) {
      setCreateClassError(`❌ Lỗi hệ thống: ${err.message || 'Không thể tạo lớp mới.'}`);
    } finally {
      setIsCreatingClass(false);
    }
  };

  const handleOpenOverrideModal = (item: SubmissionRecord) => {
    setEditingItem(item);
    setOverrideScoreInput(item.manual_score !== null ? String(item.manual_score) : String(item.score));
    setTeacherCommentInput(item.teacher_feedback || '');
  };

  const handleSaveOverride = async () => {
    if (!editingItem) return;
    const parsedScore = parseFloat(overrideScoreInput);
    if (isNaN(parsedScore) || parsedScore < 0 || parsedScore > 100) {
      notifyUser('error', 'Điểm số phải từ 0 đến 100!');
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
          notifyUser('error', `Lỗi cập nhật: ${error.message}`);
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
          notifyUser('success', '✅ Đã cập nhật điểm và nhận xét của Giảng viên!');
        }
      }
    } catch (e: any) {
      notifyUser('error', e.message || 'Không thể lưu điểm');
    } finally {
      setIsSavingScore(false);
    }
  };

  // 📝 GIAO BÀI TẬP MỚI (GẮN VỚI LỚP CỦA GIẢNG VIÊN)
  const handleCreateAssignment = async () => {
    setCreateAssignError('');
    if (!assignTitle.trim() || !assignPrompt.trim()) {
      setCreateAssignError('⚠️ Vui lòng nhập đầy đủ tiêu đề và nội dung câu mẫu/đề bài!');
      return;
    }

    const normalizedClassCode = (assignClassCodeInput || '').toUpperCase().trim().replace(/\s+/g, '_');
    if (!normalizedClassCode || normalizedClassCode === 'PUBLIC') {
      setCreateAssignError('⚠️ Vui lòng chọn lớp học phần hoặc nhập Mã lớp riêng (VD: TCCNTT)!');
      return;
    }

    const parsedDate = new Date(assignDeadline);
    if (isNaN(parsedDate.getTime())) {
      setCreateAssignError('⚠️ Hạn chót phải theo định dạng YYYY-MM-DDTHH:mm (Ví dụ: 2026-12-31T23:59).');
      return;
    }

    setIsSubmittingAssign(true);
    try {
      if (supabase) {
        const selectedClassObj = classList.find(c => c.code?.toUpperCase() === normalizedClassCode || c.id === assignClassId);
        const validClassId = selectedClassObj && !selectedClassObj.id.startsWith('local_') ? selectedClassObj.id : null;

        const { error } = await supabase.from('assignments').insert([{
          tenant_id: selectedClassObj?.tenant_id || currentTenantId,
          class_id: validClassId,
          class_code: normalizedClassCode,
          created_by: currentInstructorId,
          title: assignTitle.trim(),
          description: assignDescription.trim() || `Bài tập giao cho lớp ${normalizedClassCode}`,
          station_type: assignStation,
          target_prompt: assignPrompt.trim(),
          cefr_level: assignCefr.toUpperCase().trim(),
          deadline_at: parsedDate.toISOString(),
          status: 'PUBLISHED'
        }]);

        if (error) {
          setCreateAssignError(`❌ Lỗi phát hành đề: ${error.message}`);
        } else {
          setShowCreateAssignmentModal(false);
          setAssignTitle('');
          setAssignPrompt('');
          setAssignDescription('');
          setCreateAssignError('');
          setSelectedClass(normalizedClassCode);
          await fetchDashboardData();
          notifyUser(
            'success',
            `✅ Đã phát hành đề "${assignTitle}" cho mã lớp [${normalizedClassCode}]. Sinh viên chỉ cần nhập mã lớp này để nhận bài!`
          );
        }
      }
    } catch (err: any) {
      setCreateAssignError(`❌ Lỗi hệ thống: ${err.message || 'Không thể tạo bài tập.'}`);
    } finally {
      setIsSubmittingAssign(false);
    }
  };

  // 👥 BULK IMPORT SINH VIÊN BẰNG FILE CSV
  const handleBulkImportStudents = async () => {
    if (!importCsvText.trim()) {
      notifyUser('error', 'Vui lòng nhập hoặc dán nội dung CSV danh sách sinh viên!');
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
            class_id: importClassId && !importClassId.startsWith('local_') ? importClassId : null,
            student_id: studentCode,
            full_name: fullName,
            email: email,
            role: 'STUDENT'
          });
        }
      }

      if (studentsToInsert.length === 0) {
        notifyUser('error', 'Không tìm thấy dữ liệu sinh viên hợp lệ trong nội dung CSV!');
        setIsImporting(false);
        return;
      }

      if (supabase) {
        const { error } = await supabase.from('profiles').upsert(studentsToInsert, { onConflict: 'id' });
        if (error) {
          notifyUser('error', `Lỗi đồng bộ hồ sơ: ${error.message}`);
        } else {
          notifyUser('success', `✅ Đã nhập và cấp quyền thành công cho ${studentsToInsert.length} sinh viên vào lớp!`);
          setShowImportModal(false);
          setImportCsvText('');
        }
      }
    } catch (err: any) {
      notifyUser('error', err.message || 'Quá trình nhập danh sách gặp lỗi.');
    } finally {
      setIsImporting(false);
    }
  };

  const handleDownloadSampleCsv = () => {
    const sample = "MSSV,HoVaTen,Email\nSV2026001,Nguyen Van An,an.nv@student.vibespeak.edu.vn\nSV2026002,Tran Thi Mai,mai.tt@student.vibespeak.edu.vn\nSV2026003,Le Hoang Nam,nam.lh@student.vibespeak.edu.vn";
    setImportCsvText(sample);
  };

  // Xuất file CSV báo cáo điểm
  const handleExportCSV = () => {
    if (filteredSubmissions.length === 0) {
      notifyUser('error', 'Không có dữ liệu bài nộp để xuất!');
      return;
    }

    const headers = [
      "MSSV", "Ho va Ten", "Ma Lop", "Chi Tiet Tram",
      "Diem AI", "Diem Giang Vien", "Diem Chot",
      "Ban Ghi Am (Transcript)", "Phan Tich Chi Tiet AI", "Nhan Xet Giang Vien",
      "Cap Do", "Ky Nang", "Thoi Gian"
    ];
    const rows = filteredSubmissions.map(s => {
      const finalScore = getFinalScore(s);
      const code = extractSubmissionClassCode(s);
      return [
        `"${s.student_code || 'GUEST'}"`,
        `"${(s.student_name || 'N/A').replace(/"/g, '""')}"`,
        `"${code}"`,
        `"${(s.class_name || 'Lop Chung').replace(/"/g, '""')}"`,
        s.score,
        s.manual_score !== null ? s.manual_score : 'Chua sua',
        finalScore,
        `"${(s.transcript || '').replace(/"/g, '""')}"`,
        `"${(s.feedback || '').replace(/"/g, '""')}"`,
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
    }
  };

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

        <ScrollView contentContainerStyle={styles.loginWrapper}>
          <View style={styles.loginCard}>
            <Text style={styles.loginIcon}>🏫</Text>
            <Text style={styles.loginTitle}>CỔNG QUẢN TRỊ GIẢNG VIÊN</Text>
            <Text style={styles.loginSubtitle}>
              Khu vực dành riêng cho Giảng viên & Cán bộ đào tạo.
            </Text>

            <View style={styles.authTabRow}>
              <TouchableOpacity
                style={[styles.authTabBtn, authMode === 'LOGIN' && styles.authTabBtnActive]}
                onPress={() => {
                  setAuthMode('LOGIN');
                  setAuthErrorMsg('');
                  setAuthSuccessMsg('');
                }}
              >
                <Text style={[styles.authTabText, authMode === 'LOGIN' && styles.authTabTextActive]}>
                  🔑 ĐĂNG NHẬP
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.authTabBtn, authMode === 'REGISTER' && styles.authTabBtnRegisterActive]}
                onPress={() => {
                  setAuthMode('REGISTER');
                  setAuthErrorMsg('');
                  setAuthSuccessMsg('');
                }}
              >
                <Text style={[styles.authTabText, authMode === 'REGISTER' && styles.authTabTextActive]}>
                  📝 ĐĂNG KÝ GIẢNG VIÊN
                </Text>
              </TouchableOpacity>
            </View>

            {authErrorMsg ? (
              <View style={styles.errorBanner}>
                <Text style={styles.errorBannerText}>{authErrorMsg}</Text>
              </View>
            ) : null}

            {authSuccessMsg ? (
              <View style={styles.successBanner}>
                <Text style={styles.successBannerText}>{authSuccessMsg}</Text>
              </View>
            ) : null}

            {authMode === 'REGISTER' && (
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Họ và tên Giảng viên (*):</Text>
                <TextInput
                  style={styles.loginInput}
                  placeholder="Ví dụ: Cô Nguyễn Thị Lan"
                  placeholderTextColor="#666688"
                  value={fullNameInput}
                  onChangeText={setFullNameInput}
                />
              </View>
            )}

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Email Giảng viên (*):</Text>
              <TextInput
                style={styles.loginInput}
                placeholder="vi-du: lan.gv@truong.edu.vn"
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
                placeholder={authMode === 'REGISTER' ? 'Tạo mật khẩu (tối thiểu 6 ký tự)...' : 'Nhập mật khẩu đăng nhập...'}
                placeholderTextColor="#666688"
                secureTextEntry
                value={loginPassword}
                onChangeText={setLoginPassword}
              />
            </View>

            {authMode === 'REGISTER' && (
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Mã mời Giảng viên nội bộ (*):</Text>
                <TextInput
                  style={[styles.loginInput, { borderColor: '#FFD700' }]}
                  placeholder="Nhập mã mời của bộ môn..."
                  placeholderTextColor="#666688"
                  autoCapitalize="characters"
                  value={inviteCodeInput}
                  onChangeText={setInviteCodeInput}
                />
              </View>
            )}

            <TouchableOpacity
              style={[
                styles.loginSubmitBtn,
                authMode === 'REGISTER' && { backgroundColor: '#00FFFF' },
                isLoggingIn && { opacity: 0.6 },
              ]}
              onPress={authMode === 'LOGIN' ? handleInstructorLogin : handleInstructorRegister}
              disabled={isLoggingIn}
            >
              {isLoggingIn ? (
                <ActivityIndicator size="small" color="#000" />
              ) : (
                <Text style={styles.loginSubmitText}>
                  {authMode === 'LOGIN'
                    ? '🔓 ĐĂNG NHẬP VÀO CỔNG QUẢN LÝ'
                    : '🚀 HOÀN TẤT ĐĂNG KÝ GIẢNG VIÊN'}
                </Text>
              )}
            </TouchableOpacity>

            <Text style={styles.loginHelperNote}>
              {authMode === 'LOGIN'
                ? '💡 Giảng viên mới? Chọn tab "📝 ĐĂNG KÝ GIẢNG VIÊN" phía trên để tự tạo tài khoản bằng Mã mời.'
                : '🔒 Mã mời giúp bảo vệ quyền quản trị lớp học, tránh sinh viên đăng ký nhầm vai trò.'}
            </Text>
          </View>
        </ScrollView>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Top Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={onBack} style={styles.backBtn}>
          <Text style={styles.backBtnText}>🔙 BẢN ĐỒ</Text>
        </TouchableOpacity>
        <View style={{ flex: 1, alignItems: 'center' }}>
          <Text style={styles.headerTitle}>🏫 CỔNG QUẢN LÝ GIẢNG VIÊN</Text>
          <Text style={styles.roleBadge}>
            👤 {currentInstructorName} ({userRole})
          </Text>
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

      {/* Banner thông báo trực quan trên Web */}
      {toastBanner && (
        <View style={toastBanner.type === 'success' ? styles.successBanner : styles.errorBanner}>
          <Text style={toastBanner.type === 'success' ? styles.successBannerText : styles.errorBannerText}>
            {toastBanner.text}
          </Text>
        </View>
      )}

      <ScrollView contentContainerStyle={{ paddingBottom: 40 }}>
        {/* NÚT TÁC VỤ SƯ PHẠM: TẠO LỚP + GIAO BÀI + IMPORT */}
        <View style={styles.managementActionRow}>
          <TouchableOpacity 
            style={styles.createClassBtn}
            onPress={() => {
              setCreateClassError('');
              setShowCreateClassModal(true);
            }}
          >
            <Text style={styles.createClassBtnText}>🏫 TẠO LỚP MỚI</Text>
          </TouchableOpacity>
          <TouchableOpacity 
            style={styles.newAssignmentBtn}
            onPress={() => {
              setCreateAssignError('');
              if (!assignClassCodeInput && availableFilterCodes.length > 0) {
                setAssignClassCodeInput(availableFilterCodes[0]);
              }
              setShowCreateAssignmentModal(true);
            }}
          >
            <Text style={styles.newAssignmentBtnText}>➕ GIAO BÀI TẬP</Text>
          </TouchableOpacity>
          <TouchableOpacity 
            style={styles.bulkImportBtn}
            onPress={() => setShowImportModal(true)}
          >
            <Text style={styles.bulkImportBtnText}>👥 IMPORT SV</Text>
          </TouchableOpacity>
        </View>

        {/* Cảnh báo nếu Giảng viên mới chưa có lớp học phần */}
        {availableFilterCodes.length === 0 && !loading && (
          <View style={styles.emptyClassBanner}>
            <Text style={styles.emptyClassBannerTitle}>👋 Chào mừng {currentInstructorName}!</Text>
            <Text style={styles.emptyClassBannerDesc}>
              Bạn chưa tạo lớp học phần nào. Hãy bấm nút <Text style={{ color: '#00FFFF', fontWeight: 'bold' }}>🏫 TẠO LỚP MỚI</Text> (ví dụ: TCCNTT) để hệ thống tách biệt hoàn toàn dữ liệu bài nộp và điểm số của lớp bạn dạy!
            </Text>
          </View>
        )}

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

        {/* Thanh lọc theo Mã lớp của Giảng viên & Tìm kiếm sinh viên */}
        <View style={styles.filterSection}>
          <Text style={styles.filterLabel}>📌 CÁC LỚP HỌC PHẦN CỦA BẠN ({availableFilterCodes.length} LỚP):</Text>
          <TextInput
            style={styles.searchInput}
            placeholder="🔍 Gõ tên hoặc MSSV sinh viên để lọc nhanh..."
            placeholderTextColor="#666688"
            value={searchStudentQuery}
            onChangeText={setSearchStudentQuery}
          />
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filterScroll}>
            <TouchableOpacity 
              style={[styles.filterChip, selectedClass === 'ALL' && styles.filterChipActive]}
              onPress={() => setSelectedClass('ALL')}
            >
              <Text style={[styles.filterChipText, selectedClass === 'ALL' && styles.filterChipTextActive]}>
                Tất Cả Lớp Của Tôi ({submissions.length})
              </Text>
            </TouchableOpacity>
            {availableFilterCodes.map((code) => {
              const clsObj = classList.find(c => c.code?.toUpperCase() === code);
              const countInClass = submissions.filter(s => extractSubmissionClassCode(s) === code).length;
              return (
                <TouchableOpacity 
                  key={code} 
                  style={[styles.filterChip, selectedClass === code && styles.filterChipActive]}
                  onPress={() => setSelectedClass(code)}
                >
                  <Text style={[styles.filterChipText, selectedClass === code && styles.filterChipTextActive]}>
                    🏫 {code}{clsObj?.name ? ` (${clsObj.name})` : ''} • {countInClass} bài
                  </Text>
                </TouchableOpacity>
              );
            })}
          </ScrollView>
        </View>

        {/* Danh sách bảng điểm sinh viên */}
        <View style={styles.tableBox}>
          <View style={styles.tableHeaderRow}>
            <Text style={[styles.thText, { flex: 1.3 }]}>SINH VIÊN / BÀI NÓI</Text>
            <Text style={[styles.thText, { flex: 1 }]}>MÃ LỚP / TRẠM</Text>
            <Text style={[styles.thText, { flex: 0.85, textAlign: 'center' }]}>ĐIỂM CHỐT</Text>
            <Text style={[styles.thText, { flex: 1.15, textAlign: 'right' }]}>THAO TÁC</Text>
          </View>

          {loading ? (
            <ActivityIndicator size="large" color="#00FFFF" style={{ marginVertical: 30 }} />
          ) : filteredSubmissions.length === 0 ? (
            <Text style={styles.emptyText}>
              {availableFilterCodes.length === 0
                ? 'Bạn chưa có lớp học phần nào. Hãy bấm "🏫 TẠO LỚP MỚI" để bắt đầu!'
                : `Chưa có sinh viên nào nộp bài vào lớp "${selectedClass === 'ALL' ? 'của bạn' : selectedClass}".`}
            </Text>
          ) : (
            filteredSubmissions.map((item) => {
              const finalScore = getFinalScore(item);
              const isPass = finalScore >= 70;
              const hasOverride = item.manual_score !== null && item.manual_score !== undefined;
              const rowClassCode = extractSubmissionClassCode(item);

              return (
                <View key={item.id} style={styles.tableRow}>
                  <View style={{ flex: 1.3, paddingRight: 6 }}>
                    <Text style={styles.studentNameText} numberOfLines={1}>
                      {item.student_name || 'Học viên VipeSpeak'}
                    </Text>
                    <Text style={styles.studentCodeText}>
                      MSSV: {item.student_code || 'GUEST'}
                    </Text>
                    {item.transcript ? (
                      <Text style={styles.transcriptPreviewText} numberOfLines={2}>
                        🗣️ "{item.transcript}"
                      </Text>
                    ) : null}
                    {item.teacher_feedback ? (
                      <Text style={styles.teacherNoteText} numberOfLines={2}>
                        💬 GV: {item.teacher_feedback}
                      </Text>
                    ) : null}
                  </View>

                  <View style={{ flex: 1 }}>
                    <View style={styles.classCodeTag}>
                      <Text style={styles.classCodeTagText}>{rowClassCode}</Text>
                    </View>
                    <Text style={styles.modeText} numberOfLines={1}>{item.mode || 'STATION_1'} • {item.cefr_level || 'B1'}</Text>
                    {item.feedback ? (
                      <Text style={styles.aiMetricMiniText} numberOfLines={2}>
                        {item.feedback}
                      </Text>
                    ) : null}
                  </View>

                  <View style={{ flex: 0.85, alignItems: 'center' }}>
                    <Text style={[styles.scoreBadge, { color: isPass ? '#39FF14' : '#FF0055' }]}>
                      {finalScore}đ
                    </Text>
                    <Text style={styles.statusText}>
                      {hasOverride ? '✍️ ĐÃ CHẤM LẠI' : '🤖 AI CHẤM'}
                    </Text>
                  </View>

                  <View style={{ flex: 1.15, alignItems: 'flex-end', justifyContent: 'center', gap: 4 }}>
                    <TouchableOpacity 
                      style={styles.overrideBtn}
                      onPress={() => handleOpenOverrideModal(item)}
                    >
                      <Text style={styles.overrideBtnText}>📄 CHI TIẾT / ĐIỂM</Text>
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
      {/* KHUNG NỔI 0: TẠO LỚP HỌC PHẦN MỚI CỦA GIẢNG VIÊN (CHỐNG KẸT MODAL WEB) */}
      {/* ========================================================================= */}
      {showCreateClassModal && (
        <View style={[styles.modalOverlay, { position: 'fixed' as any, top: 0, left: 0, right: 0, bottom: 0, zIndex: 9999 }]}>
          <View style={[styles.modalContent, { maxWidth: 460, borderColor: '#00FFFF' }]}>
            <Text style={[styles.modalTitle, { color: '#00FFFF' }]}>🏫 TẠO LỚP HỌC PHẦN CỦA BẠN</Text>
            <Text style={styles.modalSubtitle}>
              Mỗi lớp có một Mã lớp duy nhất. Sinh viên nhập mã này sẽ tự động nộp bài vào đúng bảng điểm của bạn.
            </Text>

            {createClassError ? (
              <View style={styles.errorBanner}>
                <Text style={styles.errorBannerText}>{createClassError}</Text>
              </View>
            ) : null}

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Mã lớp học phần (* - Viết liền, không dấu):</Text>
              <TextInput
                style={[styles.textInput, { borderColor: '#00FFFF', fontWeight: 'bold' }]}
                value={newClassCodeInput}
                onChangeText={(val) => setNewClassCodeInput(val.toUpperCase())}
                autoCapitalize="characters"
                placeholder="Ví dụ: TCCNTT hoặc ENG101_N01"
                placeholderTextColor="#666"
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Tên lớp học phần (*):</Text>
              <TextInput
                style={styles.textInput}
                value={newClassNameInput}
                onChangeText={setNewClassNameInput}
                placeholder="Ví dụ: Lớp tiếng Anh CNTT"
                placeholderTextColor="#666"
              />
            </View>

            <View style={styles.modalBtnRow}>
              <TouchableOpacity
                style={styles.modalCancelBtn}
                onPress={() => {
                  setCreateClassError('');
                  setShowCreateClassModal(false);
                }}
                disabled={isCreatingClass}
              >
                <Text style={styles.modalCancelText}>HỦY BỎ</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalSaveBtn, { backgroundColor: '#00FFFF' }]}
                onPress={handleCreateClass}
                disabled={isCreatingClass}
              >
                {isCreatingClass ? (
                  <ActivityIndicator size="small" color="#000" />
                ) : (
                  <Text style={styles.modalSaveText}>TẠO LỚP NGAY</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      )}

      {/* ========================================================================= */}
      {/* KHUNG NỔI 1: TẠO BÀI TẬP MỚI (CHỐNG KẸT MODAL WEB) */}
      {/* ========================================================================= */}
      {showCreateAssignmentModal && (
        <View style={[styles.modalOverlay, { position: 'fixed' as any, top: 0, left: 0, right: 0, bottom: 0, zIndex: 9999 }]}>
          <View style={[styles.modalContent, { maxWidth: 500, maxHeight: '92%' }]}>
            <Text style={styles.modalTitle}>📝 GIAO BÀI TẬP THEO MÃ LỚP</Text>

            {createAssignError ? (
              <View style={styles.errorBanner}>
                <Text style={styles.errorBannerText}>{createAssignError}</Text>
              </View>
            ) : null}

            <ScrollView style={{ width: '100%' }} showsVerticalScrollIndicator={false}>
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Chọn lớp của bạn (hoặc gõ mã lớp mới bên dưới):</Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ flexDirection: 'row', marginBottom: 6 }}>
                  {classList.map(c => (
                    <TouchableOpacity
                      key={c.id}
                      style={[styles.smallChip, assignClassCodeInput === c.code && styles.smallChipActive]}
                      onPress={() => {
                        setAssignClassId(c.id);
                        setAssignClassCodeInput(c.code || '');
                      }}
                    >
                      <Text style={[styles.smallChipText, assignClassCodeInput === c.code && styles.smallChipTextActive]}>
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
                  placeholder="Ví dụ: TCCNTT"
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
                  placeholder="Ví dụ: [SOLO] Discussing the impact of AI on software development"
                  placeholderTextColor="#666"
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Mô tả bối cảnh tiếng Việt (Gợi ý cho sinh viên):</Text>
                <TextInput 
                  style={styles.textInput}
                  value={assignDescription}
                  onChangeText={setAssignDescription}
                  placeholder="Ví dụ: Bạn trình bày quan điểm cá nhân về ứng dụng công nghệ AI..."
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
                  placeholder="Ví dụ: Artificial intelligence significantly accelerates software development..."
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
            </ScrollView>

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
      )}

      {/* ========================================================================= */}
      {/* MODAL 2: BULK IMPORT SINH VIÊN QUA FILE CSV / EXCEL */}
      {/* ========================================================================= */}
      <Modal visible={showImportModal} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { maxWidth: 520 }]}>
            <Text style={styles.modalTitle}>👥 NHẬP DANH SÁCH SINH VIÊN VÀO LỚP</Text>
            <Text style={styles.modalSubtitle}>Định dạng: MSSV, Họ và Tên, Email (Mỗi sinh viên một dòng)</Text>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Chọn lớp học của bạn để xếp sinh viên:</Text>
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
      {/* MODAL 3: XEM CHI TIẾT BÀI NÓI & GHI ĐÈ ĐIỂM GIẢNG VIÊN */}
      {/* ========================================================================= */}
      <Modal visible={editingItem !== null} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { maxWidth: 520, maxHeight: '88%' }]}>
            <Text style={styles.modalTitle}>✍️ THẨM ĐỊNH & ĐIỀU CHỈNH ĐIỂM</Text>
            <Text style={styles.modalSubtitle}>
              Sinh viên: {editingItem?.student_name} ({editingItem?.student_code}) • {editingItem?.cefr_level}
            </Text>

            <ScrollView style={{ width: '100%' }} showsVerticalScrollIndicator={false}>
              <View style={styles.detailAuditBox}>
                <Text style={styles.detailAuditHeader}>🗣️ Bản ghi âm nguyên văn AI nhận diện:</Text>
                <Text style={styles.detailAuditTranscript}>
                  "{editingItem?.transcript || '(Không có dữ liệu văn bản)'}"
                </Text>

                {editingItem?.feedback ? (
                  <>
                    <Text style={[styles.detailAuditHeader, { color: '#FFD700', marginTop: 8 }]}>
                      📊 Chi tiết điểm & Lỗi AI phát hiện:
                    </Text>
                    <Text style={styles.detailAuditFeedback}>{editingItem.feedback}</Text>
                  </>
                ) : null}

                {editingItem?.audio_url ? (
                  <View style={{ marginTop: 8 }}>
                    {React.createElement('audio', {
                      controls: true,
                      src: editingItem.audio_url,
                      style: { width: '100%', height: 34 }
                    })}
                  </View>
                ) : null}
              </View>

              <Text style={styles.modalAiScore}>
                Điểm AI chấm tự động: <Text style={{ color: '#00FFFF', fontWeight: 'bold' }}>{editingItem?.score}đ</Text>
              </Text>

              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Điểm số chốt của Giảng viên (0 - 100):</Text>
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
                  style={[styles.textInput, { height: 70, textAlignVertical: 'top' }]}
                  multiline
                  value={teacherCommentInput}
                  onChangeText={setTeacherCommentInput}
                  placeholder="Nhập lưu ý, sửa lỗi phát âm hoặc lời khen..."
                  placeholderTextColor="#666"
                />
              </View>
            </ScrollView>

            <View style={styles.modalBtnRow}>
              <TouchableOpacity 
                style={styles.modalCancelBtn} 
                onPress={() => setEditingItem(null)}
                disabled={isSavingScore}
              >
                <Text style={styles.modalCancelText}>ĐÓNG</Text>
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
      {/* MODAL 4: HƯỚNG DẪN SỬ DỤNG DÀNH CHO GIẢNG VIÊN */}
      {/* ========================================================================= */}
      <Modal visible={showGuideModal} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { maxWidth: 540, maxHeight: '85%' }]}>
            <Text style={styles.modalTitle}>📖 HƯỚNG DẪN VẬN HÀNH CỔNG GIẢNG VIÊN</Text>
            <Text style={styles.modalSubtitle}>Quy trình 4 bước tạo lớp, giao bài và chốt điểm riêng biệt</Text>

            <ScrollView style={{ width: '100%', marginVertical: 8 }} showsVerticalScrollIndicator={false}>
              <View style={styles.guideStepBox}>
                <Text style={styles.guideStepTitle}>1️⃣ Tạo Lớp Học Phần Riêng (Tách Biệt Dữ Liệu)</Text>
                <Text style={styles.guideStepDesc}>
                  • Bấm <Text style={{ color: '#00FFFF', fontWeight: 'bold' }}>🏫 TẠO LỚP MỚI</Text> để tạo lớp học phần của riêng bạn (ví dụ: <Text style={{ color: '#FFD700' }}>TCCNTT</Text>).{'\n'}
                  • Hệ thống gắn chặt lớp này với tài khoản của bạn — chỉ bạn mới thấy danh sách bài nộp và điểm số của sinh viên thuộc lớp mình dạy.
                </Text>
              </View>

              <View style={styles.guideStepBox}>
                <Text style={styles.guideStepTitle}>2️⃣ Giao Bài Tập Theo Mã Lớp</Text>
                <Text style={styles.guideStepDesc}>
                  • Bấm <Text style={{ color: '#FF007F', fontWeight: 'bold' }}>➕ GIAO BÀI TẬP</Text>, chọn lớp vừa tạo, chọn Trạm luyện tập, nhập đề bài tiếng Anh và bấm <Text style={{ color: '#39FF14', fontWeight: 'bold' }}>PHÁT HÀNH ĐỀ</Text>.
                </Text>
              </View>

              <View style={styles.guideStepBox}>
                <Text style={styles.guideStepTitle}>3️⃣ Sinh Viên Nhập Mã Lớp Khi Làm Bài</Text>
                <Text style={styles.guideStepDesc}>
                  • Sinh viên vào Trạm 2 hoặc Trạm 4, bấm <Text style={{ color: '#FFD700', fontWeight: 'bold' }}>✏️ Nhập Mã Lớp / Tên</Text> ở thanh trên cùng và nhập đúng <Text style={{ color: '#00FFFF', fontWeight: 'bold' }}>Mã lớp</Text> bạn cấp.{'\n'}
                  • Mọi bài nộp của sinh viên có mã lớp này sẽ tự động chảy thẳng về bảng điểm của bạn.
                </Text>
              </View>

              <View style={styles.guideStepBox}>
                <Text style={styles.guideStepTitle}>4️⃣ Thẩm Định Ghi Âm & Xuất Excel Từng Lớp</Text>
                <Text style={styles.guideStepDesc}>
                  • Chọn thẻ <Text style={{ color: '#00FFFF', fontWeight: 'bold' }}>🏫 [Mã Lớp]</Text> trên thanh lọc, bấm <Text style={{ color: '#FF007F', fontWeight: 'bold' }}>📄 CHI TIẾT / ĐIỂM</Text> để xem nguyên văn bài nói, lỗi AI bắt được, nghe lại audio và bấm <Text style={{ color: '#39FF14', fontWeight: 'bold' }}>📥 EXCEL</Text> để xuất bảng điểm lớp.
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
    flexGrow: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingBottom: 20,
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
  loginIcon: { fontSize: 34, textAlign: 'center', marginBottom: 6 },
  loginTitle: { color: '#FFD700', fontSize: 15, fontWeight: '900', textAlign: 'center', marginBottom: 4 },
  loginSubtitle: { color: '#AAAABB', fontSize: 10.5, textAlign: 'center', lineHeight: 16, marginBottom: 14 },
  authTabRow: { flexDirection: 'row', gap: 8, marginBottom: 14 },
  authTabBtn: { flex: 1, paddingVertical: 9, borderRadius: 8, backgroundColor: '#16082F', borderWidth: 1.5, borderColor: '#332255', alignItems: 'center' },
  authTabBtnActive: { backgroundColor: '#092B1E', borderColor: '#39FF14' },
  authTabBtnRegisterActive: { backgroundColor: '#0B192C', borderColor: '#00FFFF' },
  authTabText: { color: '#8888AA', fontSize: 9.5, fontWeight: 'bold' },
  authTabTextActive: { color: '#FFF', fontWeight: '900' },
  errorBanner: { backgroundColor: 'rgba(255, 0, 85, 0.15)', borderWidth: 1, borderColor: '#FF0055', padding: 10, borderRadius: 8, marginBottom: 12 },
  errorBannerText: { color: '#FF0055', fontSize: 10.5, fontWeight: 'bold', textAlign: 'center' },
  successBanner: { backgroundColor: 'rgba(57, 255, 20, 0.15)', borderWidth: 1, borderColor: '#39FF14', padding: 10, borderRadius: 8, marginBottom: 12 },
  successBannerText: { color: '#39FF14', fontSize: 10.5, fontWeight: 'bold', textAlign: 'center', lineHeight: 15 },
  loginInput: { backgroundColor: '#070212', color: '#FFF', borderRadius: 8, borderWidth: 1.5, borderColor: '#332255', padding: 11, fontSize: 12 },
  loginSubmitBtn: { backgroundColor: '#39FF14', paddingVertical: 13, borderRadius: 10, alignItems: 'center', marginTop: 8 },
  loginSubmitText: { color: '#000', fontSize: 11.5, fontWeight: '900' },
  loginHelperNote: { color: '#8888AA', fontSize: 9.5, textAlign: 'center', marginTop: 14, fontStyle: 'italic', lineHeight: 14 },

  managementActionRow: { flexDirection: 'row', gap: 8, marginBottom: 14 },
  createClassBtn: { flex: 1, backgroundColor: '#0B192C', paddingVertical: 10, borderRadius: 8, alignItems: 'center', borderWidth: 1.5, borderColor: '#00FFFF' },
  createClassBtnText: { color: '#00FFFF', fontSize: 9.5, fontWeight: '900' },
  newAssignmentBtn: { flex: 1, backgroundColor: '#FF007F', paddingVertical: 10, borderRadius: 8, alignItems: 'center' },
  newAssignmentBtnText: { color: '#FFF', fontSize: 9.5, fontWeight: '900' },
  bulkImportBtn: { flex: 1, backgroundColor: '#1A0B2E', paddingVertical: 10, borderRadius: 8, alignItems: 'center', borderWidth: 1.5, borderColor: '#39FF14' },
  bulkImportBtnText: { color: '#39FF14', fontSize: 9.5, fontWeight: '900' },

  emptyClassBanner: {
    backgroundColor: '#0B192C',
    borderWidth: 1.5,
    borderColor: '#00FFFF',
    borderRadius: 12,
    padding: 12,
    marginBottom: 14,
  },
  emptyClassBannerTitle: { color: '#FFD700', fontSize: 11.5, fontWeight: '900', marginBottom: 4 },
  emptyClassBannerDesc: { color: '#E0E0F5', fontSize: 10, lineHeight: 15 },
  
  statsRow: { flexDirection: 'row', gap: 10, marginBottom: 16 },
  statCard: { flex: 1, backgroundColor: '#0D0620', padding: 12, borderRadius: 12, borderWidth: 1, borderColor: '#221133', alignItems: 'center' },
  statLabel: { color: '#8888AA', fontSize: 8, fontWeight: 'bold', marginBottom: 4 },
  statValue: { color: '#FFF', fontSize: 16, fontWeight: '900' },

  filterSection: { marginBottom: 14 },
  filterLabel: { color: '#00FFFF', fontSize: 9, fontWeight: '900', marginBottom: 6 },
  searchInput: {
    backgroundColor: '#0D0620',
    borderWidth: 1,
    borderColor: '#332255',
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 7,
    color: '#FFF',
    fontSize: 10.5,
    marginBottom: 8,
  },
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
  transcriptPreviewText: { color: '#C8E6FF', fontSize: 8.5, fontStyle: 'italic', marginTop: 2 },
  teacherNoteText: { color: '#FFD700', fontSize: 8, fontStyle: 'italic', marginTop: 2 },
  classCodeTag: { alignSelf: 'flex-start', backgroundColor: '#0B192C', borderWidth: 1, borderColor: '#00FFFF', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4, marginBottom: 2 },
  classCodeTagText: { color: '#00FFFF', fontSize: 8.5, fontWeight: '900' },
  modeText: { color: '#AAAABB', fontSize: 8 },
  aiMetricMiniText: { color: '#88FFBB', fontSize: 7.5, marginTop: 2 },
  scoreBadge: { fontSize: 13, fontWeight: '900' },
  statusText: { fontSize: 7, color: '#8888AA', fontWeight: 'bold' },
  
  overrideBtn: { backgroundColor: '#FF007F', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6 },
  overrideBtnText: { color: '#FFF', fontSize: 8, fontWeight: 'bold' },
  listenBtn: { backgroundColor: '#1A0B2E', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6, borderWidth: 1, borderColor: '#00FFFF' },
  listenBtnText: { color: '#00FFFF', fontSize: 8, fontWeight: '900' },
  emptyText: { color: '#8888AA', fontSize: 11, textAlign: 'center', marginVertical: 20 },

  floatingAudioPlayer: { marginTop: 15, backgroundColor: '#070212', borderRadius: 12, borderWidth: 1.5, borderColor: '#39FF14', padding: 12 },
  floatingPlayerTitle: { color: '#39FF14', fontSize: 9, fontWeight: '900' },

  detailAuditBox: {
    backgroundColor: '#130628',
    borderWidth: 1,
    borderColor: '#332255',
    borderRadius: 10,
    padding: 10,
    marginBottom: 10,
  },
  detailAuditHeader: { color: '#00FFFF', fontSize: 9.5, fontWeight: 'bold', marginBottom: 3 },
  detailAuditTranscript: { color: '#FFFFFF', fontSize: 11, fontStyle: 'italic', lineHeight: 16 },
  detailAuditFeedback: { color: '#E0E0F5', fontSize: 10, lineHeight: 15 },

  modalOverlay: { flex: 1, backgroundColor: 'rgba(5, 2, 13, 0.88)', justifyContent: 'center', alignItems: 'center', padding: 16 },
  modalContent: { backgroundColor: '#0D0620', padding: 18, borderRadius: 16, borderWidth: 2, borderColor: '#FF007F', width: '100%' },
  modalTitle: { color: '#FF007F', fontSize: 13, fontWeight: '900', textAlign: 'center', marginBottom: 4 },
  modalSubtitle: { color: '#8888AA', fontSize: 10, textAlign: 'center', marginBottom: 10 },
  modalAiScore: { color: '#AAAABB', fontSize: 10, textAlign: 'center', marginBottom: 10 },
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
  guideStepTitle: { color: '#FFD700', fontSize: 11, fontWeight: '900', marginBottom: 4 },
  guideStepDesc: { color: '#E0E0F0', fontSize: 10, lineHeight: 16 },
});