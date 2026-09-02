import { useState, useEffect } from 'react';
import { supabase } from '../services/supabaseClient';

export function useSupabaseRealtime(userId: string, betAmount: number) {
  const [matchId, setMatchId] = useState<string | null>(null);
  const [matchStatus, setMatchStatus] = useState<'idle' | 'searching' | 'found'>('idle');
  const [opponent, setOpponent] = useState<string | null>(null);

  const findMatch = async () => {
    setMatchStatus('searching');

    // 1. Quét tìm phòng đang 'waiting' (Sắp xếp phòng cũ nhất lên trước)
    const { data: waitingMatches, error } = await supabase
      .from('arena_matches')
      .select('*')
      .eq('status', 'waiting')
      .eq('bet_amount', betAmount)
      .neq('player1_id', userId)
      .order('created_at', { ascending: true })
      .limit(1);

    if (error) {
      console.error('Lỗi quét phòng:', error);
    }

    if (waitingMatches && waitingMatches.length > 0) {
      // 2. Tìm thấy phòng -> Ghép vào làm Player 2
      const match = waitingMatches[0];
      
      const { error: updateError } = await supabase
        .from('arena_matches')
        .update({ player2_id: userId, status: 'in_progress' })
        .eq('id', match.id);

      if (!updateError) {
        setMatchId(match.id);
        setOpponent(match.player1_id);
        setMatchStatus('found');
        return;
      }
    }

    // 3. Nếu không có phòng sẵn -> Tạo phòng mới (Làm Player 1)
    const { data: newMatch, error: createError } = await supabase
      .from('arena_matches')
      .insert([{ player1_id: userId, bet_amount: betAmount, status: 'waiting' }])
      .select()
      .single();

    if (newMatch && !createError) {
      setMatchId(newMatch.id);
    }
  };

  // 4. Lắng nghe Realtime qua WebSocket
  useEffect(() => {
    if (!matchId || matchStatus === 'found') return;

    const channel = supabase
      .channel(`arena_room_${matchId}`)
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'arena_matches',
          filter: `id=eq.${matchId}`,
        },
        (payload) => {
          // Ngay khi Player 2 nhảy vào, cập nhật giao diện Player 1
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