import React, { useEffect, useRef } from 'react';
import { StyleSheet, View, Animated, Easing, Text } from 'react-native';

export function CassetteTapeAnimation({ isPlayingAudio }: { isPlayingAudio: boolean }) {
  const spinAnim = useRef(new Animated.Value(0)).current;

  // Quản lý trạng thái quay của trục băng
  useEffect(() => {
    let animation: Animated.CompositeAnimation;
    if (isPlayingAudio) {
      animation = Animated.loop(
        Animated.timing(spinAnim, {
          toValue: 1,
          duration: 3000, 
          easing: Easing.linear,
          useNativeDriver: true, // Tối ưu phần cứng[cite: 3]
        })
      );
      animation.start();
    } else {
      spinAnim.setValue(0);
    }
    return () => {
      if (animation) animation.stop();
    };
  }, [isPlayingAudio, spinAnim]);

  const spinRotate = spinAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg'],
  });

  return (
    <View style={styles.cassetteContainer}>
      <View style={styles.tapeBody}>
        <View style={styles.labelArea}>
          <Text style={styles.labelText}>VIBESPEAK • DEBRIEF MIXTAPE</Text>
          <View style={styles.labelSubLine} />
        </View>

        <View style={styles.windowArea}>
          {/* Trục trái */}
          <Animated.View style={[styles.reel, { transform: [{ rotate: spinRotate }] }]}>
            <View style={styles.hub}>
              <View style={styles.hubTeeth} />
              <View style={[styles.hubTeeth, { transform: [{ rotate: '90deg' }] }]} />
              <View style={styles.centerHole} />
            </View>
          </Animated.View>

          <View style={styles.magneticTapeBridge} />

          {/* Trục phải */}
          <Animated.View style={[styles.reel, { transform: [{ rotate: spinRotate }] }]}>
            <View style={styles.hub}>
              <View style={styles.hubTeeth} />
              <View style={[styles.hubTeeth, { transform: [{ rotate: '90deg' }] }]} />
              <View style={styles.centerHole} />
            </View>
          </Animated.View>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  cassetteContainer: { alignItems: 'center', marginVertical: 20 },
  tapeBody: {
    width: 280, height: 160, backgroundColor: '#120B2C', 
    borderRadius: 12, borderWidth: 3, borderColor: '#FF007F', // Viền Hot Pink[cite: 3]
    padding: 10, justifyContent: 'space-between', alignItems: 'center',
    shadowColor: '#FF007F', shadowRadius: 15, shadowOpacity: 0.8,
  },
  labelArea: { width: '100%', height: 35, backgroundColor: '#39FF14', borderRadius: 4, justifyContent: 'center', alignItems: 'center' },
  labelText: { color: '#000', fontSize: 11, fontWeight: 'bold', fontFamily: 'Courier New' },
  labelSubLine: { width: '80%', height: 2, backgroundColor: '#000', marginTop: 2 },
  windowArea: { width: '85%', height: 65, backgroundColor: '#070314', borderRadius: 8, borderWidth: 2, borderColor: '#00FFFF', flexDirection: 'row', justifyContent: 'space-around', alignItems: 'center', paddingHorizontal: 15, overflow: 'hidden' },
  reel: { width: 44, height: 44, borderRadius: 22, borderWidth: 2, borderColor: '#39FF14', backgroundColor: '#FFF', justifyContent: 'center', alignItems: 'center' },
  hub: { width: '100%', height: '100%', justifyContent: 'center', alignItems: 'center' },
  hubTeeth: { position: 'absolute', width: '100%', height: 4, backgroundColor: '#120B2C' },
  centerHole: { width: 14, height: 14, borderRadius: 7, backgroundColor: '#070314', borderWidth: 1, borderColor: '#120B2C', zIndex: 10 },
  magneticTapeBridge: { position: 'absolute', width: 120, height: 6, backgroundColor: '#3D2F28', top: '45%', zIndex: -1 },
});