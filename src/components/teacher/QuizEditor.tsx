import React, { useState } from 'react';
import type { Quiz, Question } from '../../types/quiz';
import { QuestionForm } from './QuestionForm';
import { generateQuizCode } from '../../services/quizService';
import { uploadMediaFile } from '../../services/storageService';
import { ArrowLeft, Plus, Eye, Share2, Save, Sparkles, HelpCircle, CheckCircle2, Clock, Trash2, Edit3, Image as ImageIcon, Music, Film, ListOrdered } from 'lucide-react';

interface QuizEditorProps {
  quiz: Quiz;
  onSaveQuiz: (updatedQuiz: Quiz) => Promise<Quiz>;
  onBack: () => void;
  onPreview: (quiz: Quiz) => void;
}

export const QuizEditor: React.FC<QuizEditorProps> = ({
  quiz,
  onSaveQuiz,
  onBack,
  onPreview
}) => {
  const [title, setTitle] = useState(quiz.title || '');
  const [description, setDescription] = useState(quiz.description || '');
  const [coverImage, setCoverImage] = useState(quiz.cover_image || '');
  const [defaultTimer, setDefaultTimer] = useState(quiz.default_timer || 20);
  const [status, setStatus] = useState<'draft' | 'published'>(quiz.status || 'draft');
  const [code] = useState(quiz.code || generateQuizCode());
  const [questions, setQuestions] = useState<Question[]>(quiz.questions || []);

  const [editingQuestionId, setEditingQuestionId] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [isUploadingCover, setIsUploadingCover] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  // Cover Image File Upload
  const handleCoverUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setIsUploadingCover(true);
    try {
      const res = await uploadMediaFile(file);
      setCoverImage(res.url);
    } catch (err) {
      console.error('Cover upload failed', err);
    } finally {
      setIsUploadingCover(false);
    }
  };

  // Add new question shell
  const handleAddQuestion = () => {
    const newQuestionId = `temp-${Date.now()}`;
    const newQuestion: Question = {
      id: newQuestionId,
      question_text: '',
      question_type: 'multiple_choice',
      timer_seconds: defaultTimer,
      order_index: questions.length,
      options: [
        { id: `opt-0`, option_text: '', option_color: 'red', is_correct: true, order_index: 0 },
        { id: `opt-1`, option_text: '', option_color: 'blue', is_correct: false, order_index: 1 },
        { id: `opt-2`, option_text: '', option_color: 'yellow', is_correct: false, order_index: 2 },
        { id: `opt-3`, option_text: '', option_color: 'green', is_correct: false, order_index: 3 }
      ]
    };
    setQuestions([...questions, newQuestion]);
    setEditingQuestionId(newQuestionId);
  };

  // Question save update
  const handleSaveQuestion = (updatedQuestion: Question) => {
    const nextQuestions = questions.map(q => q.id === updatedQuestion.id ? updatedQuestion : q);
    setQuestions(nextQuestions);
    setEditingQuestionId(null);
  };

  // Delete question
  const handleDeleteQuestion = (id: string) => {
    setQuestions(questions.filter(q => q.id !== id));
    if (editingQuestionId === id) setEditingQuestionId(null);
  };

  // Handle Main Save & Publish
  const handleSaveAll = async (targetStatus?: 'draft' | 'published') => {
    if (!title.trim()) {
      alert('Please enter a Quiz Title');
      return;
    }

    setIsSaving(true);
    setSaveError(null);
    const finalStatus = targetStatus || status;

    const updatedQuiz: Quiz = {
      ...quiz,
      title,
      description,
      cover_image: coverImage || undefined,
      default_timer: Number(defaultTimer),
      status: finalStatus,
      code: code || generateQuizCode(),
      questions: questions.map((q, idx) => ({ ...q, order_index: idx }))
    };

    try {
      await onSaveQuiz(updatedQuiz);
      setStatus(finalStatus);
    } catch (err) {
      console.error('Failed to save quiz', err);
      setSaveError(err instanceof Error ? err.message : 'Could not publish this quiz. Please try again.');
    } finally {
      setIsSaving(false);
    }
  };

  const getQuestionTypeBadge = (type: string) => {
    switch (type) {
      case 'image':
        return <span className="px-2.5 py-1 rounded-lg bg-emerald-500/20 text-emerald-300 text-[11px] font-bold flex items-center gap-1"><ImageIcon className="w-3 h-3" /> Image</span>;
      case 'audio':
        return <span className="px-2.5 py-1 rounded-lg bg-fuchsia-500/20 text-fuchsia-300 text-[11px] font-bold flex items-center gap-1"><Music className="w-3 h-3" /> Audio</span>;
      case 'video':
        return <span className="px-2.5 py-1 rounded-lg bg-amber-500/20 text-amber-300 text-[11px] font-bold flex items-center gap-1"><Film className="w-3 h-3" /> Video</span>;
      case 'true_false':
        return <span className="px-2.5 py-1 rounded-lg bg-blue-500/20 text-blue-300 text-[11px] font-bold flex items-center gap-1">True/False</span>;
      default:
        return <span className="px-2.5 py-1 rounded-lg bg-purple-500/20 text-purple-300 text-[11px] font-bold flex items-center gap-1"><ListOrdered className="w-3 h-3" /> Multiple Choice</span>;
    }
  };

  return (
    <div className="max-w-5xl mx-auto space-y-8 pb-20">
      
      {/* ACTION BAR */}
      <div className="flex flex-wrap items-center justify-between gap-4 bg-slate-900/90 p-4 rounded-3xl border border-slate-800 backdrop-blur-md sticky top-20 z-30 shadow-xl">
        <button
          onClick={onBack}
          className="px-4 py-2 rounded-xl text-xs font-bold bg-slate-800 text-slate-300 hover:text-white flex items-center gap-2 transition-all"
        >
          <ArrowLeft className="w-4 h-4" /> Back to Dashboard
        </button>

        <div className="flex items-center gap-3">
          <button
            onClick={() => onPreview({
              ...quiz,
              title,
              description,
              cover_image: coverImage,
              default_timer: defaultTimer,
              code,
              status,
              questions
            })}
            className="px-4 py-2 rounded-xl text-xs font-bold bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 hover:bg-cyan-500/30 flex items-center gap-2 transition-all"
          >
            <Eye className="w-4 h-4" /> Preview Quiz
          </button>

          <button
            onClick={() => handleSaveAll('draft')}
            disabled={isSaving}
            className="px-4 py-2 rounded-xl text-xs font-bold bg-slate-800 text-slate-200 hover:bg-slate-700 flex items-center gap-2 transition-all"
          >
            <Save className="w-4 h-4" /> {isSaving ? 'Saving...' : 'Save Draft'}
          </button>

          <button
            onClick={() => handleSaveAll('published')}
            disabled={isSaving}
            className="px-5 py-2.5 rounded-xl text-xs font-bold bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 text-white shadow-lg shadow-emerald-500/30 flex items-center gap-2 transition-all transform active:scale-95"
          >
            <CheckCircle2 className="w-4 h-4" /> {status === 'published' ? 'Update Published Quiz' : 'Publish Quiz Now'}
          </button>
        </div>
      </div>

      {saveError && (
        <div className="rounded-2xl border border-rose-500/40 bg-rose-500/10 px-4 py-3 text-sm font-semibold text-rose-200">
          {saveError}
        </div>
      )}

      {/* QUIZ HEADER DETAILS */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-3xl p-6 shadow-2xl space-y-6">
        <div className="flex items-center justify-between border-b border-slate-800 pb-4">
          <div className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-amber-400" />
            <h2 className="text-xl font-black text-white">Quiz Details & Settings</h2>
          </div>

          <div className="flex items-center gap-3">
            <div className="px-3 py-1 rounded-xl bg-purple-500/20 text-purple-300 border border-purple-500/30 text-xs font-mono font-bold flex items-center gap-2">
              <Share2 className="w-3.5 h-3.5" /> Code: <span className="text-amber-400 tracking-wider font-extrabold">{code}</span>
            </div>
            <span className={`px-3 py-1 rounded-xl text-xs font-extrabold uppercase tracking-wider ${
              status === 'published' ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40' : 'bg-amber-500/20 text-amber-400 border border-amber-500/40'
            }`}>
              {status}
            </span>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* TITLE & DESCRIPTION */}
          <div className="md:col-span-2 space-y-4">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-300 mb-2">
                Quiz Title <span className="text-purple-400">*</span>
              </label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g. 🚀 Grade 10 Science & Space Trivia"
                className="w-full px-4 py-3 bg-slate-950 border border-slate-700/80 rounded-2xl text-white font-bold text-lg focus:outline-none focus:ring-2 focus:ring-purple-500 shadow-inner"
              />
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-300 mb-2">
                Quiz Description
              </label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={3}
                placeholder="Short summary of what students will learn or be tested on..."
                className="w-full px-4 py-3 bg-slate-950 border border-slate-700/80 rounded-2xl text-white text-sm focus:outline-none focus:ring-2 focus:ring-purple-500 shadow-inner"
              />
            </div>
          </div>

          {/* COVER IMAGE & TIMER */}
          <div className="space-y-4">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-300 mb-2">
                Cover Image URL / File
              </label>
              <div className="space-y-2">
                <input
                  type="url"
                  value={coverImage}
                  onChange={(e) => setCoverImage(e.target.value)}
                  placeholder="https://..."
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none"
                />
                <div className="relative">
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleCoverUpload}
                    className="hidden"
                    id="cover-upload-file"
                  />
                  <label
                    htmlFor="cover-upload-file"
                    className="w-full py-2 bg-slate-800 hover:bg-slate-700 text-xs text-slate-300 rounded-xl font-bold flex items-center justify-center gap-2 cursor-pointer border border-slate-700 transition-colors"
                  >
                    <ImageIcon className="w-3.5 h-3.5 text-purple-400" />
                    {isUploadingCover ? 'Uploading...' : 'Upload Cover Image'}
                  </label>
                </div>
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-300 mb-2 flex items-center gap-1">
                <Clock className="w-3.5 h-3.5 text-amber-400" /> Default Question Timer
              </label>
              <select
                value={defaultTimer}
                onChange={(e) => setDefaultTimer(Number(e.target.value))}
                className="w-full px-3 py-2.5 bg-slate-950 border border-slate-700 rounded-xl text-white text-xs font-semibold focus:outline-none"
              >
                <option value={10}>10 seconds</option>
                <option value={15}>15 seconds</option>
                <option value={20}>20 seconds (Default)</option>
                <option value={30}>30 seconds</option>
              </select>
            </div>
          </div>
        </div>
      </div>

      {/* QUESTIONS LIST SECTION */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-xl font-black text-white flex items-center gap-2">
              <HelpCircle className="w-5 h-5 text-indigo-400" /> Quiz Questions ({questions.length})
            </h3>
            <p className="text-xs text-slate-400">Add unlimited questions, media attachments, timers, and explanations</p>
          </div>

          <button
            onClick={handleAddQuestion}
            className="px-4 py-2.5 rounded-xl text-xs font-extrabold bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white shadow-lg shadow-purple-600/30 flex items-center gap-2 transition-all transform active:scale-95"
          >
            <Plus className="w-4 h-4" /> Add Question
          </button>
        </div>

        {/* QUESTIONS LIST / EDITORS */}
        {questions.length === 0 ? (
          <div className="text-center py-16 bg-slate-900/50 border border-dashed border-slate-800 rounded-3xl space-y-4">
            <div className="w-16 h-16 rounded-full bg-purple-500/10 text-purple-400 mx-auto flex items-center justify-center">
              <Plus className="w-8 h-8" />
            </div>
            <div>
              <h4 className="text-lg font-bold text-white">No questions added yet</h4>
              <p className="text-xs text-slate-400">Click the button above to create your first multiple-choice or media question!</p>
            </div>
            <button
              onClick={handleAddQuestion}
              className="px-5 py-2.5 rounded-xl text-xs font-bold bg-purple-600 text-white shadow-lg shadow-purple-600/30"
            >
              Add First Question
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            {questions.map((q, idx) => (
              <div key={q.id}>
                {editingQuestionId === q.id ? (
                  <QuestionForm
                    question={q}
                    index={idx}
                    onSave={handleSaveQuestion}
                    onDelete={handleDeleteQuestion}
                    onCancel={() => setEditingQuestionId(null)}
                  />
                ) : (
                  <div className="bg-slate-900/80 border border-slate-800 hover:border-slate-700 rounded-3xl p-5 shadow-xl transition-all flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div className="flex items-start gap-4">
                      <div className="w-10 h-10 rounded-2xl bg-slate-800 text-indigo-400 font-extrabold flex items-center justify-center shrink-0 border border-slate-700">
                        {idx + 1}
                      </div>

                      <div className="space-y-1.5">
                        <div className="flex flex-wrap items-center gap-2">
                          {getQuestionTypeBadge(q.question_type)}
                          <span className="px-2.5 py-0.5 rounded-lg bg-slate-800 text-slate-400 text-[11px] font-semibold flex items-center gap-1">
                            <Clock className="w-3 h-3" /> {q.timer_seconds}s
                          </span>
                          {q.media_url && (
                            <span className="px-2 py-0.5 rounded bg-cyan-500/10 text-cyan-400 text-[10px] uppercase font-bold border border-cyan-500/20">
                              Media Attached
                            </span>
                          )}
                        </div>

                        <h4 className="font-extrabold text-white text-base">
                          {q.question_text || <span className="text-slate-500 italic">Empty Question Text...</span>}
                        </h4>

                        <div className="flex flex-wrap gap-2 text-xs text-slate-400 pt-1">
                          {q.options?.map((opt, oIdx) => (
                            <span
                              key={oIdx}
                              className={`px-2.5 py-1 rounded-lg text-[11px] font-semibold border ${
                                opt.is_correct
                                  ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40 font-bold'
                                  : 'bg-slate-950 text-slate-400 border-slate-800'
                              }`}
                            >
                              {opt.is_correct && '✓ '} {opt.option_text || `Option ${oIdx + 1}`}
                            </span>
                          ))}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 self-end md:self-center">
                      <button
                        onClick={() => setEditingQuestionId(q.id)}
                        className="px-3 py-2 rounded-xl text-xs font-bold bg-slate-800 text-slate-200 hover:text-white flex items-center gap-1.5 border border-slate-700 transition-colors"
                      >
                        <Edit3 className="w-3.5 h-3.5 text-indigo-400" /> Edit
                      </button>

                      <button
                        onClick={() => handleDeleteQuestion(q.id)}
                        className="p-2 rounded-xl text-slate-500 hover:text-rose-400 hover:bg-rose-500/10 transition-colors"
                        title="Delete question"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

    </div>
  );
};
