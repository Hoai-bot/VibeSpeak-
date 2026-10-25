// src/services/notificationService.ts
import { getStreakData } from './streakService';
import { getWeakVaultSummary } from './weakPointsService';
import { getCurrentWeekRange } from './leagueService';

const NOTIF_PERMISSION_KEY = 'vibespeak_notif_enabled';
const LAST_NOTIF_DATE_KEY = 'vibespeak_last_notif_date';

export const isNotificationSupported = (): boolean => {
  return typeof window !== 'undefined' && 'Notification' in window;
};

// 🎯 1. REQUEST NOTIFICATION PERMISSION
export const requestNotificationPermission = async (): Promise<boolean> => {
  if (!isNotificationSupported()) return false;

  try {
    const permission = await Notification.requestPermission();
    const granted = permission === 'granted';
    if (granted) {
      localStorage.setItem(NOTIF_PERMISSION_KEY, 'true');
      sendNotification(
        "⚡ Thông báo VibeSpeak Đã Bật!",
        "Bạn sẽ nhận được cảnh báo bảo vệ Streak và lịch phục thù lỗi phát âm mỗi ngày."
      );
    }
    return granted;
  } catch (err) {
    console.warn("Notification request failed:", err);
    return false;
  }
};

// 🎯 2. SEND INSTANT NOTIFICATION
export const sendNotification = (title: string, body: string, icon = '🔥') => {
  if (!isNotificationSupported() || Notification.permission !== 'granted') return;

  try {
    const notif = new Notification(title, {
      body,
      icon: '/favicon.ico',
      badge: '/favicon.ico',
    });

    notif.onclick = () => {
      window.focus();
      notif.close();
    };
  } catch (e) {
    // Fallback for Service Worker push environments if available
    if (navigator.serviceWorker && navigator.serviceWorker.ready) {
      navigator.serviceWorker.ready.then((reg) => {
        reg.showNotification(title, { body, icon: '/favicon.ico' });
      });
    }
  }
};

// 🎯 3. EVALUATE CONTEXT & DISPATCH SMART NOTIFICATION
export const checkAndTriggerSmartNotification = () => {
  if (!isNotificationSupported() || Notification.permission !== 'granted') return;

  const todayStr = new Date().toISOString().split('T')[0];
  const lastNotifDate = localStorage.getItem(LAST_NOTIF_DATE_KEY);

  // Prevent spamming: only fire once per day
  if (lastNotifDate === todayStr) return;

  const now = new Date();
  const currentHour = now.getHours();

  // Priority 1: Spaced Repetition Due Words (Check in morning/afternoon: 11 AM - 3 PM)
  const { dueForReview } = getWeakVaultSummary();
  if (dueForReview.length > 0 && currentHour >= 11 && currentHour <= 15) {
    sendNotification(
      `🎯 Bạn có ${dueForReview.length} âm cần phục thù hôm nay!`,
      `Các từ như "${dueForReview[0].word.toUpperCase()}" đã đến hạn ôn tập 60s để xóa khỏi blacklist.`
    );
    localStorage.setItem(LAST_NOTIF_DATE_KEY, todayStr);
    return;
  }

  // Priority 2: Streak Protection (Evening reminder: after 7 PM if unstudied)
  const streak = getStreakData();
  if (!streak.isStudiedToday && currentHour >= 19) {
    sendNotification(
      `🔥 Cảnh Báo Chuỗi Streak ${streak.count} Ngày!`,
      "Chỉ còn vài tiếng trước khi chuỗi ngày học của bạn bị dập tắt. Vào hoàn thành 1 bài nói 30s ngay!"
    );
    localStorage.setItem(LAST_NOTIF_DATE_KEY, todayStr);
    return;
  }

  // Priority 3: Weekend League Urgency (Saturdays & Sundays)
  const dayOfWeek = now.getDay();
  if ((dayOfWeek === 6 || dayOfWeek === 0) && currentHour >= 14) {
    const { daysRemaining } = getCurrentWeekRange();
    sendNotification(
      "🏆 Giải Đấu Tuần Đang Bước Vào Giai Đoạn Nước Rút!",
      `Chỉ còn ${daysRemaining === 0 ? 'hôm nay' : '1 ngày'} để ghi điểm giành vé thăng hạng Top 5.`
    );
    localStorage.setItem(LAST_NOTIF_DATE_KEY, todayStr);
  }
};