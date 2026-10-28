// src/components/AuthModal.tsx
import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Modal, ActivityIndicator } from 'react-native';
import { supabase } from '../utils/supabase';

interface Props {
  visible: boolean;
  onClose: () => void;
  onSuccess: (user: any) => void;
}

// 🔑 MÃ BÍ MẬT GIÁO VIÊN (Bạn có thể đổi mật mã này theo ý muốn)
const TEACHER_SECRET_KEY = 'VIBE_TEACHER_2026';

export default function AuthModal({ visible, onClose, onSuccess }: Props) {
  const [isRegister, setIsRegister] = useState<boolean>(false);
  const [email, setEmail] = useState<string>('');
  const [password, setPassword] = useState<string>('');
  const [fullName, setFullName] = useState<string>('');
  const [studentCode, setStudentCode] = useState<string>('');
  const [classCode, setClassCode] = useState<string>('');

  // 🎯 State phân quyền giáo viên
  const [isTeacherMode, setIsTeacherMode] = useState<boolean>(false);
  const [teacherSecret, setTeacherSecret] = useState<string>('');

  const [loading, setLoading] = useState<boolean>(false);
  const [errMsg, setErrMsg] = useState<string>('');
  const [successMsg, setSuccessMsg] = useState<string>('');

  const resetForm = () => {
    setErrMsg('');
    setSuccessMsg('');
    setEmail('');
    setPassword('');
    setFullName('');
    setStudentCode('');
    setClassCode('');
    setIsTeacherMode(false);
    setTeacherSecret('');
  };

  const handleForgotPassword = async () => {
    setErrMsg('');
    setSuccessMsg('');

    if (!email.trim()) {
      setErrMsg('Vui lòng điền địa chỉ Email để nhận liên kết khôi phục mật khẩu.');
      return;
    }

    setLoading(true);
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email.trim(), {
        redirectTo: typeof window !== 'undefined' ? window.location.origin : undefined,
      });

      if (error) throw error;

      setSuccessMsg('Đã gửi email khôi phục mật khẩu! Vui lòng kiểm tra hộp thư đến hoặc thư rác (Spam).');
    } catch (err: any) {
      setErrMsg(err.message || 'Không thể gửi email khôi phục mật khẩu.');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async () => {
    setErrMsg('');
    setSuccessMsg('');

    if (!email.trim() || !password.trim()) {
      setErrMsg('Vui lòng nhập đầy đủ Email và Mật khẩu.');
      return;
    }

    if (password.length < 6) {
      setErrMsg('Mật khẩu phải chứa ít nhất 6 ký tự.');
      return;
    }

    if (!supabase) {
      setErrMsg('Hệ thống Supabase chưa được cấu hình.');
      return;
    }

    setLoading(true);

    try {
      if (isRegister) {
        // Kiểm tra mã giáo viên nếu đang kích hoạt chế độ giảng viên
        if (isTeacherMode && teacherSecret.trim() !== TEACHER_SECRET_KEY) {
          setLoading(false);
          setErrMsg('Mã kích hoạt Giáo viên không chính xác!');
          return;
        }

        const role = isTeacherMode ? 'teacher' : 'student';
        const finalStudentCode = isTeacherMode
          ? 'GIẢNG VIÊN'
          : studentCode.trim().toUpperCase() || 'GUEST';

        // 🎯 1. ĐĂNG KÝ TÀI KHOẢN MỚI
        const { data, error } = await supabase.auth.signUp({
          email: email.trim(),
          password: password.trim(),
          options: {
            data: {
              full_name: fullName.trim() || (isTeacherMode ? 'Thầy/Cô Giảng viên' : 'Người học VibeSpeak'),
              student_code: finalStudentCode,
              class_code: classCode.trim().toUpperCase() || 'LỚP CHUNG',
              role: role,
            },
          },
        });

        if (error) throw error;

        if (data?.user) {
          setSuccessMsg(
            isTeacherMode
              ? '🎉 ĐĂNG KÝ GIẢNG VIÊN THÀNH CÔNG! ĐANG VÀO ĐẤU TRƯỜNG...'
              : '🎉 ĐĂNG KÝ THÀNH CÔNG! ĐANG VÀO ĐẤU TRƯỜNG...'
          );
          
          // Tự động đăng nhập để lưu session bền vững
          const { data: loginData } = await supabase.auth.signInWithPassword({
            email: email.trim(),
            password: password.trim(),
          });

          const activeUser = loginData?.user || data.user;

          setTimeout(() => {
            onSuccess(activeUser);
            resetForm();
            onClose();
          }, 1200);
        }
      } else {
        // 🎯 2. ĐĂNG NHẬP
        const { data, error } = await supabase.auth.signInWithPassword({
          email: email.trim(),
          password: password.trim(),
        });

        if (error) throw error;
        if (data?.user) {
          setSuccessMsg('🔓 ĐĂNG NHẬP THÀNH CÔNG!');
          setTimeout(() => {
            onSuccess(data.user);
            resetForm();
            onClose();
          }, 800);
        }
      }
    } catch (err: any) {
      console.warn('Lỗi xác thực Auth chi tiết:', err);

      const rawError =
        err?.message ||
        err?.error_description ||
        err?.msg ||
        (typeof err === 'object' ? JSON.stringify(err) : String(err));

      if (rawError.includes('Invalid login credentials')) {
        setErrMsg('Email hoặc mật khẩu không chính xác.');
      } else if (rawError.includes('User already registered') || rawError.includes('already registered')) {
        setErrMsg('Email này đã được đăng ký. Vui lòng bấm vào Đăng nhập bên dưới.');
      } else if (rawError.includes('Password should be at least')) {
        setErrMsg('Mật khẩu cần tối thiểu 6 ký tự.');
      } else if (rawError.includes('Signup requires a valid password')) {
        setErrMsg('Vui lòng nhập mật khẩu hợp lệ.');
      } else if (rawError === '{}' || !rawError || rawError === 'null') {
        setErrMsg('Không thể kết nối đến máy chủ Supabase. Vui lòng kiểm tra kết nối mạng hoặc thử lại.');
      } else {
        setErrMsg(rawError);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleContinueAsGuest = () => {
    const guestUser = {
      id: `guest_${Date.now()}`,
      email: '',
      user_metadata: {
        full_name: 'Khách Dùng Thử',
        student_code: 'GUEST',
        class_code: 'LỚP CHUNG',
        role: 'guest',
      },
    };
    onSuccess(guestUser);
    resetForm();
    onClose();
  };

  return (
    <Modal visible={visible} transparent animationType="slide">
      <View style={styles.overlay}>
        <View style={styles.modalBox}>
          <Text style={styles.tag}>🔒 HỆ THỐNG XÁC THỰC VIBESPEAK</Text>
          <Text style={[styles.title, isTeacherMode && styles.teacherTitle]}>
            {isRegister
              ? (isTeacherMode ? 'ĐĂNG KÝ TÀI KHOẢN GIẢNG VIÊN' : 'ĐĂNG KÝ TÀI KHOẢN')
              : 'ĐĂNG NHẬP'}
          </Text>
          <Text style={styles.desc}>
            {isTeacherMode
              ? 'Tài khoản Giảng viên có quyền quản lý danh sách học viên, phòng đấu và theo dõi tiến độ cả lớp.'
              : 'Đăng ký để đồng bộ chuỗi Streak 🔥, điểm giải đấu tuần và lưu trữ kho âm cần phục thù trên Cloud.'}
          </Text>

          {/* BANNER THÔNG BÁO LỖI HOẶC THÀNH CÔNG */}
          {errMsg ? <Text style={styles.errorText}>⚠️ {errMsg}</Text> : null}
          {successMsg ? <Text style={styles.successText}>{successMsg}</Text> : null}

          {isRegister && (
            <>
              <TextInput
                style={styles.input}
                placeholder={isTeacherMode ? 'Họ và tên Giảng viên *' : 'Họ và tên hoặc Biệt danh *'}
                placeholderTextColor="#666688"
                value={fullName}
                onChangeText={setFullName}
                editable={!loading && !successMsg}
              />

              {/* Nếu là chế độ giáo viên: nhập Mã bí mật. Nếu học viên: nhập MSSV */}
              {isTeacherMode ? (
                <TextInput
                  style={[styles.input, styles.teacherInput]}
                  placeholder="Nhập mã bí mật Giảng viên (Passcode) *"
                  placeholderTextColor="#ff88aa"
                  secureTextEntry
                  value={teacherSecret}
                  onChangeText={setTeacherSecret}
                  editable={!loading && !successMsg}
                />
              ) : (
                <View style={{ flexDirection: 'row', gap: 8, width: '100%' }}>
                  <TextInput
                    style={[styles.input, { flex: 1 }]}
                    placeholder="MSSV (Không bắt buộc)"
                    placeholderTextColor="#666688"
                    value={studentCode}
                    onChangeText={setStudentCode}
                    editable={!loading && !successMsg}
                  />
                  <TextInput
                    style={[styles.input, { flex: 1 }]}
                    placeholder="Mã Lớp (Không bắt buộc)"
                    placeholderTextColor="#666688"
                    value={classCode}
                    onChangeText={setClassCode}
                    editable={!loading && !successMsg}
                  />
                </View>
              )}

              {isTeacherMode && (
                <TextInput
                  style={styles.input}
                  placeholder="Mã lớp phụ trách (VD: ENG01, TIENGANH1)"
                  placeholderTextColor="#666688"
                  value={classCode}
                  onChangeText={setClassCode}
                  editable={!loading && !successMsg}
                />
              )}

              {/* Nút chuyển đổi chế độ Giảng viên */}
              <TouchableOpacity
                style={styles.teacherToggle}
                onPress={() => {
                  setIsTeacherMode(!isTeacherMode);
                  setErrMsg('');
                }}
                disabled={loading || !!successMsg}
              >
                <Text style={[styles.teacherToggleText, isTeacherMode && styles.teacherToggleActive]}>
                  {isTeacherMode
                    ? '✓ Đang bật chế độ: GIẢNG VIÊN (Nhấn để quay lại Học viên)'
                    : '👨‍🏫 Bạn là Giảng viên / Giám khảo? (Nhấn vào đây)'}
                </Text>
              </TouchableOpacity>
            </>
          )}

          <TextInput
            style={styles.input}
            placeholder="Địa chỉ Email *"
            placeholderTextColor="#666688"
            keyboardType="email-address"
            autoCapitalize="none"
            value={email}
            onChangeText={setEmail}
            editable={!loading && !successMsg}
          />

          <TextInput
            style={styles.input}
            placeholder="Mật khẩu (Tối thiểu 6 ký tự) *"
            placeholderTextColor="#666688"
            secureTextEntry
            value={password}
            onChangeText={setPassword}
            editable={!loading && !successMsg}
          />

          {/* 🔑 NÚT QUÊN MẬT KHẨU (CHỈ HIỂN THỊ KHI Ở CHẾ ĐỘ ĐĂNG NHẬP) */}
          {!isRegister && (
            <TouchableOpacity 
              style={styles.forgotBtn} 
              onPress={handleForgotPassword}
              disabled={loading || !!successMsg}
            >
              <Text style={styles.forgotBtnText}>Quên mật khẩu?</Text>
            </TouchableOpacity>
          )}

          <TouchableOpacity 
            style={[
              styles.submitBtn, 
              isTeacherMode && styles.teacherSubmitBtn,
              (loading || !!successMsg) && styles.submitBtnDisabled
            ]} 
            onPress={handleSubmit}
            disabled={loading || !!successMsg}
          >
            {loading ? (
              <ActivityIndicator color="#000" size="small" />
            ) : (
              <Text style={[styles.submitText, isTeacherMode && styles.teacherSubmitText]}>
                {isRegister
                  ? (isTeacherMode ? '⚡ TẠO TÀI KHOẢN GIẢNG VIÊN' : '⚡ TẠO TÀI KHOẢN NGAY')
                  : '🔓 ĐĂNG NHẬP'}
              </Text>
            )}
          </TouchableOpacity>

          <TouchableOpacity 
            style={styles.guestBtn} 
            onPress={handleContinueAsGuest}
            disabled={loading || !!successMsg}
          >
            <Text style={styles.guestBtnText}>🚀 TIẾP TỤC VỚI TƯ CÁCH KHÁCH (DÙNG THỬ)</Text>
          </TouchableOpacity>

          <TouchableOpacity 
            style={styles.toggleRow} 
            onPress={() => {
              setIsRegister(!isRegister);
              setIsTeacherMode(false);
              setErrMsg('');
              setSuccessMsg('');
            }}
            disabled={loading || !!successMsg}
          >
            <Text style={styles.toggleText}>
              {isRegister ? 'Đã có tài khoản? Đăng nhập ngay' : 'Chưa có tài khoản? Bấm vào đây để Đăng ký'}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity 
            style={styles.closeBtn} 
            onPress={() => {
              resetForm();
              onClose();
            }}
            disabled={loading || !!successMsg}
          >
            <Text style={styles.closeText}>Đóng lại</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: { flex: 1, backgroundColor: 'rgba(5, 2, 13, 0.85)', justifyContent: 'center', alignItems: 'center', padding: 20 },
  modalBox: { backgroundColor: '#120826', padding: 22, borderRadius: 16, borderWidth: 2, borderColor: '#00FFFF', width: '100%', maxWidth: 420, alignItems: 'center' },
  tag: { color: '#FFD700', fontSize: 10, fontWeight: '900', marginBottom: 4 },
  title: { color: '#00FFFF', fontSize: 16, fontWeight: '900', marginBottom: 6 },
  teacherTitle: { color: '#FF007F' },
  desc: { color: '#AAAABB', fontSize: 10, textAlign: 'center', lineHeight: 15, marginBottom: 16 },
  errorText: { color: '#FF0055', backgroundColor: 'rgba(255, 0, 85, 0.15)', padding: 8, borderRadius: 6, width: '100%', fontSize: 10, fontWeight: 'bold', marginBottom: 10, textAlign: 'center' },
  successText: { color: '#39FF14', backgroundColor: 'rgba(57, 255, 20, 0.15)', padding: 8, borderRadius: 6, width: '100%', fontSize: 10, fontWeight: '900', marginBottom: 10, textAlign: 'center' },
  input: { width: '100%', backgroundColor: '#0D0620', color: '#FFF', padding: 11, borderRadius: 8, borderWidth: 1, borderColor: '#332255', fontSize: 11, marginBottom: 10 },
  teacherInput: { borderColor: '#FF007F', backgroundColor: '#260B1E' },
  teacherToggle: { paddingVertical: 4, marginBottom: 10, alignItems: 'center' },
  teacherToggleText: { color: '#8888BB', fontSize: 10, textDecorationLine: 'underline' },
  teacherToggleActive: { color: '#FF007F', fontWeight: 'bold' },
  forgotBtn: { alignSelf: 'flex-end', marginTop: -4, marginBottom: 10, paddingVertical: 2 },
  forgotBtnText: { color: '#FFD700', fontSize: 10, textDecorationLine: 'underline' },
  submitBtn: { width: '100%', backgroundColor: '#39FF14', paddingVertical: 12, borderRadius: 10, alignItems: 'center', marginTop: 4 },
  teacherSubmitBtn: { backgroundColor: '#FF007F' },
  submitBtnDisabled: { opacity: 0.5 },
  submitText: { color: '#000', fontSize: 11, fontWeight: '900' },
  teacherSubmitText: { color: '#FFF' },
  guestBtn: { width: '100%', backgroundColor: '#1A0B2E', borderWidth: 1.5, borderColor: '#FF007F', paddingVertical: 11, borderRadius: 10, alignItems: 'center', marginTop: 8 },
  guestBtnText: { color: '#FF007F', fontSize: 10, fontWeight: '900' },
  toggleRow: { marginTop: 14, paddingVertical: 4 },
  toggleText: { color: '#00FFFF', fontSize: 10, textDecorationLine: 'underline' },
  closeBtn: { marginTop: 10, paddingVertical: 6 },
  closeText: { color: '#8888AA', fontSize: 10 }
});