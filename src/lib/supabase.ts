import { createClient } from '@supabase/supabase-js';

// Read env variables or fallback to empty strings
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || '';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || '';

// Helper to check if credentials are validly configured
export const isSupabaseConfigured = (): boolean => {
  return Boolean(
    supabaseUrl && 
    supabaseAnonKey && 
    supabaseUrl !== 'https://your-supabase-project.supabase.co' &&
    !supabaseUrl.includes('your-supabase-url')
  );
};

// Create client instance (or dummy instance if missing env vars)
export const supabase = createClient(
  supabaseUrl || 'https://placeholder.supabase.co',
  supabaseAnonKey || 'placeholder'
);
