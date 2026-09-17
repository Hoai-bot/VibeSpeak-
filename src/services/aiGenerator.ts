// src/services/aiGenerator.ts
import { generateTier1Drill } from './drills/tier1Service';
import { generateTier2Drill } from './drills/tier2Service';
import { generateTier3Drill } from './drills/tier3Service';

export interface DrillItem {
  target: string;
  phonetics: string;
  meaning: string;
  tip: string;
  spokenText: string;
  cefrLevel?: string;
  isReviewItem?: boolean;
}

export async function generateDynamicDrill(
  tier: 1 | 2 | 3,
  cefrLevel: 'A1' | 'A2' | 'B1' | 'B2' | 'C1' = 'B2',
  topicContext: string = 'Cyberpunk Business & Tech'
): Promise<DrillItem> {
  if (tier === 1) return await generateTier1Drill(cefrLevel, topicContext);
  if (tier === 2) return await generateTier2Drill(cefrLevel, topicContext);
  return await generateTier3Drill(cefrLevel, topicContext);
}