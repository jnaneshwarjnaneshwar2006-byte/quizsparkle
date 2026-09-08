import React, { useState } from 'react';
import type { Quiz } from '../../types/quiz';
import { quizService } from '../../services/quizService';
import { Sparkles, Gamepad2, ArrowRight, CheckCircle2, KeyRound } from 'lucide-react';

interface JoinQuizModalProps {
  onJoinSuccess: (quiz: Quiz, studentName: string, avatar: string) => void;
}

const AVATARS = ['🚀', '⚡', '🧠', '🔥', '🎯', '🦁', '🦉', '🐱', '🐼', '🌈', '🍀', '🎸'];

export const JoinQuizModal: React.FC<JoinQuizModalProps> = ({ onJoinSuccess }) => {
  const [code, setCode] = useState('');
  const [studentName, setStudentName] = useState('');
  const [selectedAvatar, setSelectedAvatar] = useState(AVATARS[0]);
  const [verifiedQuiz, setVerifiedQuiz] = useState<Quiz | null>(null);
  const [errorMsg, setErrorMsg] = useState('');
  const [isJoining, setIsJoining] = useState(false);

  const handleVerifyCode = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');

    if (!code.trim()) {
      setErrorMsg('Please enter a 6-digit Quiz Code');
      return;
    }
    setIsJoining(true);
    try {
      const quiz = await quizService.getQuizByCode(code);
      if (!quiz) {
        setErrorMsg('Invalid or unpublished Quiz Code! Please check your code.');
        setIsJoining(false);
        return;
      }
      setVerifiedQuiz(quiz);
    } catch {
      setErrorMsg('Failed to connect to quiz session.');
      setIsJoining(false);
    }
  };

  const handleJoin = (e: React.FormEvent) => {
    e.preventDefault();
    if (!verifiedQuiz || !studentName.trim()) {
      setErrorMsg('Enter your name to join.');
      return;
    }
    onJoinSuccess(verifiedQuiz, studentName.trim(), selectedAvatar);
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8 pb-20">
      
      {/* JOIN CODE HERO BOX */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-tr from-violet-900 via-slate-900 to-emerald-900 border border-emerald-500/30 p-8 shadow-2xl">
        <div className="max-w-xl mx-auto text-center space-y-6">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-300 text-xs font-black uppercase tracking-widest border border-emerald-500/30">
            <Gamepad2 className="w-4 h-4 animate-bounce" /> Live Student Portal
          </div>

          <h1 className="text-3xl md:text-5xl font-black text-white tracking-tight">
            Enter Quiz Code & Play!
          </h1>
          <p className="text-sm text-slate-300">
            Ask your teacher for the 6-digit game code or pick a featured live quiz below.
          </p>

          {/* JOIN FORM */}
          {!verifiedQuiz ? (
            <form onSubmit={handleVerifyCode} className="space-y-4 bg-slate-950/80 p-6 rounded-3xl border border-slate-800 shadow-2xl backdrop-blur-md">
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 text-left">Quiz code</label>
              <div className="relative"><KeyRound className="w-5 h-5 text-amber-400 absolute left-4 top-4" /><input type="text" value={code} onChange={(e) => setCode(e.target.value.toUpperCase())} placeholder="e.g. 839-201" autoFocus className="w-full pl-12 pr-4 py-4 bg-slate-900 border border-slate-700 rounded-2xl text-amber-400 font-mono font-black text-2xl placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-amber-500 tracking-widest" /></div>
              <button type="submit" disabled={isJoining} className="w-full py-4 rounded-2xl bg-amber-400 hover:bg-amber-300 text-slate-950 font-black text-lg flex items-center justify-center gap-2 transition-all disabled:opacity-60">{isJoining ? 'Checking code...' : 'Check code'} <ArrowRight className="w-5 h-5" /></button>
            </form>
            ) : (
              <form onSubmit={handleJoin} className="space-y-5 bg-slate-950/80 p-6 rounded-3xl border border-emerald-500/30 shadow-xl text-left animate-fade-in">
                <div className="flex items-center gap-3 p-3 rounded-2xl bg-emerald-400/10 border border-emerald-400/20"><CheckCircle2 className="w-5 h-5 text-emerald-400" /><div><p className="text-xs text-emerald-300 font-black uppercase">Code accepted</p><p className="text-white font-bold">{verifiedQuiz.title}</p></div></div>
                <div><label className="block text-xs font-black uppercase tracking-wider text-slate-300 mb-2" htmlFor="student-name">Your name</label><input id="student-name" value={studentName} onChange={(event) => setStudentName(event.target.value)} placeholder="e.g. Maya" autoFocus className="w-full px-4 py-3 bg-slate-900 border border-slate-700 rounded-2xl text-white text-lg font-bold placeholder-slate-600 focus:outline-none focus:ring-2 focus:ring-emerald-400" /></div>
                <div><p className="text-xs font-black uppercase tracking-wider text-slate-300 mb-2">Pick your emoji</p><div className="grid grid-cols-6 gap-2">{AVATARS.map((avatar) => <button key={avatar} type="button" onClick={() => setSelectedAvatar(avatar)} aria-label={`Choose ${avatar}`} className={`h-11 rounded-xl text-xl transition-all ${selectedAvatar === avatar ? 'bg-emerald-400 text-slate-950 scale-105 ring-2 ring-emerald-200' : 'bg-slate-900 border border-slate-800 hover:border-emerald-400/50'}`}>{avatar}</button>)}</div></div>
                <button type="submit" className="w-full py-4 rounded-2xl bg-gradient-to-r from-emerald-400 to-cyan-400 hover:from-emerald-300 hover:to-cyan-300 text-slate-950 font-black text-lg flex items-center justify-center gap-2"><Sparkles className="w-5 h-5" /> Join the earth</button>
              </form>
            )}
          {errorMsg && <div className="p-3 rounded-xl bg-rose-500/20 border border-rose-500/30 text-rose-300 text-xs font-bold text-center">{errorMsg}</div>}
        </div>
      </div>

    </div>
  );
};
