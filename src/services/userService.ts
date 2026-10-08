// src/services/userService.ts
import { db, auth } from './firebaseClient';
import { doc, getDoc, setDoc, updateDoc, increment } from 'firebase/firestore';

export interface UserStats {
  uid: string;
  displayName: string;
  totalXp: number;
  level: number;
  streak: number;
  station1Completed: number;
  station2Wins: number;
  station2Losses: number;
  lastActive: string;
}

export interface UserProgress {
  totalXp: number;
  streakDays: number;
  totalDrillsCompleted: number;
  completedStations: number[];
}

// 🎯 INTERFACE CHO BÀI NỘP ROLEPLAY / LƯỢT ĐẤU CỦA GIÁO VIÊN
export interface RoleplaySubmission {
  id: string;
  studentName: string;
  pairName: string;
  mode: string;
  cefrLevel: string;
  score: number;
  transcript: string;
  audioUrl?: string;
  feedback: string;
  timestamp: string;
}

const STORAGE_KEY_SUBMISSIONS = 'vibespeak_teacher_submissions';

// 🎯 HÀM LƯU BÀI NỘP DÀNH CHO BẢNG ĐIỂM GIÁO VIÊN
export const saveSubmissionForTeacher = (
  submission: Omit<RoleplaySubmission, 'id' | 'timestamp'>
) => {
  try {
    const existing = getSubmissionsForTeacher();
    const newEntry: RoleplaySubmission = {
      ...submission,
      id: Date.now().toString(),
      timestamp: new Date().toLocaleString('vi-VN'),
    };
    const updated = [newEntry, ...existing];
    if (typeof window !== 'undefined') {
      localStorage.setItem(STORAGE_KEY_SUBMISSIONS, JSON.stringify(updated));
    }
  } catch (e) {
    console.error('Lỗi lưu điểm cho giáo viên:', e);
  }
};

// 🎯 HÀM LẤY DANH SÁCH BÀI NỘP CỦA SINH VIÊN DÀNH CHO GIÁO VIÊN
export const getSubmissionsForTeacher = (): RoleplaySubmission[] => {
  try {
    if (typeof window !== 'undefined') {
      const data = localStorage.getItem(STORAGE_KEY_SUBMISSIONS);
      return data ? JSON.parse(data) : [];
    }
  } catch (e) {
    console.error('Lỗi lấy danh sách điểm:', e);
  }
  return [];
};

// 🎯 HÀM XÓA LỊCH SỬ BÀI NỘP KHI CẦN REFRESH LỚP HỌC MỚI
export const clearTeacherSubmissions = () => {
  if (typeof window !== 'undefined') {
    localStorage.removeItem(STORAGE_KEY_SUBMISSIONS);
  }
};

// Lấy tên đã lưu trong LocalStorage
export const getStoredPlayerName = (): string => {
  return localStorage.getItem('vibe_player_name') || localStorage.getItem('vibe_display_name') || '';
};

// Lưu tên người dùng / mã tên sinh viên
export const savePlayerName = async (newName: string): Promise<string> => {
  localStorage.setItem('vibe_player_name', newName);
  localStorage.setItem('vibe_display_name', newName);

  const uid = auth.currentUser?.uid || 'GUEST_USER';
  try {
    if (db && uid !== 'GUEST_USER') {
      const userRef = doc(db, 'users', uid);
      await setDoc(userRef, { displayName: newName }, { merge: true });
    }
  } catch (e) {
    console.warn('Không thể đồng bộ tên lên DB:', e);
  }
  return newName;
};

export const getUserProgress = async (): Promise<UserProgress> => {
  const xp = parseInt(localStorage.getItem('vibe_xp') || '180', 10);
  const streak = parseInt(localStorage.getItem('vibe_streak') || '3', 10);
  const drills = parseInt(localStorage.getItem('vibe_s1_count') || '12', 10);

  return {
    totalXp: xp,
    streakDays: streak,
    totalDrillsCompleted: drills,
    completedStations: [1, 2]
  };
};

export const getUserStats = async (uid: string): Promise<UserStats> => {
  const localFallback: UserStats = {
    uid,
    displayName: getStoredPlayerName() || auth.currentUser?.displayName || 'CyberWarrior',
    totalXp: parseInt(localStorage.getItem('vibe_xp') || '150', 10),
    level: parseInt(localStorage.getItem('vibe_level') || '2', 10),
    streak: parseInt(localStorage.getItem('vibe_streak') || '3', 10),
    station1Completed: parseInt(localStorage.getItem('vibe_s1_count') || '12', 10),
    station2Wins: parseInt(localStorage.getItem('vibe_s2_wins') || '8', 10),
    station2Losses: parseInt(localStorage.getItem('vibe_s2_losses') || '3', 10),
    lastActive: new Date().toLocaleDateString('vi-VN')
  };

  try {
    if (!db) return localFallback;
    const userRef = doc(db, 'users', uid);
    const snap = await getDoc(userRef);
    if (snap.exists()) {
      return snap.data() as UserStats;
    } else {
      await setDoc(userRef, localFallback);
      return localFallback;
    }
  } catch (e) {
    return localFallback;
  }
};

export const updateUserProgress = async (
  station: 1 | 2,
  earnedXp: number,
  isWin: boolean = true
) => {
  const uid = auth.currentUser?.uid || 'GUEST_USER';
  
  const currentXp = parseInt(localStorage.getItem('vibe_xp') || '0', 10) + earnedXp;
  localStorage.setItem('vibe_xp', currentXp.toString());
  localStorage.setItem('vibe_level', Math.floor(currentXp / 100 + 1).toString());

  if (station === 1) {
    const s1 = parseInt(localStorage.getItem('vibe_s1_count') || '0', 10) + 1;
    localStorage.setItem('vibe_s1_count', s1.toString());
  } else {
    if (isWin) {
      const wins = parseInt(localStorage.getItem('vibe_s2_wins') || '0', 10) + 1;
      localStorage.setItem('vibe_s2_wins', wins.toString());
    } else {
      const losses = parseInt(localStorage.getItem('vibe_s2_losses') || '0', 10) + 1;
      localStorage.setItem('vibe_s2_losses', losses.toString());
    }
  }

  try {
    if (!db || uid === 'GUEST_USER') return;
    const userRef = doc(db, 'users', uid);
    await updateDoc(userRef, {
      totalXp: increment(earnedXp),
      station1Completed: station === 1 ? increment(1) : increment(0),
      station2Wins: station === 2 && isWin ? increment(1) : increment(0),
      station2Losses: station === 2 && !isWin ? increment(1) : increment(0),
      lastActive: new Date().toLocaleDateString('vi-VN')
    });
  } catch (e) {
    console.warn('Lưu Firestore bỏ qua:', e);
  }
};