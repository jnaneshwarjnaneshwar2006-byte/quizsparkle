import React from 'react';
import type { UserProfile } from '../../types/quiz';
import { SoundToggle } from './SoundToggle';
import { Sparkles, GraduationCap, UserCheck, Sun, Moon, LogOut } from 'lucide-react';

interface NavbarProps {
  user: UserProfile | null;
  onLogout: () => void;
  isDarkMode: boolean;
  onToggleDarkMode: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  user,
  onLogout,
  isDarkMode,
  onToggleDarkMode
}) => {
  return (
    <header className="sticky top-0 z-40 backdrop-blur-md bg-slate-900/80 border-b border-slate-800 text-white transition-colors duration-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        
        {/* LOGO */}
        <div className="flex items-center gap-3 cursor-pointer">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-violet-600 via-fuchsia-500 to-amber-400 p-0.5 shadow-lg shadow-purple-500/20">
            <div className="w-full h-full bg-slate-950 rounded-[10px] flex items-center justify-center">
              <Sparkles className="w-6 h-6 text-amber-400 animate-spin-slow" />
            </div>
          </div>
          <div>
            <div className="flex items-center gap-1.5 font-black text-xl tracking-tight">
              <span className="bg-clip-text text-transparent bg-gradient-to-r from-amber-400 via-fuchsia-400 to-cyan-400">
                QuizSpark
              </span>
              <span className="text-[10px] uppercase font-bold tracking-widest px-1.5 py-0.5 rounded bg-fuchsia-500/20 text-fuchsia-300 border border-fuchsia-500/30">
                LIVE
              </span>
            </div>
          </div>
        </div>

        {/* CONTROLS & USER PROFILE */}
        <div className="flex items-center gap-3">
          
          {/* USER INFO BADGE */}
          {user && (
            <div className="flex items-center gap-2 bg-slate-950 px-3 py-1.5 rounded-xl border border-slate-800">
              <span className="text-lg">{user.avatar || '👤'}</span>
              <div className="text-left hidden sm:block">
                <span className="font-extrabold text-xs text-white block leading-tight">{user.name}</span>
                <span className="text-[10px] uppercase font-bold text-purple-400 flex items-center gap-0.5">
                  {user.role === 'teacher' ? <GraduationCap className="w-3 h-3" /> : <UserCheck className="w-3 h-3 text-emerald-400" />}
                  {user.role}
                </span>
              </div>
            </div>
          )}

          {/* SOUND TOGGLE */}
          <SoundToggle />

          {/* DARK/LIGHT MODE TOGGLE */}
          <button
            onClick={onToggleDarkMode}
            className="p-2 rounded-xl border border-slate-700 bg-slate-800 text-slate-300 hover:text-white transition-colors"
            title="Toggle theme"
          >
            {isDarkMode ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4 text-cyan-400" />}
          </button>

          {/* LOGOUT BUTTON */}
          {user && (
            <button
              onClick={onLogout}
              className="p-2 rounded-xl border border-rose-500/30 bg-rose-500/10 text-rose-300 hover:bg-rose-500/20 transition-all flex items-center gap-1 text-xs font-bold"
              title="Sign Out"
            >
              <LogOut className="w-4 h-4" />
              <span className="hidden md:inline">Sign Out</span>
            </button>
          )}

        </div>

      </div>
    </header>
  );
};
