import { useState, useEffect } from 'react';
import { supabase } from '../services/supabaseClient';

export function useBossRaidRealtime() {
  const [bossId, setBossId] = useState<string | null>(null);
  const [bossName, setBossName] = useState<string>('MECHA-GROQ V3');
  const [maxHp, setMaxHp] = useState<number>(1000);
  const [currentHp, setCurrentHp] = useState<number>(1000);
  const [isDefeated, setIsDefeated] = useState<boolean>(false);

  // 1. Tải thông tin con Boss đang sống từ Supabase
  useEffect(() => {
    async function fetchActiveBoss() {
      try {
        const { data, error } = await supabase
          .from('boss_raids')
          .select('*')
          .eq('status', 'active')
          .order('created_at', { ascending: false })
          .limit(1)
          .single();

        if (data && !error) {
          setBossId(data.id);
          setBossName(data.boss_name);
          setMaxHp(data.max_hp);
          setCurrentHp(data.current_hp);
          if (data.current_hp <= 0) setIsDefeated(true);
        } else {
          // Fallback: Tạo ID tạm nếu Database chưa có bảng/record
          setBossId('local_fallback_boss');
        }
      } catch (err) {
        console.warn('Supabase offline/chưa cấu hình bảng boss_raids, chạy chế độ Offline Boss');
        setBossId('local_fallback_boss');
      }
    }
    fetchActiveBoss();
  }, []);

  // 2. Gây sát thương lên Boss
  const attackBoss = async (damage: number) => {
    if (isDefeated) return;

    const newHp = Math.max(0, currentHp - damage);
    const newStatus = newHp === 0 ? 'defeated' : 'active';

    setCurrentHp(newHp);
    if (newHp === 0) setIsDefeated(true);

    // Nếu có Boss ID thực tế trên Supabase thì cập nhật lên Server
    if (bossId && bossId !== 'local_fallback_boss') {
      try {
        await supabase
          .from('boss_raids')
          .update({ current_hp: newHp, status: newStatus })
          .eq('id', bossId);
      } catch (err) {
        console.error('Lỗi sync sát thương lên Supabase:', err);
      }
    }
  };

  // 3. Realtime đồng bộ máu Boss cho tất cả Runner
  useEffect(() => {
    if (!bossId || bossId === 'local_fallback_boss') return;

    const channel = supabase
      .channel(`boss_room_${bossId}`)
      .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'boss_raids', filter: `id=eq.${bossId}` },
        (payload: any) => {
          if (payload?.new?.current_hp !== undefined) {
            setCurrentHp(payload.new.current_hp);
            if (payload.new.current_hp <= 0) {
              setIsDefeated(true);
            }
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [bossId]);

  return { bossName, maxHp, currentHp, isDefeated, attackBoss };
}