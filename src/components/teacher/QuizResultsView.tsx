import React, { useState, useEffect } from 'react';
import type { Quiz, QuizAttempt } from '../../types/quiz';
import { quizService } from '../../services/quizService';
import { ArrowLeft, Users, Trophy, Target, Clock, BarChart3 } from 'lucide-react';

interface QuizResultsViewProps {
  quiz: Quiz;
  onBack: () => void;
}

export const QuizResultsView: React.FC<QuizResultsViewProps> = ({ quiz, onBack }) => {
  const [attempts, setAttempts] = useState<QuizAttempt[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchResults = async () => {
      setLoading(true);
      try {
        const storedAttempts = await quizService.getAttempts(quiz.id);
        setAttempts(storedAttempts);
      } catch (err) {
        console.error('Failed to load results', err);
      } finally {
        setLoading(false);
      }
    };
    fetchResults();
  }, [quiz]);

  const totalStudents = attempts.length;
  const avgScore = totalStudents > 0 ? Math.round(attempts.reduce((sum, a) => sum + a.total_score, 0) / totalStudents) : 0;
  const avgAccuracy = totalStudents > 0 ? Math.round(attempts.reduce((sum, a) => sum + a.accuracy_percentage, 0) / totalStudents) : 0;

  return (
    <div className="max-w-5xl mx-auto space-y-8 pb-20">
      
      {/* HEADER */}
      <div className="flex flex-wrap items-center justify-between gap-4 bg-slate-900/90 p-4 rounded-3xl border border-slate-800 backdrop-blur-md sticky top-20 z-30 shadow-xl">
        <button
          onClick={onBack}
          className="px-4 py-2 rounded-xl text-xs font-bold bg-slate-800 text-slate-300 hover:text-white flex items-center gap-2 transition-all"
        >
          <ArrowLeft className="w-4 h-4" /> Back to Dashboard
        </button>

        <div className="flex items-center gap-2">
          <span className="text-xs font-bold text-slate-400">Quiz Code:</span>
          <span className="px-3 py-1 bg-amber-500/10 text-amber-400 border border-amber-500/30 rounded-xl font-mono font-extrabold text-xs">
            {quiz.code}
          </span>
        </div>
      </div>

      {/* QUIZ TITLE HERO */}
      <div className="bg-gradient-to-r from-purple-900/60 via-slate-900 to-indigo-900/60 border border-purple-500/30 rounded-3xl p-6 shadow-2xl space-y-4">
        <span className="text-xs font-extrabold uppercase tracking-widest text-purple-400 bg-purple-500/10 px-3 py-1 rounded-full border border-purple-500/20">
          Analytics & Student Results
        </span>
        <h2 className="text-2xl md:text-3xl font-black text-white">{quiz.title}</h2>
        <p className="text-xs text-slate-300 max-w-2xl">{quiz.description || 'View detailed breakdown of student attempt scores and rankings.'}</p>
      </div>

      {/* METRICS OVERVIEW CARDS */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-slate-900/90 border border-slate-800 rounded-3xl p-5 shadow-xl flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-indigo-500/10 border border-indigo-500/30 flex items-center justify-center text-indigo-400 shrink-0">
            <Users className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs font-bold uppercase tracking-wider text-slate-400">Total Participants</p>
            <h3 className="text-2xl font-black text-white">{totalStudents}</h3>
          </div>
        </div>

        <div className="bg-slate-900/90 border border-slate-800 rounded-3xl p-5 shadow-xl flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400 shrink-0">
            <Trophy className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs font-bold uppercase tracking-wider text-slate-400">Average Score</p>
            <h3 className="text-2xl font-black text-white">{avgScore} <span className="text-xs font-normal text-slate-500">pts</span></h3>
          </div>
        </div>

        <div className="bg-slate-900/90 border border-slate-800 rounded-3xl p-5 shadow-xl flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400 shrink-0">
            <Target className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs font-bold uppercase tracking-wider text-slate-400">Average Accuracy</p>
            <h3 className="text-2xl font-black text-white">{avgAccuracy}%</h3>
          </div>
        </div>
      </div>

      {/* STUDENT RESULTS TABLE */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-3xl p-6 shadow-2xl space-y-4">
        <h3 className="text-lg font-black text-white flex items-center gap-2">
          <BarChart3 className="w-5 h-5 text-purple-400" /> Student Performance Rankings
        </h3>

        {loading ? (
          <div className="text-center py-12 text-slate-400 text-sm animate-pulse">
            Loading student results...
          </div>
        ) : attempts.length === 0 ? (
          <div className="text-center py-12 text-slate-400 text-sm">
            No students have completed this quiz yet. Share the code <span className="text-amber-400 font-mono font-bold">{quiz.code}</span> to get started!
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-slate-300">
              <thead className="text-xs uppercase tracking-wider text-slate-400 bg-slate-950 border-b border-slate-800 font-bold">
                <tr>
                  <th className="px-4 py-3">Rank</th>
                  <th className="px-4 py-3">Student</th>
                  <th className="px-4 py-3">Score</th>
                  <th className="px-4 py-3">Correct</th>
                  <th className="px-4 py-3">Accuracy</th>
                  <th className="px-4 py-3">Time</th>
                  <th className="px-4 py-3">Submitted</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 font-semibold">
                {attempts.map((attempt, idx) => (
                  <tr key={attempt.id || idx} className="hover:bg-slate-800/40 transition-colors">
                    <td className="px-4 py-3 font-black text-base">
                      {idx === 0 ? '🥇 #1' : idx === 1 ? '🥈 #2' : idx === 2 ? '🥉 #3' : `#${idx + 1}`}
                    </td>
                    <td className="px-4 py-3 font-bold text-white flex items-center gap-2">
                      <div className="w-7 h-7 rounded-full bg-gradient-to-tr from-purple-500 to-indigo-500 text-white text-xs font-black flex items-center justify-center">
                        {attempt.student_name.charAt(0).toUpperCase()}
                      </div>
                      {attempt.student_name}
                    </td>
                    <td className="px-4 py-3 text-amber-400 font-black">{attempt.total_score} pts</td>
                    <td className="px-4 py-3 font-bold text-emerald-400">
                      {attempt.correct_count} / {attempt.total_questions}
                    </td>
                    <td className="px-4 py-3">
                      <span className={`px-2.5 py-0.5 rounded-full text-xs font-extrabold ${
                        attempt.accuracy_percentage >= 80 ? 'bg-emerald-500/20 text-emerald-300' : attempt.accuracy_percentage >= 50 ? 'bg-amber-500/20 text-amber-300' : 'bg-rose-500/20 text-rose-300'
                      }`}>
                        {attempt.accuracy_percentage}%
                      </span>
                    </td>
                    <td className="px-4 py-3 text-slate-400 flex items-center gap-1">
                      <Clock className="w-3.5 h-3.5" /> {attempt.time_taken_seconds}s
                    </td>
                    <td className="px-4 py-3 text-slate-400 text-xs">{attempt.completed_at}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

    </div>
  );
};
