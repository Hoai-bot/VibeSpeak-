import { auth, db } from './firebaseClient';
import { 
  createUserWithEmailAndPassword, 
  signInWithEmailAndPassword, 
  signOut,
  updateProfile,
  User
} from 'firebase/auth';
import { doc, setDoc, getDoc, serverTimestamp } from 'firebase/firestore';

// 📝 1. ĐĂNG KÝ TÀI KHOẢN MỚI
export const registerUser = async (email: string, pass: string, username: string) => {
  const userCredential = await createUserWithEmailAndPassword(auth, email, pass);
  const user = userCredential.user;

  // Cập nhật Display Name trong Firebase Auth
  await updateProfile(user, { displayName: username });

  // Tạo Profile người chơi mặc định trên Firestore
  await setDoc(doc(db, 'users', user.uid), {
    username,
    email,
    exp: 0,
    tier: 'BRONZE',
    avatar: '🌱',
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });

  return user;
};

// 🔑 2. ĐĂNG NHẬP
export const loginUser = async (email: string, pass: string) => {
  const userCredential = await signInWithEmailAndPassword(auth, email, pass);
  return userCredential.user;
};

// 🚪 3. ĐĂNG XUẤT
export const logoutUser = async () => {
  await signOut(auth);
};

// 👤 4. LẤY THÔNG TIN USER DỰA TRÊN UID
export const getUserProfile = async (uid: string) => {
  const docRef = doc(db, 'users', uid);
  const docSnap = await getDoc(docRef);
  return docSnap.exists() ? docSnap.data() : null;
};