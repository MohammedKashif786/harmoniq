import React, { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';

const STEM_THEMES = {
  Vocal: {
    badge: 'bg-rose-500/15 text-rose-300 border-rose-500/30',
    glow: 'from-rose-500/20 to-transparent',
    accent: '#f43f5e',
    icon: '🎤',
  },
  Bass: {
    badge: 'bg-cyan-500/15 text-cyan-300 border-cyan-500/30',
    glow: 'from-cyan-500/20 to-transparent',
    accent: '#06b6d4',
    icon: '🔊',
  },
  Drum: {
    badge: 'bg-amber-500/15 text-amber-300 border-amber-500/30',
    glow: 'from-amber-500/20 to-transparent',
    accent: '#f59e0b',
    icon: '🥁',
  },
  Melody: {
    badge: 'bg-purple-500/15 text-purple-300 border-purple-500/30',
    glow: 'from-purple-500/20 to-transparent',
    accent: '#a855f7',
    icon: '🎹',
  },
};

export default function StemCard({ stem }) {
  const navigate = useNavigate();
  const [isPlaying, setIsPlaying] = useState(false);
  const audioRef = useRef(null);

  const theme = STEM_THEMES[stem.stem_type] || STEM_THEMES.Melody;

  const isMinted =
    (stem.stem_mints && stem.stem_mints.length > 0) ||
    stem.is_minted ||
    Boolean(stem.token_id);

  const tokenId =
    stem.stem_mints?.[0]?.token_id || stem.token_id || stem.stem_id;

  const trackTitle =
    stem.tracks?.title ||
    stem.track_title ||
    (stem.track_id ? `Track #${stem.track_id}` : 'Master Composition');

  const producerName =
    stem.tracks?.producers?.username ||
    stem.producer_name ||
    'Harmoniq Artist';

  const audioUrl =
    stem.file_url ||
    'https://cdn.pixabay.com/download/audio/2022/03/15/audio_c8c8a73467.mp3?filename=melody-loop-110bpm-11234.mp3';

  const togglePlay = (e) => {
    e.stopPropagation();
    if (!audioRef.current) return;
    if (isPlaying) {
      audioRef.current.pause();
      setIsPlaying(false);
    } else {
      audioRef.current.play().catch(() => {});
      setIsPlaying(true);
    }
  };

  return (
    <div
      onClick={() => navigate(`/stems/${stem.stem_id}`)}
      className="group relative bg-[#0e1422] rounded-2xl p-5 border border-white/5 hover:border-purple-500/40 transition-all duration-300 cursor-pointer flex flex-col justify-between overflow-hidden hover:shadow-2xl hover:shadow-purple-900/20 hover:-translate-y-1"
    >
      {/* Ambient background glow top corner */}
      <div
        className={`absolute -top-12 -right-12 w-32 h-32 bg-gradient-to-br ${theme.glow} rounded-full blur-2xl pointer-events-none opacity-60 group-hover:opacity-100 transition-opacity`}
      />

      <audio
        ref={audioRef}
        src={audioUrl}
        onEnded={() => setIsPlaying(false)}
        onPause={() => setIsPlaying(false)}
        onPlay={() => setIsPlaying(true)}
      />

      <div>
        {/* Top Badges Header */}
        <div className="flex items-center justify-between gap-2 mb-4">
          <div className="flex items-center gap-1.5">
            <span
              className={`px-2.5 py-1 rounded-lg text-[11px] font-bold border flex items-center gap-1 ${theme.badge}`}
            >
              <span>{theme.icon}</span>
              <span>{stem.stem_type}</span>
            </span>

            {stem.is_ai_generated && (
              <span className="px-2 py-0.5 rounded-md text-[10px] font-mono font-bold bg-purple-950/80 text-purple-300 border border-purple-800/80 uppercase tracking-wider">
                AI Origin
              </span>
            )}
          </div>

          {/* Mint NFT status */}
          {isMinted ? (
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold bg-emerald-950/70 text-emerald-400 border border-emerald-800/80 flex items-center gap-1.5 shadow-sm">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
              NFT #{tokenId}
            </span>
          ) : (
            <span className="px-2 py-0.5 rounded-full text-[10px] font-mono text-slate-400 bg-white/5 border border-white/5">
              Off-Chain
            </span>
          )}
        </div>

        {/* Stem Name & Track Title */}
        <div className="mb-4">
          <h3 className="text-base font-bold text-white group-hover:text-purple-300 transition-colors line-clamp-1">
            {stem.stem_name}
          </h3>
          <p className="text-slate-400 text-xs mt-0.5 flex items-center gap-1.5 line-clamp-1">
            <span className="text-purple-400 font-medium">{producerName}</span>
            <span className="text-slate-600">&bull;</span>
            <span className="text-slate-400">{trackTitle}</span>
          </p>
        </div>

        {/* Waveform Visualization & Quick Play */}
        <div className="bg-[#080b11] border border-white/5 rounded-xl p-2.5 mb-4 flex items-center gap-3">
          <button
            onClick={togglePlay}
            className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 transition-transform active:scale-95 shadow-md ${
              isPlaying
                ? 'bg-purple-600 text-white shadow-purple-600/30'
                : 'bg-white/10 hover:bg-purple-600 text-slate-200 hover:text-white'
            }`}
            title={isPlaying ? 'Pause preview' : 'Play preview'}
          >
            {isPlaying ? (
              <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24">
                <path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z" />
              </svg>
            ) : (
              <svg className="w-4 h-4 fill-current ml-0.5" viewBox="0 0 24 24">
                <path d="M8 5v14l11-7z" />
              </svg>
            )}
          </button>

          {/* Animated mini equalizer bars */}
          <div className="flex-1 h-6 flex items-center gap-[3px] overflow-hidden">
            {[35, 60, 45, 80, 50, 95, 40, 70, 85, 30, 65, 90, 40, 75, 55, 60, 30, 45, 80, 60].map(
              (height, idx) => (
                <div
                  key={idx}
                  className={`flex-1 rounded-full transition-all duration-300 ${
                    isPlaying
                      ? 'bg-gradient-to-t from-purple-500 to-cyan-300 animate-pulse'
                      : 'bg-slate-700/60'
                  }`}
                  style={{
                    height: isPlaying ? `${Math.max(25, height)}%` : `${height * 0.4}%`,
                    animationDelay: `${(idx % 4) * 120}ms`,
                  }}
                />
              )
            )}
          </div>
        </div>
      </div>

      {/* Card Footer: Metadata & License CTA */}
      <div className="pt-3 border-t border-white/5 flex items-center justify-between gap-2">
        <div className="flex items-center gap-2 text-[11px] font-mono text-slate-400">
          <span>0.015 ETH</span>
          <span className="text-slate-600">&bull;</span>
          <span className="text-emerald-400">Instant</span>
        </div>

        <button
          onClick={(e) => {
            e.stopPropagation();
            navigate(`/stems/${stem.stem_id}`);
          }}
          className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-purple-600/20 text-purple-300 border border-purple-500/30 group-hover:bg-purple-600 group-hover:text-white transition-all flex items-center gap-1"
        >
          <span>License</span>
          <span className="text-[10px]">↗</span>
        </button>
      </div>
    </div>
  );
}
