import React, { useState } from 'react';
import type { Question, QuestionType, OptionColor, Option } from '../../types/quiz';
import { uploadMediaFile } from '../../services/storageService';
import { MediaPreview } from '../preview/MediaPreview';
import { Upload, HelpCircle, Clock, CheckCircle2, Trash2, Image, Music, Film, ListOrdered, CheckSquare, Sparkles } from 'lucide-react';

interface QuestionFormProps {
  question: Question;
  index: number;
  onSave: (updated: Question) => void;
  onDelete: (id: string) => void;
  onCancel: () => void;
}

const OPTION_COLORS: { color: OptionColor; name: string; bg: string; border: string; text: string }[] = [
  { color: 'red', name: 'Option A (Red)', bg: 'bg-red-500/20', border: 'border-red-500/50', text: 'text-red-400' },
  { color: 'blue', name: 'Option B (Blue)', bg: 'bg-blue-500/20', border: 'border-blue-500/50', text: 'text-blue-400' },
  { color: 'yellow', name: 'Option C (Yellow)', bg: 'bg-amber-500/20', border: 'border-amber-500/50', text: 'text-amber-400' },
  { color: 'green', name: 'Option D (Green)', bg: 'bg-emerald-500/20', border: 'border-emerald-500/50', text: 'text-emerald-400' }
];

