import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ActivityIndicator, Platform, Alert } from 'react-native';
import { createUserWithEmailAndPassword, signInWithEmailAndPassword, updateProfile } from 'firebase/auth';
import { auth } from '../services/firebaseClient';

interface Props {
  onAuthSuccess: (user: any) => void;
}

export default function AuthScreen({ onAuthSuccess }: Props) {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [username, setUsername] = useState('');
  const [loading, setLoading] = useState(false);

  const showAlert = (title: string, message: string) => {
    if (Platform.OS === 'web') {
      alert(`${title}: ${message}`);
    } else {
      Alert.alert(title, message);
    }
  };

  // 🧹 HÀM LÀM SẠCH VÀ ÉP KIỂU STRING TUYỆT ĐỐI CHO EMAIL
  const getCleanEmail = (rawVal: any): string => {
    if (!rawVal) return '';
    const str = String(rawVal);
    return str
      .toLowerCase()
      .replace(/\s+/g, '') // Xóa sạch dấu cách
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '') // Xóa dấu tiếng Việt
      .trim();
  };

  const handleSubmit = async () => {
    const cleanEmail = getCleanEmail(email);
    const cleanPassword = String(password).trim();
    const cleanUsername = String(username).trim();

    console.log("🔍 Clean Email Sending to Firebase:", cleanEmail);

    if (!cleanEmail || !cleanPassword || (!isLogin && !cleanUsername)) {
      showAlert('Cảnh báo', 'Vui lòng điền đầy đủ thông tin!');
      return;
    }

    // 🛡️ KIỂM TRA ĐỊNH DẠNG CƠ BẢN TRƯỚC KHI GỬI LÊN FIREBASE
    if (!cleanEmail.includes('@') || !cleanEmail.includes('.')) {
      showAlert('Cảnh báo', 'Địa chỉ email chưa đầy đủ! Vui lòng nhập đúng dạng: runner@gmail.com');
      return;
    }

    if (cleanPassword.length < 6) {
      showAlert('Cảnh báo', 'Mật khẩu phải có ít nhất 6 ký tự!');
      return;
    }

    setLoading(true);

    try {
      if (isLogin) {
        const userCredential = await signInWithEmailAndPassword(auth, cleanEmail, cleanPassword);
        onAuthSuccess(userCredential.user);
      } else {
        const userCredential = await createUserWithEmailAndPassword(auth, cleanEmail, cleanPassword);
        if (userCredential.user) {
          await updateProfile(userCredential.user, {
            displayName: cleanUsername,
          });
        }
        showAlert('Thành công', '🎉 Đã tạo tài khoản thành công!');
        onAuthSuccess(userCredential.user);
      }
    } catch (error: any) {
      console.error('Lỗi Auth Chi Tiết:', error);
      
      // 🚨 HIỂN THỊ MÃ LỖI VÀ THÔNG ĐIỆP GỐC TỪ FIREBASE ĐỂ DEBUG DỄ DÀNG
      const rawCode = error?.code || 'NO_CODE';
      const rawMsg = error?.message || 'Lỗi chưa xác định';
      
      showAlert('Lỗi Firebase Auth', `[${rawCode}]\n${rawMsg}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>⚡ VIBESPEAK AUTH ⚡</Text>
      <Text style={styles.subtitle}>{isLogin ? 'ĐĂNG NHẬP ĐỂ VÀO ĐẤU TRƯỜNG' : 'TẠO TÀI KHOẢN VIBER MỚI'}</Text>

      {!isLogin && (
        <TextInput
          style={styles.input}
          placeholder="Tên người chơi (Username)"
          placeholderTextColor="#8888AA"
          value={username}
          onChangeText={(val) => setUsername(val)}
        />
      )}

      <TextInput
        style={styles.input}
        placeholder="Email (VD: runner@gmail.com)"
        placeholderTextColor="#8888AA"
        value={email}
        onChangeText={(val) => setEmail(val)}
        autoCapitalize="none"
        autoCorrect={false}
        keyboardType="email-address"
      />

      <TextInput
        style={styles.input}
        placeholder="Mật khẩu (>= 6 ký tự)"
        placeholderTextColor="#8888AA"
        value={password}
        onChangeText={(val) => setPassword(val)}
        secureTextEntry
      />

      {loading ? (
        <ActivityIndicator size="large" color="#00FFFF" style={{ marginVertical: 15 }} />
      ) : (
        <TouchableOpacity style={styles.submitBtn} onPress={handleSubmit}>
          <Text style={styles.submitText}>{isLogin ? '🚀 ĐĂNG NHẬP' : '🔥 ĐĂNG KÝ NGAY'}</Text>
        </TouchableOpacity>
      )}

      <TouchableOpacity onPress={() => setIsLogin(!isLogin)} style={{ marginTop: 15 }}>
        <Text style={styles.switchText}>
          {isLogin ? 'Chưa có tài khoản? Đăng ký ngay' : 'Đã có tài khoản? Đăng nhập'}
        </Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#05020D', justifyContent: 'center', alignItems: 'center', padding: 25 },
  title: { color: '#00FFFF', fontSize: 20, fontWeight: '900', fontFamily: 'Courier New', marginBottom: 5 },
  subtitle: { color: '#FF007F', fontSize: 11, fontFamily: 'Courier New', marginBottom: 25 },
  input: { width: '100%', backgroundColor: '#0D0620', borderWidth: 1, borderColor: '#FF007F', color: '#FFF', padding: 12, borderRadius: 8, marginBottom: 15, fontFamily: 'Courier New' },
  submitBtn: { width: '100%', backgroundColor: '#39FF14', padding: 14, borderRadius: 8, alignItems: 'center', marginTop: 10 },
  submitText: { color: '#000', fontWeight: '900', fontFamily: 'Courier New', fontSize: 13 },
  switchText: { color: '#AAAABB', fontSize: 11, fontFamily: 'Courier New', textDecorationLine: 'underline' }
});