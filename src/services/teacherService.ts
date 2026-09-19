// src/services/teacherService.ts

export interface StudentStats {
  id: string;
  name: string;
  className: string;
  cefrLevel: 'A1' | 'A2' | 'B1' | 'B2' | 'C1';
  totalMinutes: number;
  matchesPlayed: number;
  winRate: number;
  avgScore: number;
  badges: string[];
}

export interface ClassSummary {
  className: string;
  totalStudents: number;
  avgScore: number;
  topPerformer: string;
}

// Giả lập dữ liệu báo cáo dành cho Giáo viên
export const getTeacherDashboardData = (): { classes: ClassSummary[]; students: StudentStats[] } => {
  return {
    classes: [
      { className: '10A1', totalStudents: 38, avgScore: 82, topPerformer: 'Nguyễn Văn An' },
      { className: '11B2', totalStudents: 40, avgScore: 76, topPerformer: 'Trần Thị Bích' },
      { className: '12C3', totalStudents: 35, avgScore: 88, topPerformer: 'Lê Hoàng Nam' },
    ],
    students: [
      { id: '1', name: 'Nguyễn Văn An', className: '10A1', cefrLevel: 'B2', totalMinutes: 145, matchesPlayed: 24, winRate: 83, avgScore: 88, badges: ['🔥 7-Day Streak', '⚔️ Arena Master', '🎯 Pronunciation Ace'] },
      { id: '2', name: 'Trần Thị Bích', className: '11B2', cefrLevel: 'B1', totalMinutes: 98, matchesPlayed: 16, winRate: 68, avgScore: 78, badges: ['⚡ Fast Responder', '🎭 Roleplay Star'] },
      { id: '3', name: 'Lê Hoàng Nam', className: '12C3', cefrLevel: 'C1', totalMinutes: 210, matchesPlayed: 35, winRate: 91, avgScore: 92, badges: ['🏆 Grand Champion', '🔥 14-Day Streak', '💬 Fluency King'] },
      { id: '4', name: 'Phạm Minh Khoa', className: '10A1', cefrLevel: 'A2', totalMinutes: 60, matchesPlayed: 10, winRate: 50, avgScore: 68, badges: ['🌱 Rising Star'] },
    ]
  };
};