// src/screens/UserProfileScreen.tsx
import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, ActivityIndicator, TouchableOpacity } from 'react-native';
import { fetchSubmissionsFromCloud, RoleplaySubmission } from '../services/userService';
import { supabase } from '../utils/supabase';
import WeakPointsScreen from './WeakPointsScreen'; // 🎯 TÍCH HỢP KHO TỪ YẾU

const LOCAL_HISTORY_KEY = 'vibespeak_user_submissions_history';

interface SkillStats {
  pronunciation: number;
  vocabulary: number;
  shadowing: number;
  reflexWpm: number;
}

export default function UserProfileScreen({ onBack }: { onBack: () => void }) {
  const [userSubmissions, setUserSubmissions] = useState<RoleplaySubmission[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [showWeakPoints, setShowWeakPoints] = useState<boolean>(false);

  // Định danh học viên / người dùng tự do
  const [displayName, setDisplayName] = useState<string>('Chiến Binh VibeSpeak');
  const [studentCode, setStudentCode] = useState<string>('');
  const [className, setClassName] = useState<string>('');
  const [userType, setUserType] = useState<'STUDENT' | 'FREELANCER'>('FREELANCER');

  // Điểm kỹ năng cho Radar Chart
  const [skills, setSkills] = useState<SkillStats>({
    pronunciation: 75,
    vocabulary: 70,
    shadowing: 65,
    reflexWpm: 80,
  });

  useEffect(() => {
    loadUserIdentity();
    loadUserProfileData();
  }, []);

  const loadUserIdentity = async () => {
    let name = 'Chiến Binh VibeSpeak';
    let code = '';
    let cls = '';

    if (typeof window !== 'undefined' && window.localStorage) {
      const savedName = localStorage.getItem('vibe_student_name');
      const savedCode = localStorage.getItem('vibe_student_code');
      const savedClass = localStorage.getItem('vibe_student_class');

      if (savedName && savedName.trim()) name = savedName.trim();
      if (savedCode && savedCode.trim()) code = savedCode.trim();
      if (savedClass && savedClass.trim()) cls = savedClass.trim();
    }

    try {
      if (supabase && supabase.auth) {
        const { data } = await supabase.auth.getUser();
        if (data?.user?.user_metadata?.full_name && name === 'Chiến Binh VibeSpeak') {
          name = data.user.user_metadata.full_name;
        }
      }
    } catch (e) {}

    setDisplayName(name);
    setStudentCode(code);
    setClassName(cls);

    const isStudent = (code !== '' && code.toUpperCase() !== 'GUEST') || (cls !== '' && cls.toUpperCase() !== 'LỚP CHUNG');
    setUserType(isStudent ? 'STUDENT' : 'FREELANCER');
  };

  const loadUserProfileData = async () => {
    setLoading(true);
    let localSubmissions: RoleplaySubmission[] = [];

    try {
      const localData = localStorage.getItem(LOCAL_HISTORY_KEY);
      if (localData) {
        localSubmissions = JSON.parse(localData) || [];
      }
    } catch (e) {
      console.warn("Lỗi đọc local history:", e);
    }

    try {
      const cloudSubmissions = await fetchSubmissionsFromCloud('ALL');
      const combinedMap = new Map<string, RoleplaySubmission>();

      [...localSubmissions, ...cloudSubmissions].forEach((item) => {
        const key = `${item.studentName}_${item.score}_${item.timestamp}`;
        if (!combinedMap.has(key)) {
          combinedMap.set(key, item);
        }
      });

      const allList = Array.from(combinedMap.values());
      setUserSubmissions(allList);

      // 🎯 Phân tích tính toán điểm 4 trụ cột kỹ năng từ dữ liệu thi đấu
      let pTotal = 0, pCount = 0;
      let vTotal = 0, vCount = 0;
      let sTotal = 0, sCount = 0;
      let rTotal = 0, rCount = 0;

      allList.forEach((sub: any) => {
        const m = (sub.mode || '').toUpperCase();
        const sc = Number(sub.score) || 0;

        if (m.includes('STATION_1') || m.includes('PRONUNCIATION')) {
          pTotal += sc; pCount++;
        } else if (m.includes('SOLO') || m.includes('RELAY') || m.includes('ROLEPLAY') || m.includes('VOCAB')) {
          vTotal += sc; vCount++;
        } else if (m.includes('SHADOW') || m.includes('GHOST')) {
          sTotal += sc; sCount++;
        } else if (m.includes('EXPRESS') || m.includes('STATION_4')) {
          rTotal += sc; rCount++;
        }
      });

      setSkills({
        pronunciation: pCount > 0 ? Math.round(pTotal / pCount) : 75,
        vocabulary: vCount > 0 ? Math.round(vTotal / vCount) : 70,
        shadowing: sCount > 0 ? Math.round(sTotal / sCount) : 65,
        reflexWpm: rCount > 0 ? Math.round(rTotal / rCount) : 80,
      });
    } catch (err) {
      console.warn("⚠️ Lỗi loadData UserProfileScreen:", err);
      setUserSubmissions(localSubmissions);
    } finally {
      setLoading(false);
    }
  };

  // 🎯 Vẽ biểu đồ Radar SVG thuần
  const renderRadarChart = () => {
    const size = 250;
    const center = size / 2;
    const radius = 80;

    const axes = [
      { label: 'Phát âm', val: skills.pronunciation, angle: -Math.PI / 2, color: '#00FFFF' },
      { label: 'Từ vựng', val: skills.vocabulary, angle: 0, color: '#39FF14' },
      { label: 'Shadowing', val: skills.shadowing, angle: Math.PI / 2, color: '#FFD700' },
      { label: 'Phản xạ/WPM', val: skills.reflexWpm, angle: Math.PI, color: '#FF007F' },
    ];

    const getCoords = (val: number, angle: number) => {
      const r = (val / 100) * radius;
      const x = center + r * Math.cos(angle);
      const y = center + r * Math.sin(angle);
      return `${x.toFixed(1)},${y.toFixed(1)}`;
    };

    const polygonPoints = axes.map(a => getCoords(a.val, a.angle)).join(' ');

    return (
      <View style={styles.chartWrapper}>
        <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
          {[0.25, 0.5, 0.75, 1.0].map((step, idx) => (
            <polygon
              key={idx}
              points={axes.map(a => getCoords(100 * step, a.angle)).join(' ')}
              fill="none"
              stroke="#2A1B4E"
              strokeWidth="1.5"
            />
          ))}

          {axes.map((a, idx) => {
            const endX = center + radius * Math.cos(a.angle);
            const endY = center + radius * Math.sin(a.angle);
            return (
              <line
                key={idx}
                x1={center}
                y1={center}
                x2={endX}
                y2={endY}
                stroke="#332255"
                strokeWidth="1.5"
              />
            );
          })}

          <polygon
            points={polygonPoints}
            fill="rgba(0, 255, 204, 0.25)"
            stroke="#00FFCC"
            strokeWidth="2.5"
          />

          {axes.map((a, idx) => {
            const [cx, cy] = getCoords(a.val, a.angle).split(',');
            return (
              <circle
                key={idx}
                cx={cx}
                cy={cy}
                r="4.5"
                fill={a.color}
                stroke="#FFF"
                strokeWidth="1.5"
              />
            );
          })}

          <text x={center} y={20} textAnchor="middle" fill="#00FFFF" fontSize="9" fontWeight="bold">
            🎯 Phát âm ({skills.pronunciation}đ)
          </text>
          <text x={size - 10} y={center + 4} textAnchor="end" fill="#39FF14" fontSize="9" fontWeight="bold">
            ⚡ Từ vựng ({skills.vocabulary}đ)
          </text>
          <text x={center} y={size - 12} textAnchor="middle" fill="#FFD700" fontSize="9" fontWeight="bold">
            👻 Shadowing ({skills.shadowing}đ)
          </text>
          <text x={10} y={center + 4} textAnchor="start" fill="#FF007F" fontSize="9" fontWeight="bold">
            🚀 WPM ({skills.reflexWpm}đ)
          </text>
        </svg>
      </View>
    );
  };

  if (showWeakPoints) {
    return <WeakPointsScreen onBack={() => setShowWeakPoints(false)} />;
  }

  const totalSubmissions = userSubmissions.length;
  const avgScore = totalSubmissions > 0 
    ? Math.round(userSubmissions.reduce((acc, curr) => acc + (Number(curr.score) || 0), 0) / totalSubmissions) 
    : 0;

  return (
    <View style={styles.container}>
      <TouchableOpacity onPress={onBack} style={styles.backBtn}>
        <Text style={styles.backText}>🔙 QUAY LẠI MAP</Text>
      </TouchableOpacity>

      <ScrollView contentContainerStyle={{ paddingBottom: 40 }} showsVerticalScrollIndicator={false}>
        <Text style={styles.title}>🎖 HỒ SƠ CHIẾN BINH & TIẾN TRÌNH RÈN LUYỆN</Text>

        {/* THẺ ĐỊNH DANH NGƯỜI DÙNG */}
        <View style={[styles.profileBadgeCard, userType === 'STUDENT' ? styles.studentBorder : styles.freeBorder]}>
          <View style={styles.headerRow}>
            <View style={styles.avatarBox}>
              <Text style={styles.avatarText}>{displayName.charAt(0).toUpperCase()}</Text>
            </View>

            <View style={{ flex: 1, marginLeft: 12 }}>
              <View style={styles.tagRow}>
                <Text style={styles.nameText}>{displayName}</Text>
                <View style={[styles.typePill, userType === 'STUDENT' ? styles.studentPill : styles.freePill]}>
                  <Text style={styles.typePillText}>
                    {userType === 'STUDENT' ? '🎓 SINH VIÊN' : '🌟 TỰ DO'}
                  </Text>
                </View>
              </View>

              {userType === 'STUDENT' ? (
                <View style={styles.studentInfoRow}>
                  <Text style={styles.infoSubText}>
                    MSSV: <Text style={{ color: '#00FFFF', fontWeight: 'bold' }}>{studentCode || 'Đang cập nhật'}</Text>
                  </Text>
                  <Text style={styles.infoSubText}>
                    Lớp: <Text style={{ color: '#FFD700', fontWeight: 'bold' }}>{className || 'Chung'}</Text>
                  </Text>
                </View>
              ) : (
                <Text style={styles.freeUserDesc}>✨ Chế độ Luyện tự do • Không ràng buộc mã lớp</Text>
              )}

              {/* NÚT MỞ KHO TỪ YẾU */}
              <TouchableOpacity style={styles.weakVaultBtn} onPress={() => setShowWeakPoints(true)}>
                <Text style={styles.weakVaultText}>🎯 MỞ KHO TỪ YẾU CẦN ÔN LUYỆN</Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* CHỈ SỐ NHANH */}
          <View style={styles.statContainer}>
            <View style={styles.statBox}>
              <Text style={styles.statValue}>{totalSubmissions}</Text>
              <Text style={styles.statLabel}>Bài đã nộp</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statBox}>
              <Text style={[styles.statValue, { color: avgScore >= 70 ? '#39FF14' : '#FF0055' }]}>
                {avgScore}đ
              </Text>
              <Text style={styles.statLabel}>Điểm trung bình</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statBox}>
              <Text style={[styles.statValue, { color: '#00FFFF' }]}>
                {userSubmissions.filter(s => (s.score || 0) >= 70).length}
              </Text>
              <Text style={styles.statLabel}>Lượt đạt (Win)</Text>
            </View>
          </View>
        </View>

        {/* BIỂU ĐỒ RADAR TIẾN ĐỘ KỸ NĂNG */}
        <View style={styles.chartCard}>
          <Text style={styles.chartTitle}>🕸️ BIỂU ĐỒ KỸ NĂNG NÓI TOÀN DIỆN</Text>
          <Text style={styles.chartSub}>Tổng hợp độ vững 4 Trạm thực chiến</Text>
          {renderRadarChart()}
        </View>

        {/* LỊCH SỬ THI ĐẤU */}
        <View style={styles.historyHeader}>
          <Text style={styles.sectionTitle}>📜 LỊCH SỬ THI ĐẤU & PHÁT ÂM GẦN ĐÂY</Text>
          <TouchableOpacity onPress={loadUserProfileData}>
            <Text style={styles.refreshBtnText}>🔄 Làm mới</Text>
          </TouchableOpacity>
        </View>

        {loading ? (
          <ActivityIndicator size="large" color="#00FFFF" style={{ marginVertical: 30 }} />
        ) : userSubmissions.length === 0 ? (
          <View style={styles.emptyCard}>
            <Text style={styles.emptyText}>⚠️ Chưa ghi nhận lịch sử thực hành nào.</Text>
            <Text style={styles.emptySubText}>
              Hãy bắt đầu phát âm tại các Trạm để AI chấm điểm và cập nhật tiến trình của bạn!
            </Text>
          </View>
        ) : (
          userSubmissions.map((sub, index) => {
            const isPass = (sub.score || 0) >= 70;
            return (
              <View 
                key={sub.id || index} 
                style={[styles.historyCard, { borderColor: isPass ? '#332255' : '#551122' }]}
              >
                <View style={styles.cardHeader}>
                  <View style={styles.modeBadge}>
                    <Text style={styles.modeText}>🔥 {sub.mode || 'SPEAKING'}</Text>
                    {sub.cefrLevel && <Text style={styles.levelTag}>[{sub.cefrLevel}]</Text>}
                  </View>
                  <Text style={[styles.scoreText, { color: isPass ? '#39FF14' : '#FF0055' }]}>
                    {sub.score} ĐIỂM
                  </Text>
                </View>

                {sub.timestamp ? (
                  <Text style={styles.timeText}>⏱ {sub.timestamp}</Text>
                ) : null}

                {sub.transcript ? (
                  <Text style={styles.transcriptText}>💬 "{sub.transcript}"</Text>
                ) : null}

                {sub.feedback ? (
                  <Text style={styles.feedbackText}>💡 {sub.feedback}</Text>
                ) : null}

                {sub.audioUrl ? (
                  <View 
                    style={styles.audioBox}
                    // @ts-ignore
                    onStartShouldSetResponder={() => false}
                    onMoveShouldSetResponder={() => false}
                  >
                    {React.createElement('audio', {
                      controls: true,
                      playsInline: true,
                      src: sub.audioUrl,
                      style: { width: '100%', height: 32, marginTop: 4, touchAction: 'manipulation' }
                    })}
                  </View>
                ) : null}
              </View>
            );
          })
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#05020D', padding: 18, paddingTop: 40 },
  backBtn: { alignSelf: 'flex-start', padding: 8, backgroundColor: '#0D0620', borderRadius: 8, borderWidth: 1, borderColor: '#00FFFF', marginBottom: 12 },
  backText: { color: '#00FFFF', fontSize: 10, fontWeight: 'bold' },
  title: { color: '#FFD700', fontSize: 13, fontWeight: '900', marginBottom: 14, textAlign: 'center' },
  profileBadgeCard: { backgroundColor: '#120826', borderRadius: 14, padding: 14, borderWidth: 1.5, marginBottom: 16 },
  studentBorder: { borderColor: '#00FFFF' },
  freeBorder: { borderColor: '#FF007F' },
  headerRow: { flexDirection: 'row', alignItems: 'center' },
  avatarBox: { width: 46, height: 46, borderRadius: 23, backgroundColor: '#1A0B2E', alignItems: 'center', justifyContent: 'center', borderWidth: 2, borderColor: '#00FFFF' },
  avatarText: { color: '#FFF', fontSize: 18, fontWeight: '900' },
  tagRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 6 },
  nameText: { color: '#FFF', fontSize: 13, fontWeight: '900', flex: 1 },
  typePill: { paddingHorizontal: 7, paddingVertical: 2, borderRadius: 6 },
  studentPill: { backgroundColor: 'rgba(0, 255, 255, 0.2)', borderWidth: 1, borderColor: '#00FFFF' },
  freePill: { backgroundColor: 'rgba(255, 0, 127, 0.2)', borderWidth: 1, borderColor: '#FF007F' },
  typePillText: { color: '#FFF', fontSize: 9, fontWeight: '900' },
  studentInfoRow: { flexDirection: 'row', gap: 12, marginTop: 4 },
  infoSubText: { color: '#AAAABB', fontSize: 10 },
  freeUserDesc: { color: '#39FF14', fontSize: 10, fontStyle: 'italic', marginTop: 3 },
  weakVaultBtn: { backgroundColor: '#FF0055', paddingVertical: 5, paddingHorizontal: 10, borderRadius: 6, alignSelf: 'flex-start', marginTop: 6 },
  weakVaultText: { color: '#FFF', fontSize: 9, fontWeight: '900' },
  statContainer: { flexDirection: 'row', justifyContent: 'space-between', backgroundColor: '#0D0620', borderRadius: 10, marginTop: 12, paddingVertical: 10, paddingHorizontal: 8, borderWidth: 1, borderColor: '#332255' },
  statBox: { flex: 1, alignItems: 'center' },
  statValue: { color: '#FFF', fontSize: 14, fontWeight: '900' },
  statLabel: { color: '#8888AA', fontSize: 9, marginTop: 2 },
  statDivider: { width: 1, backgroundColor: '#332255', height: '80%', alignSelf: 'center' },
  chartCard: { backgroundColor: '#0D0620', borderWidth: 1.5, borderColor: '#332255', borderRadius: 14, padding: 14, alignItems: 'center', marginBottom: 16 },
  chartTitle: { color: '#FFD700', fontSize: 11, fontWeight: '900' },
  chartSub: { color: '#8888AA', fontSize: 9, marginTop: 2, marginBottom: 8 },
  chartWrapper: { width: '100%', alignItems: 'center', justifyContent: 'center' },
  historyHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 },
  sectionTitle: { color: '#00FFFF', fontSize: 11, fontWeight: '900' },
  refreshBtnText: { color: '#FFD700', fontSize: 10, fontWeight: 'bold' },
  emptyCard: { backgroundColor: '#130A2A', padding: 20, borderRadius: 12, alignItems: 'center', marginTop: 15 },
  emptyText: { color: '#FF007F', fontSize: 11, fontWeight: 'bold' },
  emptySubText: { color: '#8888AA', fontSize: 9, marginTop: 4, textAlign: 'center' },
  historyCard: { backgroundColor: '#130A2A', padding: 12, borderRadius: 10, borderWidth: 1, marginBottom: 10 },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  modeBadge: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  modeText: { color: '#00FFFF', fontSize: 10, fontWeight: 'bold' },
  levelTag: { color: '#FFD700', fontSize: 9, fontWeight: 'bold' },
  scoreText: { fontSize: 12, fontWeight: '900' },
  timeText: { color: '#8888AA', fontSize: 8, marginTop: 3 },
  transcriptText: { color: '#EEE', fontSize: 10, fontStyle: 'italic', marginTop: 6 },
  feedbackText: { color: '#FFD700', fontSize: 9, marginTop: 4 },
  audioBox: { width: '100%', marginTop: 6 },
});