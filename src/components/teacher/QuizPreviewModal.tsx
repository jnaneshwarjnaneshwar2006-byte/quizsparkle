import React, { useState } from 'react';
import type { Quiz, Option } from '../../types/quiz';
import { MediaPreview } from '../preview/MediaPreview';
import { soundFx } from '../../lib/sound';
import {
  X,
  ChevronRight,
  ChevronLeft,
  Eye,
  Clock,
  CheckCircle2,
  XCircle,
  HelpCircle,
  Sparkles,
  RotateCcw
} from 'lucide-react';

interface QuizPreviewModalProps {
  quiz: Quiz;
  onClose: () => void;
}

export const QuizPreviewModal: React.FC<QuizPreviewModalProps> = ({ quiz, onClose }) => {
  const [currentIdx, setCurrentIdx] = useState(0);
  const [interactiveMode, setInteractiveMode] = useState(true);
  const [selectedOptId, setSelectedOptId] = useState<string | null>(null);

  const questions = quiz.questions || [];
  const currentQuestion = questions[currentIdx];

  const handleSelectOption = (opt: Option) => {
    if (!interactiveMode) return;
    setSelectedOptId(opt.id);
    if (opt.is_correct) {
      soundFx.playCorrect();
    } else {
      soundFx.playWrong();
    }
  };

  const handleNext = () => {
    setSelectedOptId(null);
    setCurrentIdx(prev => Math.min(questions.length - 1, prev + 1));
  };

  const handlePrev = () => {
    setSelectedOptId(null);
    setCurrentIdx(prev => Math.max(0, prev - 1));
  };

  if (!currentQuestion) {
    return (
      <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4">
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-8 max-w-md text-center space-y-4 shadow-2xl">
          <h3 className="text-xl font-bold text-white">No Questions to Preview</h3>
          <p className="text-sm text-slate-400">Add at least one question to preview the quiz flow.</p>
          <button
            onClick={onClose}
            className="px-5 py-2.5 rounded-xl bg-purple-600 text-white text-xs font-bold shadow-lg"
          >
            Close Preview
          </button>
        </div>
      </div>
    );
  }

  const userSelectedOpt = currentQuestion.options.find(o => o.id === selectedOptId);

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/90 backdrop-blur-md flex items-center justify-center p-4">
      <div className="bg-slate-900 border border-slate-800 rounded-3xl max-w-3xl w-full max-h-[90vh] overflow-y-auto p-6 space-y-6 shadow-2xl relative">
        
        {/* MODAL HEADER */}
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-800 pb-4">
          <div className="flex items-center gap-2">
            <Eye className="w-5 h-5 text-cyan-400" />
            <h3 className="text-lg font-black text-white">Quiz Preview</h3>
            <span className="px-2.5 py-0.5 rounded-full bg-slate-800 text-slate-300 text-xs font-mono">
              {currentIdx + 1} of {questions.length}
            </span>
          </div>

          <div className="flex items-center gap-2">
            {/* INTERACTIVE MODE TOGGLE */}
            <div className="flex bg-slate-950 p-1 rounded-xl border border-slate-800 text-xs font-bold">
              <button
                type="button"
                onClick={() => { setInteractiveMode(true); setSelectedOptId(null); }}
                className={`px-3 py-1 rounded-lg transition-all flex items-center gap-1 ${
                  interactiveMode ? 'bg-cyan-600 text-white shadow' : 'text-slate-400 hover:text-white'
                }`}
              >
                <Sparkles className="w-3.5 h-3.5" />
                <span>Test Mode</span>
              </button>
              <button
                type="button"
                onClick={() => { setInteractiveMode(false); setSelectedOptId(null); }}
                className={`px-3 py-1 rounded-lg transition-all ${
                  !interactiveMode ? 'bg-purple-600 text-white shadow' : 'text-slate-400 hover:text-white'
                }`}
              >
                Answer Key
              </button>
            </div>

            <button
              onClick={onClose}
              className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* QUESTION DISPLAY PREVIEW */}
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <span className="text-xs uppercase font-extrabold tracking-widest text-purple-400 bg-purple-500/10 px-3 py-1 rounded-full border border-purple-500/20">
              {currentQuestion.question_type.replace('_', ' ')}
            </span>
            <div className="flex items-center gap-1.5 text-amber-400 font-mono text-sm font-bold bg-amber-500/10 px-3 py-1 rounded-full border border-amber-500/20">
              <Clock className="w-4 h-4" /> {currentQuestion.timer_seconds}s
            </div>
          </div>

          <h2 className="text-xl md:text-2xl font-black text-white text-center leading-snug">
            {currentQuestion.question_text}
          </h2>

          {/* MEDIA PREVIEW */}
          {currentQuestion.media_url && (
            <div className="max-w-xl mx-auto">
              <MediaPreview mediaUrl={currentQuestion.media_url} mediaType={currentQuestion.media_type} />
            </div>
          )}

          {/* OPTIONS PREVIEW */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
            {currentQuestion.options.map((opt, oIdx) => {
              const isSelected = selectedOptId === opt.id;
              const isCorrect = opt.is_correct;

              let style = 'bg-slate-950/80 border-slate-800 text-slate-300';
              let badge = null;

              if (interactiveMode) {
                if (selectedOptId) {
                  if (isSelected && isCorrect) {
                    style = 'bg-emerald-600/30 border-emerald-400 text-emerald-200 ring-2 ring-emerald-500/50 shadow-lg';
                    badge = <span className="text-xs font-extrabold text-emerald-400 flex items-center gap-1"><CheckCircle2 className="w-4 h-4" /> Correct!</span>;
                  } else if (isSelected && !isCorrect) {
                    style = 'bg-rose-600/30 border-rose-400 text-rose-200 ring-2 ring-rose-500/50 shadow-lg';
                    badge = <span className="text-xs font-extrabold text-rose-400 flex items-center gap-1"><XCircle className="w-4 h-4" /> Incorrect</span>;
                  } else if (isCorrect) {
                    style = 'bg-emerald-600/20 border-emerald-500 text-emerald-300 ring-1 ring-emerald-500/40';
                    badge = <span className="text-xs font-bold text-emerald-400 flex items-center gap-1"><CheckCircle2 className="w-4 h-4" /> Correct Answer</span>;
                  } else {
                    style = 'bg-slate-950/50 border-slate-800/80 text-slate-500 opacity-40';
                  }
                } else {
                  style = 'bg-slate-950/80 border-slate-800 hover:border-cyan-500/50 text-slate-300 hover:text-white cursor-pointer';
                }
              } else {
                // Answer Key Mode
                if (opt.is_correct) {
                  style = 'bg-emerald-600/20 border-emerald-500 text-emerald-300 ring-2 ring-emerald-500/40';
                  badge = <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />;
                }
              }

              return (
                <button
                  key={opt.id || oIdx}
                  type="button"
                  onClick={() => handleSelectOption(opt)}
                  disabled={!interactiveMode || Boolean(selectedOptId)}
                  className={`p-4 rounded-2xl border text-left font-bold text-base flex items-center justify-between shadow-lg transition-all ${style}`}
                >
                  <span>{opt.option_text}</span>
                  {badge}
                </button>
              );
            })}
          </div>

          {/* INSTANT RESULT IN TEST MODE */}
          {interactiveMode && selectedOptId && (
            <div className={`p-4 rounded-2xl border text-left flex items-center justify-between ${
              userSelectedOpt?.is_correct
                ? 'bg-emerald-950/50 border-emerald-500/40 text-emerald-300'
                : 'bg-rose-950/50 border-rose-500/40 text-rose-300'
            }`}>
              <div className="flex items-center gap-2">
                {userSelectedOpt?.is_correct ? (
                  <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
                ) : (
                  <XCircle className="w-5 h-5 text-rose-400 shrink-0" />
                )}
                <span className="text-xs font-black">
                  {userSelectedOpt?.is_correct ? 'Correct! That is the right answer.' : 'Incorrect! See the highlighted correct answer above.'}
                </span>
              </div>

              <button
                type="button"
                onClick={() => setSelectedOptId(null)}
                className="px-3 py-1 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-300 hover:text-white text-xs font-bold flex items-center gap-1 border border-slate-700"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Retry</span>
              </button>
            </div>
          )}

          {/* EXPLANATION */}
          {currentQuestion.explanation && (!interactiveMode || selectedOptId) && (
            <div className="p-4 rounded-2xl bg-cyan-950/40 border border-cyan-500/30 text-xs text-cyan-200 flex items-start gap-2.5 animate-fade-in">
              <HelpCircle className="w-4 h-4 text-cyan-400 shrink-0 mt-0.5" />
              <div>
                <span className="font-bold block uppercase tracking-wider text-[10px] text-cyan-400 mb-0.5">Explanation</span>
                {currentQuestion.explanation}
              </div>
            </div>
          )}
        </div>

        {/* NAVIGATION FOOTER */}
        <div className="flex items-center justify-between border-t border-slate-800 pt-4">
          <button
            onClick={handlePrev}
            disabled={currentIdx === 0}
            className="px-4 py-2 rounded-xl text-xs font-bold bg-slate-800 text-slate-300 disabled:opacity-40 disabled:cursor-not-allowed hover:bg-slate-700 flex items-center gap-1 transition-all"
          >
            <ChevronLeft className="w-4 h-4" /> Previous
          </button>

          <button
            onClick={handleNext}
            disabled={currentIdx === questions.length - 1}
            className="px-4 py-2 rounded-xl text-xs font-bold bg-purple-600 text-white disabled:opacity-40 disabled:cursor-not-allowed hover:bg-purple-500 flex items-center gap-1 shadow-lg shadow-purple-600/30 transition-all"
          >
            Next <ChevronRight className="w-4 h-4" />
          </button>
        </div>

      </div>
    </div>
  );
};
