import React, { useState, useEffect, useRef } from 'react';
import confetti from 'canvas-confetti';
import type { Question, Option } from '../../types/quiz';
import { MediaPreview } from '../preview/MediaPreview';
import { soundFx } from '../../lib/sound';
import {
  Clock,
  Triangle,
  Diamond,
  Circle,
  Square,
  CheckCircle2,
  XCircle,
  Zap,
  HelpCircle,
  Trophy,
  ArrowRight,
  LogOut
} from 'lucide-react';

interface QuizScreenProps {
  question: Question;
  questionIndex: number;
  totalQuestions: number;
  currentScore?: number;
  onAnswerSelected: (selectedOption: Option | null, responseTimeMs: number, viewLeaderboard?: boolean) => void;
  onExitQuiz?: () => void;
}

const GEOMETRIC_ICONS = [
  { icon: Triangle, name: 'Red Triangle', bg: 'bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-500 hover:to-rose-500', shadow: 'shadow-red-600/40', border: 'border-red-400/40' },
  { icon: Diamond, name: 'Blue Diamond', bg: 'bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500', shadow: 'shadow-blue-600/40', border: 'border-blue-400/40' },
  { icon: Circle, name: 'Yellow Circle', bg: 'bg-gradient-to-r from-amber-500 to-yellow-500 hover:from-amber-400 hover:to-yellow-400', shadow: 'shadow-amber-500/40', border: 'border-amber-300/40' },
  { icon: Square, name: 'Green Square', bg: 'bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500', shadow: 'shadow-emerald-600/40', border: 'border-emerald-400/40' }
];

