import type { Quiz, QuizAttempt, LeaderboardEntry, LiveQuizParticipant, LiveQuizSession } from '../types/quiz';
import { apiUrl } from './apiConfig';

const LOCAL_STORAGE_KEY = 'kahoot_quiz_platform_quizzes';
const LOCAL_STORAGE_ATTEMPTS_KEY = 'kahoot_quiz_platform_attempts';
const DEMO_QUIZ_IDS = new Set(['quiz-starter-science', 'quiz-starter-general', 'quiz-science-101', 'quiz-world-history']);
export const generateQuizCode = (): string => {
  const part1 = Math.floor(100 + Math.random() * 900);
  const part2 = Math.floor(100 + Math.random() * 900);
  return `${part1}-${part2}`;
};

const api = async <T>(path: string, options?: RequestInit): Promise<T> => {
  const response = await fetch(apiUrl(path), {
    ...options,
    headers: { 'Content-Type': 'application/json', ...(options?.headers || {}) }
  });
  const text = await response.text();
  let body: any = null;
  try { body = text ? JSON.parse(text) : null; } catch { body = text; }
  if (!response.ok) throw new Error(body?.error || `API request failed (${response.status})`);
  return body as T;
};

const normalizeQuiz = (quiz: any): Quiz => ({
  ...quiz,
  questions: (quiz.questions || []).sort((a: any, b: any) => a.order_index - b.order_index).map((q: any) => ({
    ...q,
    options: (q.options || []).sort((a: any, b: any) => a.order_index - b.order_index).map((o: any) => ({ ...o, is_correct: Boolean(o.is_correct) }))
  }))
});

class QuizService {
  async createLiveQuizSession(quizId: string, hostId?: string | null): Promise<LiveQuizSession> {
    return api<LiveQuizSession>('/live-sessions', { method: 'POST', body: JSON.stringify({ quiz_id: quizId, teacher_id: hostId }) });
  }

  async getWaitingLiveQuizSession(quizId: string): Promise<LiveQuizSession | null> {
    return api<LiveQuizSession | null>(`/live-sessions/waiting?quizId=${encodeURIComponent(quizId)}`);
  }

  async updateLiveQuizSessionStatus(sessionId: string, status: 'live' | 'finished'): Promise<void> {
    await api(`/live-sessions/${encodeURIComponent(sessionId)}/status`, { method: 'PATCH', body: JSON.stringify({ status }) });
  }

  async getLiveQuizSession(sessionId: string): Promise<LiveQuizSession | null> {
    return api<LiveQuizSession | null>(`/live-sessions/${encodeURIComponent(sessionId)}`);
  }

  async joinLiveQuiz(sessionId: string, quizId: string, studentName: string, avatar: string, studentId?: string | null): Promise<LiveQuizParticipant> {
    return api<LiveQuizParticipant>(`/live-sessions/${encodeURIComponent(sessionId)}/participants`, {
      method: 'POST',
      body: JSON.stringify({ quiz_id: quizId, student_id: studentId, student_name: studentName, avatar })
    });
  }

  async getLiveQuizParticipants(sessionId: string): Promise<LiveQuizParticipant[]> {
    return api<LiveQuizParticipant[]>(`/live-sessions/${encodeURIComponent(sessionId)}/participants`);
  }

  /** MySQL has no Supabase Realtime here, so this uses reliable short polling. */
  subscribeToLiveQuizParticipants(
    sessionId: string,
    onChange: (participant: LiveQuizParticipant) => void,
    onStatus?: (status: string) => void
  ): () => void {
    let stopped = false;
    let known = new Set<string>();
    const poll = async () => {
      if (stopped) return;
      try {
        const participants = await this.getLiveQuizParticipants(sessionId);
        onStatus?.('CONNECTED');
        for (const participant of participants) {
          if (!known.has(participant.id)) onChange(participant);
        }
        known = new Set(participants.map(p => p.id));
      } catch (error) {
        console.warn('[QuizSpark MySQL lobby] polling failed', error);
        onStatus?.('ERROR');
      }
    };
    void poll();
    const timer = window.setInterval(poll, 1000);
    return () => { stopped = true; window.clearInterval(timer); };
  }

  private getLocalQuizzes(): Quiz[] {
    try {
      const stored = localStorage.getItem(LOCAL_STORAGE_KEY);
      if (!stored) return [];
      return (JSON.parse(stored) as Quiz[]).filter(q => !DEMO_QUIZ_IDS.has(q.id));
    } catch { return []; }
  }

