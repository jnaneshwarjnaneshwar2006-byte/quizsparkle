import React, { useState, useRef } from 'react';
import { Play, Pause, Volume2, VolumeX, Image as ImageIcon, Music, Film } from 'lucide-react';

interface MediaPreviewProps {
  mediaUrl?: string;
  mediaType?: 'image' | 'audio' | 'video' | 'none';
  className?: string;
  autoPlayAudio?: boolean;
}

export const MediaPreview: React.FC<MediaPreviewProps> = ({
  mediaUrl,
  mediaType = 'none',
  className = '',
  autoPlayAudio = false
}) => {
  const [isPlayingAudio, setIsPlayingAudio] = useState(autoPlayAudio);
  const [isMuted, setIsMuted] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  if (!mediaUrl || mediaType === 'none') {
    return null;
  }

  // --- IMAGE PREVIEW ---
  if (mediaType === 'image') {
    return (
      <div className={`relative overflow-hidden rounded-2xl border border-slate-700 bg-slate-900/50 shadow-xl group ${className}`}>
        <img
          src={mediaUrl}
          alt="Question Media"
          className="w-full max-h-[300px] object-cover object-center group-hover:scale-105 transition-transform duration-500"
          onError={(e) => {
            // Fallback placeholder image
            (e.target as HTMLImageElement).src = 'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?auto=format&fit=crop&w=800&q=80';
          }}
        />
        <div className="absolute top-2 right-2 px-2.5 py-1 rounded-full bg-slate-900/80 backdrop-blur-sm text-xs font-semibold text-cyan-300 flex items-center gap-1.5 border border-slate-700">
          <ImageIcon className="w-3.5 h-3.5" />
          Image
        </div>
      </div>
    );
  }

  // --- AUDIO PREVIEW ---
  if (mediaType === 'audio') {
    const toggleAudioPlay = () => {
      if (audioRef.current) {
        if (isPlayingAudio) {
          audioRef.current.pause();
          setIsPlayingAudio(false);
        } else {
          audioRef.current.play().then(() => setIsPlayingAudio(true)).catch(console.error);
        }
      }
    };

    return (
      <div className={`p-4 rounded-2xl border border-purple-500/30 bg-gradient-to-r from-purple-950/60 via-slate-900 to-indigo-950/60 backdrop-blur-md shadow-xl ${className}`}>
        <audio
          ref={audioRef}
          src={mediaUrl}
          onEnded={() => setIsPlayingAudio(false)}
          autoPlay={autoPlayAudio}
          muted={isMuted}
        />
        <div className="flex items-center gap-4">
          <button
            onClick={toggleAudioPlay}
            className="w-14 h-14 rounded-full bg-gradient-to-r from-purple-500 to-indigo-500 hover:from-purple-400 hover:to-indigo-400 text-white flex items-center justify-center shadow-lg shadow-purple-500/40 transform active:scale-95 transition-all"
            type="button"
          >
            {isPlayingAudio ? <Pause className="w-6 h-6" /> : <Play className="w-6 h-6 ml-0.5" />}
          </button>
          <div className="flex-1">
            <div className="flex items-center justify-between mb-1">
              <span className="text-xs font-bold uppercase tracking-wider text-purple-300 flex items-center gap-1.5">
                <Music className="w-3.5 h-3.5" /> Audio Clip
              </span>
              <button
                onClick={() => setIsMuted(!isMuted)}
                className="text-slate-400 hover:text-white transition-colors"
                type="button"
              >
                {isMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4 text-purple-400" />}
              </button>
            </div>
            
            {/* Animated Equalizer Waveform Simulation */}
            <div className="h-6 flex items-center gap-1">
              {[40, 70, 30, 90, 50, 80, 40, 100, 60, 30, 85, 45, 95, 60, 40].map((height, i) => (
                <div
                  key={i}
                  className={`flex-1 rounded-full transition-all duration-300 ${
                    isPlayingAudio
                      ? 'bg-purple-400 animate-pulse'
                      : 'bg-slate-700'
                  }`}
                  style={{
                    height: isPlayingAudio ? `${Math.max(20, (height * Math.random()) % 100)}%` : `${height / 3}%`
                  }}
                />
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  // --- VIDEO PREVIEW ---
  if (mediaType === 'video') {
    return (
      <div className={`relative overflow-hidden rounded-2xl border border-indigo-500/30 bg-slate-950 shadow-xl ${className}`}>
        <video
          src={mediaUrl}
          controls
          className="w-full max-h-[320px] rounded-xl object-contain bg-black"
          playsInline
        >
          Your browser does not support the video tag.
        </video>
        <div className="absolute top-2 right-2 px-2.5 py-1 rounded-full bg-slate-900/80 backdrop-blur-sm text-xs font-semibold text-indigo-300 flex items-center gap-1.5 border border-slate-700 pointer-events-none">
          <Film className="w-3.5 h-3.5" />
          Video
        </div>
      </div>
    );
  }

  return null;
};
