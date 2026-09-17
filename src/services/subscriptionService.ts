import AsyncStorage from '@react-native-async-storage/async-storage';

const DAILY_FREE_LIMIT = 3;
const STORAGE_KEY_PLAY_COUNT = '@vibespeak_daily_play_count';
const STORAGE_KEY_USER_TIER = '@vibespeak_user_tier'; // 'FREE' | 'VIP'

export async function checkCanPlayArena(): Promise<{ canPlay: boolean; remaining: number; isVip: boolean }> {
  const tier = (await AsyncStorage.getItem(STORAGE_KEY_USER_TIER)) || 'FREE';
  if (tier === 'VIP') return { canPlay: true, remaining: 999, isVip: true };

  const todayStr = new Date().toISOString().split('T')[0];
  const rawData = await AsyncStorage.getItem(STORAGE_KEY_PLAY_COUNT);
  const data = rawData ? JSON.parse(rawData) : { date: todayStr, count: 0 };

  if (data.date !== todayStr) {
    // Reset lượt chơi mới cho ngày mới
    await AsyncStorage.setItem(STORAGE_KEY_PLAY_COUNT, JSON.stringify({ date: todayStr, count: 0 }));
    return { canPlay: true, remaining: DAILY_FREE_LIMIT, isVip: false };
  }

  const remaining = DAILY_FREE_LIMIT - data.count;
  return { canPlay: remaining > 0, remaining: Math.max(0, remaining), isVip: false };
}

export async function incrementPlayCount(): Promise<void> {
  const todayStr = new Date().toISOString().split('T')[0];
  const rawData = await AsyncStorage.getItem(STORAGE_KEY_PLAY_COUNT);
  const data = rawData ? JSON.parse(rawData) : { date: todayStr, count: 0 };

  if (data.date === todayStr) {
    data.count += 1;
    await AsyncStorage.setItem(STORAGE_KEY_PLAY_COUNT, JSON.stringify(data));
  }
}