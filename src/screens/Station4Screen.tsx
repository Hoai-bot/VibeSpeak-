// Trong src/screens/Station4Screen.tsx

// Import thêm clearStation4History từ service
import { 
  getInstantStation4Exercise, 
  generateStation4Exercise, 
  clearStation4History,
  SpeakingExpressExercise 
} from '../services/arena/station4Service';

// Cập nhật hàm đổi level
const handleLevelChange = (newLevel: string) => {
  if (newLevel === cefrLevel) return;
  clearStation4History();
  setCefrLevel(newLevel);
};

// Cập nhật hàm load bài tập
const loadExerciseData = async (level: string) => {
  const currentRequestId = ++requestIdRef.current;
  stopAllAudio();
  resetState();

  // 1. Nạp tức thì Flash Data Local (0ms delay)
  const instantData = getInstantStation4Exercise(level);
  setExercise(instantData);

  // 2. Tạo ngầm từ AI
  setLoading(true);
  try {
    const aiData = await generateStation4Exercise(level);
    if (currentRequestId === requestIdRef.current && aiData) {
      setExercise(aiData);
    }
  } catch (err) {
    console.warn("Dùng Flash Data cho Trạm 4:", err);
  } finally {
    if (currentRequestId === requestIdRef.current) {
      setLoading(false);
    }
  }
};