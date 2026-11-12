// src/utils/studentSession.ts
export interface StudentProfile {
  studentName: string;
  studentCode: string;
  classCode: string;
}

const STORAGE_KEY = 'vipespeak_student_profile_v1';

export const getSavedStudentProfile = (): StudentProfile => {
  if (typeof window === 'undefined' || !window.localStorage) {
    return { studentName: '', studentCode: '', classCode: '' };
  }
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      return {
        studentName: parsed.studentName || '',
        studentCode: parsed.studentCode || '',
        classCode: (parsed.classCode || '').toUpperCase().trim(),
      };
    }
  } catch (e) {
    console.warn('Lỗi đọc localStorage:', e);
  }
  return { studentName: '', studentCode: '', classCode: '' };
};

export const saveStudentProfile = (profile: Partial<StudentProfile>): StudentProfile => {
  const current = getSavedStudentProfile();
  const updated: StudentProfile = {
    studentName: profile.studentName !== undefined ? profile.studentName.trim() : current.studentName,
    studentCode: profile.studentCode !== undefined ? profile.studentCode.trim() : current.studentCode,
    classCode: profile.classCode !== undefined ? profile.classCode.toUpperCase().trim() : current.classCode,
  };
  if (typeof window !== 'undefined' && window.localStorage) {
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
    } catch (e) {
      console.warn('Lỗi lưu localStorage:', e);
    }
  }
  return updated;
};