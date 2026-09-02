import { useState, useEffect } from 'react';
import { supabase } from '../services/supabaseClient';

export function useSupabaseRealtime(userId: string, betAmount: number) {
  const [matchId, setMatchId] = useState<string | null>(null);
  const [matchStatus, setMatchStatus] = useState<'idle' | 'searching' | 'found'>('idle');
  const [opponent, setOpponent] = useState<string | null>(null);
  const [isPlayer1, setIsPlayer1] = useState<boolean>(false);
  const [opponentScore, setOpponentScore] = useState<number | null>(null);
  const [userExp, setUserExp] = useState<number>(1000);

  // 1. Khởi tạo / Lấy EXP thực tế của Runner
  useEffect(() => {
    async function fetchOrCreateProfile() {
      const { data } = await supabase.from('profiles').select('exp').eq('id', userId).single();

      if (data) {
        setUserExp(data.exp);
      } else {
        await supabase.from('profiles').insert([{ id: userId, username: userId, exp: 1000 }]);
        setUserExp(1000);
      }
    }
    fetchOrCreateProfile();
  }, [userId]);

  // 2. Hàm Cập nhật EXP Thực Tế
  const updateUserExp = async (expChange: number) => {
    const newExp = Math.max(0, userExp + expChange);
    setUserExp(newExp);
    await supabase.from('profiles').update({ exp: newExp }).eq('id', userId);
  };

  const findMatch = async () => {
    setMatchStatus('searching');

    const { data: waitingMatches } = await supabase
      .from('arena_matches')
      .select('*')
      .eq('status', 'waiting')
      .eq('bet_amount', betAmount)
      .neq('player1_id', userId)
      .order('created_at', { ascending: true })
      .limit(1);

    if (waitingMatches && waitingMatches.length > 0) {
      const match = waitingMatches[0];
      const { error } = await supabase
        .from('arena_matches')
        .update({ player2_id: userId, status: 'in_progress' })
        .eq('id', match.id);

      if (!error) {
        setMatchId(match.id);
        setOpponent(match.player1_id);
        setIsPlayer1(false);
        setMatchStatus('found');
        return;
      }
    }

    const { data: newMatch } = await supabase
      .from('arena_matches')
      .insert([{ player1_id: userId, bet_amount: betAmount, status: 'waiting' }])
      .select()
      .single();

    if (newMatch) {
      setMatchId(newMatch.id);
      setIsPlayer1(true);
    }
  };

  const submitScore = async (score: number) => {
    if (!matchId) return;
    const scoreData = isPlayer1 ? { player1_score: score } : { player2_score: score };
    await supabase.from('arena_matches').update(scoreData).eq('id', matchId);
  };

  useEffect(() => {
    if (!matchId) return;

    const channel = supabase
      .channel(`arena_room_${matchId}`)
      .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'arena_matches', filter: `id=eq.${matchId}` },
        (payload) => {
          if (payload.new.status === 'in_progress' && matchStatus !== 'found') {
            setOpponent(payload.new.player2_id);
            setMatchStatus('found');
          }

          if (isPlayer1 && payload.new.player2_score !== null) {
            setOpponentScore(payload.new.player2_score);
          } else if (!isPlayer1 && payload.new.player1_score !== null) {
            setOpponentScore(payload.new.player1_score);
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [matchId, matchStatus, isPlayer1]);

  return { findMatch, submitScore, matchStatus, opponent, opponentScore, userExp, updateUserExp };
}