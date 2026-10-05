// src/services/drills/station3Service.ts
import { Groq } from 'groq-sdk';
import { BOSS_SCENARIOS_DATA, BossScenarioItem } from '../../data/station3/bossScenarios';

const ACTIVE_GROQ_KEY =
  process.env.GROQ_API_KEY_NEW ||
  process.env.GROQ_API_KEY ||
  process.env.GROQ_API ||
  process.env.EXPO_PUBLIC_GROQ_API_KEY ||
  '';

const groq = new Groq({ apiKey: ACTIVE_GROQ_KEY, dangerouslyAllowBrowser: true });

// Bộ nhớ đệm lưu vết ID Boss đã xuất hiện để chống lặp đề
let usedBossIds: string[] = [];

/**
 * ⚡ LẤY BOSS TỨC THÌ TỪ FLASH DATA LOCAL (Chống lặp 100%)
 */
export function getInstantShadowBoss(level: string = 'B2'): BossScenarioItem {
  const levelBosses = BOSS_SCENARIOS_DATA.filter((b) => b.level === level);
  const targetList = levelBosses.length > 0 ? levelBosses : BOSS_SCENARIOS_DATA;

  let available = targetList.filter((b) => !usedBossIds.includes(b.id));

  // Nếu đã duyệt hết kho Boss của Level này -> Reset danh sách
  if (available.length === 0) {
    usedBossIds = usedBossIds.filter((id) => !targetList.some((b) => b.id === id));
    available = [...targetList];
  }

  const selected = available[Math.floor(Math.random() * available.length)];
  usedBossIds.push(selected.id);

  return selected;
}

/**
 * 🤖 TẠO NGẦM BOSS MỚI BẰNG GROQ AI (Dynamic Generation)
 */
export async function generateShadowBoss(cefrLevel: string = 'B2'): Promise<BossScenarioItem> {
  const prompt = `You are an ELT Expert designing a Cyberpunk Shadow Boss Challenge for CEFR Level ${cefrLevel} in VibeSpeak Arena.
Create ONE engaging Shadowing Boss scenario.

Return ONLY JSON matching schema:
{
  "id": "ai_boss_${Date.now()}",
  "level": "${cefrLevel}",
  "bossName": "Cyber Phantasm",
  "bossTitle": "Chúa Tể Bóng Mơ",
  "bossAvatar": "👾",
  "maxHp": 120,
  "timeLimitSeconds": 40,
  "bossChallengeEn": "The ultimate rhythm requires absolute focus and clear articulation.",
  "bossChallengeVi": "Nhịp điệu tối thượng đòi hỏi sự tập trung tuyệt đối và phát âm rõ ràng.",
  "expectedResponsePromptEn": "Shadow the phrase with clear rhythm and articulation.",
  "expectedResponsePromptVi": "Đọc đuổi theo câu thoại với nhịp điệu rõ ràng.",
  "keyTargetPhrases": ["ultimate rhythm", "absolute focus", "clear articulation"]
}`;

  try {
    const response = await groq.chat.completions.create({
      messages: [{ role: 'user', content: prompt }],
      model: 'llama3-8b-8192',
      temperature: 0.8,
      response_format: { type: 'json_object' },
    });

    const aiBoss = JSON.parse(response.choices[0]?.message?.content || '{}') as BossScenarioItem;

    if (aiBoss && aiBoss.bossName && aiBoss.bossChallengeEn) {
      usedBossIds.push(aiBoss.id);
      return aiBoss;
    }
  } catch (error) {
    console.warn('⚠️ Groq AI Trạm 3 gặp sự cố, chuyển sang Flash Data Local:', error);
  }

  // Fallback an toàn về Flash Data Local
  return getInstantShadowBoss(cefrLevel);
}

/**
 * 🔄 XÓA LỊCH SỬ BỐC BOSS KHI ĐỔI LEVEL
 */
export function clearStation3History() {
  usedBossIds = [];
}