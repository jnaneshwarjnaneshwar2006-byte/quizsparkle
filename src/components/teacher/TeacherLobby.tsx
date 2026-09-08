import React, { useEffect, useState } from 'react';
import type { Quiz } from '../../types/quiz';
import { ArrowLeft, Play, Users } from 'lucide-react';
import { soundFx } from '../../lib/sound';

type LobbyPlayer = { name: string; avatar: string };

interface TeacherLobbyProps {
  quiz: Quiz;
  onBack: () => void;
}

export const TeacherLobby: React.FC<TeacherLobbyProps> = ({ quiz, onBack }) => {
  const [players, setPlayers] = useState<LobbyPlayer[]>([]);
  const [hasStarted, setHasStarted] = useState(false);

  useEffect(() => {
    const lobbyKey = `quiz-lobby-${quiz.id}`;
    const startKey = `quiz-start-${quiz.id}`;
    localStorage.removeItem(startKey);

    const syncLobby = () => {
      try {
        const stored = JSON.parse(localStorage.getItem(lobbyKey) || '[]') as LobbyPlayer[];
        setPlayers(stored);
        setHasStarted(Boolean(localStorage.getItem(startKey)));
      } catch {
        setPlayers([]);
      }
    };

    syncLobby();
    const refresh = window.setInterval(syncLobby, 500);
    return () => window.clearInterval(refresh);
  }, [quiz.id]);

  const startQuiz = () => {
    soundFx.playClick();
    localStorage.setItem(`quiz-start-${quiz.id}`, Date.now().toString());
    setHasStarted(true);
  };

  return (
    <div className="max-w-5xl mx-auto space-y-6 pb-20">
      <button onClick={onBack} className="px-4 py-2 rounded-xl text-xs font-bold bg-slate-800 text-slate-300 hover:text-white flex items-center gap-2 transition-all">
        <ArrowLeft className="w-4 h-4" /> Back to dashboard
      </button>

      <section className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-emerald-950 via-slate-950 to-cyan-950 border border-emerald-400/30 p-6 md:p-10 shadow-2xl">
        <div className="relative space-y-8">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-5">
            <div>
              <p className="text-xs font-black uppercase tracking-widest text-emerald-300">Teacher live lobby</p>
              <h1 className="text-3xl md:text-4xl font-black text-white mt-2">{quiz.title}</h1>
              <p className="text-sm text-slate-300 mt-2">Share the code or QR with students, then watch them appear here.</p>
            </div>
            <div className="text-center px-5 py-3 rounded-2xl bg-slate-950/80 border border-amber-400/30">
              <p className="text-xs uppercase font-black tracking-widest text-slate-400">Quiz code</p>
              <p className="text-3xl font-mono font-black tracking-widest text-amber-300">{quiz.code}</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-[0.8fr_1.2fr] gap-6 items-center">
            <div className="relative mx-auto w-56 h-56 rounded-full bg-gradient-to-br from-cyan-400 via-emerald-500 to-blue-900 border-8 border-cyan-200/20 shadow-[0_0_70px_rgba(34,211,238,0.25)]">
              <div className="absolute inset-0 flex items-center justify-center text-7xl">🌍</div>
              {players.map((player, index) => (
                <span key={`${player.name}-${index}`} title={player.name} className={`absolute flex items-center justify-center w-11 h-11 rounded-full bg-slate-950 border-2 border-emerald-300 text-2xl shadow-lg ${['-left-2 top-10', '-right-2 top-16', 'left-4 -bottom-2', 'right-4 -bottom-2'][index % 4]}`}>
                  {player.avatar}
                </span>
              ))}
            </div>

            <div className="space-y-4">
              <div className="flex items-center justify-between gap-4">
                <h2 className="text-xl font-black text-white flex items-center gap-2"><Users className="w-5 h-5 text-emerald-400" /> Joined students</h2>
                <span className="px-3 py-1 rounded-full bg-emerald-400/15 border border-emerald-400/30 text-emerald-300 font-black text-sm">{players.length} {players.length === 1 ? 'member' : 'members'}</span>
              </div>
              <div className="min-h-40 max-h-64 overflow-y-auto rounded-2xl bg-slate-950/70 border border-slate-800 p-3 space-y-2">
                {players.length === 0 ? <p className="h-32 flex items-center justify-center text-sm text-slate-500">Waiting for students to join...</p> : players.map((player, index) => <div key={`${player.name}-${index}`} className="flex items-center gap-3 rounded-xl bg-slate-900 border border-slate-800 px-3 py-2"><span className="text-2xl">{player.avatar}</span><span className="text-white font-bold text-sm">{player.name}</span><span className="ml-auto text-[10px] uppercase tracking-wider text-emerald-400 font-black">Ready</span></div>)}
              </div>
              <button onClick={startQuiz} disabled={hasStarted || players.length === 0} className="w-full py-4 rounded-2xl bg-gradient-to-r from-amber-400 via-emerald-400 to-cyan-400 text-slate-950 font-black text-lg flex items-center justify-center gap-3 disabled:opacity-50 disabled:cursor-not-allowed">
                <Play className="w-5 h-5 fill-current" /> {hasStarted ? 'Quiz started' : players.length === 0 ? 'Waiting for students' : `Start quiz for ${players.length} ${players.length === 1 ? 'student' : 'students'}`}
              </button>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};
