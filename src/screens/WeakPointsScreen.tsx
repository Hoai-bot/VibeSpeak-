// src/screens/WeakPointsScreen.tsx
import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView, ActivityIndicator } from 'react-native';
import { getWeakVaultSummary, resolveWeakWordReview, WeakItem } from '../services/weakPointsService';

interface Props {
  onBack: () => void;
  onSelectPractice?: (promptText: string) => void;
}

export default function WeakPointsScreen({ onBack, onSelectPractice }: Props) {
  const [vaultData, setVaultData] = useState(() => {
    try {
      return getWeakVaultSummary() || { all: [], topRevenge: [], dueForReview: [], totalWeak: 0 };
    } catch (e) {
      return { all: [], topRevenge: [], dueForReview: [], totalWeak: 0 };
    }
  });

  const [activeTestWord, setActiveTestWord] = useState<WeakItem | null>(null);
  const [testResult, setTestResult] = useState<string | null>(null);

  const reloadData = () => {
    try {
      const data = getWeakVaultSummary();
      setVaultData(data || { all: [], topRevenge: [], dueForReview: [], totalWeak: 0 });
    } catch (e) {
      setVaultData({ all: [], topRevenge: [], dueForReview: [], totalWeak: 0 });
    }
  };

  useEffect(() => {
    reloadData();
  }, []);

  const handlePassTest = (item: WeakItem) => {
    resolveWeakWordReview(item.id, true);
    setTestResult(`🎉 TUYỆT VỜI! Đã vượt qua từ "${item.word.toUpperCase()}".`);
    setTimeout(() => {
      setTestResult(null);
      setActiveTestWord(null);
      reloadData();
    }, 1200);
  };

  const handleFailTest = (item: WeakItem) => {
    resolveWeakWordReview(item.id, false);
    setTestResult(`⚠️ Chưa đạt chuẩn. Từ "${item.word.toUpperCase()}" sẽ được nhắc ôn lại sau 1 ngày.`);
    setTimeout(() => {
      setTestResult(null);
      setActiveTestWord(null);
      reloadData();
    }, 1500);
  };

  const topRevengeList = vaultData?.topRevenge || [];
  const dueList = vaultData?.dueForReview || [];

  return (
    <View style={styles.container}>
      {/* HEADER */}
      <View style={styles.header}>
        <TouchableOpacity onPress={onBack} style={styles.backBtn}>
          <Text style={styles.backText}>🔙 QUAY LẠI TRẠM</Text>
        </TouchableOpacity>
        <Text style={styles.title}>🎯 KHO LỖI SAI & PHỤC THÙ</Text>
      </View>

      <ScrollView contentContainerStyle={{ paddingBottom: 40 }}>
        {/* BANNER THÔNG TIN CHU KỲ SPACED REPETITION */}
        <View style={styles.spCard}>
          <Text style={styles.spTitle}>🧠 THUẬT TOÁN ÔN TẬP NGẮT QUÃNG (1 - 3 - 7 NGÀY)</Text>
          <Text style={styles.spDesc}>
            Vượt qua 3 lần mini-test liên tiếp để vĩnh viễn xóa cụm từ khó ra khỏi danh sách theo dõi!
          </Text>
          <View style={styles.spBadgeRow}>
            <Text style={styles.spBadge}>Hôm nay cần ôn: {dueList.length} từ</Text>
            <Text style={[styles.spBadge, { borderColor: '#FF007F', color: '#FF007F' }]}>
              Tổng từ đang lưu: {vaultData?.totalWeak || 0}
            </Text>
          </View>
        </View>

        {/* POPUP MINI-TEST 60S PHỤC THÙ */}
        {activeTestWord && (
          <View style={styles.testCard}>
            <Text style={styles.testTitle}>⚡ MINI-TEST PHỤC THÙ: "{activeTestWord.word.toUpperCase()}"</Text>
            <Text style={styles.testHint}>🎯 Trọng tâm: {activeTestWord.phonemeHint || 'Phát âm chuẩn'}</Text>
            <Text style={styles.testSentence}>"{activeTestWord.targetSentence || activeTestWord.word}"</Text>
            
            {testResult ? (
              <Text style={styles.testResultText}>{testResult}</Text>
            ) : (
              <View style={styles.testBtnRow}>
                <TouchableOpacity 
                  style={[styles.testActionBtn, { backgroundColor: '#39FF14' }]}
                  onPress={() => handlePassTest(activeTestWord)}
                >
                  <Text style={styles.testActionText}>✓ ĐÃ PHÁT ÂM ĐÚNG</Text>
                </TouchableOpacity>

                <TouchableOpacity 
                  style={[styles.testActionBtn, { backgroundColor: '#FF0055' }]}
                  onPress={() => handleFailTest(activeTestWord)}
                >
                  <Text style={styles.testActionText}>⚠️ CẦN LUYỆN LẠI</Text>
                </TouchableOpacity>
              </View>
            )}

            {onSelectPractice && (
              <TouchableOpacity 
                style={styles.directPracticeBtn}
                onPress={() => onSelectPractice(activeTestWord.targetSentence || activeTestWord.word)}
              >
                <Text style={styles.directPracticeText}>🚀 ĐƯA VÀO TRẠM 4 LUYỆN NGAY</Text>
              </TouchableOpacity>
            )}
          </View>
        )}

        {/* DANH SÁCH TOP LỖI CẦN PHỤC THÙ */}
        <Text style={styles.sectionHeader}>🔥 TOP ÂM & CỤM TỪ CẦN PHỤC THÙ:</Text>
        {topRevengeList.length === 0 ? (
          <View style={styles.emptyCard}>
            <Text style={styles.emptyText}>🎉 Bạn chưa có từ nào bị cảnh báo lỗi sai!</Text>
            <Text style={styles.emptySubText}>Hãy tiếp tục luyện nói tại Trạm 2, 3, 4 để AI tự động phát hiện và gom từ yếu vào đây.</Text>
          </View>
        ) : (
          topRevengeList.map((item) => (
            <View key={item.id} style={styles.wordCard}>
              <View style={{ flex: 1 }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                  <Text style={styles.wordText}>{item.word.toUpperCase()}</Text>
                  <View style={styles.stageTag}>
                    <Text style={styles.stageTagText}>Stage {item.stage || 1}/3</Text>
                  </View>
                </View>
                <Text style={styles.phonemeText}>💡 {item.phonemeHint || 'Ngữ điệu / Trọng âm'}</Text>
                <Text style={styles.dateText}>
                  Sai {item.mistakeCount} lần | Hạn ôn: {item.nextReviewDate}
                </Text>
              </View>

              <TouchableOpacity 
                style={styles.reviewBtn}
                onPress={() => setActiveTestWord(item)}
              >
                <Text style={styles.reviewBtnText}>⚔️ PHỤC THÙ</Text>
              </TouchableOpacity>
            </View>
          ))
        )}

        {/* DANH SÁCH CÁC TỪ ĐẾN HẠN ÔN HÔM NAY */}
        {dueList.length > 0 && (
          <View style={{ marginTop: 20 }}>
            <Text style={styles.sectionHeader}>⏰ ĐẾN HẠN ÔN THEO CHU KỲ HÔM NAY:</Text>
            {dueList.map((item) => (
              <View key={`due_${item.id}`} style={[styles.wordCard, { borderColor: '#39FF14' }]}>
                <View style={{ flex: 1 }}>
                  <Text style={[styles.wordText, { color: '#39FF14' }]}>{item.word.toUpperCase()}</Text>
                  <Text style={styles.phonemeText}>Cần hoàn thành mini-test để nâng stage</Text>
                </View>
                <TouchableOpacity 
                  style={[styles.reviewBtn, { backgroundColor: '#39FF14' }]}
                  onPress={() => setActiveTestWord(item)}
                >
                  <Text style={[styles.reviewBtnText, { color: '#000' }]}>⚡ ÔN NGAY</Text>
                </TouchableOpacity>
              </View>
            ))}
          </View>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#05020D', padding: 18, paddingTop: 45 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 15 },
  backBtn: { backgroundColor: '#1A0B2E', padding: 8, borderRadius: 8, borderWidth: 1, borderColor: '#00FFFF' },
  backText: { color: '#00FFFF', fontSize: 10, fontWeight: 'bold' },
  title: { color: '#FFD700', fontSize: 12, fontWeight: '900' },
  spCard: { backgroundColor: '#120826', padding: 14, borderRadius: 12, borderWidth: 1, borderColor: '#00FFFF', marginBottom: 15 },
  spTitle: { color: '#00FFFF', fontSize: 11, fontWeight: '900', marginBottom: 4 },
  spDesc: { color: '#DDD', fontSize: 9, lineHeight: 14, marginBottom: 8 },
  spBadgeRow: { flexDirection: 'row', gap: 8 },
  spBadge: { paddingVertical: 4, paddingHorizontal: 8, borderRadius: 6, borderWidth: 1, borderColor: '#39FF14', color: '#39FF14', fontSize: 9, fontWeight: 'bold' },
  testCard: { backgroundColor: '#1D0836', padding: 16, borderRadius: 14, borderWidth: 2, borderColor: '#FF007F', marginBottom: 16 },
  testTitle: { color: '#FF007F', fontSize: 12, fontWeight: '900', marginBottom: 4 },
  testHint: { color: '#FFD700', fontSize: 10, fontWeight: 'bold', marginBottom: 6 },
  testSentence: { color: '#FFF', fontSize: 11, fontStyle: 'italic', marginBottom: 12, backgroundColor: '#0D0620', padding: 10, borderRadius: 8 },
  testBtnRow: { flexDirection: 'row', gap: 10 },
  testActionBtn: { flex: 1, paddingVertical: 10, borderRadius: 8, alignItems: 'center' },
  testActionText: { color: '#000', fontSize: 10, fontWeight: '900' },
  directPracticeBtn: { marginTop: 10, backgroundColor: '#00FFFF', paddingVertical: 8, borderRadius: 8, alignItems: 'center' },
  directPracticeText: { color: '#000', fontSize: 10, fontWeight: '900' },
  testResultText: { color: '#39FF14', fontSize: 11, fontWeight: 'bold', textAlign: 'center', marginVertical: 8 },
  sectionHeader: { color: '#FF007F', fontSize: 11, fontWeight: '900', marginBottom: 10 },
  emptyCard: { backgroundColor: '#0D0620', padding: 25, borderRadius: 12, alignItems: 'center', borderWidth: 1, borderColor: '#332255' },
  emptyText: { color: '#39FF14', fontSize: 11, fontWeight: 'bold', marginBottom: 4 },
  emptySubText: { color: '#8888AA', fontSize: 9, textAlign: 'center' },
  wordCard: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', backgroundColor: '#0D0620', padding: 12, borderRadius: 10, borderWidth: 1, borderColor: '#332255', marginBottom: 10 },
  wordText: { color: '#FFF', fontSize: 13, fontWeight: '900' },
  stageTag: { backgroundColor: '#1A0B2E', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4, borderWidth: 1, borderColor: '#00FFFF' },
  stageTagText: { color: '#00FFFF', fontSize: 8, fontWeight: 'bold' },
  phonemeText: { color: '#FFD700', fontSize: 9, marginTop: 2 },
  dateText: { color: '#8888AA', fontSize: 8, marginTop: 2 },
  reviewBtn: { backgroundColor: '#FF007F', paddingVertical: 8, paddingHorizontal: 12, borderRadius: 8 },
  reviewBtnText: { color: '#FFF', fontSize: 9, fontWeight: '900' }
});