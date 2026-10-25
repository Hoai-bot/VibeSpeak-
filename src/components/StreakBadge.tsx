// src/components/StreakBadge.tsx
import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { getStreakData, StreakData } from '../services/streakService';

export default function StreakBadge() {
  const [streak, setStreak] = useState<StreakData>({ count: 0, isStudiedToday: false });

  const refreshStreak = () => {
    setStreak(getStreakData());
  };

  useEffect(() => {
    refreshStreak();

    // Lắng nghe sự kiện cập nhật khi vừa nộp bài xong
    if (typeof window !== 'undefined') {
      window.addEventListener('vibespeak_streak_updated', refreshStreak);
      return () => {
        window.removeEventListener('vibespeak_streak_updated', refreshStreak);
      };
    }
  }, []);

  return (
    <TouchableOpacity 
      style={[
        styles.badge, 
        streak.isStudiedToday ? styles.badgeActive : styles.badgePending
      ]}
      activeOpacity={0.8}
    >
      <Text style={styles.icon}>{streak.isStudiedToday ? '🔥' : '⚡'}</Text>
      <Text style={[styles.text, streak.isStudiedToday ? styles.textActive : styles.textPending]}>
        {streak.count} {streak.count === 1 ? 'NGÀY' : 'NGÀY'}
      </Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 5,
    paddingHorizontal: 10,
    borderRadius: 20,
    borderWidth: 1.5,
    gap: 4,
  },
  badgeActive: {
    backgroundColor: 'rgba(255, 69, 0, 0.15)',
    borderColor: '#FF4500',
  },
  badgePending: {
    backgroundColor: 'rgba(255, 215, 0, 0.1)',
    borderColor: '#665522',
  },
  icon: {
    fontSize: 14,
  },
  text: {
    fontSize: 11,
    fontWeight: '900',
    letterSpacing: 0.5,
  },
  textActive: {
    color: '#FF4500',
  },
  textPending: {
    color: '#AAAABB',
  },
});