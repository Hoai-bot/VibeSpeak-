// src/services/firebaseClient.ts
import { initializeApp, getApps, getApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';
import { initializeAuth, getReactNativePersistence, getAuth } from 'firebase/auth';
import { getAnalytics, isSupported } from 'firebase/analytics';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';

// ⚙️ Cấu hình chuẩn cho Project ID: vipespeak
const firebaseConfig = {
  apiKey: "AIzaSyDHnBGqGNvfu8oI-Gwf8lOUXZXRP-0p7dM",
  authDomain: "vipespeak.firebaseapp.com",
  projectId: "vipespeak",
  storageBucket: "vipespeak.firebasestorage.app",
  messagingSenderId: "532463856102",
  appId: "1:532463856102:web:13a5088ffcc4121fbd4e27",
  measurementId: "G-VBY41X81JM"
};

// 🛡️ Khởi tạo App an toàn chống trùng lặp instance khi Hot-Reload
const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();

// 🚀 Khởi tạo Auth tương thích tuyệt đối cho cả Web & Mobile
export const auth = Platform.OS === 'web'
  ? getAuth(app)
  : initializeAuth(app, {
      persistence: getReactNativePersistence(AsyncStorage)
    });

// 💾 Khởi tạo dịch vụ Firestore
export const db = getFirestore(app);

// 📊 Khởi tạo Analytics an toàn cho môi trường Web
export let analytics: any = null;
if (typeof window !== 'undefined') {
  isSupported().then((supported) => {
    if (supported) {
      analytics = getAnalytics(app);
    }
  }).catch(() => {});
}

export default app;