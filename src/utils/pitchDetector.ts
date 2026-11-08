// src/utils/pitchDetector.ts

// Thuật toán YIN rút gọn cho Web Audio API
export function detectPitchYIN(buffer: Float32Array, sampleRate: number): number | null {
  const threshold = 0.15;
  const bufferSize = buffer.length;
  const halfBufferSize = Math.floor(bufferSize / 2);
  const yinBuffer = new Float32Array(halfBufferSize);

  // Bước 1: Tính hàm sai phân bình phương
  for (let tau = 0; tau < halfBufferSize; tau++) {
    for (let i = 0; i < halfBufferSize; i++) {
      const delta = buffer[i] - buffer[i + tau];
      yinBuffer[tau] += delta * delta;
    }
  }

  // Bước 2: Chuẩn hóa CMNDF
  yinBuffer[0] = 1;
  let runningSum = 0;
  for (let tau = 1; tau < halfBufferSize; tau++) {
    runningSum += yinBuffer[tau];
    yinBuffer[tau] *= tau / runningSum;
  }

  // Bước 3: Tìm điểm cực tiểu tuyệt đối dưới ngưỡng
  let tauFound = -1;
  for (let tau = 2; tau < halfBufferSize; tau++) {
    if (yinBuffer[tau] < threshold) {
      while (tau + 1 < halfBufferSize && yinBuffer[tau + 1] < yinBuffer[tau]) {
        tau++;
      }
      tauFound = tau;
      break;
    }
  }

  if (tauFound === -1) return null; // Unvoiced / Silent

  // Nội suy parabol tăng độ chính xác
  const betterTau = tauFound;
  const pitch = sampleRate / betterTau;

  // Giới hạn tần số giọng người: 70Hz - 450Hz
  return (pitch >= 70 && pitch <= 450) ? pitch : null;
}

// Chuyển mảng F0 thành đường cong ngữ điệu chuẩn hóa (Semitones)
export function extractNormalizedContour(f0Array: (number | null)[]): number[] {
  const voiced = f0Array.filter((f): f is number => f !== null && f > 0);
  if (voiced.length === 0) return [];
  const meanF0 = voiced.reduce((a, b) => a + b, 0) / voiced.length;

  return f0Array.map((f) => {
    if (!f || f <= 0) return 0;
    return 12 * Math.log2(f / meanF0); // Semitone offset
  });
}