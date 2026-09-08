import React, { useState, useEffect } from 'react';
import type { Quiz, LeaderboardEntry } from '../../types/quiz';
import { quizService } from '../../services/quizService';
import { Trophy, ArrowRight } from 'lucide-react';

interface QuestionLeaderboardProps {
  quiz: Quiz;
  studentName: string;
  currentScore: number;
  questionIndex: number;
  totalQuestions: number;
  onNextQuestion: () => void;
}

export const QuestionLeaderboard: React.FC<QuestionLeaderboardProps> = ({
  quiz,
  studentName,
  currentScore,
  questionIndex,
  totalQuestions,
  onNextQuestion
}) => {
  const [entries, setEntries] = useState<LeaderboardEntry[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchLeaderboard = async () => {
      setLoading(true);
      try {
        const lb = await quizService.getLeaderboard(quiz.id, studentName, currentScore);
        setEntries(lb);
      } catch (err) {
        console.error('Failed to load leaderboard', err);
      } finally {
        setLoading(false);
      }
    };
    fetchLeaderboard();
  }, [quiz.id, studentName, currentScore]);

  const userRankEntry = entries.find(e => e.student_name === studentName);

  return (
    <div className="max-w-2xl mx-auto space-y-6 pb-20 text-center animate-fade-in">
      
      {/* HERO HEADER */}
      <div className="bg-gradient-to-r from-purple-950 via-slate-900 to-indigo-950 border border-purple-500/30 rounded-3xl p-6 shadow-2xl space-y-3">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-500/20 text-amber-300 text-xs font-black uppercase tracking-widest border border-amber-500/30">
          <Trophy className="w-4 h-4 text-amber-400" /> Leaderboard Update
        </div>

        <h2 className="text-3xl font-black text-white">Scoreboard</h2>
        <p className="text-xs text-slate-300">
          Rankings after Question {questionIndex + 1} of {totalQuestions}
        </p>

        {userRankEntry && (
          <div className="inline-flex items-center gap-3 bg-purple-600/20 border border-purple-500/40 px-4 py-2 rounded-2xl text-purple-200 text-xs font-bold">
            <span>Your Current Rank: <span className="text-amber-400 text-sm font-black">#{userRankEntry.rank}</span></span>
            <span>• Score: <span className="text-emerald-400 text-sm font-black">{currentScore} pts</span></span>
          </div>
        )}
      </div>

      {/* LEADERBOARD LIST */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-3xl p-6 shadow-2xl space-y-3">
        {loading ? (
          <div className="py-12 text-slate-400 text-sm animate-pulse">Loading live scores...</div>
        ) : (
          <div className="space-y-2.5">
            {entries.slice(0, 5).map((entry) => {
              const isCurrentUser = entry.student_name === studentName;
              return (
                <div
                  key={entry.id}
                  className={`p-4 rounded-2xl border transition-all flex items-center justify-between ${
                    isCurrentUser
                      ? 'bg-gradient-to-r from-purple-600/30 to-indigo-600/30 border-purple-500 text-white ring-2 ring-purple-500/50 shadow-lg'
                      : entry.rank === 1
                      ? 'bg-amber-500/10 border-amber-500/40 text-amber-200'
                      : 'bg-slate-950/80 border-slate-800 text-slate-300'
                  }`}
                >
                  <div className="flex items-center gap-4">
                    {/* RANK ICON */}
                    <div className="w-9 h-9 rounded-xl flex items-center justify-center font-black text-sm shrink-0">
                      {entry.rank === 1 ? (
                        <span className="text-amber-400 font-black text-lg">🥇</span>
                      ) : entry.rank === 2 ? (
                        <span className="text-slate-300 font-black text-lg">🥈</span>
                      ) : entry.rank === 3 ? (
                        <span className="text-amber-600 font-black text-lg">🥉</span>
                      ) : (
                        <span className="text-slate-400 font-bold">#{entry.rank}</span>
                      )}
                    </div>

                    <div className="text-left">
                      <span className="font-extrabold text-base block text-white">
                        {entry.student_name} {isCurrentUser && <span className="text-xs text-purple-400 font-bold">(You)</span>}
                      </span>
                    </div>
                  </div>

                  <div className="text-amber-400 font-black text-lg">
                    {entry.score} <span className="text-xs font-semibold text-slate-400">pts</span>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* NEXT QUESTION BUTTON */}
        <div className="pt-4">
          <button
            onClick={onNextQuestion}
            className="w-full py-4 rounded-2xl bg-gradient-to-r from-purple-600 via-fuchsia-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-black text-base shadow-xl shadow-purple-600/30 flex items-center justify-center gap-2 transition-all transform active:scale-98"
          >
            <span>Next Question</span>
            <ArrowRight className="w-5 h-5" />
          </button>
        </div>

      </div>

    </div>
  );
};
