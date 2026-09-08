import React, { useState } from 'react';
import { Volume2, VolumeX } from 'lucide-react';
import { soundFx } from '../../lib/sound';

export const SoundToggle: React.FC = () => {
  const [muted, setMuted] = useState(soundFx.isMuted());

  const handleToggle = () => {
    const isNowMuted = soundFx.toggleMute();
    setMuted(isNowMuted);
  };

  return (
    <button
      onClick={handleToggle}
      className={`p-2.5 rounded-xl font-medium transition-all duration-200 flex items-center gap-2 border shadow-sm ${
        muted
          ? 'bg-slate-800/80 text-slate-400 border-slate-700 hover:text-white'
          : 'bg-indigo-600/20 text-indigo-400 border-indigo-500/30 hover:bg-indigo-600/30'
      }`}
      title={muted ? 'Unmute game sounds' : 'Mute game sounds'}
    >
      {muted ? <VolumeX className="w-5 h-5" /> : <Volume2 className="w-5 h-5 text-indigo-400 animate-pulse" />}
      <span className="text-xs hidden md:inline">{muted ? 'Muted' : 'Sound On'}</span>
    </button>
  );
};
