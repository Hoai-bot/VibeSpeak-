import { useState, useEffect } from 'react';
import { supabase } from '../services/supabaseClient';

const ARENA_TOPICS = [
  "Describe your favorite food and why you like it.",
  "What is your dream job in the future?",
  "Talk about a movie or book you really enjoyed.",
  "How do you usually spend your weekends?",
  "Why is learning English important to you?"
];

export function useSupabaseRealtime(userId: string, betAmount: number) {
  const [matchId, setMatchId] = useState<string | null>(null);
  const [matchStatus, setMatchStatus] = useState<'idle' | 'searching' | 'found'>('idle');
  const [opponent, setOpponent] = useState<string | null>(null);
  const [isPlayer1, setIsPlayer1] = useState<boolean>(false);
  const [opponentScore, setOpponentScore] = useState<number | null>(null);
  const [userExp, setUserExp] = useState<number>(1000);
  const [userAvgScore, setUserAvgScore] = useState<number>(75);
  const [totalMatches, setTotalMatches] = useState<number>(0);
  const [currentTopic, setCurrentTopic] = useState<string>(ARENA_TOPICS[0]);

  // 1. Khởi tạo / Lấy Hồ sơ chỉ số thực tế của Runner
  useEffect(() => {
    async function fetchOrCreateProfile() {
      const { data } = await supabase.from('profiles').select('exp, avg_score, total_matches').eq('id', userId).single();

      if (data) {
        setUserExp(data.exp || 1000);
        setUserAvgScore(data.avg_score || 75);
        setTotalMatches(data.total_matches || 0);
      } else {
        await supabase.from('profiles').insert([{ id: userId, username: userId, exp: 1000, avg_score: 75, total_matches: 0 }]);
        setUserExp(1000);
        setUserAvgScore(75);
        setTotalMatches(0);
      }
    }
    fetchOrCreateProfile();
  }, [userId]);

  // 2. Cập nhật EXP và Điểm Trung Bình mới sau mỗi trận
  const updateUserExp = async (expChange: number) => {
    const newExp = Math.max(0, userExp + expChange);
    setUserExp(newExp);
    await supabase.from('profiles').update({ exp: newExp }).eq('id', userId);
  };

  const updateStatsAfterMatch = async (newScore: number) => {
    const updatedMatches = totalMatches + 1;
    const updatedAvg = Math.round(((userAvgScore * totalMatches) + newScore) / updatedMatches);
    setUserAvgScore(updatedAvg);
    setTotalMatches(updatedMatches);

    await supabase.from('profiles').update({
      avg_score: updatedAvg,
      total_matches: updatedMatches
    }).eq('id', userId);
  };

  // 3. Hàm Tìm Trận Smart SBMM (Ghép khoảng điểm +/- 12)
  const findMatch = async () => {
    setMatchStatus('searching');
    setMatchId(null);
    setOpponent(null);
    setOpponentScore(null);

    const thirtySecondsAgo = new Date(Date.now() - 30 * 1000).toISOString();

    // BƯỚC A: Chỉ lọc các phòng có player1_avg_score trong khoảng +/- 12 điểm
    const { data: waitingMatches } = await supabase
      .from('arena_matches')
      .select('*')
      .eq('status', 'waiting')
      .eq('bet_amount', betAmount)
      .neq('player1_id', userId)
      .gt('created_at', thirtySecondsAgo)
      .gte('player1_avg_score', userAvgScore - 12)
      .lte('player1_avg_score', userAvgScore + 12)
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
        if (match.topic_prompt) setCurrentTopic(match.topic_prompt);
        return;
      }
    }

    // BƯỚC B: Nếu không thấy đối thủ ngang trình, tạo phòng mới đẩy chỉ số avg_score lên
    const randomTopic = ARENA_TOPICS[Math.floor(Math.random() * ARENA_TOPICS.length)];
    setCurrentTopic(randomTopic);

    const { data: newMatch } = await supabase
      .from('arena_matches')
      .insert([
        { 
          player1_id: userId, 
          bet_amount: betAmount, 
          status: 'waiting',
          topic_prompt: randomTopic,
          player1_avg_score: userAvgScore
        }
      ])
      .select()
      .single();

    if (newMatch) {
      setMatchId(newMatch.id);
      setIsPlayer1(true);
    }
  };

  // 4. Gửi điểm số bài nói & Cập nhật chỉ số cá nhân
  const submitScore = async (score: number) => {
    if (!matchId) return;
    const scoreData = isPlayer1 ? { player1_score: score } : { player2_score: score };
    await supabase.from('arena_matches').update(scoreData).eq('id', matchId);
    await updateStatsAfterMatch(score);
  };

  // 5. Realtime Sync
  useEffect(() => {
    if (!matchId) return;

    const channel = supabase
      .channel(`arena_room_${matchId}`)
      .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'arena_matches', filter: `id=eq.${matchId}` },
        (payload) => {
          if (payload.new.status === 'in_progress' && payload.new.player2_id) {
            if (isPlayer1) setOpponent(payload.new.player2_id);
            setMatchStatus('found');
          }

          if (payload.new.topic_prompt) setCurrentTopic(payload.new.topic_prompt);

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
  }, [matchId, isPlayer1]);

  return { 
    findMatch, 
    submitScore, 
    matchStatus, 
    opponent, 
    opponentScore, 
    userExp, 
    updateUserExp, 
    currentTopic,
    userAvgScore 
  };
}