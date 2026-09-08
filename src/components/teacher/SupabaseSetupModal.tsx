import React, { useState } from 'react';
import { X, Copy, Check, Database, Sparkles, ExternalLink } from 'lucide-react';
import { isSupabaseConfigured } from '../../lib/supabase';

interface SupabaseSetupModalProps {
  onClose: () => void;
}

export const SupabaseSetupModal: React.FC<SupabaseSetupModalProps> = ({ onClose }) => {
  const [copied, setCopied] = useState(false);
  const isConnected = isSupabaseConfigured();

  const handleCopySql = () => {
    const sqlScript = `-- Supabase Schema for Kahoot Quiz Platform
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

CREATE TABLE IF NOT EXISTS public.quizzes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    title TEXT NOT NULL,
    description TEXT,
    code TEXT UNIQUE NOT NULL,
    status TEXT NOT NULL DEFAULT 'draft',
    cover_image TEXT,
    default_timer INT DEFAULT 20,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.questions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    quiz_id UUID REFERENCES public.quizzes(id) ON DELETE CASCADE,
    question_text TEXT NOT NULL,
    question_type TEXT NOT NULL,
    media_url TEXT,
    media_type TEXT,
    timer_seconds INT DEFAULT 20,
    explanation TEXT,
    order_index INT DEFAULT 0
);

CREATE TABLE IF NOT EXISTS public.options (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    question_id UUID REFERENCES public.questions(id) ON DELETE CASCADE,
    option_text TEXT NOT NULL,
    option_color TEXT,
    is_correct BOOLEAN DEFAULT false,
    order_index INT DEFAULT 0
);

CREATE TABLE IF NOT EXISTS public.quiz_attempts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    quiz_id UUID REFERENCES public.quizzes(id) ON DELETE CASCADE,
    student_name TEXT NOT NULL,
    total_score INT DEFAULT 0,
    correct_count INT DEFAULT 0,
    total_questions INT DEFAULT 0,
    accuracy_percentage NUMERIC(5,2) DEFAULT 0,
    time_taken_seconds INT DEFAULT 0,
    completed_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.leaderboard (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    quiz_id UUID REFERENCES public.quizzes(id) ON DELETE CASCADE,
    student_name TEXT NOT NULL,
    score INT DEFAULT 0,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);`;

    navigator.clipboard.writeText(sqlScript);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4">
      <div className="bg-slate-900 border border-slate-800 rounded-3xl max-w-2xl w-full max-h-[90vh] overflow-y-auto p-6 space-y-6 shadow-2xl relative">
        
        {/* HEADER */}
        <div className="flex items-center justify-between border-b border-slate-800 pb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
              <Database className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-lg font-black text-white">Supabase Integration Setup</h3>
              <p className="text-xs text-slate-400">
                {isConnected ? '✅ Connected to live Supabase Backend' : '⚡ Running in Standalone Demo Mode (LocalStorage active)'}
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* STATUS CARD */}
        <div className={`p-4 rounded-2xl border ${
          isConnected ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300' : 'bg-amber-500/10 border-amber-500/30 text-amber-300'
        } space-y-2 text-xs`}>
          <div className="flex items-center justify-between font-bold text-sm">
            <span>{isConnected ? 'Supabase Credentials Found' : 'Supabase Environment Variables Missing'}</span>
            <span className="px-2 py-0.5 rounded uppercase font-black tracking-wider text-[10px] bg-slate-950/60">
              {isConnected ? 'ONLINE' : 'DEMO MODE'}
            </span>
          </div>
          <p>
            {isConnected
              ? 'Your app is directly communicating with Supabase PostgreSQL and Realtime Leaderboards!'
              : 'The application operates 100% functionality in Local Storage Demo Mode out-of-the-box. To connect your live Supabase database, create a .env file with VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY.'}
          </p>
        </div>

        {/* INSTRUCTIONS & COPY SQL */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h4 className="text-sm font-bold text-white flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-purple-400" /> PostgreSQL SQL Schema Script
            </h4>
            <button
              onClick={handleCopySql}
              className="px-3 py-1.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white text-xs font-bold flex items-center gap-1.5 shadow-lg shadow-purple-600/30 transition-all"
            >
              {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
              {copied ? 'Copied SQL!' : 'Copy SQL Schema'}
            </button>
          </div>

          <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800 font-mono text-[11px] text-slate-300 max-h-48 overflow-y-auto leading-relaxed">
            <pre>
{`-- Execute in Supabase SQL Editor:
CREATE TABLE IF NOT EXISTS public.quizzes (...)
CREATE TABLE IF NOT EXISTS public.questions (...)
CREATE TABLE IF NOT EXISTS public.options (...)
CREATE TABLE IF NOT EXISTS public.quiz_attempts (...)
CREATE TABLE IF NOT EXISTS public.leaderboard (...)`}
            </pre>
          </div>

          <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 space-y-2 text-xs text-slate-400">
            <h5 className="font-bold text-white flex items-center gap-2">
              Env File Setup (.env)
            </h5>
            <div className="bg-slate-900 p-2.5 rounded-xl font-mono text-[11px] text-cyan-300">
              VITE_SUPABASE_URL=https://your-project.supabase.co<br />
              VITE_SUPABASE_ANON_KEY=your-anon-key-here
            </div>
          </div>
        </div>

        {/* FOOTER */}
        <div className="flex items-center justify-between border-t border-slate-800 pt-4">
          <a
            href="https://supabase.com"
            target="_blank"
            rel="noreferrer"
            className="text-xs text-purple-400 hover:underline flex items-center gap-1 font-bold"
          >
            Visit Supabase.com <ExternalLink className="w-3.5 h-3.5" />
          </a>

          <button
            onClick={onClose}
            className="px-5 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-white text-xs font-bold transition-all"
          >
            Close
          </button>
        </div>

      </div>
    </div>
  );
};
