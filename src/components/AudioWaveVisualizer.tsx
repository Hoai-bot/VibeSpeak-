// src/components/AudioWaveVisualizer.tsx
import React, { useEffect, useRef } from 'react';
import { View, StyleSheet } from 'react-native';

interface Props {
  stream: MediaStream | null;
  isRecording: boolean;
  barColor?: string;
}

export default function AudioWaveVisualizer({ stream, isRecording, barColor = '#00FFFF' }: Props) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const animationFrameId = useRef<number | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const sourceNodeRef = useRef<MediaStreamAudioSourceNode | null>(null);

  useEffect(() => {
    // 1. Dọn dẹp tài nguyên khi dừng thu âm
    if (!isRecording || !stream) {
      if (animationFrameId.current) {
        cancelAnimationFrame(animationFrameId.current);
        animationFrameId.current = null;
      }
      if (sourceNodeRef.current) {
        try { sourceNodeRef.current.disconnect(); } catch (e) {}
        sourceNodeRef.current = null;
      }
      if (audioContextRef.current && audioContextRef.current.state !== 'closed') {
        audioContextRef.current.close().catch(() => {});
        audioContextRef.current = null;
      }
      if (canvasRef.current) {
        const ctx = canvasRef.current.getContext('2d');
        if (ctx) ctx.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height);
      }
      return;
    }

    let isMounted = true;

    const setupAudio = async () => {
      try {
        const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
        if (!AudioCtx) return;

        const audioCtx = new AudioCtx();
        audioContextRef.current = audioCtx;

        // 🛡️ BƯỚC 1: Tự động đánh thức AudioContext nếu đang ở trạng thái 'suspended'
        if (audioCtx.state === 'suspended') {
          await audioCtx.resume();
        }

        // 🛡️ BƯỚC 2: Dự phòng cho iOS Safari - Gắn bộ mở khóa khi người dùng tương tác
        const unlockAudioContext = async () => {
          if (audioCtx.state === 'suspended') {
            await audioCtx.resume();
          }
          if (audioCtx.state === 'running') {
            window.removeEventListener('touchstart', unlockAudioContext);
            window.removeEventListener('click', unlockAudioContext);
          }
        };

        if (audioCtx.state === 'suspended') {
          window.addEventListener('touchstart', unlockAudioContext, { passive: true });
          window.addEventListener('click', unlockAudioContext, { passive: true });
        }

        if (!isMounted) return;

        const sourceNode = audioCtx.createMediaStreamSource(stream);
        sourceNodeRef.current = sourceNode;

        const analyser = audioCtx.createAnalyser();
        analyser.fftSize = 64; // 32 dải tần số
        analyser.smoothingTimeConstant = 0.8;
        sourceNode.connect(analyser);

        const bufferLength = analyser.frequencyBinCount;
        const dataArray = new Uint8Array(bufferLength);

        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        const draw = () => {
          if (!isMounted) return;
          animationFrameId.current = requestAnimationFrame(draw);
          analyser.getByteFrequencyData(dataArray);

          ctx.clearRect(0, 0, canvas.width, canvas.height);

          const barWidth = (canvas.width / bufferLength) * 1.5;
          let x = 0;

          for (let i = 0; i < bufferLength; i++) {
            const barHeight = (dataArray[i] / 255) * canvas.height * 0.9;

            const gradient = ctx.createLinearGradient(0, canvas.height - barHeight, 0, canvas.height);
            gradient.addColorStop(0, '#39FF14');
            gradient.addColorStop(1, barColor);

            ctx.fillStyle = gradient;
            ctx.fillRect(x, canvas.height - barHeight, barWidth - 2, barHeight);

            x += barWidth + 1;
          }
        };

        draw();
      } catch (err) {
        console.warn("Lỗi khởi tạo AudioContext Visualizer:", err);
      }
    };

    setupAudio();

    return () => {
      isMounted = false;
      if (animationFrameId.current) {
        cancelAnimationFrame(animationFrameId.current);
      }
      if (sourceNodeRef.current) {
        try { sourceNodeRef.current.disconnect(); } catch (e) {}
      }
      if (audioContextRef.current && audioContextRef.current.state !== 'closed') {
        audioContextRef.current.close().catch(() => {});
      }
    };
  }, [isRecording, stream, barColor]);

  if (!isRecording) return null;

  return (
    <View style={styles.container}>
      {React.createElement('canvas', {
        ref: canvasRef,
        width: 280,
        height: 40,
        style: { width: '100%', height: 40, borderRadius: 6 }
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: '100%',
    height: 44,
    backgroundColor: '#05020D',
    borderWidth: 1,
    borderColor: '#332255',
    borderRadius: 8,
    marginVertical: 10,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 8
  }
});