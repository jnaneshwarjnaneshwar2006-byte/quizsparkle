import React, { useState } from 'react';
import type { Quiz } from '../../types/quiz';
import { Check, Copy, ExternalLink, QrCode, X } from 'lucide-react';

interface ShareQuizModalProps {
  quiz: Quiz;
  onClose: () => void;
}

export const ShareQuizModal: React.FC<ShareQuizModalProps> = ({ quiz, onClose }) => {
  const [copied, setCopied] = useState<'url' | 'code' | null>(null);
  const joinUrl = `${window.location.origin}${window.location.pathname}?quiz=${encodeURIComponent(quiz.code)}`;
  const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=320x320&margin=12&data=${encodeURIComponent(joinUrl)}`;

  const copy = async (value: string, kind: 'url' | 'code') => {
    await navigator.clipboard.writeText(value);
    setCopied(kind);
    window.setTimeout(() => setCopied(null), 1800);
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4" role="dialog" aria-modal="true" aria-label="Share quiz">
      <div className="w-full max-w-lg bg-slate-900 border border-emerald-400/30 rounded-3xl shadow-2xl overflow-hidden">
        <div className="flex items-center justify-between px-6 py-5 border-b border-slate-800">
          <div><p className="text-xs font-black uppercase tracking-widest text-emerald-300">Ready to launch</p><h2 className="text-xl font-black text-white">Share {quiz.title || 'your quiz'}</h2></div>
          <button onClick={onClose} className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800" title="Close share dialog"><X className="w-5 h-5" /></button>
        </div>
        <div className="p-6 space-y-5">
          <div className="flex flex-col sm:flex-row gap-5 items-center">
            <div className="bg-white p-3 rounded-2xl shrink-0"><img src={qrUrl} alt={`QR code to join ${quiz.title}`} className="w-40 h-40" /></div>
            <div className="space-y-3 w-full text-center sm:text-left"><div><p className="text-xs text-slate-400 uppercase font-black tracking-wider">Quiz code</p><p className="text-4xl font-mono font-black text-amber-300 tracking-widest">{quiz.code}</p></div><p className="text-sm text-slate-300">Students scan the QR code or open the join link, then enter their name and emoji.</p></div>
          </div>
          <div className="flex gap-2"><input readOnly value={joinUrl} className="min-w-0 flex-1 px-3 py-3 rounded-xl bg-slate-950 border border-slate-700 text-xs text-slate-300" /><button onClick={() => copy(joinUrl, 'url')} className="px-3 rounded-xl bg-emerald-400 text-slate-950 font-black text-xs flex items-center gap-1" title="Copy join URL">{copied === 'url' ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />} URL</button></div>
          <div className="grid grid-cols-2 gap-3"><button onClick={() => copy(quiz.code, 'code')} className="py-3 rounded-xl border border-slate-700 bg-slate-950 text-slate-200 font-bold text-sm flex items-center justify-center gap-2"><Copy className="w-4 h-4" /> {copied === 'code' ? 'Copied' : 'Copy code'}</button><a href={joinUrl} target="_blank" rel="noreferrer" className="py-3 rounded-xl bg-cyan-400 text-slate-950 font-black text-sm flex items-center justify-center gap-2"><ExternalLink className="w-4 h-4" /> Open join page</a></div>
          <div className="flex items-center justify-center gap-2 text-xs text-slate-500"><QrCode className="w-4 h-4" /> QR opens this quiz directly</div>
        </div>
      </div>
    </div>
  );
};
