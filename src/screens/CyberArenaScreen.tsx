// Trong đoạn render TẦNG 2: RELAY CO-OP của CyberArenaScreen.tsx
{arenaTier === 2 && relayData && (
  <>
    <Text style={styles.cardTitle}>🎯 CHỦ ĐỀ THI ĐẤU: {relayData.topic} [{cefrLevel}]</Text>
    <Text style={styles.cardDesc}>📌 Bối cảnh: "{relayData.context}"</Text>
    
    {/* Phần nhiệm vụ cho Bạn 1 */}
    <View style={styles.relayBox}>
      <Text style={styles.playerTag}>⏱️ BẠN 1 (30 giây đầu - Đặt vấn đề / Ý kiến 1):</Text>
      <Text style={[styles.cardDesc, { textAlign: 'left', fontStyle: 'normal' }]}>
        💡 {relayData.player1Guideline}
      </Text>
    </View>

    {/* Phần nhiệm vụ cho Bạn 2 */}
    <View style={[styles.relayBox, { borderColor: '#FF007F' }]}>
      <Text style={[styles.playerTag, { color: '#FF007F' }]}>⏱️ BẠN 2 (30 giây sau - Giải pháp / Ý kiến 2):</Text>
      <Text style={[styles.cardDesc, { textAlign: 'left', fontStyle: 'normal' }]}>
        💡 {relayData.player2Guideline}
      </Text>
    </View>

    <Text style={styles.keyText}>🔑 Từ khóa gợi ý nên dùng: {relayData.keyVocabulary?.join(', ')}</Text>
    <Text style={[styles.keyText, { color: '#00FFCC', marginTop: 4 }]}>
      🎙️ Hai bạn bấm mic để lần lượt trình bày ý kiến cá nhân trong 30s!
    </Text>
  </>
)}