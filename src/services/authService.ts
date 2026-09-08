import { supabase, isSupabaseConfigured } from '../lib/supabase';
import type { UserProfile, Role } from '../types/quiz';

const AUTH_STORAGE_KEY = 'kahoot_quiz_platform_user';
const TEACHER_EMAIL = 'aditya2003@gmail.com';
const TEACHER_PASSWORD = '123456';

export const authService = {
  // Get current logged in user profile
  getUser(): UserProfile | null {
    try {
      const stored = localStorage.getItem(AUTH_STORAGE_KEY);
      if (stored) return JSON.parse(stored);
    } catch {
      // Ignore
    }
    return null;
  },

  // Save current user locally
  setUser(user: UserProfile | null): void {
    if (user) {
      localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(user));
    } else {
      localStorage.removeItem(AUTH_STORAGE_KEY);
    }
  },

  // Login with Email & Password
  async login(email: string, pass: string, role: Role): Promise<{ user: UserProfile | null; error: string | null }> {
    const cleanEmail = email.trim().toLowerCase();

    if (cleanEmail !== TEACHER_EMAIL || pass !== TEACHER_PASSWORD || role !== 'teacher') {
      return { user: null, error: 'Invalid teacher email or password.' };
    }

    if (isSupabaseConfigured()) {
      try {
        const { data, error } = await supabase.auth.signInWithPassword({
          email: cleanEmail,
          password: pass
        });

        if (error) {
          return { user: null, error: error.message };
        }

        if (data.user) {
          const profile: UserProfile = {
            id: data.user.id,
            role: (data.user.user_metadata?.role as Role) || role,
            name: data.user.user_metadata?.full_name || cleanEmail.split('@')[0],
            avatar: role === 'teacher' ? '👑' : '🚀'
          };
          this.setUser(profile);
          return { user: profile, error: null };
        }
      } catch (e: any) {
        return { user: null, error: e.message || 'Authentication failed' };
      }
    }

    // Standalone Auth (Local Storage persistent session)
    const profile: UserProfile = {
      id: `user-${Date.now()}`,
      role: role,
      name: cleanEmail.split('@')[0] || 'User',
      avatar: role === 'teacher' ? '👑' : '🚀'
    };
    this.setUser(profile);
    return { user: profile, error: null };
  },

  // Register New User
  async signUp(email: string, pass: string, name: string, role: Role): Promise<{ user: UserProfile | null; error: string | null }> {
    if (email.trim().toLowerCase() !== TEACHER_EMAIL || pass !== TEACHER_PASSWORD || role !== 'teacher') {
      return { user: null, error: 'Only the authorized teacher account can access this dashboard.' };
    }
    const cleanEmail = email.trim().toLowerCase();

    if (isSupabaseConfigured()) {
      try {
        const { data, error } = await supabase.auth.signUp({
          email: cleanEmail,
          password: pass,
          options: {
            data: {
              full_name: name,
              role: role
            }
          }
        });

        if (error) {
          return { user: null, error: error.message };
        }

        if (data.user) {
          // Insert profile into database
          await supabase.from('profiles').insert({
            id: data.user.id,
            email: cleanEmail,
            full_name: name,
            role: role
          });

          const profile: UserProfile = {
            id: data.user.id,
            role: role,
            name: name,
            avatar: role === 'teacher' ? '👑' : '🚀'
          };
          this.setUser(profile);
          return { user: profile, error: null };
        }
      } catch (e: any) {
        return { user: null, error: e.message || 'Registration failed' };
      }
    }

    // Standalone Registration
    const profile: UserProfile = {
      id: `user-${Date.now()}`,
      role: role,
      name: name,
      avatar: role === 'teacher' ? '👑' : '🚀'
    };
    this.setUser(profile);
    return { user: profile, error: null };
  },

  // Logout
  async logout(): Promise<void> {
    if (isSupabaseConfigured()) {
      try {
        await supabase.auth.signOut();
      } catch {
        // Ignore
      }
    }
    this.setUser(null);
  }
};
