// src/services/userService.ts
export const fetchSubmissionsFromCloud = async (selectedClass?: string): Promise<RoleplaySubmission[]> => {
  try {
    if (!supabase) return [];

    // ⚡ GIẢI PHÁP MỚI: Bỏ .order('created_at') để tránh Statement Timeout 57014
    const { data: results, error } = await supabase
      .from('assessment_results')
      .select('id, score, transcript, feedback, audio_url, created_at, user_id')
      .limit(100); // Lấy nhanh 100 bản ghi thô

    if (error) {
      console.error("❌ Lỗi truy vấn Supabase:", error.code, error.message, error.details);
      return [];
    }

    if (!results || results.length === 0) return [];

    const parsedList: RoleplaySubmission[] = results.map((item: any) => {
      let mode = 'SOLO';
      let cefrLevel = 'A1';
      let extractedClass = 'LỚP CHUNG';
      let playerName = 'Học viên';
      let cleanFeedback = item.feedback || '';

      if (cleanFeedback && cleanFeedback.startsWith('[') && cleanFeedback.includes(']:')) {
        const parts = cleanFeedback.split(']:');
        const headerTag = parts[0].replace('[', '');
        cleanFeedback = parts.slice(1).join(']:').trim();

        const tagParts = headerTag.split('|').map((p) => p.trim());

        if (tagParts[0]) {
          const meta = tagParts[0].split('-');
          mode = String(meta[0] || 'SOLO').trim().toUpperCase();
          cefrLevel = String(meta[1] || 'A1').trim().toUpperCase();
        }

        for (let i = 1; i < tagParts.length; i++) {
          const part = tagParts[i];
          if (part.startsWith('CLASS:')) {
            extractedClass = part.replace('CLASS:', '').trim().toUpperCase() || 'LỚP CHUNG';
          } else if (part.length > 0) {
            playerName = part;
          }
        }
      }

      if (extractedClass.startsWith('CLASS:')) {
        extractedClass = extractedClass.replace('CLASS:', '').trim();
      }
      if (!extractedClass) extractedClass = 'LỚP CHUNG';

      return {
        id: item.id || String(Math.random()),
        studentName: playerName,
        pairName: playerName,
        className: extractedClass,
        score: Number(item.score) || 0,
        mode: String(mode).toUpperCase(),
        cefrLevel: String(cefrLevel).toUpperCase(),
        transcript: item.transcript || '',
        audioUrl: item.audio_url || '',
        feedback: cleanFeedback,
        timestamp: item.created_at ? new Date(item.created_at).toLocaleString('vi-VN') : '',
        rawCreatedAt: item.created_at ? new Date(item.created_at).getTime() : 0, // Lưu mốc thời gian dạng số
      };
    });

    // 🎯 TỰ SẮP XẾP BẰNG JAVASCRIPT TRÊN TRÌNH DUYỆT (Siêu nhanh, không bị tốn tài nguyên DB)
    parsedList.sort((a: any, b: any) => b.rawCreatedAt - a.rawCreatedAt);

    let filtered = parsedList;
    if (selectedClass && selectedClass !== 'ALL') {
      filtered = parsedList.filter(
        (s) => s.className?.toUpperCase() === selectedClass.toUpperCase()
      );
    }

    // Tự động sắp xếp và gắn thứ hạng (Rank) theo Điểm số
    const sortedForRank = [...filtered].sort((a, b) => b.score - a.score);
    return filtered.map((item) => {
      const rankIndex = sortedForRank.findIndex((r) => r.id === item.id);
      return {
        ...item,
        rank: rankIndex !== -1 ? rankIndex + 1 : undefined,
      };
    });
  } catch (err) {
    console.warn("⚠️ Lỗi fetchSubmissionsFromCloud:", err);
  }
  return [];
};