import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Modal } from 'react-native';

interface PostMatchData {
  pronunciation: number; // 0 - 100%
  grammar: number;       // 0 - 100%
  fluency: number;       // 0 - 100%
  totalScore: number;
  eloEarned: number;
  transcription: string;
}

interface Props {
  visible: boolean;
  data: PostMatchData | null;
  onClose: () => void;
  onGoToOasis?: () => void;
}

export function PostMatchAnalyticsModal({ visible, data, onClose, onGoToOasis }: Props) {
  if (!data) return null;

  return (
    <Modal visible={visible} transparent animationType="fade">
      <View style={styles.overlay}>
        <View style={styles.modalCard}>
          <Text style={styles.headerTitle}>📊 POST-MATCH ANALYTICS</Text>
          <Text style={styles.subTitle}>PHÂN TÍCH HIỆU SUẤT TRẬN ĐẤU</Text>

          {/* ELO EARNED BADGE */}
          <View style={styles.eloBadge}>
            <Text style={styles.eloText}>
              {data.eloEarned >= 0 ? `+${data.eloEarned}` : data.eloEarned} ELO
            </Text>
          </View>

          {/* VISUAL CIRCULAR SCORE ENGINE (BIỂU ĐỒ TRÒN CYBER) */}
          <View style={styles.chartContainer}>
            <View style={styles.circleOuter}>
              <View style={styles.circleInner}>
                <Text style={styles.scoreNumber}>{data.totalScore}</Text>
                <Text style={styles.scoreLabel}>TỔNG ĐIỂM</Text>
              </View>
            </View>
          </View>

          {/* 3 TẦNG ĐÁNH GIÁ CHI TIẾT */}
          <View style={styles.metricsBox}>
            {/* 1. PHÁT ÂM */}
            <View style={styles.metricRow}>
              <Text style={styles.metricName}>🗣️ Phát Âm (Phonetics):</Text>
              <Text style={[styles.metricVal, { color: '#00FFFF' }]}>{data.pronunciation}%</Text>
            </View>
            <View style={styles.barBg}>
              <View style={[styles.barFill, { width: `${data.pronunciation}%`, backgroundColor: '#00FFFF' }]} />
            </View>

            {/* 2. NGỮ PHÁP & TỪ VỰNG */}
            <View style={styles.metricRow}>
              <Text style={styles.metricName}>📚 Ngữ Pháp & Từ Vựng:</Text>
              <Text style={[styles.metricVal, { color: '#FFD700' }]}>{data.grammar}%</Text>
            </View>
            <View style={styles.barBg}>
              <View style={[styles.barFill, { width: `${data.grammar}%`, backgroundColor: '#FFD700' }]} />
            </View>

            {/* 3. TRÔI CHẢY & LƯU LOÁT */}
            <View style={styles.metricRow}>
              <Text style={styles.metricName}>⚡ Độ Trôi Chảy (Fluency):</Text>
              <Text style={[styles.metricVal, { color: '#39FF14' }]}>{data.fluency}%</Text>
            </View>
            <View style={styles.barBg}>
              <View style={[styles.barFill, { width: `${data.fluency}%`, backgroundColor: '#39FF14' }]} />
            </View>
          </View>

          {/* VĂN BẢN NHẬN DẠNG */}
          <Text style={styles.transcriptionText}>"{data.transcription}"</Text>

          {/* ACTION BUTTONS */}
          <View style={styles.btnGroup}>
            {data.totalScore < 70 && onGoToOasis && (
              <TouchableOpacity style={styles.oasisBtn} onPress={onGoToOasis}>
                <Text style={styles.oasisBtnText}>🌴 OASIS WARM-UP</Text>
              </TouchableOpacity>
            )}

            <TouchableOpacity style={styles.closeBtn} onPress={onClose}>
              <Text style={styles.closeBtnText}>TIẾP TỤC ĐẤU ⚔️</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: { flex: 1, backgroundColor: 'rgba(2, 10, 15, 0.9)', justifyContent: 'center', alignItems: 'center', padding: 20 },
  modalCard: { backgroundColor: '#0D0620', padding: 22, borderRadius: 20, borderWidth: 2, borderColor: '#00FFFF', width: '100%', alignItems: 'center' },
  headerTitle: { color: '#00FFFF', fontSize: 18, fontWeight: '900', fontFamily: 'Courier New' },
  subTitle: { color: '#8888AA', fontSize: 10, fontWeight: 'bold', marginBottom: 10 },
  eloBadge: { backgroundColor: '#FF007F', paddingHorizontal: 12, paddingVertical: 4, borderRadius: 12, marginBottom: 15 },
  eloText: { color: '#FFF', fontWeight: 'bold', fontSize: 12 },
  chartContainer: { marginVertical: 10, alignItems: 'center', justifyContent: 'center' },
  circleOuter: { width: 110, height: 110, borderRadius: 55, borderWidth: 4, borderColor: '#39FF14', justifyContent: 'center', alignItems: 'center', backgroundColor: '#05020D' },
  circleInner: { alignItems: 'center' },
  scoreNumber: { color: '#FFF', fontSize: 28, fontWeight: '900' },
  scoreLabel: { color: '#39FF14', fontSize: 8, fontWeight: 'bold' },
  metricsBox: { width: '100%', marginVertical: 12 },
  metricRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 4 },
  metricName: { color: '#AAAABB', fontSize: 11, fontWeight: 'bold' },
  metricVal: { fontSize: 12, fontWeight: 'bold' },
  barBg: { width: '100%', height: 6, backgroundColor: '#1A0B36', borderRadius: 3, marginBottom: 10, overflow: 'hidden' },
  barFill: { height: '100%', borderRadius: 3 },
  transcriptionText: { color: '#A0E0E0', fontSize: 11, fontStyle: 'italic', textAlign: 'center', marginBottom: 16 },
  btnGroup: { width: '100%', flexDirection: 'row', gap: 10 },
  oasisBtn: { flex: 1, backgroundColor: '#052C30', padding: 12, borderRadius: 10, borderWidth: 1, borderColor: '#00FFCC', alignItems: 'center' },
  oasisBtnText: { color: '#00FFCC', fontSize: 11, fontWeight: 'bold' },
  closeBtn: { flex: 1, backgroundColor: '#00FFFF', padding: 12, borderRadius: 10, alignItems: 'center' },
  closeBtnText: { color: '#000', fontSize: 11, fontWeight: '900' }
});