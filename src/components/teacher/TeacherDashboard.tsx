import React, { useState, useEffect } from 'react';
import type { Quiz, UserProfile, LiveQuizSession } from '../../types/quiz';
import { quizService, generateQuizCode } from '../../services/quizService';
import { QuizEditor } from './QuizEditor';
import { QuizPreviewModal } from './QuizPreviewModal';
import { QuizResultsView } from './QuizResultsView';
import { ShareQuizModal } from './ShareQuizModal';
import { TeacherLobby } from './TeacherLobby';
import { Plus, Edit3, Trash2, Eye, Share2, BarChart2, Clock, Sparkles, Copy, Check, Layers, Users } from 'lucide-react';

interface TeacherDashboardProps { user: UserProfile | null; }

export const TeacherDashboard: React.FC<TeacherDashboardProps> = ({ user }) => {
  const [quizzes, setQuizzes] = useState<Quiz[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeQuiz, setActiveQuiz] = useState<Quiz | null>(null);
  const [previewQuiz, setPreviewQuiz] = useState<Quiz | null>(null);
  const [resultsQuiz, setResultsQuiz] = useState<Quiz | null>(null);
  const [copiedCode, setCopiedCode] = useState<string | null>(null);
  const [shareQuiz, setShareQuiz] = useState<Quiz | null>(null);
  const [liveLobby, setLiveLobby] = useState<{ quiz: Quiz; session: LiveQuizSession } | null>(null);

  // Load Quizzes
  const fetchQuizzes = async () => {
    setLoading(true);
    try {
      const data = await quizService.getQuizzes();
      setQuizzes(data);
    } catch (err) {
      console.error('Failed to load quizzes', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchQuizzes();
  }, []);

  // Create new Quiz
  const handleCreateNewQuiz = () => {
    const newQuiz: Quiz = {
      id: `temp-${Date.now()}`,
      title: '',
      description: '',
      code: generateQuizCode(),
      status: 'draft',
      default_timer: 20,
      created_at: new Date().toISOString(),
      questions: []
    };
    setActiveQuiz(newQuiz);
  };

  // Save Quiz Handler
  const handleSaveQuiz = async (updatedQuiz: Quiz) => {
    const savedQuiz = await quizService.saveQuiz(updatedQuiz);
    await fetchQuizzes();
    setActiveQuiz(null);
    if (savedQuiz.status === 'published') {
      setShareQuiz(savedQuiz);
    }
    return savedQuiz;
  };

  // Delete Quiz
  const handleDeleteQuiz = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (confirm('Are you sure you want to delete this quiz?')) {
      await quizService.deleteQuiz(id);
      await fetchQuizzes();
    }
  };

  // Toggle Publish
  const handleTogglePublish = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    await quizService.togglePublish(id);
    await fetchQuizzes();
  };

  // Copy Code to Clipboard
  const handleCopyCode = (code: string, e: React.MouseEvent) => {
    e.stopPropagation();
    navigator.clipboard.writeText(code);
    setCopiedCode(code);
    setTimeout(() => setCopiedCode(null), 2000);
  };

  if (activeQuiz) {
    return (
      <QuizEditor
        quiz={activeQuiz}
        onSaveQuiz={handleSaveQuiz}
        onBack={() => setActiveQuiz(null)}
        onPreview={(q) => setPreviewQuiz(q)}
      />
    );
  }

  if (liveLobby) {
    return <TeacherLobby quiz={liveLobby.quiz} session={liveLobby.session} onBack={() => setLiveLobby(null)} />;
  }

  if (resultsQuiz) {
    return (
      <QuizResultsView
        quiz={resultsQuiz}
        onBack={() => setResultsQuiz(null)}
      />
    );
  }

  return (
    <div className="max-w-6xl mx-auto space-y-8 pb-20">
      
      {/* HERO BANNER */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-purple-900 via-slate-900 to-indigo-900 border border-purple-500/30 p-8 shadow-2xl">
        <div className="absolute top-0 right-0 -mr-16 -mt-16 w-64 h-64 bg-purple-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2 max-w-2xl">
            <div className="flex items-center gap-2">
              <span className="px-3 py-1 rounded-full bg-purple-500/20 text-purple-300 text-xs font-extrabold uppercase tracking-widest border border-purple-500/30">
                Teacher Control Panel
              </span>
            </div>
            <h1 className="text-3xl md:text-4xl font-black text-white tracking-tight">
              Create & Manage Interactive Quizzes
            </h1>
            <p className="text-sm text-slate-300">
              Build high-energy quizzes with images, audio clips, and video. Publish to get a 6-digit Quiz Code and track live student performance!
            </p>
          </div>

          <button
            onClick={handleCreateNewQuiz}
            className="px-6 py-3.5 rounded-2xl bg-gradient-to-r from-purple-600 via-fuchsia-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-black text-sm shadow-xl shadow-purple-600/30 flex items-center gap-2.5 transition-all transform active:scale-95 shrink-0"
          >
            <Plus className="w-5 h-5" /> Create New Quiz
          </button>
        </div>
      </div>

      {/* QUIZ LIST SECTION */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-black text-white flex items-center gap-2">
            <Layers className="w-5 h-5 text-purple-400" /> Your Quizzes ({quizzes.length})
          </h2>
        </div>

        {loading ? (
          <div className="text-center py-20 text-slate-400 text-sm animate-pulse">
            Loading your quizzes...
          </div>
        ) : quizzes.length === 0 ? (
          <div className="text-center py-20 bg-slate-900/50 border border-dashed border-slate-800 rounded-3xl space-y-4">
            <Sparkles className="w-12 h-12 text-purple-400 mx-auto" />
            <h3 className="text-xl font-bold text-white">No Quizzes Created Yet</h3>
            <p className="text-xs text-slate-400 max-w-sm mx-auto">
              Get started by creating your first interactive quiz for your students.
            </p>
            <button
              onClick={handleCreateNewQuiz}
              className="px-5 py-2.5 rounded-xl bg-purple-600 text-white text-xs font-bold shadow-lg"
            >
              Create Quiz Now
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {quizzes.map((quiz) => (
              <div
                key={quiz.id}
                className="bg-slate-900/90 border border-slate-800 hover:border-purple-500/50 rounded-3xl overflow-hidden shadow-xl hover:shadow-2xl hover:shadow-purple-500/10 transition-all flex flex-col justify-between group"
              >
                {/* COVER IMAGE */}
                <div className="relative h-44 bg-slate-950 overflow-hidden">
                  <img
                    src={quiz.cover_image || 'https://images.unsplash.com/photo-1451187580459-43490279c0fa?auto=format&fit=crop&w=800&q=80'}
                    alt={quiz.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    onError={(e) => {
                      (e.target as HTMLImageElement).src = 'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?auto=format&fit=crop&w=800&q=80';
                    }}
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/20 to-transparent" />

                  {/* STATUS BADGE & CODE */}
                  <div className="absolute top-3 left-3 right-3 flex items-center justify-between">
                    <button
                      onClick={(e) => handleTogglePublish(quiz.id, e)}
                      className={`px-3 py-1 rounded-full text-[11px] font-extrabold uppercase tracking-wider backdrop-blur-md border transition-all ${
                        quiz.status === 'published'
                          ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40 hover:bg-emerald-500/30'
                          : 'bg-amber-500/20 text-amber-300 border-amber-500/40 hover:bg-amber-500/30'
                      }`}
                    >
                      {quiz.status}
                    </button>

                    <button
                      onClick={(e) => { handleCopyCode(quiz.code, e); setShareQuiz(quiz); }}
                      className="px-3 py-1 rounded-full bg-slate-900/90 text-amber-400 border border-slate-700 text-xs font-mono font-bold flex items-center gap-1.5 hover:bg-slate-800 transition-all shadow-md"
                      title="Copy Quiz Code"
                    >
                      <Share2 className="w-3 h-3" />
                      <span>{quiz.code}</span>
                      {copiedCode === quiz.code ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3 text-slate-400" />}
                    </button>
                  </div>
                </div>

                {/* CONTENT INFO */}
                <div className="p-5 space-y-3 flex-1 flex flex-col justify-between">
                  <div className="space-y-1.5">
                    <h3 className="font-extrabold text-white text-lg group-hover:text-purple-300 transition-colors line-clamp-1">
                      {quiz.title || 'Untitled Quiz'}
                    </h3>
                    <p className="text-xs text-slate-400 line-clamp-2">
                      {quiz.description || 'No description provided.'}
                    </p>
                  </div>

                  <div className="flex items-center gap-4 text-xs font-semibold text-slate-400 pt-2 border-t border-slate-800">
                    <span className="flex items-center gap-1 text-purple-400">
                      <Sparkles className="w-3.5 h-3.5" /> {quiz.questions?.length || 0} Questions
                    </span>
                    <span className="flex items-center gap-1">
                      <Clock className="w-3.5 h-3.5" /> {quiz.default_timer || 20}s / Q
                    </span>
                  </div>
                </div>

                {/* ACTION BUTTONS */}
                <div className="px-5 pb-5 pt-2 border-t border-slate-800/80 bg-slate-950/40 flex items-center justify-between gap-2">
                  <div className="flex items-center gap-1.5">
                    <button
                      onClick={() => setActiveQuiz(quiz)}
                      className="p-2 rounded-xl text-slate-300 hover:text-white hover:bg-slate-800 transition-colors"
                      title="Edit Quiz"
                    >
                      <Edit3 className="w-4 h-4 text-indigo-400" />
                    </button>

                    <button
                      onClick={() => setPreviewQuiz(quiz)}
                      className="p-2 rounded-xl text-slate-300 hover:text-white hover:bg-slate-800 transition-colors"
                      title="Preview Quiz"
                    >
                      <Eye className="w-4 h-4 text-cyan-400" />
                    </button>

                    <button
                      onClick={() => setResultsQuiz(quiz)}
                      className="p-2 rounded-xl text-slate-300 hover:text-white hover:bg-slate-800 transition-colors"
                      title="View Results & Analytics"
                    >
                      <BarChart2 className="w-4 h-4 text-emerald-400" />
                    </button>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={(e) => handleDeleteQuiz(quiz.id, e)}
                      className="p-2 rounded-xl text-slate-500 hover:text-rose-400 hover:bg-rose-500/10 transition-colors"
                      title="Delete Quiz"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>

                    {quiz.status === 'published' && (
                      <button
                        onClick={async () => {
                          try {
                            const session = await quizService.createLiveQuizSession(quiz.id, user?.id);
                            setLiveLobby({ quiz, session });
                          } catch (error) {
                            console.error('Failed to create live quiz session', error);
                            alert('Could not start the live quiz. Make sure the MySQL server is running and server/.env has the correct MySQL password.');
                          }
                        }}
                        className="px-3 py-1.5 rounded-xl bg-emerald-500/20 text-emerald-300 hover:bg-emerald-500/30 text-xs font-bold flex items-center gap-1 border border-emerald-500/40 transition-all"
                      >
                        <Users className="w-3.5 h-3.5" /> Live Lobby
                      </button>
                    )}
                  </div>
                </div>

              </div>
            ))}
          </div>
        )}
      </div>

      {/* PREVIEW MODAL */}
      {previewQuiz && (
        <QuizPreviewModal quiz={previewQuiz} onClose={() => setPreviewQuiz(null)} />
      )}

      {shareQuiz && (
        <ShareQuizModal quiz={shareQuiz} onClose={() => setShareQuiz(null)} />
      )}

    </div>
  );
};
