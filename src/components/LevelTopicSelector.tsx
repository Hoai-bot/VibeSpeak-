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
  'Daily Life & Hobbies',
  'Campus & Education',
  'Tech & AI Innovations',
  'Business & Startup',
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
      {/* Chọn Cấp độ CEFR */}
      <Text style={styles.label}>🎯 CẤP ĐỘ (CEFR):</Text>
      <View style={styles.row}>
        {LEVELS.map((lvl) => (
          <TouchableOpacity
            key={lvl}
            style={[styles.chip, currentLevel === lvl && styles.activeChip]}
            onPress={() => onSelectLevel(lvl)}
          >
            <Text style={[styles.chipText, currentLevel === lvl && styles.activeText]}>
              {lvl}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Chọn Chủ đề Topic Context */}
      <Text style={[styles.label, { marginTop: 10 }]}>💡 CHỦ ĐỀ LUYỆN TẬP:</Text>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.topicRow}>
        {TOPICS.map((topic) => (
          <TouchableOpacity
            key={topic}
            style={[styles.topicChip, currentTopic === topic && styles.activeTopicChip]}
            onPress={() => onSelectTopic(topic)}
          >
            <Text style={[styles.topicText, currentTopic === topic && styles.activeText]}>
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
    backgroundColor: '#12122b',
    padding: 12,
    borderRadius: 12,
    marginHorizontal: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#2a2a5a',
  },
  label: { color: '#00ffcc', fontSize: 12, fontWeight: 'bold', marginBottom: 6 },
  row: { flexDirection: 'row', justifyContent: 'space-between' },
  chip: {
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 8,
    backgroundColor: '#1a1a3a',
    borderWidth: 1,
    borderColor: '#3a3a7a',
  },
  activeChip: { backgroundColor: '#00ffcc', borderColor: '#00ffcc' },
  chipText: { color: '#8888cc', fontWeight: 'bold', fontSize: 12 },
  activeText: { color: '#000', fontWeight: 'bold' },
  topicRow: { flexDirection: 'row' },
  topicChip: {
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 16,
    backgroundColor: '#1a1a3a',
    marginRight: 8,
    borderWidth: 1,
    borderColor: '#3a3a7a',
  },
  activeTopicChip: { backgroundColor: '#ff007f', borderColor: '#ff007f' },
  topicText: { color: '#aaa', fontSize: 12 },
});