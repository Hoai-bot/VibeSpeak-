// src/components/AuthModal.tsx
import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Modal, ActivityIndicator } from 'react-native';
import { supabase } from '../utils/supabase';

interface Props {
  visible: boolean;
  onClose: () => void;
  onSuccess: (user: any) => void;
}

export default function AuthModal({ visible, onClose, onSuccess }: Props) {
  const [isRegister, setIsRegister] = useState<boolean>(false);
  const [email, setEmail] = useState<string>('');
  const [password, setPassword] = useState<string>('');
  const [fullName, setFullName] = useState<string>('');
  const [studentCode, setStudentCode] = useState<string>('');
  const [classCode, setClassCode] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(false);
  const [errMsg, setErrMsg] = useState<string>('');

  const handleSubmit = async () => {
    setErrMsg('');
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
        // 🎯 ĐĂNG KÝ TÀI KHOẢN MỚI
        const { data, error } = await supabase.auth.signUp({
          email: email.trim(),
          password: password.trim(),
          options: {
            data: {
              full_name: fullName.trim() || 'Người học tự do',
              student_code: studentCode.trim().toUpperCase() || 'GUEST',
              class_code: classCode.trim().toUpperCase() || 'LỚP CHUNG',
              role: 'student',
            },
          },
        });

        if (error) throw error;
        if (data?.user) {
          alert('🎉 Đăng ký tài khoản thành công!');
          onSuccess(data.user);
          onClose();
        }
      } else {
        // 🎯 ĐĂNG NHẬP
        const { data, error } = await supabase.auth.signInWithPassword({
          email: email.trim(),
          password: password.trim(),
        });

        if (error) throw error;
        if (data?.user) {
          onSuccess(data.user);
          onClose();
        }
      }
    } catch (err: any) {
      console.warn('Lỗi xác thực Auth:', err);
      if (err.message?.includes('Invalid login credentials')) {
        setErrMsg('Email hoặc mật khẩu không chính xác.');
      } else if (err.message?.includes('User already registered')) {
        setErrMsg('Email này đã được đăng ký tài khoản.');
      } else {
        setErrMsg(err.message || 'Lỗi kết nối máy chủ xác thực.');
      }
    } finally {
      setLoading(false);
    }
  };

  // 🎯 XỬ LÝ KHI NGƯỜI DÙNG CHỌN TIẾP TỤC DÙNG THỬ (GUEST MODE)
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
    onClose();
  };

  return (
    <Modal visible={visible} transparent animationType="slide">
      <View style={styles.overlay}>
        <View style={styles.modalBox}>
          <Text style={styles.tag}>🔒 HỆ THỐNG XÁC THỰC VIBESPEAK</Text>
          <Text style={styles.title}>{isRegister ? 'ĐĂNG KÝ TÀI KHOẢN' : 'ĐĂNG NHẬP'}</Text>
          <Text style={styles.desc}>
            Đăng nhập để đồng bộ chuỗi Streak 🔥, điểm giải đấu tuần và lưu trữ kho âm cần phục thù trên Cloud[cite: 14].
          </Text>

          {errMsg ? <Text style={styles.errorText}>⚠️ {errMsg}</Text> : null}

          {isRegister && (
            <>
              <TextInput
                style={styles.input}
                placeholder="Họ và tên hoặc Biệt danh của bạn *"
                placeholderTextColor="#666688"
                value={fullName}
                onChangeText={setFullName}
              />
              <View style={{ flexDirection: 'row', gap: 8, width: '100%' }}>
                <TextInput
                  style={[styles.input, { flex: 1 }]}
                  placeholder="MSSV (Không bắt buộc)"
                  placeholderTextColor="#666688"
                  value={studentCode}
                  onChangeText={setStudentCode}
                />
                <TextInput
                  style={[styles.input, { flex: 1 }]}
                  placeholder="Mã Lớp (Không bắt buộc)"
                  placeholderTextColor="#666688"
                  value={classCode}
                  onChangeText={setClassCode}
                />
              </View>
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
          />

          <TextInput
            style={styles.input}
            placeholder="Mật khẩu (Tối thiểu 6 ký tự) *"
            placeholderTextColor="#666688"
            secureTextEntry
            value={password}
            onChangeText={setPassword}
          />

          <TouchableOpacity 
            style={[styles.submitBtn, loading && styles.submitBtnDisabled]} 
            onPress={handleSubmit}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color="#000" size="small" />
            ) : (
              <Text style={styles.submitText}>
                {isRegister ? '⚡ TẠO TÀI KHOẢN NGAY' : '🔓 ĐĂNG NHẬP'}
              </Text>
            )}
          </TouchableOpacity>

          {/* 🎯 NÚT TIẾP TỤC VỚI TƯ CÁCH KHÁCH (DÙNG THỬ) */}
          <TouchableOpacity 
            style={styles.guestBtn} 
            onPress={handleContinueAsGuest}
          >
            <Text style={styles.guestBtnText}>🚀 TIẾP TỤC VỚI TƯ CÁCH KHÁCH (DÙNG THỬ)</Text>
          </TouchableOpacity>

          <TouchableOpacity 
            style={styles.toggleRow} 
            onPress={() => {
              setIsRegister(!isRegister);
              setErrMsg('');
            }}
          >
            <Text style={styles.toggleText}>
              {isRegister ? 'Đã có tài khoản? Đăng nhập ngay' : 'Chưa có tài khoản? Bấm vào đây để Đăng ký'}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.closeBtn} onPress={onClose}>
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
  desc: { color: '#AAAABB', fontSize: 10, textAlign: 'center', lineHeight: 15, marginBottom: 16 },
  errorText: { color: '#FF0055', fontSize: 10, fontWeight: 'bold', marginBottom: 10, textAlign: 'center' },
  input: { width: '100%', backgroundColor: '#0D0620', color: '#FFF', padding: 11, borderRadius: 8, borderWidth: 1, borderColor: '#332255', fontSize: 11, marginBottom: 10 },
  submitBtn: { width: '100%', backgroundColor: '#39FF14', paddingVertical: 12, borderRadius: 10, alignItems: 'center', marginTop: 4 },
  submitBtnDisabled: { opacity: 0.5 },
  submitText: { color: '#000', fontSize: 11, fontWeight: '900' },
  
  // Style nút Khách dùng thử
  guestBtn: { 
    width: '100%', 
    backgroundColor: '#1A0B2E', 
    borderWidth: 1.5, 
    borderColor: '#FF007F', 
    paddingVertical: 11, 
    borderRadius: 10, 
    alignItems: 'center', 
    marginTop: 8 
  },
  guestBtnText: { color: '#FF007F', fontSize: 10, fontWeight: '900' },

  toggleRow: { marginTop: 14, paddingVertical: 4 },
  toggleText: { color: '#00FFFF', fontSize: 10, textDecorationLine: 'underline' },
  closeBtn: { marginTop: 10, paddingVertical: 6 },
  closeText: { color: '#8888AA', fontSize: 10 }
});