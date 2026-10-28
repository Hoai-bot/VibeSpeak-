// App.tsx
import React, { useEffect } from 'react';
import { SafeAreaView, StyleSheet, StatusBar } from 'react-native';
import AppNavigator from './src/navigation/AppNavigator';

if (typeof window !== 'undefined') {
  const originalError = console.error;
  const originalWarn = console.warn;

  console.error = (...args: any[]) => {
    if (args[0] && typeof args[0] === 'string' && (args[0].includes('api.groq.com') || args[0].includes('404'))) {
      return;
    }
    originalError.apply(console, args);
  };

  console.warn = (...args: any[]) => {
    if (args[0] && typeof args[0] === 'string' && args[0].includes('groq')) {
      return;
    }
    originalWarn.apply(console, args);
  };
}

export default function App() {
  useEffect(() => {
    // 🛡️ CHẶN GOOGLE CHROME VÀ TRÌNH DUYỆT TỰ ĐỘNG DỊCH TIẾNG ANH SANG TIẾNG VIỆT
    if (typeof document !== 'undefined') {
      // 1. Thêm thuộc tính translate="no" vào thẻ <html> và <body>
      document.documentElement.setAttribute('translate', 'no');
      document.body.setAttribute('translate', 'no');
      document.body.classList.add('notranslate');

      // 2. Tự động tiêm thẻ meta chống dịch nếu chưa có
      if (!document.querySelector('meta[name="google"]')) {
        const metaGoogle = document.createElement('meta');
        metaGoogle.name = 'google';
        metaGoogle.content = 'notranslate';
        document.head.appendChild(metaGoogle);
      }
    }
  }, []);

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