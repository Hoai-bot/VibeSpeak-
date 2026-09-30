// src/screens/DrillScreen.tsx
import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView, ActivityIndicator } from 'react-native';
import { generateTier1Drill } from '../services/drills/tier1Service';
import { generateTier2Drill } from '../services/drills/tier2Service';
import { generateTier3Drill } from '../services/drills/tier3Service';
import { DrillItem } from '../services/aiGenerator';
import { updateUserProgress } from '../services/userService';

interface Props {
  tier?: number;
  onBack: () => void;
}

export default function DrillScreen({ onBack }: Props) {
  const [activeTier, setActiveTier] = useState<number>(1);
  const [cefrLevel, setCefrLevel] = useState<string>('B2');
  const [drillData, setDrillData] = useState<DrillItem | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [isAnalyzing, setIsAnalyzing] = useState<boolean>(false);
  const [result, setResult] = useState<{ score: number; feedback: string } | null>(null);

  const CEFR_LEVELS = ['A1', 'A2', 'B1', 'B2', 'C1', 'C2'];

  const loadDrill = async (tier: number, level: string) => {
    setLoading(true);
    setResult(null);
    let item: DrillItem;
    if (tier === 1) {
      item = await generateTier1Drill(level, 'General Practice');
    } else if (tier === 2) {
      item = await generateTier2Drill(level, 'General Practice');
    } else {
      item = await generateTier3Drill(level, 'General Practice');
    }
    setDrillData(item);
    setLoading(false);
  };

  useEffect(() => {
    loadDrill(activeTier, cefrLevel);
  }, [activeTier, cefrLevel]);

  const handleSimulateGrade = () => {
    setIsAnalyzing(true);
    setResult(null);
    setTimeout(() => {
      setResult({
        score: 88,
        feedback: "Phát âm chuẩn IPA, ngắt nghỉ câu tự nhiên! Giữ vững phong độ.",
      });
      setIsAnalyzing(false);
      updateUserProgress(1, 25, true);
    }, 1500);
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={onBack} style={styles.backBtn}>
          <Text style={styles.backText}>🔙 QUAY LẠI MAP</Text>
        </TouchableOpacity>
        <Text style={styles.title}>🎯 TRẠM 1: PHẢN XẠ ÂM (DRILL ARENA)</Text>
      </View>

      <ScrollView contentContainerStyle={{ alignItems: 'center', width: '100%', paddingBottom: 30 }}>
        {/* THANH CHỌN TẦNG (3 TIERS) */}
        <Text style={styles.sectionLabel}>CHỌN TẦNG THỬ THÁCH (TIER 1 - 3):</Text>
        <View style={styles.tabRow}>
          <TouchableOpacity 
            style={[styles.tierTab, activeTier === 1 && styles.tierTabActive]} 
            onPress={() => setActiveTier(1)}
          >
            <Text style={[styles.tierTabText, activeTier === 1 && styles.tierTextActive]}>TIER 1: MINIMAL PAIRS</Text>
          </TouchableOpacity>
          <TouchableOpacity 
            style={[styles.tierTab, activeTier === 2 && styles.tierTabActive]} 
            onPress={() => setActiveTier(2)}
          >
            <Text style={[styles.tierTabText, activeTier === 2 && styles.tierTextActive]}>TIER 2: LINKING</Text>
          </TouchableOpacity>
          <TouchableOpacity 
            style={[styles.tierTab, activeTier === 3 && styles.tierTabActive]} 
            onPress={() => setActiveTier(3)}
          >
            <Text style={[styles.tierTabText, activeTier === 3 && styles.tierTextActive]}>TIER 3: TWISTER</Text>
          </TouchableOpacity>
        </View>

        {/* THANH CHỌN CẤP ĐỘ CEFR TỪ A1 ĐẾN C2 */}
        <View style={styles.cefrRow}>
          {CEFR_LEVELS.map((lvl) => (
            <TouchableOpacity
              key={lvl}
              style={[
                styles.cefrBadge,
                cefrLevel === lvl && styles.cefrBadgeActive,
                lvl === 'C2' && { borderColor: '#FF007F' }
              ]}
              onPress={() => setCefrLevel(lvl)}
            >
              <Text style={[
                styles.cefrText, 
                cefrLevel === lvl && styles.cefrTextActive,
                lvl === 'C2' && { color: '#FF007F' }
              ]}>{lvl}</Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* CARD BÀI TẬP PHÂN LOẠI */}
        <View style={styles.card}>
          {loading ? (
            <ActivityIndicator size="small" color="#00FFFF" style={{ marginVertical: 20 }} />
          ) : drillData ? (
            <>
              <Text style={styles.tag}>[ LEVEL {cefrLevel} • TIER {activeTier} ]</Text>
              <Text style={styles.targetText}>"{drillData.target}"</Text>
              <Text style={styles.ipaText}>🔊 IPA: {drillData.phonetics}</Text>
              <Text style={styles.meaningText}>💡 Nghĩa: {drillData.meaning}</Text>
              <Text style={styles.tipText}>📌 Mẹo: {drillData.tip}</Text>
            </>
          ) : null}
        </View>

        <TouchableOpacity 
          style={styles.refreshBtn} 
          onPress={() => loadDrill(activeTier, cefrLevel)}
          disabled={loading}
        >
          <Text style={styles.refreshBtnText}>🔄 ĐỔI CÂU HỎI MỚI ({cefrLevel})</Text>
        </TouchableOpacity>

        {isAnalyzing ? (
          <ActivityIndicator size="large" color="#39FF14" style={{ marginVertical: 15 }} />
        ) : (
          <TouchableOpacity style={styles.recordBtn} onPress={handleSimulateGrade}>
            <Text style={styles.recordBtnText}>🎙️ PHÁT ÂM & CHẤM ĐIỂM AI CHẶT CHẼ</Text>
          </TouchableOpacity>
        )}

        {result && (
          <View style={styles.resultBox}>
            <Text style={styles.scoreText}>⚡ KẾT QUẢ: {result.score}/100 ĐIỂM (+25 XP)</Text>
            <Text style={styles.feedback}>{result.feedback}</Text>
          </View>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#05020D', padding: 20, paddingTop: 50 },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 15 },
  backBtn: { padding: 8, backgroundColor: '#0D0620', borderRadius: 8, borderWidth: 1, borderColor: '#00FFFF' },
  backText: { color: '#00FFFF', fontSize: 10, fontWeight: 'bold' },
  title: { color: '#00FFFF', fontSize: 12, fontWeight: '900' },
  sectionLabel: { color: '#FFD700', fontSize: 10, fontWeight: 'bold', alignSelf: 'flex-start', marginBottom: 8 },
  tabRow: { flexDirection: 'row', justifyContent: 'space-between', width: '100%', marginBottom: 12 },
  tierTab: { backgroundColor: '#0D0620', paddingVertical: 8, paddingHorizontal: 6, borderRadius: 8, borderWidth: 1, borderColor: '#332255', width: '32%', alignItems: 'center' },
  tierTabActive: { backgroundColor: '#00FFFF', borderColor: '#00FFFF' },
  tierTabText: { color: '#8888AA', fontSize: 9, fontWeight: '900' },
  tierTextActive: { color: '#000' },
  cefrRow: { flexDirection: 'row', justifyContent: 'space-between', width: '100%', marginBottom: 15 },
  cefrBadge: { backgroundColor: '#0D0620', paddingVertical: 6, paddingHorizontal: 10, borderRadius: 6, borderWidth: 1, borderColor: '#332255' },
  cefrBadgeActive: { backgroundColor: '#FF007F', borderColor: '#FF007F' },
  cefrText: { color: '#8888AA', fontSize: 10, fontWeight: 'bold' },
  cefrTextActive: { color: '#FFF' },
  card: { backgroundColor: '#0D0620', padding: 18, borderRadius: 16, borderWidth: 2, borderColor: '#00FFFF', width: '100%', alignItems: 'center', marginBottom: 12 },
  tag: { color: '#FFD700', fontSize: 10, fontWeight: '900', marginBottom: 6 },
  targetText: { color: '#FFF', fontSize: 16, fontWeight: '800', textAlign: 'center', lineHeight: 22, marginBottom: 8 },
  ipaText: { color: '#39FF14', fontSize: 11, fontWeight: 'bold', marginBottom: 6 },
  meaningText: { color: '#AAAABB', fontSize: 11, textAlign: 'center', marginBottom: 4 },
  tipText: { color: '#FF007F', fontSize: 10, textAlign: 'center', fontStyle: 'italic' },
  refreshBtn: { backgroundColor: '#1A0B2E', padding: 10, borderRadius: 8, borderWidth: 1, borderColor: '#FF007F', width: '100%', alignItems: 'center', marginBottom: 12 },
  refreshBtnText: { color: '#FF007F', fontSize: 10, fontWeight: '900' },
  recordBtn: { backgroundColor: '#39FF14', padding: 14, borderRadius: 12, width: '100%', alignItems: 'center', marginBottom: 15 },
  recordBtnText: { color: '#000', fontSize: 12, fontWeight: '900' },
  resultBox: { backgroundColor: '#120826', padding: 14, borderRadius: 12, borderWidth: 1, borderColor: '#39FF14', width: '100%', alignItems: 'center' },
  scoreText: { color: '#39FF14', fontSize: 13, fontWeight: '900', marginBottom: 6 },
  feedback: { color: '#AAAABB', fontSize: 10, textAlign: 'center' }
});