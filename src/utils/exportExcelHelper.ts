// src/utils/exportExcelHelper.ts
import * as XLSX from 'xlsx';

export interface SubmissionExportData {
  id?: string;
  studentName: string;
  className?: string;
  mode?: string;
  cefrLevel?: string;
  score: number;
  transcript?: string;
  feedback?: string;
  audioUrl?: string;
  created_at?: string;
  timestamp?: string;
}

/**
 * 📊 Xuất danh sách bài nộp và báo cáo học tập ra file Excel .xlsx
 * Bao gồm 2 Sheet:
 *  1. Sheet "Báo cáo chi tiết": Từng bài nộp của học viên
 *  2. Sheet "Thống kê tổng quan": Tổng số bài, điểm trung bình, tỷ lệ Đạt (>=70)
 */
export const exportSubmissionsToExcel = (
  submissions: SubmissionExportData[],
  selectedClass: string = 'ALL'
) => {
  if (!submissions || submissions.length === 0) {
    alert('⚠️ Không có dữ liệu bài nộp để xuất báo cáo!');
    return;
  }

  // 1. Chuẩn bị dữ liệu Sheet Chi tiết
  const detailedRows = submissions.map((item, index) => {
    // Tách Họ tên và MSSV nếu có dạng "Tên (MSSV: 12345)"
    let studentName = item.studentName || 'Chưa đặt tên';
    let studentCode = 'GUEST';

    const matchCode = studentName.match(/\(MSSV:\s*([^)]+)\)/i);
    if (matchCode) {
      studentCode = matchCode[1].trim();
      studentName = studentName.replace(/\(MSSV:[^)]+\)/i, '').trim();
    }

    const scoreNum = Number(item.score) || 0;
    const isPass = scoreNum >= 70;

    return {
      'STT': index + 1,
      'Mã Lớp': item.className || 'LỚP CHUNG',
      'Họ và Tên': studentName,
      'MSSV': studentCode,
      'Trạm / Chế độ': item.mode || 'SPEAKING',
      'Cấp độ CEFR': item.cefrLevel || 'B1',
      'Điểm số (/100)': scoreNum,
      'Kết quả': isPass ? 'ĐẠT (PASS)' : 'CHƯA ĐẠT (RETRY)',
      'Lời thoại AI nhận diện': item.transcript || '(Không có bản ghi)',
      'Nhận xét AI': item.feedback || '',
      'Link file ghi âm': item.audioUrl || '',
      'Thời gian nộp': item.created_at
        ? new Date(item.created_at).toLocaleString('vi-VN')
        : item.timestamp || ''
    };
  });

  // 2. Chuẩn bị dữ liệu Sheet Thống kê tổng quan (Summary)
  const totalSubmissions = submissions.length;
  const passCount = submissions.filter((s) => (Number(s.score) || 0) >= 70).length;
  const failCount = totalSubmissions - passCount;
  const passRate = totalSubmissions > 0 ? ((passCount / totalSubmissions) * 100).toFixed(1) + '%' : '0%';
  const avgScore =
    totalSubmissions > 0
      ? (
          submissions.reduce((acc, curr) => acc + (Number(curr.score) || 0), 0) /
          totalSubmissions
        ).toFixed(1)
      : '0';

  const summaryRows = [
    { 'Chỉ số thống kê': 'Lớp học được lọc', 'Giá trị': selectedClass === 'ALL' ? 'Tất cả các lớp' : selectedClass },
    { 'Chỉ số thống kê': 'Ngày xuất báo cáo', 'Giá trị': new Date().toLocaleString('vi-VN') },
    { 'Chỉ số thống kê': 'Tổng số bài thực hành đã nộp', 'Giá trị': totalSubmissions },
    { 'Chỉ số thống kê': 'Điểm số trung bình toàn lớp', 'Giá trị': `${avgScore} / 100` },
    { 'Chỉ số thống kê': 'Số lượng bài Đạt (>= 70đ)', 'Giá trị': passCount },
    { 'Chỉ số thống kê': 'Số lượng bài Cần luyện thêm (< 70đ)', 'Giá trị': failCount },
    { 'Chỉ số thống kê': 'Tỷ lệ đạt chuẩn (Pass Rate)', 'Giá trị': passRate },
  ];

  // 3. Tạo Workbook
  const workbook = XLSX.utils.book_new();

  // Sheet 1: Thống kê tổng quan
  const summarySheet = XLSX.utils.json_to_sheet(summaryRows);
  summarySheet['!cols'] = [{ wch: 30 }, { wch: 30 }];
  XLSX.utils.book_append_sheet(workbook, summarySheet, 'Tổng quan lớp');

  // Sheet 2: Danh sách chi tiết
  const detailSheet = XLSX.utils.json_to_sheet(detailedRows);
  detailSheet['!cols'] = [
    { wch: 6 },  // STT
    { wch: 15 }, // Lớp
    { wch: 25 }, // Tên
    { wch: 14 }, // MSSV
    { wch: 20 }, // Chế độ
    { wch: 12 }, // CEFR
    { wch: 15 }, // Điểm
    { wch: 18 }, // Kết quả
    { wch: 40 }, // Lời thoại
    { wch: 45 }, // Nhận xét
    { wch: 35 }, // Link audio
    { wch: 20 }  // Thời gian
  ];
  XLSX.utils.book_append_sheet(workbook, detailSheet, 'Danh sách bài nộp');

  // 4. Xuất file và kích hoạt tải về máy
  const cleanClassName = selectedClass === 'ALL' ? 'Tat_Ca_Lop' : selectedClass.replace(/[^a-zA-Z0-9]/g, '_');
  const dateStr = new Date().toISOString().slice(0, 10);
  const fileName = `VibeSpeak_BaoCao_${cleanClassName}_${dateStr}.xlsx`;

  XLSX.writeFile(workbook, fileName);
};

/**
 * 📄 Tùy chọn dự phòng: Xuất CSV nhanh thuần văn bản
 */
export const exportSubmissionsToCSV = (
  submissions: SubmissionExportData[],
  selectedClass: string = 'ALL'
) => {
  if (!submissions || submissions.length === 0) return;

  const detailSheet = XLSX.utils.json_to_sheet(submissions);
  const csvContent = XLSX.utils.sheet_to_csv(detailSheet);

  const blob = new Blob(['\uFEFF' + csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', `VibeSpeak_Export_${selectedClass}_${Date.now()}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};