// src/components/DetailedSpeechFeedbackModal.tsx
import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Modal, TouchableOpacity, ScrollView } from 'react-native';

export interface RubricScoreItem {
  name: string;
  key: 'pronunciation' | 'intonation' | 'fluency' | 'vocabulary' | 'grammar' | 'content';
  score: number;
  weight: string;
  feedback: string;
  color: string;
}

export interface DetailedFeedbackData {
  totalScore: number;
  cefrLevel: string;
  transcript: string;
  pitchHistory: number[];
  spontaneityScore: number;
  isScriptSuspected: boolean;
  rubrics: {
    pronunciation: RubricScoreItem;
    intonation: RubricScoreItem;
    fluency: RubricScoreItem;
    vocabulary: RubricScoreItem;
    grammar: RubricScoreItem;
    content: RubricScoreItem;
  };
  keyImprovements: string[];
}

interface Props {
  visible: boolean;
  data: DetailedFeedbackData | null;
  onClose: () => void;
}

export default function DetailedSpeechFeedbackModal({ visible, data, onClose }: Props) {
  const canvasRef = useRef<any>(null);

  useEffect(() => {
    if (!visible || !data || !canvasRef.current) return;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext ? canvas.getContext('2d') : null;
    if (!ctx) return;

    const width = canvas.width || 560;
    const height = canvas.height || 140;
    ctx.clearRect(0, 0, width, height);

    ctx.strokeStyle = '#1F1138';
    ctx.lineWidth = 1;
    for (let y = 30; y < height; y += 30) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(width, y);
      ctx.stroke();
    }

    const pitches = (data.pitchHistory && data.pitchHistory.length > 0)
      ? data.pitchHistory
      : [140, 150, 185, 210, 205, 175, 160, 140, 190, 230, 215, 180, 155, 145, 130];

    const minPitch = 70;
    const maxPitch = 320;
    const stepX = width / Math.max(pitches.length - 1, 1);

    ctx.beginPath();
    pitches.forEach((f0, idx) => {
      const clamped = Math.max(minPitch, Math.min(maxPitch, f0));
      const normY = height - ((clamped - minPitch) / (maxPitch - minPitch)) * (height - 30) - 15;
      const x = idx * stepX;
      if (idx === 0) ctx.moveTo(x, normY);
      else ctx.lineTo(x, normY);
    });
    ctx.lineTo(width, height);
    ctx.lineTo(0, height);
    ctx.closePath();
    const grad = ctx.createLinearGradient(0, 0, 0, height);
    grad.addColorStop(0, 'rgba(57, 255, 20, 0.25)');
    grad.addColorStop(1, 'rgba(57, 255, 20, 0.0)');
    ctx.fillStyle = grad;
    ctx.fill();

    ctx.beginPath();
    pitches.forEach((f0, idx) => {
      const clamped = Math.max(minPitch, Math.min(maxPitch, f0));
      const normY = height - ((clamped - minPitch) / (maxPitch - minPitch)) * (height - 30) - 15;
      const x = idx * stepX;
      if (idx === 0) ctx.moveTo(x, normY);
      else ctx.lineTo(x, normY);
    });
    ctx.strokeStyle = data.isScriptSuspected ? '#FF0055' : '#39FF14';
    ctx.lineWidth = 2.5;
    ctx.stroke();
  }, [visible, data]);

  if (!data) return null;

  const rubricList: RubricScoreItem[] = [
    data.rubrics.pronunciation,
    data.rubrics.intonation,
    data.rubrics.fluency,
    data.rubrics.vocabulary,
    data.rubrics.grammar,
    data.rubrics.content,
  ];

  return (
    <Modal visible={visible} transparent animationType="slide">
      <View style={styles.modalOverlay}>
        <View style={styles.modalCard}>
          <View style={styles.headerRow}>
            <View>
              <Text style={styles.modalTitle}>📊 BẢNG PHÂN TÍCH ĐIỂM CHI TIẾT & SÓNG ÂM</Text>
              <Text style={styles.modalSubTitle}>Chuẩn kiểm định CEFR: {data.cefrLevel}</Text>
            </View>
            <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
              <Text style={styles.closeBtnText}>✕ ĐÓNG</Text>
            </TouchableOpacity>
          </View>

          <ScrollView contentContainerStyle={{ paddingBottom: 25 }}>
            <View style={styles.scoreOverviewBox}>
              <View style={styles.scoreCircle}>
                <Text style={styles.totalScoreNumber}>{data.totalScore}</Text>
                <Text style={styles.totalScoreUnit}>/100</Text>
              </View>
              <View style={{ flex: 1, marginLeft: 14 }}>
                <Text style={styles.overviewVerdict}>
                  {data.totalScore >= 80 ? '🌟 ĐẠT CHUẨN XUẤT SẮC' : data.totalScore >= 65 ? '👍 ĐẠT YÊU CẦU' : '⚠️ CẦN LUYỆN TẬP THÊM'}
                </Text>
                <View style={styles.spontaneityBadgeRow}>
                  <View style={[styles.badge, data.isScriptSuspected ? styles.badgeDanger : styles.badgeSuccess]}>
                    <Text style={[styles.badgeText, data.isScriptSuspected ? styles.badgeTextDanger : styles.badgeTextSuccess]}>
                      {data.isScriptSuspected ? '⚠️ NGHI VẤN ĐỌC KỊCH BẢN' : '🗣️ PHẢN XẠ NÓI TỰ NHIÊN'}
                    </Text>
                  </View>
                  <Text style={styles.spontaneitySub}>
                    Biến thiên F0: {data.spontaneityScore}đ
                  </Text>
                </View>
              </View>
            </View>

            <View style={styles.sectionCard}>
              <Text style={styles.sectionTitle}>🌊 BIỂU ĐỒ SÓNG ÂM & CAO ĐỘ (F0 CONTOUR)</Text>
              <View style={styles.canvasWrapper}>
                {React.createElement('canvas', {
                  ref: canvasRef,
                  width: 560,
                  height: 140,
                  style: { width: '100%', height: 140, display: 'block', backgroundColor: '#070212', borderRadius: 8 }
                })}
              </View>
            </View>

            <View style={styles.sectionCard}>
              <Text style={styles.sectionTitle}>📋 ĐÁNH GIÁ 6 TIÊU CHÍ (RUBRICS):</Text>
              {rubricList.map((item, idx) => (
                <View key={item.key || idx} style={styles.rubricRow}>
                  <View style={styles.rubricHeader}>
                    <Text style={[styles.rubricName, { color: item.color }]}>{item.name} ({item.weight})</Text>
                    <Text style={[styles.rubricScoreText, { color: item.color }]}>{item.score}/100</Text>
                  </View>
                  <View style={styles.progressBarBg}>
                    <View style={[styles.progressBarFill, { width: `${item.score}%`, backgroundColor: item.color }]} />
                  </View>
                  <Text style={styles.rubricCommentText}>💬 {item.feedback}</Text>
                </View>
              ))}
            </View>
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modalOverlay: { flex: 1, backgroundColor: 'rgba(5, 2, 13, 0.92)', justifyContent: 'center', alignItems: 'center', padding: 14 },
  modalCard: { backgroundColor: '#0D0620', width: '100%', maxWidth: 620, maxHeight: '92%', borderRadius: 16, borderWidth: 2, borderColor: '#00FFFF', padding: 16 },
  headerRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', borderBottomWidth: 1.5, borderBottomColor: '#221133', paddingBottom: 12, marginBottom: 12 },
  modalTitle: { color: '#FFD700', fontSize: 12.5, fontWeight: '900' },
  modalSubTitle: { color: '#00FFFF', fontSize: 10, marginTop: 2, fontWeight: 'bold' },
  closeBtn: { paddingHorizontal: 10, paddingVertical: 5, borderRadius: 6, backgroundColor: '#1F0B2E', borderWidth: 1, borderColor: '#FF0055' },
  closeBtnText: { color: '#FF0055', fontSize: 10, fontWeight: 'bold' },
  scoreOverviewBox: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#130628', padding: 14, borderRadius: 12, borderWidth: 1, borderColor: '#332255', marginBottom: 14 },
  scoreCircle: { width: 66, height: 66, borderRadius: 33, backgroundColor: '#070212', borderWidth: 2.5, borderColor: '#39FF14', alignItems: 'center', justifyContent: 'center' },
  totalScoreNumber: { color: '#39FF14', fontSize: 22, fontWeight: '900' },
  totalScoreUnit: { color: '#8888AA', fontSize: 9, fontWeight: 'bold' },
  overviewVerdict: { color: '#FFF', fontSize: 12.5, fontWeight: '900', marginBottom: 6 },
  spontaneityBadgeRow: { flexDirection: 'row', alignItems: 'center', flexWrap: 'wrap', gap: 8 },
  badge: { paddingHorizontal: 7, paddingVertical: 3, borderRadius: 4, borderWidth: 1 },
  badgeSuccess: { backgroundColor: '#072514', borderColor: '#39FF14' },
  badgeDanger: { backgroundColor: '#350A18', borderColor: '#FF0055' },
  badgeText: { fontSize: 9, fontWeight: '900' },
  badgeTextSuccess: { color: '#39FF14' },
  badgeTextDanger: { color: '#FF0055' },
  spontaneitySub: { color: '#8888AA', fontSize: 9.5 },
  sectionCard: { backgroundColor: '#130628', padding: 14, borderRadius: 12, borderWidth: 1, borderColor: '#261245', marginBottom: 12 },
  sectionTitle: { color: '#FFD700', fontSize: 10.5, fontWeight: '900', marginBottom: 8 },
  canvasWrapper: { borderRadius: 8, overflow: 'hidden', borderWidth: 1, borderColor: '#332255' },
  rubricRow: { backgroundColor: '#0A0318', padding: 10, borderRadius: 8, borderWidth: 1, borderColor: '#1F1138', marginBottom: 8 },
  rubricHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 },
  rubricName: { fontSize: 11, fontWeight: '900' },
  rubricScoreText: { fontSize: 12, fontWeight: '900' },
  progressBarBg: { height: 6, backgroundColor: '#1A0B2E', borderRadius: 3, overflow: 'hidden', marginVertical: 4 },
  progressBarFill: { height: '100%', borderRadius: 3 },
  rubricCommentText: { color: '#DDDDEE', fontSize: 9.5, lineHeight: 14, marginTop: 3 },
});