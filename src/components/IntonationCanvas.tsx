// src/components/IntonationCanvas.tsx
import React from 'react';
import { View, Text, StyleSheet, Dimensions } from 'react-native';
import Svg, { Path, Line } from 'react-native-svg';

interface Props {
  targetContour: number[];
  studentContour: number[];
  height?: number;
}

export default function IntonationCanvas({ targetContour, studentContour, height = 110 }: Props) {
  const width = Math.min(360, Dimensions.get('window').width - 70);

  const buildPath = (contour: number[]) => {
    if (!contour || contour.length === 0) return '';
    const step = width / Math.max(1, contour.length - 1);
    const midY = height / 2;

    return contour.reduce((acc, val, i) => {
      // Scale semitone offset (-8 đến +8) vào khung hiển thị
      const y = Math.max(12, Math.min(height - 12, midY - val * 3.5));
      return i === 0 ? `M 0,${y}` : `${acc} L ${i * step},${y}`;
    }, '');
  };

  const hasData = studentContour && studentContour.length > 0;

  return (
    <View style={[styles.card, { height: height + 36 }]}>
      <View style={styles.legendRow}>
        <Text style={styles.title}>📈 ĐƯỜNG CONG NGỮ ĐIỆU (PITCH INTONATION):</Text>
        <View style={styles.legendGroup}>
          <Text style={[styles.legendText, { color: '#FFD700' }]}>━ Mẫu</Text>
          <Text style={[styles.legendText, { color: '#00FFFF' }]}>━ Bạn</Text>
        </View>
      </View>

      <View style={{ width, height, justifyContent: 'center', alignItems: 'center' }}>
        <Svg width={width} height={height}>
          {/* Trục cao độ trung tâm */}
          <Line x1="0" y1={height / 2} x2={width} y2={height / 2} stroke="#221133" strokeDasharray="4 4" />
          
          {/* Đường câu mẫu (Vàng Gold) */}
          <Path 
            d={buildPath(targetContour)} 
            stroke="#FFD700" 
            strokeWidth="2.5" 
            fill="none" 
            opacity={0.85} 
          />

          {/* Đường ngữ điệu người học (Xanh Cyan) */}
          {hasData && (
            <Path 
              d={buildPath(studentContour)} 
              stroke="#00FFFF" 
              strokeWidth="3" 
              fill="none" 
            />
          )}
        </Svg>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#070212',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#00FFFF',
    padding: 10,
    width: '100%',
    marginVertical: 10,
    alignItems: 'center',
  },
  legendRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
    marginBottom: 6,
    paddingHorizontal: 4,
  },
  title: {
    color: '#00FFFF',
    fontSize: 9,
    fontWeight: '900',
    letterSpacing: 0.5,
  },
  legendGroup: {
    flexDirection: 'row',
    gap: 8,
  },
  legendText: {
    fontSize: 9,
    fontWeight: 'bold',
  }
});