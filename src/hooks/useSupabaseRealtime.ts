import { useState, useEffect } from 'react';
import { supabase } from '../services/supabaseClient';
import { generateDynamicTopic, generateRoleplayScenario } from '../services/groqClient';

export function useSupabaseRealtime(userId: string, betAmount: number) {
  const [matchId, setMatchId] = useState<string | null>(null);
  const [matchStatus, setMatchStatus] = useState<'idle' | 'searching' | 'found'>('idle');
  const [opponent, setOpponent] = useState<string | null>(null);
  const [isPlayer1, setIsPlayer1] = useState<boolean>(false);
  const [opponentScore, setOpponentScore] = useState<number | null>(null);
  const [userExp, setUserExp] = useState<number>(1000);
  const [userAvgScore, setUserAvgScore] = useState<number>(75);
  const [totalMatches, setTotalMatches] = useState<number>(0);
  const [currentTopic, setCurrentTopic] = useState<string>('Generating dynamic topic...');
  const [roleplayScenario, setRoleplayScenario] = useState<{ scenario: string; roleA: string; roleB: string } | null>(null);

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

  // 3. Hàm Tìm Trận Smart SBMM (Ghép Đội Cân Bằng Trình Đội & Cặp Đấu)
  const findMatch = async (matchType: 'solo' | 'relay_2v2' | 'roleplay_2v2' = 'solo') => {
    setMatchStatus('searching');
    setMatchId(null);
    setOpponent(null);
    setOpponentScore(null);
    setRoleplayScenario(null);

    const thirtySecondsAgo = new Date(Date.now() - 30 * 1000).toISOString();

    // BƯỚC A: Lọc các phòng cùng loại match_type và cược
    const { data: waitingMatches } = await supabase
      .from('arena_matches')
      .select('*')
      .eq('status', 'waiting')
      .eq('match_type', matchType)
      .eq('bet_amount', betAmount)
      .neq('player1_id', userId)
      .gt('created_at', thirtySecondsAgo)
      .order('created_at', { ascending: true });

    if (waitingMatches && waitingMatches.length > 0) {
      // Siết chặt khoảng chênh lệch: Solo (+/- 12d), Đấu đôi (+/- 8d để tổng điểm 2 đội ngang nhau)
      const maxVariance = matchType === 'solo' ? 12 : 8;

      const balancedMatch = waitingMatches.find((match) => {
        const scoreDiff = Math.abs((match.player1_avg_score || 75) - userAvgScore);
        return scoreDiff <= maxVariance;
      });

      if (balancedMatch) {
        const { error } = await supabase
          .from('arena_matches')
          .update({ player2_id: userId, status: 'in_progress' })
          .eq('id', balancedMatch.id);

        if (!error) {
          setMatchId(balancedMatch.id);
          setOpponent(balancedMatch.player1_id);
          setIsPlayer1(false);
          setMatchStatus('found');
          if (balancedMatch.topic_prompt) setCurrentTopic(balancedMatch.topic_prompt);
          if (balancedMatch.scenario_data) setRoleplayScenario(balancedMatch.scenario_data);
          return;
        }
      }
    }

    // BƯỚC B: Nếu chưa có phòng cân bằng -> Sinh đề AI Động và tạo phòng mới
    let topicToSave = '';
    let scenarioDataToSave = null;

    if (matchType === 'roleplay_2v2') {
      const rpData = await generateRoleplayScenario();
      topicToSave = `🎭 ROLEPLAY: ${rpData.scenario}`;
      scenarioDataToSave = rpData;
      setRoleplayScenario(rpData);
    } else {
      topicToSave = await generateDynamicTopic(userAvgScore);
    }

    setCurrentTopic(topicToSave);

    const { data: newMatch } = await supabase
      .from('arena_matches')
      .insert([
        { 
          player1_id: userId, 
          bet_amount: betAmount, 
          status: 'waiting',
          match_type: matchType,
          topic_prompt: topicToSave,
          scenario_data: scenarioDataToSave,
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
          if (payload.new.scenario_data) setRoleplayScenario(payload.new.scenario_data);

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
    userAvgScore,
    roleplayScenario
  };
}