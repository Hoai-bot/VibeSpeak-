// src/utils/offlineStorage.ts

export interface OfflineSubmission {
  id: string;
  audioBlob: Blob;
  prompt: string;
  stationType: string;
  cefrLevel: string;
  timestamp: number;
  retryCount: number;
}

const DB_NAME = 'VibeSpeakOfflineDB';
const STORE_NAME = 'pending_submissions';
const DB_VERSION = 1;

function openDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    if (typeof window === 'undefined' || !window.indexedDB) {
      reject(new Error('IndexedDB không được hỗ trợ trên môi trường này'));
      return;
    }

    const request = window.indexedDB.open(DB_NAME, DB_VERSION);

    request.onupgradeneeded = (event: any) => {
      const db = event.target.result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME, { keyPath: 'id' });
      }
    };

    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

// 💾 Lưu bài làm ngoại tuyến vào IndexedDB
export async function saveOfflineSubmission(submission: Omit<OfflineSubmission, 'id' | 'timestamp' | 'retryCount'>): Promise<string> {
  try {
    const db = await openDB();
    const id = `sub_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    const fullItem: OfflineSubmission = {
      ...submission,
      id,
      timestamp: Date.now(),
      retryCount: 0,
    };

    return new Promise((resolve, reject) => {
      const transaction = db.transaction(STORE_NAME, 'readwrite');
      const store = transaction.objectStore(STORE_NAME);
      const request = store.put(fullItem);

      request.onsuccess = () => resolve(id);
      request.onerror = () => reject(request.error);
    });
  } catch (error) {
    console.warn('Lỗi khi lưu bài offline vào IndexedDB:', error);
    throw error;
  }
}

// 📦 Lấy tất cả bài thi đang chờ đồng bộ
export async function getPendingSubmissions(): Promise<OfflineSubmission[]> {
  try {
    const db = await openDB();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(STORE_NAME, 'readonly');
      const store = transaction.objectStore(STORE_NAME);
      const request = store.getAll();

      request.onsuccess = () => resolve(request.result || []);
      request.onerror = () => reject(request.error);
    });
  } catch (error) {
    console.warn('Không thể đọc IndexedDB:', error);
    return [];
  }
}

// 🗑️ Xóa bản ghi sau khi đã đồng bộ thành công lên server
export async function removeOfflineSubmission(id: string): Promise<void> {
  try {
    const db = await openDB();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(STORE_NAME, 'readwrite');
      const store = transaction.objectStore(STORE_NAME);
      const request = store.delete(id);

      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  } catch (error) {
    console.warn('Lỗi xóa bản ghi IndexedDB:', error);
  }
}