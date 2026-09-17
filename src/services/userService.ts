import { db } from './firebaseClient';
import { doc, setDoc, getDoc, updateDoc, increment, collection, addDoc, serverTimestamp } from 'firebase/firestore';

// 👤 Cập nhật hoặc cộng dồn EXP cho người chơi
export const saveUserData = async (userId: string, username: string, expGained: number) => {
  try {
    const userRef = doc(db, 'users', userId);
    const userSnap = await getDoc(userRef);

    if (!userSnap.exists()) {
      // Nếu chưa có user, tạo mới
      await setDoc(userRef, {
        username,
        exp: expGained,
        tier: 'BRONZE',
        updatedAt: serverTimestamp(),
      });
    } else {
      // Nếu đã có, cộng dồn EXP
      await updateDoc(userRef, {
        exp: increment(expGained),
        updatedAt: serverTimestamp(),
      });
    }
  } catch (error) {
    console.error('Lỗi cập nhật dữ liệu Firebase:', error);
  }
};

// 🏆 Lưu lịch sử trận đấu Arena (Trạm 2)
export const saveMatchHistory = async (userId: string, matchData: {
  mode: string;
  userScore: number;
  opponentScore: number;
  result: 'VICTORY' | 'DEFEATED' | 'DRAW';
  topic?: string;
  transcribedText?: string;
}) => {
  try {
    await addDoc(collection(db, 'match_history'), {
      userId,
      ...matchData,
      createdAt: serverTimestamp(),
    });
  } catch (error) {
    console.error('Lỗi lưu lịch sử trận đấu:', error);
  }
};