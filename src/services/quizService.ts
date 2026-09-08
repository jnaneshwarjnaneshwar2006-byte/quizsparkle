import type { Quiz, QuizAttempt, LeaderboardEntry } from '../types/quiz';
import { supabase, isSupabaseConfigured } from '../lib/supabase';
import { INITIAL_QUIZZES } from '../lib/mockData';

const LOCAL_STORAGE_KEY = 'kahoot_quiz_platform_quizzes';
const LOCAL_STORAGE_ATTEMPTS_KEY = 'kahoot_quiz_platform_attempts';
const LOCAL_STORAGE_HAS_CREATED_QUIZ_KEY = 'kahoot_quiz_platform_has_created_quiz';

// Helper to generate a 6-digit quiz code like 849-201
export const generateQuizCode = (): string => {
  const part1 = Math.floor(100 + Math.random() * 900);
  const part2 = Math.floor(100 + Math.random() * 900);
  return `${part1}-${part2}`;
};

class QuizService {
  private getLocalQuizzes(): Quiz[] {
    try {
      const stored = localStorage.getItem(LOCAL_STORAGE_KEY);
      if (stored) {
        const quizzes: Quiz[] = JSON.parse(stored);
        const cleaned = quizzes.filter(q => q.id !== 'quiz-science-101' && q.id !== 'quiz-world-history');
        if (cleaned.length > 0) {
          if (cleaned.length !== quizzes.length) {
            localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(cleaned));
          }
          return cleaned;
        }

        if (localStorage.getItem(LOCAL_STORAGE_HAS_CREATED_QUIZ_KEY) === 'true') {
          return [];
        }
      }
      // Seed with initial quizzes if none present
      this.saveLocalQuizzes(INITIAL_QUIZZES);
      return INITIAL_QUIZZES;
    } catch {
      // Ignore JSON error
    }
    return INITIAL_QUIZZES;
  }

  private saveLocalQuizzes(quizzes: Quiz[]): void {
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(quizzes));
  }

  private getLocalAttempts(): QuizAttempt[] {
    try {
      const stored = localStorage.getItem(LOCAL_STORAGE_ATTEMPTS_KEY);
      if (stored) return JSON.parse(stored);
    } catch {
      // Ignore
    }
    return [];
  }

  private saveLocalAttempt(attempt: QuizAttempt): void {
    const attempts = this.getLocalAttempts();
    attempts.push(attempt);
    localStorage.setItem(LOCAL_STORAGE_ATTEMPTS_KEY, JSON.stringify(attempts));
  }

  // --- GET ALL QUIZZES ---
  async getQuizzes(): Promise<Quiz[]> {
    if (isSupabaseConfigured()) {
      try {
        const { data: quizzesData, error } = await supabase
          .from('quizzes')
          .select(`
            *,
            questions (
              *,
              options (*)
            )
          `)
          .order('created_at', { ascending: false });

        if (!error && quizzesData) {
          return quizzesData.map((q: any) => ({
            ...q,
            questions: (q.questions || []).sort((a: any, b: any) => a.order_index - b.order_index)
              .map((question: any) => ({
                ...question,
                options: (question.options || []).sort((a: any, b: any) => a.order_index - b.order_index)
              }))
          }));
        }
      } catch (e) {
        console.warn('Supabase fetch failed, falling back to local storage', e);
      }
    }
    return this.getLocalQuizzes();
  }

  // --- GET QUIZ BY CODE (STUDENT JOIN) ---
  async getQuizByCode(code: string): Promise<Quiz | null> {
    const cleanCode = code.trim().toUpperCase();

    if (isSupabaseConfigured()) {
      try {
        const { data, error } = await supabase
          .from('quizzes')
          .select(`
            *,
            questions (
              *,
              options (*)
            )
          `)
          .eq('code', cleanCode)
          .eq('status', 'published')
          .maybeSingle();

        if (!error && data) {
          return {
            ...data,
            questions: (data.questions || []).sort((a: any, b: any) => a.order_index - b.order_index)
              .map((q: any) => ({
                ...q,
                options: (q.options || []).sort((a: any, b: any) => a.order_index - b.order_index)
              }))
          };
        }
      } catch (e) {
        console.warn('Supabase fetch by code failed', e);
      }
    }

    const localQuizzes = this.getLocalQuizzes();
    const found = localQuizzes.find(
      q => q.code.replace('-', '').toUpperCase() === cleanCode.replace('-', '').toUpperCase() && q.status === 'published'
    );
    return found || null;
  }

  // --- SAVE / CREATE / UPDATE QUIZ ---
  async saveQuiz(quiz: Quiz): Promise<Quiz> {
    const isNew = !quiz.id || quiz.id.startsWith('temp-');
    const quizToSave: Quiz = {
      ...quiz,
      id: isNew ? `quiz-${Date.now()}` : quiz.id,
      code: quiz.code || generateQuizCode(),
      updated_at: new Date().toISOString()
    };

    if (isSupabaseConfigured()) {
      try {
        // Upsert Quiz
        const { data: dbQuiz, error: quizError } = await supabase
          .from('quizzes')
          .upsert({
            id: isNew ? undefined : quizToSave.id,
            title: quizToSave.title,
            description: quizToSave.description || '',
            code: quizToSave.code,
            status: quizToSave.status,
            cover_image: quizToSave.cover_image || null,
            default_timer: quizToSave.default_timer || 20,
            updated_at: quizToSave.updated_at
          })
          .select()
          .single();

        if (!quizError && dbQuiz) {
          const quizId = dbQuiz.id;

          // Process questions
          for (let i = 0; i < quizToSave.questions.length; i++) {
            const q = quizToSave.questions[i];
            const { data: dbQuestion, error: qError } = await supabase
              .from('questions')
              .upsert({
                id: q.id.startsWith('temp-') ? undefined : q.id,
                quiz_id: quizId,
                question_text: q.question_text,
                question_type: q.question_type,
                media_url: q.media_url || null,
                media_type: q.media_type || 'none',
                timer_seconds: q.timer_seconds || 20,
                explanation: q.explanation || null,
                order_index: i
              })
              .select()
              .single();

            if (!qError && dbQuestion) {
              const questionId = dbQuestion.id;

              for (let j = 0; j < q.options.length; j++) {
                const opt = q.options[j];
                await supabase.from('options').upsert({
                  id: opt.id.startsWith('temp-') ? undefined : opt.id,
                  question_id: questionId,
                  option_text: opt.option_text,
                  option_color: opt.option_color,
                  is_correct: opt.is_correct,
                  order_index: j
                });
              }
            }
          }
          return quizToSave;
        }
      } catch (e) {
        console.warn('Supabase save failed, storing locally', e);
      }
    }

    // Local Storage Fallback
    const local = this.getLocalQuizzes().filter(existingQuiz =>
      !isNew || !INITIAL_QUIZZES.some(demoQuiz => demoQuiz.id === existingQuiz.id)
    );
    if (isNew) localStorage.setItem(LOCAL_STORAGE_HAS_CREATED_QUIZ_KEY, 'true');
    const existingIndex = local.findIndex(q => q.id === quizToSave.id);
    if (existingIndex >= 0) {
      local[existingIndex] = quizToSave;
    } else {
      local.unshift(quizToSave);
    }
    this.saveLocalQuizzes(local);
    return quizToSave;
  }

  // --- DELETE QUIZ ---
  async deleteQuiz(quizId: string): Promise<boolean> {
    if (isSupabaseConfigured()) {
      try {
        await supabase.from('quizzes').delete().eq('id', quizId);
      } catch (e) {
        console.warn('Supabase delete error', e);
      }
    }
    const local = this.getLocalQuizzes().filter(q => q.id !== quizId);
    this.saveLocalQuizzes(local);
    return true;
  }

  // --- TOGGLE PUBLISH ---
  async togglePublish(quizId: string): Promise<Quiz | null> {
    const quizzes = await this.getQuizzes();
    const target = quizzes.find(q => q.id === quizId);
    if (!target) return null;

    target.status = target.status === 'published' ? 'draft' : 'published';
    return await this.saveQuiz(target);
  }

  // --- SAVE ATTEMPTS & UPDATE LEADERBOARD ---
  async submitQuizAttempt(attempt: QuizAttempt): Promise<QuizAttempt> {
    if (isSupabaseConfigured()) {
      try {
        const { data: savedAttempt, error: attemptError } = await supabase.from('quiz_attempts').insert({
          quiz_id: attempt.quiz_id,
          student_name: attempt.student_name,
          student_id: attempt.student_id || null,
          total_score: attempt.total_score,
          correct_count: attempt.correct_count,
          total_questions: attempt.total_questions,
          accuracy_percentage: attempt.accuracy_percentage,
          time_taken_seconds: attempt.time_taken_seconds
        }).select('id').single();

        if (attemptError) throw attemptError;

        if (savedAttempt && attempt.answers?.length) {
          const { error: answersError } = await supabase.from('student_answers').insert(
            attempt.answers.map(answer => ({
              attempt_id: savedAttempt.id,
              question_id: answer.question_id,
              selected_option_id: answer.selected_option_id || null,
              is_correct: answer.is_correct,
              points_earned: answer.points_earned,
              response_time_ms: answer.response_time_ms
            }))
          );

          if (answersError) throw answersError;
        }

        // Insert into leaderboard
        const { error: leaderboardError } = await supabase.from('leaderboard').insert({
          quiz_id: attempt.quiz_id,
          student_name: attempt.student_name,
          score: attempt.total_score
        });

        if (leaderboardError) throw leaderboardError;
      } catch (e) {
        console.warn('Supabase attempt submit error', e);
      }
    }

    this.saveLocalAttempt(attempt);
    return attempt;
  }

  async getAttempts(quizId: string): Promise<QuizAttempt[]> {
    if (isSupabaseConfigured()) {
      try {
        const { data, error } = await supabase
          .from('quiz_attempts')
          .select('*')
          .eq('quiz_id', quizId)
          .order('completed_at', { ascending: false });

        if (!error && data) return data as QuizAttempt[];
      } catch (e) {
        console.warn('Supabase attempts fetch error', e);
      }
    }

    return this.getLocalAttempts().filter(attempt => attempt.quiz_id === quizId);
  }

  // --- GET LEADERBOARD FOR A QUIZ ---
  async getLeaderboard(quizId: string, currentStudentName?: string, currentScore?: number): Promise<LeaderboardEntry[]> {
    let entries: { student_name: string; score: number }[] = [];

    if (isSupabaseConfigured()) {
      try {
        const { data } = await supabase
          .from('leaderboard')
          .select('student_name, score')
          .eq('quiz_id', quizId)
          .order('score', { ascending: false })
          .limit(10);

        if (data && data.length > 0) {
          entries = data;
        }
      } catch (e) {
        console.warn('Supabase leaderboard fetch error', e);
      }
    }

    if (entries.length === 0) {
      const attempts = this.getLocalAttempts().filter(a => a.quiz_id === quizId);
      entries = attempts.map(a => ({ student_name: a.student_name, score: a.total_score }));
    }

    if (currentStudentName && currentScore !== undefined) {
      const existing = entries.find(e => e.student_name === currentStudentName);
      if (existing) {
        existing.score = Math.max(existing.score, currentScore);
      } else {
        entries.push({ student_name: currentStudentName, score: currentScore });
      }
    }

    // Sort by score descending
    entries.sort((a, b) => b.score - a.score);

    return entries.map((entry, index) => ({
      id: `lb-${index}`,
      quiz_id: quizId,
      student_name: entry.student_name,
      score: entry.score,
      rank: index + 1,
      is_current_user: entry.student_name === currentStudentName
    }));
  }
}

export const quizService = new QuizService();
