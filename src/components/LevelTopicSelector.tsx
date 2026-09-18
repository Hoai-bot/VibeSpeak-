// src/components/LevelTopicSelector.tsx
import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView } from 'react-native';

export type CEFRLevel = 'A1' | 'A2' | 'B1' | 'B2' | 'C1';

interface Props {
  currentLevel: CEFRLevel;
  currentTopic: string;
  onSelectLevel: (level: CEFRLevel) => void;
  onSelectTopic: (topic: string) => void;
}

const LEVELS: CEFRLevel[] = ['A1', 'A2', 'B1', 'B2', 'C1'];
const TOPICS = [
  'Tech & AI Innovations',
  'Business & Startup',
  'Daily Life & Hobbies',
  'Campus & Education',
  'Cyberpunk World',
];

export const LevelTopicSelector: React.FC<Props> = ({
  currentLevel,
  currentTopic,
  onSelectLevel,
  onSelectTopic,
}) => {
  return (
    <View style={styles.container}>
      {/* 🎯 BỘ CHỌN CẤP ĐỘ THI ĐẤU (CEFR) */}
      <Text style={styles.sectionTitle}>📊 CHỌN CẤP ĐỘ THI ĐẤU (CEFR):</Text>
      <View style={styles.levelRow}>
        {LEVELS.map((lvl) => (
          <TouchableOpacity
            key={lvl}
            style={[styles.levelBtn, currentLevel === lvl && styles.activeLevelBtn]}
            onPress={() => onSelectLevel(lvl)}
          >
            <Text style={[styles.levelBtnText, currentLevel === lvl && styles.activeLevelText]}>
              {lvl}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* 💡 CHỌN CHỦ ĐỀ LUYỆN TẬP */}
      <Text style={[styles.sectionTitle, { marginTop: 12 }]}>💡 CHỌN CHỦ ĐỀ LUYỆN TẬP:</Text>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.topicScrollView}>
        {TOPICS.map((topic) => (
          <TouchableOpacity
            key={topic}
            style={[styles.topicChip, currentTopic === topic && styles.activeTopicChip]}
            onPress={() => onSelectTopic(topic)}
          >
            <Text style={[styles.topicText, currentTopic === topic && styles.activeTopicText]}>
              {topic}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    width: '100%',
    backgroundColor: '#120826',
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#3A1559',
    marginBottom: 15,
  },
  sectionTitle: {
    color: '#00FFCC',
    fontSize: 11,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  levelRow: {
    flexDirection: 'row',
    justify: 'space-between',
    width: '100%',
  },
  levelBtn: {
    flex: 1,
    paddingVertical: 10,
    marginHorizontal: 2,
    backgroundColor: '#1A0B36',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#3A1559',
    alignItems: 'center',
  },
  activeLevelBtn: {
    backgroundColor: '#FF007F',
    borderColor: '#FF007F',
  },
  levelBtnText: {
    color: '#8888CC',
    fontSize: 12,
    fontWeight: 'bold',
  },
  activeLevelText: {
    color: '#FFFFFF',
    fontWeight: '900',
  },
  topicScrollView: {
    flexDirection: 'row',
  },
  topicChip: {
    paddingVertical: 6,
    paddingHorizontal: 12,
    backgroundColor: '#1A0B36',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#3A1559',
    marginRight: 8,
  },
  activeTopicChip: {
    backgroundColor: '#00FFCC',
    borderColor: '#00FFCC',
  },
  topicText: {
    color: '#AAAABB',
    fontSize: 10,
    fontWeight: 'bold',
  },
  activeTopicText: {
    color: '#000000',
    fontWeight: 'bold',
  },
});