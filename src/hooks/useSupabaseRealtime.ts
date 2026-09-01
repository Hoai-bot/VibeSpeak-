import { useState, useEffect } from 'react';
import { supabase } from '../services/supabaseClient';

export function useSupabaseRealtime(userId: string, betAmount: number) {
  const [matchId, setMatchId] = useState<string | null>(null);
  const [matchStatus, setMatchStatus] = useState<'idle' | 'searching' | 'found'>('idle');
  const [opponent, setOpponent] = useState<string | null>(null);

  // Hàm tìm hoặc tạo phòng
  const findMatch = async () => {
    setMatchStatus('searching');

    // 1. Quét xem có phòng nào đang 'waiting' với cùng mức cược không
    const { data: waitingMatches } = await supabase
      .from('arena_matches')
      .select('*')
      .eq('status', 'waiting')
      .eq('bet_amount', betAmount)
      .neq('player1_id', userId) // Không tự ghép với chính mình
      .limit(1);

    if (waitingMatches && waitingMatches.length > 0) {
      // 2. Nếu có phòng -> Tham gia phòng đó (Trở thành player2)
      const match = waitingMatches[0];
      await supabase
        .from('arena_matches')
        .update({ player2_id: userId, status: 'in_progress' })
        .eq('id', match.id);
      
      setMatchId(match.id);
      setOpponent(match.player1_id);
      setMatchStatus('found');
    } else {
      // 3. Nếu không có phòng -> Tạo phòng mới và làm chủ phòng
      const { data: newMatch } = await supabase
        .from('arena_matches')
        .insert([{ player1_id: userId, bet_amount: betAmount, status: 'waiting' }])
        .select()
        .single();
      
      if (newMatch) {
        setMatchId(newMatch.id);
      }
    }
  };

  // 4. Lắng nghe WebSocket: Báo động ngay khi có người nhảy vào phòng của mình
  useEffect(() => {
    if (!matchId || matchStatus === 'found') return;

    const channel = supabase.channel(`match_${matchId}`)
      .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'arena_matches', filter: `id=eq.${matchId}` },
        (payload) => {
          // Kẻ địch đã vào phòng!
          if (payload.new.status === 'in_progress') {
            setOpponent(payload.new.player2_id);
            setMatchStatus('found');
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [matchId, matchStatus]);

  return { findMatch, matchStatus, opponent };
}