import React, { useEffect, useState } from 'react';
import confetti from 'canvas-confetti';
import type { Quiz, StudentAnswer, LeaderboardEntry } from '../../types/quiz';
import { quizService } from '../../services/quizService';
import { soundFx } from '../../lib/sound';
import { Trophy, CheckCircle2, XCircle, RotateCcw, HelpCircle, BarChart2 } from 'lucide-react';

interface FinalResultsProps {
  quiz: Quiz;
  studentName: string;
  studentId?: string;
  avatar: string;
  answers: StudentAnswer[];
  totalScore: number;
  totalTimeSeconds: number;
  onRestart: () => void;
}

export const FinalResults: React.FC<FinalResultsProps> = ({
  quiz,
  studentName,
  studentId,
  avatar,
  answers,
  totalScore,
  totalTimeSeconds,
  onRestart
}) => {
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [userRank, setUserRank] = useState<number>(1);

  const questions = quiz.questions || [];
  const totalQuestions = questions.length;
  const correctCount = answers.filter(a => a.is_correct).length;
  const accuracy = totalQuestions > 0 ? Math.round((correctCount / totalQuestions) * 100) : 0;
  const maxPossibleScore = totalQuestions * 1000;

  useEffect(() => {
    // Play Fanfare & Confetti Explosion! 🎉
    soundFx.playFanfare();

    try {
      confetti({
        particleCount: 120,
        spread: 80,
        origin: { y: 0.6 }
      });
    } catch {
      // Ignore if canvas-confetti fails
    }

    // Submit attempt & get final leaderboard
    const submitAttempt = async () => {
      const attempt = {
        id: `att-${Date.now()}`,
        quiz_id: quiz.id,
        student_name: studentName,
        student_id: studentId,
        total_score: totalScore,
        correct_count: correctCount,
        total_questions: totalQuestions,
        accuracy_percentage: accuracy,
        time_taken_seconds: totalTimeSeconds,
        completed_at: new Date().toISOString(),
        answers
      };

      await quizService.submitQuizAttempt(attempt);
      const lb = await quizService.getLeaderboard(quiz.id, studentName, totalScore);
      setLeaderboard(lb);

      const found = lb.find(e => e.student_name === studentName);
      if (found) setUserRank(found.rank);
    };

    submitAttempt();
  }, [quiz.id, studentName, studentId, totalScore, correctCount, totalQuestions, accuracy, totalTimeSeconds, answers]);

  return (
    <div className="max-w-4xl mx-auto space-y-8 pb-20 text-center animate-fade-in">
      
      {/* CELEBRATION HERO CARD */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-tr from-purple-950 via-slate-900 to-indigo-950 border border-purple-500/40 p-8 shadow-2xl space-y-6">
        <div className="space-y-3">
          <div className="w-20 h-20 rounded-3xl bg-gradient-to-tr from-amber-400 via-fuchsia-500 to-cyan-400 p-1 mx-auto shadow-2xl shadow-purple-500/30 animate-pulse">
            <div className="w-full h-full bg-slate-950 rounded-[22px] flex items-center justify-center text-4xl">
              {avatar || '🎉'}
            </div>
          </div>

          <h1 className="text-3xl md:text-5xl font-black text-white tracking-tight">
            Quiz Completed! 🎉
          </h1>
          <p className="text-sm font-semibold text-purple-300">
            Great job, <span className="text-amber-400 font-extrabold">{studentName}</span>! Here is your final performance report.
          </p>
        </div>

        {/* METRICS CARDS */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 pt-2">
          
          <div className="p-4 rounded-2xl bg-slate-950/80 border border-slate-800 space-y-1">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">Total Score</span>
            <span className="text-2xl md:text-3xl font-black text-amber-400">{totalScore}</span>
            <span className="text-[10px] text-slate-500 block">/ {maxPossibleScore} pts</span>
          </div>

          <div className="p-4 rounded-2xl bg-slate-950/80 border border-slate-800 space-y-1">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">Correct Answers</span>
            <span className="text-2xl md:text-3xl font-black text-emerald-400">{correctCount}</span>
            <span className="text-[10px] text-slate-500 block">/ {totalQuestions} questions</span>
          </div>

          <div className="p-4 rounded-2xl bg-slate-950/80 border border-slate-800 space-y-1">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">Accuracy</span>
            <span className="text-2xl md:text-3xl font-black text-cyan-400">{accuracy}%</span>
            <span className="text-[10px] text-slate-500 block">Overall Precision</span>
          </div>

          <div className="p-4 rounded-2xl bg-slate-950/80 border border-slate-800 space-y-1">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">Final Rank</span>
            <span className="text-2xl md:text-3xl font-black text-fuchsia-400">#{userRank}</span>
            <span className="text-[10px] text-slate-500 block">Leaderboard Position</span>
          </div>

        </div>

        <div className="pt-2">
          <button
            onClick={onRestart}
            className="px-6 py-3.5 rounded-2xl bg-gradient-to-r from-purple-600 via-fuchsia-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-black text-sm shadow-xl shadow-purple-600/30 inline-flex items-center gap-2 transition-all transform active:scale-95"
          >
            <RotateCcw className="w-4 h-4" /> Play Another Quiz
          </button>
        </div>

      </div>

      {/* LIVE LEADERBOARD PODIUM */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-3xl p-6 shadow-2xl space-y-4">
        <h3 className="text-lg font-black text-white flex items-center justify-center gap-2">
          <Trophy className="w-5 h-5 text-amber-400" /> Final Leaderboard
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {leaderboard.slice(0, 3).map((entry, idx) => (
            <div
              key={entry.id || idx}
              className={`p-4 rounded-2xl border ${
                entry.rank === 1
                  ? 'bg-amber-500/10 border-amber-500/40 text-amber-300'
                  : entry.rank === 2
                  ? 'bg-slate-800/80 border-slate-700 text-slate-200'
                  : 'bg-amber-700/10 border-amber-700/30 text-amber-500'
              }`}
            >
              <div className="text-2xl font-black mb-1">
                {entry.rank === 1 ? '🥇 #1' : entry.rank === 2 ? '🥈 #2' : '🥉 #3'}
              </div>
              <div className="font-extrabold text-white text-base">{entry.student_name}</div>
              <div className="text-amber-400 font-bold text-sm">{entry.score} pts</div>
            </div>
          ))}
        </div>
      </div>

      {/* QUESTION-BY-QUESTION PERFORMANCE BREAKDOWN */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-3xl p-6 shadow-2xl space-y-4 text-left">
        <h3 className="text-lg font-black text-white flex items-center gap-2">
          <BarChart2 className="w-5 h-5 text-purple-400" /> Question Performance Breakdown
        </h3>

        <div className="space-y-4">
          {questions.map((q, idx) => {
            const studentAns = answers.find(a => a.question_id === q.id);
            const isCorrect = studentAns?.is_correct ?? false;
            const selectedOpt = q.options.find(o => o.id === studentAns?.selected_option_id);
            const correctOpt = q.options.find(o => o.is_correct);

            return (
              <div
                key={q.id}
                className={`p-4 rounded-2xl border space-y-2 ${
                  isCorrect
                    ? 'bg-emerald-950/20 border-emerald-500/30'
                    : 'bg-rose-950/20 border-rose-500/30'
                }`}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-start gap-3">
                    {isCorrect ? (
                      <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
                    ) : (
                      <XCircle className="w-5 h-5 text-rose-400 shrink-0 mt-0.5" />
                    )}
                    <div>
                      <h4 className="font-extrabold text-white text-sm">
                        {idx + 1}. {q.question_text}
                      </h4>
                      <p className="text-xs text-slate-400 mt-1">
                        Your answer: <span className={isCorrect ? 'text-emerald-300 font-bold' : 'text-rose-300 font-bold'}>
                          {selectedOpt ? selectedOpt.option_text : 'Time Expired (No selection)'}
                        </span>
                      </p>
                      {!isCorrect && correctOpt && (
                        <p className="text-xs text-emerald-400 font-bold mt-0.5">
                          Correct answer: {correctOpt.option_text}
                        </p>
                      )}
                    </div>
                  </div>

                  <span className="text-xs font-bold text-amber-400 shrink-0 font-mono">
                    +{studentAns?.points_earned || 0} pts
                  </span>
                </div>

                {q.explanation && (
                  <div className="pt-2 text-xs text-cyan-200 border-t border-slate-800/80 flex items-start gap-2">
                    <HelpCircle className="w-3.5 h-3.5 text-cyan-400 shrink-0 mt-0.5" />
                    <span>{q.explanation}</span>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

    </div>
  );
};