export const QuestionForm: React.FC<QuestionFormProps> = ({
  question,
  index,
  onSave,
  onDelete,
  onCancel
}) => {
  const [questionText, setQuestionText] = useState(question.question_text || '');
  const [questionType, setQuestionType] = useState<QuestionType>(question.question_type || 'multiple_choice');
  const [mediaUrl, setMediaUrl] = useState(question.media_url || '');
  const [mediaType, setMediaType] = useState<'image' | 'audio' | 'video' | 'none'>(question.media_type || 'none');
  const [timerSeconds, setTimerSeconds] = useState(question.timer_seconds || 20);
  const [explanation, setExplanation] = useState(question.explanation || '');
  const [isUploading, setIsUploading] = useState(false);

  // Initialize options (4 for multiple choice, 2 for T/F)
  const defaultOptions: Option[] = [
    { id: `opt-0`, option_text: '', option_color: 'red', is_correct: true, order_index: 0 },
    { id: `opt-1`, option_text: '', option_color: 'blue', is_correct: false, order_index: 1 },
    { id: `opt-2`, option_text: '', option_color: 'yellow', is_correct: false, order_index: 2 },
    { id: `opt-3`, option_text: '', option_color: 'green', is_correct: false, order_index: 3 }
  ];

  const [options, setOptions] = useState<Option[]>(
    question.options && question.options.length > 0 ? question.options : defaultOptions
  );

  // Handle Question Type Change
  const handleTypeChange = (newType: QuestionType) => {
    setQuestionType(newType);
    if (newType === 'true_false') {
      setOptions([
        { id: `opt-tf-0`, option_text: 'True', option_color: 'blue', is_correct: true, order_index: 0 },
        { id: `opt-tf-1`, option_text: 'False', option_color: 'red', is_correct: false, order_index: 1 }
      ]);
    } else if (options.length < 4) {
      setOptions(defaultOptions);
    }

    if (newType === 'image') setMediaType('image');
    else if (newType === 'audio') setMediaType('audio');
    else if (newType === 'video') setMediaType('video');
  };

  // Media File Upload Handler
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    try {
      const result = await uploadMediaFile(file);
      setMediaUrl(result.url);
      setMediaType(result.mediaType);
    } catch (err) {
      console.error('File upload failed', err);
    } finally {
      setIsUploading(false);
    }
  };

  // Option text change
  const handleOptionTextChange = (idx: number, text: string) => {
    const nextOpts = [...options];
    nextOpts[idx].option_text = text;
    setOptions(nextOpts);
  };

  // Correct Option selection
  const handleSetCorrectOption = (idx: number) => {
    const nextOpts = options.map((opt, i) => ({
      ...opt,
      is_correct: i === idx
    }));
    setOptions(nextOpts);
  };

  // Handle Submit Save
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!questionText.trim()) return;

    onSave({
      ...question,
      question_text: questionText,
      question_type: questionType,
      media_url: mediaUrl || undefined,
      media_type: mediaUrl ? mediaType : 'none',
      timer_seconds: Number(timerSeconds),
      explanation: explanation || undefined,
      options: options
    });
  };

  return (
    <form onSubmit={handleSubmit} className="bg-slate-900/90 border border-slate-800 rounded-3xl p-6 shadow-2xl space-y-6">
      
      {/* HEADER & TYPE SELECTOR */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-800 pb-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-purple-600 to-indigo-600 flex items-center justify-center text-white font-bold text-lg shadow-lg">
            Q{index + 1}
          </div>
          <div>
            <h3 className="font-extrabold text-lg text-white">Question Details</h3>
            <p className="text-xs text-slate-400">Configure question type, media, timer, and options</p>
          </div>
        </div>

        {/* QUESTION TYPE BUTTONS */}
        <div className="flex flex-wrap items-center gap-2 bg-slate-950 p-1.5 rounded-2xl border border-slate-800">
          <button
            type="button"
            onClick={() => handleTypeChange('multiple_choice')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
              questionType === 'multiple_choice' ? 'bg-purple-600 text-white shadow' : 'text-slate-400 hover:text-white'
            }`}
          >
            <ListOrdered className="w-3.5 h-3.5" /> MC
          </button>

          <button
            type="button"
            onClick={() => handleTypeChange('true_false')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
              questionType === 'true_false' ? 'bg-blue-600 text-white shadow' : 'text-slate-400 hover:text-white'
            }`}
          >
            <CheckSquare className="w-3.5 h-3.5" /> True/False
          </button>

          <button
            type="button"
            onClick={() => handleTypeChange('image')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
              questionType === 'image' ? 'bg-emerald-600 text-white shadow' : 'text-slate-400 hover:text-white'
            }`}
          >
            <Image className="w-3.5 h-3.5" /> Image
          </button>

          <button
            type="button"
            onClick={() => handleTypeChange('audio')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
              questionType === 'audio' ? 'bg-fuchsia-600 text-white shadow' : 'text-slate-400 hover:text-white'
            }`}
          >
            <Music className="w-3.5 h-3.5" /> Audio
          </button>

          <button
            type="button"
            onClick={() => handleTypeChange('video')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
              questionType === 'video' ? 'bg-amber-600 text-white shadow' : 'text-slate-400 hover:text-white'
            }`}
          >
            <Film className="w-3.5 h-3.5" /> Video
          </button>
        </div>
      </div>

      {/* QUESTION TEXT INPUT */}
      <div>
        <label className="block text-xs font-bold uppercase tracking-wider text-slate-300 mb-2">
          Question Text <span className="text-purple-400">*</span>
        </label>
        <input
          type="text"
          value={questionText}
          onChange={(e) => setQuestionText(e.target.value)}
          placeholder="e.g. What is the capital city of France?"
          required
          className="w-full px-4 py-3 bg-slate-950 border border-slate-700/80 rounded-2xl text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-purple-500 font-medium text-base shadow-inner"
        />
      </div>

      {/* MEDIA ATTACHMENT SECTION */}
      <div className="p-4 rounded-2xl bg-slate-950/60 border border-slate-800 space-y-3">
        <div className="flex items-center justify-between">
          <label className="text-xs font-bold uppercase tracking-wider text-slate-300 flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-purple-400" /> Media Attachment ({mediaType})
          </label>
          {mediaUrl && (
            <button
              type="button"
              onClick={() => { setMediaUrl(''); setMediaType('none'); }}
              className="text-xs text-rose-400 hover:underline"
            >
              Remove Media
            </button>
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-center">
          {/* File Upload Input */}
          <div className="relative">
            <input
              type="file"
              accept="image/*,audio/*,video/*"
              onChange={handleFileUpload}
              className="hidden"
              id={`media-upload-${question.id}`}
            />
            <label
              htmlFor={`media-upload-${question.id}`}
              className="w-full h-12 flex items-center justify-center gap-2 border-2 border-dashed border-slate-700 hover:border-purple-500 bg-slate-900 rounded-xl cursor-pointer text-xs font-bold text-slate-300 hover:text-white transition-all"
            >
              <Upload className="w-4 h-4 text-purple-400" />
              {isUploading ? 'Uploading Media...' : 'Upload Image, Audio, or Video File'}
            </label>
          </div>

          {/* URL Input */}
          <div>
            <input
              type="url"
              value={mediaUrl}
              onChange={(e) => {
                setMediaUrl(e.target.value);
                if (e.target.value && mediaType === 'none') {
                  setMediaType(questionType === 'audio' ? 'audio' : questionType === 'video' ? 'video' : 'image');
                }
              }}
              placeholder="Or paste media URL (https://...)"
              className="w-full px-3 py-2.5 bg-slate-900 border border-slate-700 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-purple-500"
            />
          </div>
        </div>

        {/* Live Media Preview */}
        {mediaUrl && (
          <div className="pt-2">
            <MediaPreview mediaUrl={mediaUrl} mediaType={mediaType} />
          </div>
        )}
      </div>

      {/* TIMER & EXPLANATION ROW */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* TIMER SELECTOR */}
        <div>
          <label className="block text-xs font-bold uppercase tracking-wider text-slate-300 mb-2 flex items-center gap-1.5">
            <Clock className="w-3.5 h-3.5 text-amber-400" /> Question Timer (seconds)
          </label>
          <select
            value={timerSeconds}
            onChange={(e) => setTimerSeconds(Number(e.target.value))}
            className="w-full px-4 py-2.5 bg-slate-950 border border-slate-700 rounded-xl text-white text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-purple-500"
          >
            <option value={5}>5 seconds (Fast!)</option>
            <option value={10}>10 seconds</option>
            <option value={15}>15 seconds</option>
            <option value={20}>20 seconds (Standard)</option>
            <option value={30}>30 seconds</option>
            <option value={60}>60 seconds (Complex)</option>
          </select>
        </div>

        {/* EXPLANATION INPUT */}
        <div>
          <label className="block text-xs font-bold uppercase tracking-wider text-slate-300 mb-2 flex items-center gap-1.5">
            <HelpCircle className="w-3.5 h-3.5 text-cyan-400" /> Answer Explanation (Shown after question)
          </label>
          <input
            type="text"
            value={explanation}
            onChange={(e) => setExplanation(e.target.value)}
            placeholder="e.g. Tokyo became the capital in 1868..."
            className="w-full px-4 py-2.5 bg-slate-950 border border-slate-700 rounded-xl text-white text-sm placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-purple-500"
          />
        </div>
      </div>

      {/* ANSWER OPTIONS GRID */}
      <div className="space-y-3">
        <label className="block text-xs font-bold uppercase tracking-wider text-slate-300">
          Answer Options <span className="text-slate-400 font-normal">(Click radio button to mark correct answer)</span>
        </label>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {options.map((opt, idx) => {
            const theme = OPTION_COLORS[idx % OPTION_COLORS.length];
            return (
              <div
                key={opt.id || idx}
                className={`p-3 rounded-2xl border ${theme.bg} ${
                  opt.is_correct ? 'border-emerald-500 ring-2 ring-emerald-500/50' : theme.border
                } transition-all relative flex items-center gap-3`}
              >
                {/* Radio Button Selector for Correct Answer */}
                <button
                  type="button"
                  onClick={() => handleSetCorrectOption(idx)}
                  className={`w-6 h-6 rounded-full border-2 flex items-center justify-center shrink-0 transition-all ${
                    opt.is_correct
                      ? 'border-emerald-400 bg-emerald-500 text-white'
                      : 'border-slate-600 hover:border-white'
                  }`}
                  title="Mark as correct answer"
                >
                  {opt.is_correct && <CheckCircle2 className="w-4 h-4 fill-white text-emerald-600" />}
                </button>

                <input
                  type="text"
                  value={opt.option_text}
                  onChange={(e) => handleOptionTextChange(idx, e.target.value)}
                  placeholder={`${theme.name}`}
                  required
                  className="flex-1 bg-slate-950/80 border border-slate-700/60 rounded-xl px-3 py-2 text-white text-sm font-semibold placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-purple-500"
                />

                {opt.is_correct && (
                  <span className="text-[10px] uppercase font-black px-2 py-0.5 rounded bg-emerald-500 text-slate-950 tracking-wider shrink-0">
                    Correct
                  </span>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* FORM ACTION BUTTONS */}
      <div className="flex items-center justify-between border-t border-slate-800 pt-4">
        <button
          type="button"
          onClick={() => onDelete(question.id)}
          className="px-4 py-2 rounded-xl text-xs font-bold bg-rose-500/10 text-rose-400 hover:bg-rose-500/20 border border-rose-500/30 flex items-center gap-1.5 transition-colors"
        >
          <Trash2 className="w-4 h-4" /> Delete Question
        </button>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={onCancel}
            className="px-4 py-2 rounded-xl text-xs font-bold text-slate-400 hover:text-white transition-colors"
          >
            Cancel
          </button>

          <button
            type="submit"
            className="px-5 py-2.5 rounded-xl text-xs font-bold bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white shadow-lg shadow-purple-600/30 transition-all transform active:scale-95"
          >
            Save Question
          </button>
        </div>
      </div>

    </form>
  );
};
