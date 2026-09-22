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

export const getUserStats = async (uid: string): Promise<UserStats> => {
  const localFallback: UserStats = {
    uid,
    displayName: auth.currentUser?.displayName || 'CyberWarrior',
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