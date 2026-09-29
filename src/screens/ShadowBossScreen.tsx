import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';

export default function ShadowBossScreen({ onBack }: { onBack: () => void }) {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>👹 TRẠM 3: SHADOW BOSS RAID</Text>
      <Text style={styles.desc}>Tính năng luyện Shadowing theo nhịp điệu cùng Boss Cyber.</Text>
      <TouchableOpacity style={styles.btn} onPress={onBack}>
        <Text style={styles.btnText}>🔙 QUAY LẠI MAP</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#05020D', padding: 20, justifyContent: 'center', alignItems: 'center' },
  title: { color: '#FFD700', fontSize: 16, fontWeight: '900', marginBottom: 10 },
  desc: { color: '#AAAABB', fontSize: 12, textAlign: 'center', marginBottom: 20 },
  btn: { backgroundColor: '#FFD700', padding: 12, borderRadius: 8 },
  btnText: { color: '#000', fontWeight: '900', fontSize: 11 }
});