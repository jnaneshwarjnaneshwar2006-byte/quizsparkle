import type { UserProfile, Role } from '../types/quiz';
import { apiUrl } from './apiConfig';

const AUTH_STORAGE_KEY = 'kahoot_quiz_platform_user';
const TEACHER_EMAIL = 'aditya2003@gmail.com';
const TEACHER_PASSWORD = '123456';

export const authService = {
  getUser(): UserProfile | null {
    try { const stored = localStorage.getItem(AUTH_STORAGE_KEY); return stored ? JSON.parse(stored) : null; } catch { return null; }
  },
  setUser(user: UserProfile | null): void {
    if (user) localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(user));
    else localStorage.removeItem(AUTH_STORAGE_KEY);
  },
  async login(email: string, pass: string, role: Role): Promise<{ user: UserProfile | null; error: string | null }> {
    const cleanEmail = email.trim().toLowerCase();
    if (cleanEmail !== TEACHER_EMAIL || pass !== TEACHER_PASSWORD || role !== 'teacher') {
      return { user: null, error: 'Invalid teacher email or password.' };
    }
    try {
      const response = await fetch(apiUrl('/auth/login'), {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: cleanEmail, password: pass, role, name: cleanEmail.split('@')[0] })
      });
      if (!response.ok) throw new Error('Backend login failed');
      const body = await response.json();
      const profile = body.user as UserProfile;
      this.setUser(profile);
      return { user: profile, error: null };
    } catch {
      const profile: UserProfile = { id: '00000000-0000-4000-8000-000000000001', role, name: cleanEmail.split('@')[0] || 'Teacher', avatar: '👑' };
      this.setUser(profile);
      return { user: profile, error: null };
    }
  },
  async signUp(email: string, pass: string, name: string, role: Role) {
    return this.login(email, pass, role).then(result => result.user ? { ...result, user: { ...result.user, name } } : result);
  },
  async logout(): Promise<void> { this.setUser(null); }
};
