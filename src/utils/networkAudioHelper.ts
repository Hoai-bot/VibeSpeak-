// src/utils/networkAudioHelper.ts

/**
 * 🎯 1. TỐI ƯU CẤU HÌNH MEDIARECORDER ĐỂ GIẢM ĐỘ TRỄ VÀ NÉN DUNG LƯỢNG
 */
export const getOptimizedRecorderConfig = () => {
  if (typeof MediaRecorder === 'undefined') {
    return { options: undefined, mimeType: '' };
  }

  // Ưu tiên Opus codec vì tốc độ nén cực nhanh và độ nét giọng nói cao
  const mimeCandidates = [
    'audio/webm;codecs=opus',
    'audio/webm',
    'audio/mp4',
    'audio/aac',
    'audio/ogg'
  ];

  let selectedMime = '';
  for (const candidate of mimeCandidates) {
    if (MediaRecorder.isTypeSupported(candidate)) {
      selectedMime = candidate;
      break;
    }
  }

  const options: MediaRecorderOptions = {
    mimeType: selectedMime || undefined,
    // Giới hạn bitrate 32 kbps: tối ưu hoàn hảo cho AI nhận diện giọng nói, giảm độ trễ upload
    audioBitsPerSecond: 32000,
  };

  return { options, mimeType: selectedMime || 'audio/webm' };
};

/**
 * 🎯 2. WRAPPER GỌI API CHẤM ĐIỂM KÈM CƠ CHẾ RETRY (EXPONENTIAL BACKOFF + TIMEOUT)
 */
interface RetryOptions {
  maxRetries?: number;      // Số lần thử lại tối đa (mặc định: 3)
  timeoutMs?: number;       // Thời gian chờ tối đa cho mỗi lần gọi (mặc định: 15s)
  initialDelayMs?: number;  // Độ trễ lần retry đầu tiên (mặc định: 1s)
  onRetry?: (attempt: number, error: any) => void; // Callback cập nhật UI
}

export const executeWithRetry = async <T>(
  asyncFn: (signal: AbortSignal) => Promise<T>,
  options: RetryOptions = {}
): Promise<T> => {
  const {
    maxRetries = 3,
    timeoutMs = 15000,
    initialDelayMs = 1000,
    onRetry
  } = options;

  let attempt = 0;
  let delay = initialDelayMs;

  while (attempt < maxRetries) {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => {
      controller.abort();
    }, timeoutMs);

    try {
      attempt++;
      const result = await asyncFn(controller.signal);
      clearTimeout(timeoutId);
      return result;
    } catch (err: any) {
      clearTimeout(timeoutId);

      const isAborted = err.name === 'AbortError' || controller.signal.aborted;
      const isLastAttempt = attempt >= maxRetries;

      if (isLastAttempt) {
        throw new Error(
          isAborted
            ? 'Kết nối mạng quá chậm khiến yêu cầu bị ngắt (Timeout). Vui lòng thử lại!'
            : err?.message || 'Không thể kết nối đến máy chủ AI sau nhiều lần thử lại.'
        );
      }

      if (onRetry) {
        onRetry(attempt, err);
      }

      // Chờ tăng dần theo lũy thừa kèm một chút ngẫu nhiên (Jitter) để tránh xung đột
      const jitter = Math.random() * 200;
      await new Promise((resolve) => setTimeout(resolve, delay + jitter));
      delay *= 2; // Tăng gấp đôi độ trễ ở lần thử kế tiếp (1s -> 2s -> 4s)
    }
  }

  throw new Error('Đã hết số lần thử lại.');
};