  private saveLocalQuizzes(quizzes: Quiz[]): void { localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(quizzes)); }

  private getLocalAttempts(): QuizAttempt[] {
    try { return JSON.parse(localStorage.getItem(LOCAL_STORAGE_ATTEMPTS_KEY) || '[]'); } catch { return []; }
  }

  private saveLocalAttempt(attempt: QuizAttempt): void {
    const attempts = this.getLocalAttempts();
    attempts.push(attempt);
    localStorage.setItem(LOCAL_STORAGE_ATTEMPTS_KEY, JSON.stringify(attempts));
  }

  async getQuizzes(): Promise<Quiz[]> {
    try { return (await api<any[]>('/quizzes')).filter(q => !DEMO_QUIZ_IDS.has(q.id)).map(normalizeQuiz); }
    catch (error) { console.warn('MySQL API unavailable; using local quizzes', error); return this.getLocalQuizzes(); }
  }

  async getQuizByCode(code: string): Promise<Quiz | null> {
    const cleanCode = code.trim().toUpperCase();
    const normalized = cleanCode.replace(/[^A-Z0-9]/g, '');
    const formatted = normalized.length === 6 ? `${normalized.slice(0, 3)}-${normalized.slice(3)}` : cleanCode;
    try { return normalizeQuiz(await api<any>(`/quizzes/code/${encodeURIComponent(formatted)}`)); }
    catch { return this.getLocalQuizzes().find(q => q.code.replace(/[^A-Z0-9]/gi, '').toUpperCase() === normalized && q.status === 'published') || null; }
  }

  async saveQuiz(quiz: Quiz): Promise<Quiz> {
    const quizToSave = { ...quiz, code: quiz.code || generateQuizCode(), updated_at: new Date().toISOString() };
    try { return normalizeQuiz(await api<any>('/quizzes', { method: 'POST', body: JSON.stringify(quizToSave) })); }
    catch (error) {
      console.warn('MySQL save failed; storing locally', error);
      const local = this.getLocalQuizzes();
      const index = local.findIndex(q => q.id === quizToSave.id);
      if (index >= 0) local[index] = quizToSave; else local.unshift(quizToSave);
      this.saveLocalQuizzes(local);
      return quizToSave;
    }
  }

  async deleteQuiz(quizId: string): Promise<boolean> {
    try { await api(`/quizzes/${encodeURIComponent(quizId)}`, { method: 'DELETE' }); }
    catch (error) { console.warn('MySQL delete failed; deleting local copy', error); }
    this.saveLocalQuizzes(this.getLocalQuizzes().filter(q => q.id !== quizId));
    return true;
  }

  async togglePublish(quizId: string): Promise<Quiz | null> {
    const quizzes = await this.getQuizzes();
    const target = quizzes.find(q => q.id === quizId);
    if (!target) return null;
    target.status = target.status === 'published' ? 'draft' : 'published';
    return this.saveQuiz(target);
  }

  async submitQuizAttempt(attempt: QuizAttempt): Promise<QuizAttempt> {
    try {
      const saved = await api<any>('/attempts', { method: 'POST', body: JSON.stringify(attempt) });
      return { ...attempt, id: saved.id || attempt.id };
    } catch (error) {
      console.warn('MySQL attempt submit failed; saving locally', error);
      this.saveLocalAttempt(attempt);
      return attempt;
    }
  }

  async getAttempts(quizId: string): Promise<QuizAttempt[]> {
    try { return await api<QuizAttempt[]>(`/attempts?quizId=${encodeURIComponent(quizId)}`); }
    catch { return this.getLocalAttempts().filter(a => a.quiz_id === quizId); }
  }

  async getLeaderboard(quizId: string, currentStudentName?: string, currentScore?: number): Promise<LeaderboardEntry[]> {
    let entries: { student_name: string; score: number }[] = [];
    try { entries = await api(`/leaderboard?quizId=${encodeURIComponent(quizId)}`); }
    catch { entries = this.getLocalAttempts().filter(a => a.quiz_id === quizId).map(a => ({ student_name: a.student_name, score: a.total_score })); }

    if (currentStudentName && currentScore !== undefined) {
      const existing = entries.find(e => e.student_name === currentStudentName);
      if (existing) existing.score = Math.max(existing.score, currentScore);
      else entries.push({ student_name: currentStudentName, score: currentScore });
    }
    entries.sort((a, b) => Number(b.score) - Number(a.score));
    return entries.map((entry, index) => ({
      id: `lb-${index}`,
      quiz_id: quizId,
      student_name: entry.student_name,
      score: Number(entry.score),
      rank: index + 1,
      is_current_user: entry.student_name === currentStudentName
    }));
  }
}

export const quizService = new QuizService();
