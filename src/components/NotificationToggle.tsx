// src/components/NotificationToggle.tsx
import React, { useState, useEffect } from 'react';
import { TouchableOpacity, Text, StyleSheet } from 'react-native';
import { 
  isNotificationSupported, 
  requestNotificationPermission, 
  checkAndTriggerSmartNotification 
} from '../services/notificationService';

export default function NotificationToggle() {
  const [isEnabled, setIsEnabled] = useState<boolean>(false);

  useEffect(() => {
    if (isNotificationSupported() && Notification.permission === 'granted') {
      setIsEnabled(true);
      // Run background context check on mount
      checkAndTriggerSmartNotification();
    }
  }, []);

  const handleToggle = async () => {
    if (!isNotificationSupported()) {
      alert("⚠️ Trình duyệt hiện tại không hỗ trợ Web Notification.");
      return;
    }

    if (Notification.permission === 'granted') {
      alert("✅ Bạn đã kích hoạt thông báo VibeSpeak!");
      return;
    }

    const granted = await requestNotificationPermission();
    setIsEnabled(granted);
  };

  return (
    <TouchableOpacity 
      style={[styles.btn, isEnabled ? styles.btnActive : styles.btnInactive]} 
      onPress={handleToggle}
      activeOpacity={0.8}
    >
      <Text style={styles.icon}>{isEnabled ? '🔔' : '🔕'}</Text>
      <Text style={[styles.text, isEnabled ? styles.textActive : styles.textInactive]}>
        {isEnabled ? 'ĐÃ BẬT' : 'NHẮC HỌC'}
      </Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  btn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 6,
    paddingHorizontal: 8,
    borderRadius: 8,
    borderWidth: 1,
    gap: 4,
  },
  btnActive: {
    backgroundColor: '#120826',
    borderColor: '#39FF14',
  },
  btnInactive: {
    backgroundColor: '#0D0620',
    borderColor: '#332255',
  },
  icon: {
    fontSize: 12,
  },
  text: {
    fontSize: 9,
    fontWeight: 'bold',
  },
  textActive: {
    color: '#39FF14',
  },
  textInactive: {
    color: '#8888AA',
  },
});