import React, { useEffect, useState } from 'react';
import type { Quiz } from '../../types/quiz';
import { quizService } from '../../services/quizService';
import { Users, ArrowLeft } from 'lucide-react';

interface GameLobbyProps {
  quiz: Quiz;
  studentName: string;
  avatar: string;
  onStartGame: () => void;
  onLeave: () => void;
  participantId: string;
  sessionId: string;
}

export const GameLobby: React.FC<GameLobbyProps> = ({
  quiz,
  studentName,
  avatar,
  onStartGame,
  onLeave,
  participantId,
  sessionId
}) => {
  const [players, setPlayers] = useState<{ id: string; name: string; avatar: string }[]>([]);
  const [joinError, setJoinError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    let cleanup: () => void = () => undefined;
    if (sessionId) {
      const connectStudent = async () => {
        console.debug('[QuizSpark student] resolved quiz/session', {
          quizCode: quiz.code,
          quizId: quiz.id,
          sessionId,
          studentId: participantId
        });
        try {
          await quizService.joinLiveQuiz(sessionId, quiz.id, studentName, avatar, participantId);
          const refreshParticipants = async () => {
            const participants = await quizService.getLiveQuizParticipants(sessionId);
            if (active) {
              const uniquePlayers = new Map(participants.map(player => [player.id, {
                id: player.id,
                name: player.student_name,
                avatar: player.avatar || '🚀'
              }]));
              setPlayers([...uniquePlayers.values()]);
            }
          };
          await refreshParticipants();
          cleanup = quizService.subscribeToLiveQuizParticipants(sessionId, () => { void refreshParticipants(); });
          if (!active) cleanup();
        } catch (error) {
          if (active) setJoinError('Could not join the live quiz. Please try again.');
          console.error('[QuizSpark student] join failed', {
            quizCode: quiz.code,
            quizId: quiz.id,
            sessionId,
            studentId: participantId,
            error
          });
        }
      };
      void connectStudent();
      return () => { active = false; cleanup(); };
    }

    setJoinError('No active live quiz session was found. Please re-enter the quiz code.');
    return () => { active = false; };
  }, [avatar, participantId, quiz.id, sessionId, studentName]);

  useEffect(() => {
    const checkStart = async () => {
      if (sessionId) {
        const session = await quizService.getLiveQuizSession(sessionId);
        if (session?.status === 'live') onStartGame();
      }
    };
    checkStart();
    const refresh = window.setInterval(checkStart, 500);
    return () => window.clearInterval(refresh);
  }, [onStartGame, sessionId]);

  return (
    <div className="max-w-3xl mx-auto space-y-8 pb-20 text-center">
      
      {/* LEAVE BUTTON */}
      <div className="flex justify-start">
        <button
          onClick={onLeave}
          className="px-4 py-2 rounded-xl text-xs font-bold bg-slate-800 text-slate-300 hover:text-white flex items-center gap-2 transition-all"
        >
          <ArrowLeft className="w-4 h-4" /> Leave Lobby
        </button>
      </div>

      {/* LOBBY HERO CARD */}
      <div className="bg-gradient-to-tr from-purple-950 via-slate-900 to-indigo-950 border border-purple-500/30 rounded-3xl p-8 shadow-2xl space-y-6 relative overflow-hidden">
        
        <div className="space-y-2">
          <span className="px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-300 text-xs font-mono font-bold border border-emerald-500/30">
            PIN CODE: <span className="text-amber-400 font-extrabold">{quiz.code}</span>
          </span>

          <h1 className="text-3xl md:text-4xl font-black text-white">{quiz.title}</h1>
          <p className="text-xs text-slate-300 max-w-md mx-auto">
            Get ready! {quiz.questions?.length || 0} questions with instant speed-bonus scoring!
          </p>
        </div>

        {/* YOUR PLAYER CARD */}
        <div className="inline-flex items-center gap-3 bg-slate-950/80 px-6 py-3 rounded-2xl border border-slate-800 shadow-xl">
          <span className="text-3xl">{avatar}</span>
          <div className="text-left">
            <span className="text-[10px] uppercase font-black text-emerald-400 tracking-wider block">Ready Player</span>
            <span className="font-extrabold text-white text-lg">{studentName}</span>
          </div>
        </div>

        {/* EARTH LOBBY */}
        <div className="space-y-3 pt-4 border-t border-slate-800/80">
          <p className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center justify-center gap-1.5">
            <Users className="w-4 h-4 text-emerald-400" /> The earth is filling up ({players.length} joined)
          </p>

          <div className="relative mx-auto w-64 h-64 rounded-full bg-gradient-to-br from-cyan-400 via-emerald-500 to-blue-900 border-8 border-cyan-200/20 shadow-[0_0_70px_rgba(34,211,238,0.25)] overflow-visible">
            <div className="absolute inset-4 rounded-full border border-white/20 border-dashed animate-spin-slow" />
            <div className="absolute inset-0 flex items-center justify-center text-7xl">🌍</div>
            {players.map((player, index) => ({ ...player, pos: ['left-2 top-14', 'right-0 top-8', 'right-1 bottom-12', 'left-5 bottom-5', 'left-0 top-28'][index % 5] })).map((player) => (
              <div key={player.id} className={`absolute ${player.pos} z-10 group`} title={player.name}>
                <span className="flex items-center justify-center w-11 h-11 rounded-full bg-slate-950 border-2 border-emerald-300 text-2xl shadow-lg">{player.avatar}</span>
              </div>
            ))}
          </div>
          <div className="flex flex-wrap items-center justify-center gap-2">
            {players.map((player) => <span key={player.id} className={`px-3 py-1.5 rounded-full text-xs font-bold ${player.name === studentName ? 'bg-emerald-400/20 text-emerald-300 border border-emerald-400/40' : 'bg-slate-900 text-slate-300 border border-slate-800'}`}>{player.avatar} {player.name}{player.name === studentName ? ' (you)' : ''}</span>)}
          </div>
        </div>

        {/* LAUNCH BUTTON */}
        <div className="pt-4">
          {joinError ? <div className="w-full max-w-md mx-auto py-4 rounded-2xl bg-rose-500/10 border border-rose-500/30 text-rose-200 font-black text-sm">{joinError}</div> : <div className="w-full max-w-md mx-auto py-4 rounded-2xl bg-slate-800 border border-slate-700 text-slate-300 font-black text-lg flex items-center justify-center gap-3"><span className="animate-pulse">⏳</span> Waiting for teacher to start</div>}
        </div>

      </div>

    </div>
  );
};
