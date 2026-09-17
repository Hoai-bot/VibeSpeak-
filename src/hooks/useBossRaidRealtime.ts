// src/hooks/useBossRaidRealtime.ts
import { useState, useEffect } from 'react';
// Import db từ firebaseClient mà bạn đã cấu hình sẵn
import { db } from '../services/firebaseClient';
import { doc, onSnapshot } from 'firebase/firestore';

export function useBossRaidRealtime() {
  const [bossId, setBossId] = useState<string | null>('BOSS_NIGHTMARE_01');
  const [bossHp, setBossHp] = useState<number>(1000);

  useEffect(() => {
    try {
      if (!db) return;

      // Đăng ký lắng nghe sự thay đổi Realtime của Boss trong Firestore
      const bossRef = doc(db, 'bosses', 'BOSS_NIGHTMARE_01');
      const unsubscribe = onSnapshot(
        bossRef,
        (snapshot) => {
          if (snapshot.exists()) {
            const data = snapshot.data();
            setBossHp(data?.hp ?? 1000);
            if (data?.id) setBossId(data.id);
          }
        },
        (error) => {
          console.warn('⚠️ Lỗi kết nối Firebase Realtime Boss Raid:', error);
        }
      );

      return () => unsubscribe();
    } catch (err) {
      console.warn('⚠️ Không thể khởi chạy Firebase Realtime, dùng mock data:', err);
    }
  }, []);

  return { bossId, bossHp };
}