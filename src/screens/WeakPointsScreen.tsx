// src/screens/WeakPointsScreen.tsx
import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView } from 'react-native';
import { getWeakPoints, WeakPointItem } from '../services/weakPointsService';

interface Props {
  onBack: () => void;
  onSelectPractice?: (promptText: string, stationId: string) => void;
}

export default function WeakPointsScreen({ onBack, onSelectPractice }: Props) {
  const [weakList, setWeakList] = useState<WeakPointItem[]>([]);

  useEffect(() => {
    const data = getWeakPoints();
    setWeakList(data);
  }, []);

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={onBack} style={styles.backBtn}>
          <Text style={styles.backText}>🔙 QUAY LẠI MAP</Text>
        </TouchableOpacity>
        <Text style={styles.title}>🎯 KHO QUÁI PHỤC KÍCH (CÂU YẾU)</Text>
      </View>

      <ScrollView contentContainerStyle={{ alignItems: 'center', width: '100%', paddingBottom: 30 }}>
        <View style={styles.summaryCard}>
          <Text style={styles.summaryTitle}>⚠️ TỔNG SỐ CÂU PHÁT ÂM CẦN CẢI THIỆN</Text>
          <Text style={styles.summaryScore}>{weakList.length} CÂU HỎI YẾU</Text>
          <Text style={styles.summarySub}>
            Các câu bạn đạt dưới 60 điểm ở Trạm 3 & Trạm 4 sẽ tự động lưu vào đây để bạn phục thù!
          </Text>
        </View>

        <View style={styles.listContainer}>
          <Text style={styles.listHeader}>🔥 DANH SÁCH CÁC CÂU CẦN ÔN LUYỆN LẠI</Text>

          {weakList.length > 0 ? (
            weakList.map((item, index) => (
              <View key={item.id || index} style={styles.itemRow}>
                <View style={styles.stationBadge}>
                  <Text style={styles.stationBadgeText}>
                    {item.stationId === 'station3' || item.stationId === '3' ? 'TRẠM 3' : 'TRẠM 4'}
                  </Text>
                </View>

                <View style={{ flex: 1, marginHorizontal: 10 }}>
                  <Text style={styles.promptText}>"{item.promptText}"</Text>
                  <Text style={styles.scoreText}>Điểm gần nhất: {item.lastScore} / 100</Text>
                </View>

                {onSelectPractice && (
                  <TouchableOpacity
                    style={styles.practiceBtn}
                    onPress={() => onSelectPractice(item.promptText, item.stationId)}
                  >
                    <Text style={styles.practiceBtnText}>⚔️ PHỤC THÙ</Text>
                  </TouchableOpacity>
                )}
              </View>
            ))
          ) : (
            <View style={{ alignItems: 'center', paddingVertical: 30 }}>
              <Text style={{ color: '#39FF14', fontSize: 13, fontWeight: 'bold' }}>
                🎉 XUẤT SẮC! BẠN KHÔNG CÓ CÂU YẾU NÀO CẦN LẠI!
              </Text>
            </View>
          )}
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#05020D', padding: 20, paddingTop: 50 },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 15 },
  backBtn: { padding: 8, backgroundColor: '#0D0620', borderRadius: 8, borderWidth: 1, borderColor: '#FF007F' },
  backText: { color: '#FF007F', fontSize: 10, fontWeight: 'bold' },
  title: { color: '#FFD700', fontSize: 12, fontWeight: '900' },
  summaryCard: { backgroundColor: '#1A0B2E', padding: 16, borderRadius: 16, borderWidth: 2, borderColor: '#FF007F', width: '100%', alignItems: 'center', marginBottom: 20 },
  summaryTitle: { color: '#FF007F', fontSize: 10, fontWeight: '900', marginBottom: 6 },
  summaryScore: { color: '#FFD700', fontSize: 22, fontWeight: '900', marginBottom: 4 },
  summarySub: { color: '#AAAABB', fontSize: 10, textAlign: 'center' },
  listContainer: { backgroundColor: '#0D0620', padding: 16, borderRadius: 16, borderWidth: 2, borderColor: '#00FFFF', width: '100%' },
  listHeader: { color: '#00FFFF', fontSize: 11, fontWeight: '900', marginBottom: 14, textAlign: 'center' },
  itemRow: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#120826', padding: 12, borderRadius: 12, marginBottom: 10, borderWidth: 1, borderColor: '#221133' },
  stationBadge: { backgroundColor: '#1A0B2E', paddingVertical: 4, paddingHorizontal: 8, borderRadius: 6, borderWidth: 1, borderColor: '#FF007F' },
  stationBadgeText: { color: '#FF007F', fontSize: 9, fontWeight: 'bold' },
  promptText: { color: '#FFF', fontSize: 11, fontWeight: 'bold', marginBottom: 4 },
  scoreText: { color: '#FF0055', fontSize: 9, fontWeight: 'bold' },
  practiceBtn: { backgroundColor: '#39FF14', paddingVertical: 8, paddingHorizontal: 10, borderRadius: 8 },
  practiceBtnText: { color: '#000', fontSize: 9, fontWeight: '900' }
});