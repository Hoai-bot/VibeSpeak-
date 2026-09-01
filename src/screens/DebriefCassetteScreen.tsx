import React, { useState, useEffect, useRef } from 'react';
import { StyleSheet, Text, View, TouchableOpacity, ScrollView } from 'react-native';
import { Audio } from 'expo-av';
import { CassetteTapeAnimation } from '../components/animations/CassetteTapeAnimation';

export default function DebriefCassetteScreen() {
  const [streamedText, setStreamedText] = useState('');
  const [isStreaming, setIsStreaming] = useState(false);
  const clickSoundRef = useRef<Audio.Sound | null>(null);

  // Load trước âm thanh vào bộ đệm RAM[cite: 3]
  useEffect(() => {
    async function loadResources() {
      const { sound } = await Audio.Sound.createAsync(
        require('../../assets/sounds/typewriter_click.mp3'),
        { shouldPlay: false, volume: 0.5 }
      );
      clickSoundRef.current = sound;
    }
    loadResources();
    return () => {
      if (clickSoundRef.current) clickSoundRef.current.unloadAsync();
    };
  }, []);

  const triggerClickSFX = async () => {
    if (clickSoundRef.current) {
      try {
        await clickSoundRef.current.setPositionAsync(0); // Tua về 0[cite: 3]
        await clickSoundRef.current.playAsync();
      } catch (err) {}
    }
  };

  const startStreamingSimulation = () => {
    setStreamedText('');
    setIsStreaming(true);
    
    // Giả lập dữ liệu trả về từ AI 
    const sampleOutput = "GRAMMAR_OK: I want to book a table for two.\nNATURAL_OK: I'd like to get a table for two, please.\nNATIVE_STYLE: Can we get a table for two?\nFLUENCY_CHECK: Bạn ngập ngừng hơi nhiều ở đầu câu.";
    let index = 0;

    const interval = setInterval(async () => {
      if (index < sampleOutput.length) {
        const char = sampleOutput[index];
        setStreamedText((prev) => prev + char);
        
        // Không phát tiếng nếu là khoảng trắng[cite: 3]
        if (char !== ' ' && char !== '\n') {
          await triggerClickSFX();
        }
        index++;
      } else {
        clearInterval(interval);
        setIsStreaming(false);
      }
    }, 80); // Tốc độ gõ
  };

  return (
    <View style={styles.container}>
      <Text style={styles.neonTitle}>DEBRIEF REPORT</Text>
      
      {/* Component Băng Cassette */}
      <CassetteTapeAnimation isPlayingAudio={isStreaming} />

      <ScrollView style={styles.terminal}>
        <Text style={styles.neonText}>{streamedText}</Text>
      </ScrollView>

      <TouchableOpacity 
        style={styles.button} 
        onPress={startStreamingSimulation}
        disabled={isStreaming}
      >
        <Text style={styles.buttonText}>BẮT ĐẦU PHÂN TÍCH</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0A051B', alignItems: 'center', padding: 20, paddingTop: 50 },
  neonTitle: { fontSize: 24, color: '#39FF14', fontWeight: 'bold', textShadowColor: '#39FF14', textShadowRadius: 15, marginBottom: 10 },
  terminal: { width: '100%', height: 250, backgroundColor: '#120B2C', borderRadius: 10, borderColor: '#00FFFF', borderWidth: 2, padding: 15, marginBottom: 40, shadowColor: '#00FFFF', shadowRadius: 15 },
  neonText: { fontFamily: 'Courier New', fontSize: 15, color: '#00FFFF', lineHeight: 24 },
  button: { backgroundColor: '#FF007F', paddingVertical: 15, paddingHorizontal: 40, borderRadius: 25, shadowColor: '#FF007F', shadowRadius: 10 },
  buttonText: { color: '#FFF', fontWeight: 'bold', fontSize: 16 },
});