import React from 'react';
import { SafeAreaView, StyleSheet, StatusBar } from 'react-native';
import AppNavigator from './src/navigation/AppNavigator';

// 🛡️ BỘ LỌC CHẶN WARNING & ERROR 404 CỦA GROQ TRÊN BẢNG CONSOLE WEB
if (typeof window !== 'undefined') {
  const originalError = console.error;
  const originalWarn = console.warn;

  console.error = (...args: any[]) => {
    if (args[0] && typeof args[0] === 'string' && (args[0].includes('api.groq.com') || args[0].includes('404'))) {
      return; // Bỏ qua không hiển thị lỗi 404 mạng
    }
    originalError.apply(console, args);
  };

  console.warn = (...args: any[]) => {
    if (args[0] && typeof args[0] === 'string' && args[0].includes('groq')) {
      return; // Bỏ qua warning liên quan đến Groq Fallback
    }
    originalWarn.apply(console, args);
  };
}

export default function App() {
  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#0A051B" />
      <AppNavigator />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0A051B',
  },
});