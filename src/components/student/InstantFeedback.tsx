import React, { useEffect } from 'react';
import confetti from 'canvas-confetti';
import type { Question, Option } from '../../types/quiz';
import { soundFx } from '../../lib/sound';
import { CheckCircle2, XCircle, Zap, HelpCircle, Trophy, ArrowRight } from 'lucide-react';

interface InstantFeedbackProps {
  question: Question;
  selectedOption: Option | null;
  pointsEarned: number;
  speedBonus: number;
  totalScore: number;
  onNext: () => void;
}

export const InstantFeedback: React.FC<InstantFeedbackProps> = ({
  question,
  selectedOption,
  pointsEarned,
  speedBonus,
  totalScore,
  onNext
}) => {
  const isCorrect = selectedOption?.is_correct ?? false;
  const correctOption = question.options.find(o => o.is_correct);

  useEffect(() => {
    if (isCorrect) {
      soundFx.playCorrect();
      try {
        confetti({
          particleCount: 60,
          spread: 70,
          origin: { y: 0.6 }
        });
      } catch {
        // Ignore
      }
    } else {
      soundFx.playWrong();
    }

    const timer = setTimeout(() => {
      onNext();
    }, 4000);

    return () => clearTimeout(timer);
  }, [isCorrect, onNext]);

  return (
    <div className="max-w-2xl mx-auto space-y-6 pb-20 text-center animate-fade-in">
      
      {/* FEEDBACK CARD */}
      <div className={`p-8 rounded-3xl border shadow-2xl space-y-6 relative overflow-hidden ${
        isCorrect
          ? 'bg-gradient-to-tr from-emerald-950 via-slate-900 to-teal-950 border-emerald-500/50 shadow-emerald-500/20'
          : 'bg-gradient-to-tr from-rose-950 via-slate-900 to-red-950 border-rose-500/50 shadow-rose-500/20'
      }`}>
        
        {/* ICON & TITLE */}
        <div className="space-y-3">
          <div className={`w-20 h-20 rounded-3xl mx-auto flex items-center justify-center shadow-2xl animate-bounce ${
            isCorrect ? 'bg-emerald-500 text-slate-950 shadow-emerald-500/50' : 'bg-rose-500 text-white shadow-rose-500/50'
          }`}>
            {isCorrect ? <CheckCircle2 className="w-12 h-12 stroke-[2.5]" /> : <XCircle className="w-12 h-12 stroke-[2.5]" />}
          </div>

          <h2 className="text-4xl font-black text-white tracking-tight">
            {isCorrect ? 'CORRECT! 🎉' : selectedOption ? 'INCORRECT! ❌' : "TIME EXPIRED! ⏰"}
          </h2>

          {/* POINTS BADGE */}
          {isCorrect && (
            <div className="inline-flex items-center gap-3 bg-emerald-500/20 border border-emerald-500/40 px-5 py-2 rounded-2xl text-emerald-300">
              <span className="text-2xl font-black">+{pointsEarned} Points</span>
              {speedBonus > 0 && (
                <span className="text-xs font-bold bg-amber-400 text-slate-950 px-2.5 py-1 rounded-full flex items-center gap-1 shadow">
                  <Zap className="w-3.5 h-3.5 fill-current" /> +{speedBonus} Speed Bonus
                </span>
              )}
            </div>
          )}

          {!isCorrect && (
            <p className="text-sm font-bold text-rose-300">
              +0 points
            </p>
          )}
        </div>

        {/* ANSWERS COMPARISON */}
        <div className="space-y-2">
          {/* USER ANSWER */}
          {selectedOption && (
            <div className={`p-3.5 rounded-2xl border text-left flex items-center justify-between ${
              isCorrect
                ? 'bg-emerald-950/80 border-emerald-500/40 text-emerald-200'
                : 'bg-rose-950/80 border-rose-500/40 text-rose-200'
            }`}>
              <div>
                <span className="text-[10px] font-black uppercase tracking-wider block opacity-75">
                  Your Answer:
                </span>
                <span className="font-extrabold text-base text-white">
                  {selectedOption.option_text}
                </span>
              </div>
              {isCorrect ? (
                <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
              ) : (
                <XCircle className="w-5 h-5 text-rose-400 shrink-0" />
              )}
            </div>
          )}

          {/* CORRECT ANSWER (IF MISSED OR TIMEOUT) */}
          {!isCorrect && correctOption && (
            <div className="p-3.5 rounded-2xl bg-emerald-950/80 border border-emerald-500/40 text-left flex items-center justify-between">
              <div>
                <span className="text-[10px] font-black uppercase tracking-wider text-emerald-400 block">
                  Correct Answer:
                </span>
                <p className="font-extrabold text-white text-base">
                  {correctOption.option_text}
                </p>
              </div>
              <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
            </div>
          )}
        </div>

        {/* EXPLANATION */}
        {question.explanation && (
          <div className="p-4 rounded-2xl bg-slate-950/60 border border-slate-800/80 text-left text-xs text-slate-300 flex items-start gap-2.5">
            <HelpCircle className="w-4 h-4 text-cyan-400 shrink-0 mt-0.5" />
            <div>
              <span className="font-bold block uppercase tracking-wider text-[10px] text-cyan-400 mb-0.5">
                Question Explanation
              </span>
              {question.explanation}
            </div>
          </div>
        )}

        {/* CURRENT TOTAL SCORE & ACTION BUTTON */}
        <div className="pt-2 flex items-center justify-between text-xs font-extrabold text-slate-300 border-t border-slate-800">
          <div className="flex items-center gap-2">
            <Trophy className="w-4 h-4 text-amber-400" />
            <span>Total Score: <span className="text-amber-400 text-sm font-black">{totalScore}</span></span>
          </div>

          <button
            onClick={onNext}
            className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-cyan-500 to-emerald-500 hover:from-cyan-400 hover:to-emerald-400 text-slate-950 font-black text-xs flex items-center gap-1.5 shadow-lg shadow-cyan-500/20 transition-all transform active:scale-95"
          >
            <span>Continue Now</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>

      </div>

    </div>
  );
};