export const QuizScreen: React.FC<QuizScreenProps> = ({
  question,
  questionIndex,
  totalQuestions,
  currentScore = 0,
  onAnswerSelected,
  onExitQuiz
}) => {
  const totalSeconds = question.timer_seconds || 20;
  const [timeLeft, setTimeLeft] = useState(totalSeconds);
  const [selectedOption, setSelectedOption] = useState<Option | null>(null);
  const [isAnswerRevealed, setIsAnswerRevealed] = useState(false);
  const [pointsEarned, setPointsEarned] = useState(0);
  const [speedBonus, setSpeedBonus] = useState(0);
  const [autoAdvanceRemaining, setAutoAdvanceRemaining] = useState<number>(5);
  const [isTimedOut, setIsTimedOut] = useState(false);

  const startTimeRef = useRef<number>(Date.now());
  const responseTimeRef = useRef<number>(0);
  const hasAdvancedRef = useRef<boolean>(false);

  // Reset state on new question
  useEffect(() => {
    setTimeLeft(totalSeconds);
    setSelectedOption(null);
    setIsAnswerRevealed(false);
    setPointsEarned(0);
    setSpeedBonus(0);
    setAutoAdvanceRemaining(5);
    setIsTimedOut(false);
    startTimeRef.current = Date.now();
    responseTimeRef.current = 0;
    hasAdvancedRef.current = false;
  }, [question, totalSeconds]);

  // Timer countdown
  useEffect(() => {
    if (isAnswerRevealed) return;

    if (timeLeft <= 0) {
      // Time up! Auto reveal answer
      soundFx.playWrong();
      setIsTimedOut(true);
      setSelectedOption(null);
      responseTimeRef.current = totalSeconds * 1000;
      setIsAnswerRevealed(true);
      setPointsEarned(0);
      setSpeedBonus(0);
      return;
    }

    const timer = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 5 && prev > 1) {
          soundFx.playTick();
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [timeLeft, isAnswerRevealed, totalSeconds]);

  // Handle proceed to next step
  const handleProceed = (viewLeaderboard = false) => {
    if (hasAdvancedRef.current) return;
    hasAdvancedRef.current = true;
    onAnswerSelected(selectedOption, responseTimeRef.current, viewLeaderboard);
  };

  // Auto-advance countdown when answer is revealed
  useEffect(() => {
    if (!isAnswerRevealed) return;

    setAutoAdvanceRemaining(5);
    const countdown = setInterval(() => {
      setAutoAdvanceRemaining(prev => {
        if (prev <= 1) {
          clearInterval(countdown);
          handleProceed(false);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(countdown);
  }, [isAnswerRevealed]);

  // Handle student clicking option button - INSTANT REVEAL!
  const handleSelectOption = (option: Option) => {
    if (isAnswerRevealed) return;

    const responseTimeMs = Date.now() - startTimeRef.current;
    responseTimeRef.current = responseTimeMs;
    setSelectedOption(option);
    setIsAnswerRevealed(true);

    const isCorrect = option.is_correct;
    if (isCorrect) {
      soundFx.playCorrect();
      try {
        confetti({
          particleCount: 75,
          spread: 75,
          origin: { y: 0.65 }
        });
      } catch {
        // Ignore confetti error
      }
      const basePoints = 500;
      const maxTimeMs = totalSeconds * 1000;
      const speedRatio = Math.max(0, (maxTimeMs - responseTimeMs) / maxTimeMs);
      const bonus = Math.round(speedRatio * 500);
      setSpeedBonus(bonus);
      setPointsEarned(basePoints + bonus);
    } else {
      soundFx.playWrong();
      setSpeedBonus(0);
      setPointsEarned(0);
    }
  };

  const correctOption = question.options.find(o => o.is_correct);
  const progressPercent = Math.round(((questionIndex + 1) / totalQuestions) * 100);
  const timerPercent = Math.max(0, Math.round((timeLeft / totalSeconds) * 100));

  return (
    <div className="max-w-4xl mx-auto space-y-6 pb-20">
      
      {/* TOP PROGRESS & HEADER */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-3xl p-4 shadow-xl backdrop-blur-md space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="w-8 h-8 rounded-xl bg-purple-600/20 text-purple-400 font-extrabold flex items-center justify-center text-sm border border-purple-500/30">
              {questionIndex + 1}
            </span>
            <div className="text-left">
              <span className="text-xs font-bold text-slate-300 block">
                Question <span className="text-white font-extrabold">{questionIndex + 1}</span> of {totalQuestions}
              </span>
              <span className="text-[11px] font-mono text-amber-400 font-bold">
                Score: {currentScore + pointsEarned} pts
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* TIMER RING / BADGE */}
            <div className={`px-4 py-1.5 rounded-full border text-sm font-mono font-black flex items-center gap-2 transition-all ${
              isAnswerRevealed
                ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
                : timeLeft <= 5
                ? 'bg-rose-500/20 text-rose-400 border-rose-500/50 animate-bounce'
                : 'bg-slate-950 text-amber-400 border-slate-700'
            }`}>
              <Clock className="w-4 h-4" />
              <span>{isAnswerRevealed ? 'Answered' : `${timeLeft}s`}</span>
            </div>

            {/* EXIT BUTTON */}
            {onExitQuiz && (
              <button
                onClick={() => {
                  if (confirm('Are you sure you want to exit this quiz session?')) {
                    onExitQuiz();
                  }
                }}
                className="p-1.5 rounded-full text-slate-500 hover:text-rose-400 hover:bg-slate-800 transition-colors"
                title="Exit Quiz"
              >
                <LogOut className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>

        {/* PROGRESS BAR */}
        <div className="w-full h-2.5 bg-slate-950 rounded-full overflow-hidden p-0.5 border border-slate-800">
          <div
            className="h-full bg-gradient-to-r from-purple-500 via-fuchsia-500 to-amber-400 rounded-full transition-all duration-300"
            style={{ width: `${progressPercent}%` }}
          />
        </div>
      </div>

      {/* QUESTION CARD */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-3xl p-6 shadow-2xl space-y-6 text-center">
        
        {/* TIMER SECONDARY PROGRESS COUNTDOWN BAR */}
        <div className="w-full h-1.5 bg-slate-950 rounded-full overflow-hidden">
          <div
            className={`h-full transition-all duration-1000 ease-linear ${
              isAnswerRevealed ? 'bg-emerald-500' : timeLeft <= 5 ? 'bg-rose-500' : 'bg-amber-400'
            }`}
            style={{ width: `${isAnswerRevealed ? 100 : timerPercent}%` }}
          />
        </div>

        <h2 className="text-2xl md:text-3xl font-black text-white leading-snug">
          {question.question_text}
        </h2>

        {/* ATTACHED MEDIA */}
        {question.media_url && (
          <div className="max-w-xl mx-auto">
            <MediaPreview mediaUrl={question.media_url} mediaType={question.media_type} autoPlayAudio={true} />
          </div>
        )}
      </div>

      {/* ANSWER BUTTONS GRID (KAHOOT STYLED WITH INSTANT RIGHT/WRONG REVEAL) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {question.options.map((option, idx) => {
          const theme = GEOMETRIC_ICONS[idx % GEOMETRIC_ICONS.length];
          const IconComp = theme.icon;
          const isSelected = selectedOption?.id === option.id;
          const isCorrect = option.is_correct;

          // Compute dynamic styles once answer is revealed
          let buttonClass = `p-6 rounded-3xl border ${theme.border} ${theme.bg} text-white font-extrabold text-lg md:text-xl flex flex-col justify-between shadow-xl ${theme.shadow} transition-all transform active:scale-95 disabled:cursor-default`;
          let badge = null;

          if (isAnswerRevealed) {
            if (isSelected && isCorrect) {
              // User picked right!
              buttonClass = 'p-6 rounded-3xl border-2 border-emerald-400 bg-gradient-to-r from-emerald-600 via-emerald-500 to-teal-600 text-white font-extrabold text-lg md:text-xl flex flex-col justify-between shadow-2xl shadow-emerald-500/50 ring-4 ring-emerald-400/80 scale-[1.02]';
              badge = (
                <div className="flex items-center gap-1.5 text-xs font-black uppercase tracking-wider bg-emerald-950/90 text-emerald-300 px-3 py-1 rounded-full border border-emerald-400/60 mt-3 self-start shadow-md">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 fill-emerald-950" />
                  <span>✓ Your Answer (Correct!)</span>
                </div>
              );
            } else if (isSelected && !isCorrect) {
              // User picked wrong!
              buttonClass = 'p-6 rounded-3xl border-2 border-rose-400 bg-gradient-to-r from-rose-700 via-rose-600 to-red-600 text-white font-extrabold text-lg md:text-xl flex flex-col justify-between shadow-2xl shadow-rose-600/50 ring-4 ring-rose-500/80 scale-[1.02]';
              badge = (
                <div className="flex items-center gap-1.5 text-xs font-black uppercase tracking-wider bg-rose-950/90 text-rose-300 px-3 py-1 rounded-full border border-rose-400/60 mt-3 self-start shadow-md">
                  <XCircle className="w-4 h-4 text-rose-400 fill-rose-950" />
                  <span>✗ Your Answer (Incorrect)</span>
                </div>
              );
            } else if (!isSelected && isCorrect) {
              // Correct option revealed to user
              buttonClass = 'p-6 rounded-3xl border-2 border-emerald-400 bg-gradient-to-r from-emerald-700 via-emerald-600 to-teal-700 text-white font-extrabold text-lg md:text-xl flex flex-col justify-between shadow-2xl shadow-emerald-500/40 ring-4 ring-emerald-400/80 animate-pulse';
              badge = (
                <div className="flex items-center gap-1.5 text-xs font-black uppercase tracking-wider bg-emerald-950/90 text-emerald-300 px-3 py-1 rounded-full border border-emerald-400/60 mt-3 self-start shadow-md">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 fill-emerald-950" />
                  <span>✓ Correct Answer</span>
                </div>
              );
            } else {
              // Unselected incorrect options - dimmed
              buttonClass = 'p-6 rounded-3xl border border-slate-800 bg-slate-900/50 text-slate-500 font-bold text-lg md:text-xl flex flex-col justify-between opacity-35 grayscale-[50%]';
            }
          }

          return (
            <button
              key={option.id || idx}
              onClick={() => handleSelectOption(option)}
              disabled={isAnswerRevealed}
              className={buttonClass}
            >
              <div className="flex items-center gap-4 w-full text-left">
                <div className={`w-10 h-10 rounded-2xl flex items-center justify-center shrink-0 ${
                  isAnswerRevealed && isCorrect
                    ? 'bg-emerald-400 text-slate-950'
                    : isAnswerRevealed && isSelected && !isCorrect
                    ? 'bg-rose-400 text-slate-950'
                    : 'bg-white/20 text-white'
                }`}>
                  {isAnswerRevealed && isCorrect ? (
                    <CheckCircle2 className="w-6 h-6 stroke-[3]" />
                  ) : isAnswerRevealed && isSelected && !isCorrect ? (
                    <XCircle className="w-6 h-6 stroke-[3]" />
                  ) : (
                    <IconComp className="w-6 h-6 fill-current" />
                  )}
                </div>
                <span className="flex-1 leading-snug">{option.option_text}</span>
              </div>

              {badge}
            </button>
          );
        })}
      </div>

      {/* INSTANT ANSWER FEEDBACK DRAWER / BANNER */}
      {isAnswerRevealed && (
        <div className="bg-slate-900/95 border border-slate-800 rounded-3xl p-6 shadow-2xl space-y-5 backdrop-blur-xl animate-fade-in">
          
          {/* HEADER ROW WITH STATUS & NEXT BUTTON */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-800">
            <div className="flex items-center gap-3.5">
              {selectedOption?.is_correct ? (
                <div className="w-12 h-12 rounded-2xl bg-emerald-500/20 border border-emerald-500/40 text-emerald-400 flex items-center justify-center shadow-lg shadow-emerald-500/20 shrink-0">
                  <CheckCircle2 className="w-7 h-7 stroke-[2.5]" />
                </div>
              ) : (
                <div className="w-12 h-12 rounded-2xl bg-rose-500/20 border border-rose-500/40 text-rose-400 flex items-center justify-center shadow-lg shadow-rose-500/20 shrink-0">
                  <XCircle className="w-7 h-7 stroke-[2.5]" />
                </div>
              )}

              <div className="text-left">
                <div className="flex flex-wrap items-center gap-2">
                  <h3 className={`text-2xl font-black tracking-tight ${selectedOption?.is_correct ? 'text-emerald-400' : 'text-rose-400'}`}>
                    {selectedOption?.is_correct ? 'CORRECT! 🎉' : isTimedOut ? "TIME'S UP! ⏰" : 'INCORRECT! ❌'}
                  </h3>
                  {selectedOption?.is_correct && (
                    <span className="px-3 py-0.5 rounded-full bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 text-xs font-black">
                      +{pointsEarned} pts
                    </span>
                  )}
                  {speedBonus > 0 && (
                    <span className="px-2.5 py-0.5 rounded-full bg-amber-400/20 border border-amber-400/40 text-amber-300 text-xs font-black flex items-center gap-1">
                      <Zap className="w-3 h-3 fill-current" /> +{speedBonus} speed
                    </span>
                  )}
                </div>

                <p className="text-xs font-bold text-slate-300 mt-1">
                  {selectedOption?.is_correct ? (
                    <span>Great job! You picked the right answer.</span>
                  ) : correctOption ? (
                    <span>The correct answer is: <strong className="text-emerald-400 font-black">{correctOption.option_text}</strong></span>
                  ) : (
                    <span>Time expired before an answer was locked in.</span>
                  )}
                </p>
              </div>
            </div>

            {/* ACTION CONTROLS */}
            <div className="flex items-center gap-2 w-full sm:w-auto">
              <button
                onClick={() => handleProceed(true)}
                className="flex-1 sm:flex-initial px-4 py-3 rounded-2xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-extrabold flex items-center justify-center gap-1.5 transition-all border border-slate-700"
                title="View Current Leaderboard"
              >
                <Trophy className="w-4 h-4 text-amber-400" />
                <span>Leaderboard</span>
              </button>

              <button
                onClick={() => handleProceed(false)}
                className="flex-1 sm:flex-initial px-6 py-3 rounded-2xl bg-gradient-to-r from-emerald-500 via-teal-500 to-cyan-500 hover:from-emerald-400 hover:to-cyan-400 text-slate-950 text-sm font-black flex items-center justify-center gap-2 shadow-xl shadow-emerald-500/20 transition-all transform active:scale-95"
              >
                <span>{questionIndex + 1 < totalQuestions ? 'Next Question' : 'View Final Results'}</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* EXPLANATION BOX */}
          {question.explanation && (
            <div className="p-4 rounded-2xl bg-slate-950/80 border border-slate-800 text-left space-y-1">
              <div className="flex items-center gap-2 text-cyan-400 text-xs font-black uppercase tracking-wider">
                <HelpCircle className="w-4 h-4" />
                <span>Question Explanation</span>
              </div>
              <p className="text-xs text-slate-300 leading-relaxed pl-6">
                {question.explanation}
              </p>
            </div>
          )}

          {/* AUTO-ADVANCE BAR */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between text-[11px] font-bold text-slate-400">
              <span>Auto-advancing in {autoAdvanceRemaining}s...</span>
              <button
                onClick={() => handleProceed(false)}
                className="text-cyan-400 hover:underline flex items-center gap-1"
              >
                Continue now <ArrowRight className="w-3 h-3" />
              </button>
            </div>
            <div className="w-full h-1.5 bg-slate-950 rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-cyan-400 to-emerald-400 rounded-full transition-all duration-1000 ease-linear"
                style={{ width: `${Math.round((autoAdvanceRemaining / 5) * 100)}%` }}
              />
            </div>
          </div>

        </div>
      )}

    </div>
  );
};

