// src/services/streakService.ts
import { supabase } from '../utils/supabase';

const STREAK_KEY = 'vibespeak_user_streak_count';
const LAST_DATE_KEY = 'vibespeak_user_last_study_date';

export interface StreakData {
  count: number;
  isStudiedToday: boolean;
}

// Hàm lấy ngày dạng YYYY-MM-DD theo giờ địa phương
const getLocalDateString = (date = new Date()): string => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

// 🎯 1. LẤY SỐ NGÀY STREAK HIỆN TẠI
export const getStreakData = (): StreakData => {
  try {
    const rawCount = localStorage.getItem(STREAK_KEY);
    const lastDate = localStorage.getItem(LAST_DATE_KEY);

    if (!lastDate || !rawCount) {
      return { count: 0, isStudiedToday: false };
    }

    const todayStr = getLocalDateString();
    const count = parseInt(rawCount, 10) || 0;

    if (lastDate === todayStr) {
      return { count, isStudiedToday: true };
    }

    // Tính khoảng cách ngày so với hôm nay
    const today = new Date(todayStr);
    const last = new Date(lastDate);
    const diffDays = Math.round((today.getTime() - last.getTime()) / (1000 * 60 * 60 * 24));

    if (diffDays === 1) {
      // Ngày học gần nhất là hôm qua -> Chuỗi còn nguyên, hôm nay chưa học
      return { count, isStudiedToday: false };
    }

    // Đã đứt quãng từ 2 ngày trở lên -> Chuỗi reset về 0
    return { count: 0, isStudiedToday: false };
  } catch (e) {
    return { count: 0, isStudiedToday: false };
  }
};

// 🎯 2. TỰ ĐỘNG CẬP NHẬT STREAK KHI NỘP BÀI THÀNH CÔNG
export const recordStudySession = async (): Promise<number> => {
  try {
    const todayStr = getLocalDateString();
    const lastDate = localStorage.getItem(LAST_DATE_KEY);
    const currentCount = parseInt(localStorage.getItem(STREAK_KEY) || '0', 10);

    let nextCount = currentCount;

    if (!lastDate) {
      // Lần đầu tiên học
      nextCount = 1;
    } else if (lastDate === todayStr) {
      // Đã học hôm nay rồi -> Giữ nguyên chuỗi, không cộng dồn thêm
      nextCount = currentCount === 0 ? 1 : currentCount;
    } else {
      const today = new Date(todayStr);
      const last = new Date(lastDate);
      const diffDays = Math.round((today.getTime() - last.getTime()) / (1000 * 60 * 60 * 24));

      if (diffDays === 1) {
        // Học liên tiếp ngày hôm sau -> Tăng thêm 1 ngày
        nextCount = currentCount + 1;
      } else {
        // Đứt chuỗi -> Bắt đầu chuỗi mới từ 1
        nextCount = 1;
      }
    }

    localStorage.setItem(STREAK_KEY, String(nextCount));
    localStorage.setItem(LAST_DATE_KEY, todayStr);

    // Kích hoạt sự kiện để Header tự cập nhật giao diện ngay lập tức
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new Event('vibespeak_streak_updated'));
    }

    // Đồng bộ lên Supabase User Metadata nếu học viên đã đăng nhập
    if (supabase) {
      const { data } = await supabase.auth.getUser();
      if (data?.user) {
        await supabase.auth.updateUser({
          data: {
            streak_count: nextCount,
            last_study_date: todayStr
          }
        });
      }
    }

    return nextCount;
  } catch (err) {
    console.warn("⚠️ Lỗi cập nhật streak:", err);
    return 1;
  }
};