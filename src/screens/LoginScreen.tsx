// src/screens/LoginScreen.tsx
import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ActivityIndicator } from 'react-native';
import { auth } from '../services/firebaseClient';
import { createUserWithEmailAndPassword, signInWithEmailAndPassword } from 'firebase/auth';

interface Props {
  onLoginSuccess?: () => void;
  onBack?: () => void;
}

const isValidEmail = (email: string) => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

export default function LoginScreen({ onLoginSuccess, onBack }: Props) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isSignUp, setIsSignUp] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleAuthAction = async () => {
    // 1. Tự động loại bỏ khoảng trắng thừa do bàn phím tự động điền (Autofill)
    const cleanEmail = email.trim().toLowerCase();
    const cleanPassword = password.trim();

    // 2. Kiểm tra dữ liệu đầu vào
    if (!cleanEmail) {
      alert("Vui lòng nhập Email!");
      return;
    }

    if (!isValidEmail(cleanEmail)) {
      alert("Email không đúng định dạng chuẩn (ví dụ: user@gmail.com)!");
      return;
    }

    if (!cleanPassword) {
      alert("Vui lòng nhập Mật khẩu!");
      return;
    }

    setLoading(true);
    try {
      if (isSignUp) {
        // Gọi hàm đăng ký với email đã làm sạch
        await createUserWithEmailAndPassword(auth, cleanEmail, cleanPassword);
        alert("Đăng ký thành công!");
      } else {
        // Gọi hàm đăng nhập với email đã làm sạch
        await signInWithEmailAndPassword(auth, cleanEmail, cleanPassword);
        alert("Đăng nhập thành công!");
      }
      if (onLoginSuccess) onLoginSuccess();
    } catch (error: any) {
      if (error.code === 'auth/invalid-email') {
        alert("Lỗi xác thực: Định dạng Email không hợp lệ trên hệ thống Firebase!");
      } else if (error.code === 'auth/email-already-in-use') {
        alert("Email này đã được sử dụng!");
      } else if (error.code === 'auth/weak-password') {
        alert("Mật khẩu quá yếu (cần tối thiểu 6 ký tự)!");
      } else if (error.code === 'auth/wrong-password' || error.code === 'auth/user-not-found' || error.code === 'auth/invalid-credential') {
        alert("Sai tài khoản hoặc mật khẩu!");
      } else {
        alert(`Lỗi đăng nhập: ${error.message}`);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.card}>
        <Text style={styles.title}>⚡ VIBESPEAK CYBER LOGIN</Text>
        <Text style={styles.subtitle}>
          {isSignUp ? 'Tạo tài khoản học viên để thi đấu' : 'Đăng nhập vào đấu trường tiếng Anh'}
        </Text>

        <TextInput
          style={styles.input}
          placeholder="Nhập Email học viên (ví dụ: student@school.edu.vn)"
          placeholderTextColor="#666688"
          value={email}
          onChangeText={setEmail}
          autoCapitalize="none"
          keyboardType="email-address"
        />

        <TextInput
          style={styles.input}
          placeholder="Nhập Mật khẩu (tối thiểu 6 ký tự)"
          placeholderTextColor="#666688"
          value={password}
          onChangeText={setPassword}
          secureTextEntry
        />

        <TouchableOpacity 
          style={[styles.authBtn, loading && styles.btnDisabled]} 
          onPress={handleAuthAction}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color="#000" />
          ) : (
            <Text style={styles.authBtnText}>
              {isSignUp ? '🚀 ĐĂNG KÝ HỌC VIÊN' : '⚡ ĐĂNG NHẬP SÀN ĐẤU'}
            </Text>
          )}
        </TouchableOpacity>

        <TouchableOpacity 
          style={styles.switchModeBtn} 
          onPress={() => setIsSignUp(!isSignUp)}
        >
          <Text style={styles.switchModeText}>
            {isSignUp ? 'Đã có tài khoản? Bấm để Đăng nhập' : 'Chưa có tài khoản? Bấm để Đăng ký'}
          </Text>
        </TouchableOpacity>

        {onBack && (
          <TouchableOpacity style={styles.backBtn} onPress={onBack}>
            <Text style={styles.backBtnText}>🔙 QUAY LẠI MAP</Text>
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#05020D',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20
  },
  card: {
    width: '100%',
    maxWidth: 440,
    backgroundColor: '#0D0620',
    padding: 24,
    borderRadius: 16,
    borderWidth: 2,
    borderColor: '#00FFFF',
    alignItems: 'center'
  },
  title: {
    color: '#FFD700',
    fontSize: 14,
    fontWeight: '900',
    marginBottom: 6
  },
  subtitle: {
    color: '#8888AA',
    fontSize: 10.5,
    marginBottom: 20,
    textAlign: 'center'
  },
  input: {
    width: '100%',
    backgroundColor: '#130628',
    borderWidth: 1.5,
    borderColor: '#332255',
    borderRadius: 10,
    padding: 12,
    color: '#FFF',
    fontSize: 11,
    marginBottom: 12
  },
  authBtn: {
    width: '100%',
    backgroundColor: '#39FF14',
    paddingVertical: 12,
    borderRadius: 10,
    alignItems: 'center',
    marginTop: 8,
    marginBottom: 14
  },
  btnDisabled: {
    opacity: 0.6
  },
  authBtnText: {
    color: '#000',
    fontSize: 11.5,
    fontWeight: '900'
  },
  switchModeBtn: {
    padding: 8
  },
  switchModeText: {
    color: '#00FFFF',
    fontSize: 10,
    textDecorationLine: 'underline'
  },
  backBtn: {
    marginTop: 10,
    padding: 6
  },
  backBtnText: {
    color: '#FF0055',
    fontSize: 9.5,
    fontWeight: 'bold'
  }
});