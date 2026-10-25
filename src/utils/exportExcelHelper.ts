// src/utils/exportExcelHelper.ts
import { RoleplaySubmission } from '../services/userService';

const escapeXml = (unsafe: any): string => {
  if (unsafe === null || unsafe === undefined) return '';
  return String(unsafe)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
};

export const exportSubmissionsToExcel = (submissions: RoleplaySubmission[], fileName = 'Bang_Diem_VibeSpeak') => {
  if (!submissions || submissions.length === 0) {
    alert("⚠️ Không có dữ liệu bài nộp để xuất file!");
    return;
  }

  let totalScore = 0;
  let rowsXml = '';

  submissions.forEach((item, index) => {
    const score = Number(item.score) || 0;
    totalScore += score;

    let scoreStyle = 'ScoreMid';
    let gradeLabel = 'Khá';
    if (score >= 85) {
      scoreStyle = 'ScoreHigh';
      gradeLabel = 'Xuất Sắc';
    } else if (score < 50) {
      scoreStyle = 'ScoreLow';
      gradeLabel = 'Cần Rèn Luyện';
    }

    const rowBg = index % 2 === 1 ? 'DataZebra' : 'DataCell';

    rowsXml += `
    <Row ss:Height="40">
      <Cell ss:StyleID="CenterCell"><Data ss:Type="Number">${index + 1}</Data></Cell>
      <Cell ss:StyleID="${rowBg}"><Data ss:Type="String">${escapeXml(item.studentName || item.pairName || 'Học viên')}</Data></Cell>
      <Cell ss:StyleID="CenterCell"><Data ss:Type="String">${escapeXml(item.className || 'LỚP CHUNG')}</Data></Cell>
      <Cell ss:StyleID="CenterCell"><Data ss:Type="String">${escapeXml(item.mode || 'SOLO')}</Data></Cell>
      <Cell ss:StyleID="CenterCell"><Data ss:Type="String">${escapeXml(item.cefrLevel || 'A1')}</Data></Cell>
      <Cell ss:StyleID="${scoreStyle}"><Data ss:Type="Number">${score}</Data></Cell>
      <Cell ss:StyleID="CenterCell"><Data ss:Type="String">${gradeLabel}</Data></Cell>
      <Cell ss:StyleID="${rowBg}"><Data ss:Type="String">${escapeXml(item.transcript || '(Không có âm thanh)')}</Data></Cell>
      <Cell ss:StyleID="${rowBg}"><Data ss:Type="String">${escapeXml(item.feedback || item.detailedFeedback || 'Đã ghi nhận')}</Data></Cell>
      <Cell ss:StyleID="CenterCell"><Data ss:Type="String">${escapeXml(item.timestamp || '')}</Data></Cell>
    </Row>`;
  });

  const avgScore = (totalScore / submissions.length).toFixed(1);

  // Cấu trúc XML chuẩn Excel (SpreadsheetML)
  const excelXml = `<?xml version="1.0" encoding="UTF-8"?>
<?mso-application progid="Excel.Sheet"?>
<Workbook xmlns="urn:schemas-microsoft-com:office:spreadsheet"
 xmlns:o="urn:schemas-microsoft-com:office:office"
 xmlns:x="urn:schemas-microsoft-com:office:excel"
 xmlns:ss="urn:schemas-microsoft-com:office:spreadsheet">
 <Styles>
  <Style ss:ID="Default" ss:Name="Normal">
   <Alignment ss:Vertical="Center"/>
   <Font ss:FontName="Calibri" ss:Size="10"/>
  </Style>
  <!-- Style Banner Tiêu đề lớn -->
  <Style ss:ID="HeaderBanner">
   <Alignment ss:Horizontal="Center" ss:Vertical="Center"/>
   <Font ss:FontName="Calibri" ss:Size="14" ss:Bold="1" ss:Color="#FFFFFF"/>
   <Interior ss:Color="#1A0B2E" ss:Pattern="Solid"/>
  </Style>
  <!-- Style Cột Tiêu đề bảng -->
  <Style ss:ID="ColHeader">
   <Alignment ss:Horizontal="Center" ss:Vertical="Center" ss:WrapText="1"/>
   <Font ss:FontName="Calibri" ss:Size="10" ss:Bold="1" ss:Color="#FFFFFF"/>
   <Interior ss:Color="#2D1152" ss:Pattern="Solid"/>
   <Borders>
    <Border ss:Position="Bottom" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#1A0B2E"/>
    <Border ss:Position="Left" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#1A0B2E"/>
    <Border ss:Position="Right" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#1A0B2E"/>
    <Border ss:Position="Top" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#1A0B2E"/>
   </Borders>
  </Style>
  <!-- Style Ô nội dung tự động xuống dòng WrapText -->
  <Style ss:ID="DataCell">
   <Alignment ss:Vertical="Center" ss:WrapText="1"/>
   <Font ss:FontName="Calibri" ss:Size="10"/>
   <Borders>
    <Border ss:Position="Bottom" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#E5E5E5"/>
    <Border ss:Position="Left" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#E5E5E5"/>
    <Border ss:Position="Right" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#E5E5E5"/>
    <Border ss:Position="Top" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#E5E5E5"/>
   </Borders>
  </Style>
  <!-- Dòng xen kẽ (Zebra) -->
  <Style ss:ID="DataZebra">
   <Alignment ss:Vertical="Center" ss:WrapText="1"/>
   <Font ss:FontName="Calibri" ss:Size="10"/>
   <Interior ss:Color="#F9F6FC" ss:Pattern="Solid"/>
   <Borders>
    <Border ss:Position="Bottom" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#E5E5E5"/>
    <Border ss:Position="Left" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#E5E5E5"/>
    <Border ss:Position="Right" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#E5E5E5"/>
    <Border ss:Position="Top" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#E5E5E5"/>
   </Borders>
  </Style>
  <Style ss:ID="CenterCell">
   <Alignment ss:Horizontal="Center" ss:Vertical="Center"/>
   <Font ss:FontName="Calibri" ss:Size="10"/>
   <Borders>
    <Border ss:Position="Bottom" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#E5E5E5"/>
    <Border ss:Position="Left" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#E5E5E5"/>
    <Border ss:Position="Right" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#E5E5E5"/>
    <Border ss:Position="Top" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#E5E5E5"/>
   </Borders>
  </Style>
  <!-- Style Màu Điểm Số -->
  <Style ss:ID="ScoreHigh">
   <Alignment ss:Horizontal="Center" ss:Vertical="Center"/>
   <Font ss:FontName="Calibri" ss:Size="10" ss:Bold="1" ss:Color="#008000"/>
   <Borders>
    <Border ss:Position="Bottom" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#E5E5E5"/>
    <Border ss:Position="Left" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#E5E5E5"/>
    <Border ss:Position="Right" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#E5E5E5"/>
    <Border ss:Position="Top" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#E5E5E5"/>
   </Borders>
  </Style>
  <Style ss:ID="ScoreMid">
   <Alignment ss:Horizontal="Center" ss:Vertical="Center"/>
   <Font ss:FontName="Calibri" ss:Size="10" ss:Bold="1" ss:Color="#006699"/>
   <Borders>
    <Border ss:Position="Bottom" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#E5E5E5"/>
    <Border ss:Position="Left" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#E5E5E5"/>
    <Border ss:Position="Right" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#E5E5E5"/>
    <Border ss:Position="Top" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#E5E5E5"/>
   </Borders>
  </Style>
  <Style ss:ID="ScoreLow">
   <Alignment ss:Horizontal="Center" ss:Vertical="Center"/>
   <Font ss:FontName="Calibri" ss:Size="10" ss:Bold="1" ss:Color="#CC0000"/>
   <Borders>
    <Border ss:Position="Bottom" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#E5E5E5"/>
    <Border ss:Position="Left" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#E5E5E5"/>
    <Border ss:Position="Right" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#E5E5E5"/>
    <Border ss:Position="Top" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#E5E5E5"/>
   </Borders>
  </Style>
  <!-- Style Dòng Tổng Kết -->
  <Style ss:ID="SummaryRow">
   <Alignment ss:Horizontal="Right" ss:Vertical="Center"/>
   <Font ss:FontName="Calibri" ss:Size="10" ss:Bold="1" ss:Color="#1A0B2E"/>
   <Interior ss:Color="#E8DAF5" ss:Pattern="Solid"/>
   <Borders>
    <Border ss:Position="Bottom" ss:LineStyle="Double" ss:Weight="3" ss:Color="#1A0B2E"/>
    <Border ss:Position="Top" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#1A0B2E"/>
   </Borders>
  </Style>
  <Style ss:ID="SummaryScore">
   <Alignment ss:Horizontal="Center" ss:Vertical="Center"/>
   <Font ss:FontName="Calibri" ss:Size="11" ss:Bold="1" ss:Color="#1A0B2E"/>
   <Interior ss:Color="#E8DAF5" ss:Pattern="Solid"/>
   <Borders>
    <Border ss:Position="Bottom" ss:LineStyle="Double" ss:Weight="3" ss:Color="#1A0B2E"/>
    <Border ss:Position="Top" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#1A0B2E"/>
   </Borders>
  </Style>
 </Styles>
 <Worksheet ss:Name="Bảng Điểm VibeSpeak">
  <Table>
   <!-- Định nghĩa độ rộng từng cột cố định -->
   <Column ss:Width="35"/>  <!-- STT -->
   <Column ss:Width="160"/> <!-- Họ Tên -->
   <Column ss:Width="90"/>  <!-- Lớp -->
   <Column ss:Width="90"/>  <!-- Mode -->
   <Column ss:Width="65"/>  <!-- CEFR -->
   <Column ss:Width="65"/>  <!-- Điểm -->
   <Column ss:Width="90"/>  <!-- Đánh giá -->
   <Column ss:Width="250"/> <!-- Transcript -->
   <Column ss:Width="280"/> <!-- Feedback -->
   <Column ss:Width="120"/> <!-- Thời gian -->

   <Row ss:Height="32">
    <Cell ss:MergeAcross="9" ss:StyleID="HeaderBanner">
      <Data ss:Type="String">VIBESPEAK - BẢNG ĐIỂM HỌC VIÊN LUYỆN NÓI CEFR (A1 - C2)</Data>
    </Cell>
   </Row>
   <Row ss:Height="24">
    <Cell ss:StyleID="ColHeader"><Data ss:Type="String">STT</Data></Cell>
    <Cell ss:StyleID="ColHeader"><Data ss:Type="String">Họ &amp; Tên Học Viên</Data></Cell>
    <Cell ss:StyleID="ColHeader"><Data ss:Type="String">Mã Lớp</Data></Cell>
    <Cell ss:StyleID="ColHeader"><Data ss:Type="String">Chế Độ</Data></Cell>
    <Cell ss:StyleID="ColHeader"><Data ss:Type="String">Level</Data></Cell>
    <Cell ss:StyleID="ColHeader"><Data ss:Type="String">Điểm</Data></Cell>
    <Cell ss:StyleID="ColHeader"><Data ss:Type="String">Đánh Giá</Data></Cell>
    <Cell ss:StyleID="ColHeader"><Data ss:Type="String">Lời Thoại (Transcript)</Data></Cell>
    <Cell ss:StyleID="ColHeader"><Data ss:Type="String">Nhận Xét Chi Tiết (AI Feedback)</Data></Cell>
    <Cell ss:StyleID="ColHeader"><Data ss:Type="String">Thời Gian Nộp</Data></Cell>
   </Row>
   ${rowsXml}
   <Row ss:Height="24">
    <Cell ss:MergeAcross="4" ss:StyleID="SummaryRow"><Data ss:Type="String">ĐIỂM TRUNG BÌNH TOÀN ĐOÀN:</Data></Cell>
    <Cell ss:StyleID="SummaryScore"><Data ss:Type="Number">${avgScore}</Data></Cell>
    <Cell ss:MergeAcross="3" ss:StyleID="SummaryRow"><Data ss:Type="String"></Data></Cell>
   </Row>
  </Table>
 </Worksheet>
</Workbook>`;

  // Tải file trực tiếp về máy tính người dùng
  const blob = new Blob(['\uFEFF' + excelXml], { type: 'application/vnd.ms-excel;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `${fileName}_${new Date().toISOString().slice(0, 10)}.xls`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
};