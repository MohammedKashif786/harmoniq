import React, { useState, useRef, useEffect } from 'react';

export default function StemPlayer({ fileUrl, stemName, stemType = 'Audio' }) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(0.85);
  const [isLooping, setIsLooping] = useState(true);
  const audioRef = useRef(null);

  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.volume = volume;
      audioRef.current.loop = isLooping;
    }
  }, [volume, isLooping]);

  const togglePlay = () => {
    if (!audioRef.current) return;
    if (isPlaying) {
      audioRef.current.pause();
      setIsPlaying(false);
    } else {
      audioRef.current.play().catch(() => {});
      setIsPlaying(true);
    }
  };

  const handleTimeUpdate = () => {
    if (audioRef.current) {
      setCurrentTime(audioRef.current.currentTime);
    }
  };

  const handleLoadedMetadata = () => {
    if (audioRef.current) {
      setDuration(audioRef.current.duration || 30);
    }
  };

  const handleSeek = (e) => {
    const time = parseFloat(e.target.value);
    setCurrentTime(time);
    if (audioRef.current) {
      audioRef.current.currentTime = time;
    }
  };

  const formatTime = (secs) => {
    if (isNaN(secs)) return '0:00';
    const m = Math.floor(secs / 60);
    const s = Math.floor(secs % 60);
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  };

  return (
    <div className="relative overflow-hidden bg-gradient-to-br from-[#0e1422] via-[#11192e] to-[#0e1422] border border-white/10 rounded-2xl p-6 shadow-2xl">
      {/* Background ambient lighting */}
      <div className="absolute top-0 right-0 w-80 h-80 bg-purple-600/10 rounded-full blur-3xl pointer-events-none" />

      <audio
        ref={audioRef}
        src={fileUrl}
        onTimeUpdate={handleTimeUpdate}
        onLoadedMetadata={handleLoadedMetadata}
        onEnded={() => {
          if (!isLooping) setIsPlaying(false);
        }}
        onPlay={() => setIsPlaying(true)}
        onPause={() => setIsPlaying(false)}
      />

      {/* Header Info */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-[10px] font-mono uppercase tracking-widest font-bold px-2 py-0.5 rounded bg-purple-500/15 text-purple-300 border border-purple-500/30">
              Studio Stem Engine
            </span>
            <span className="text-xs text-slate-400 font-mono font-medium">
              44.1 kHz &bull; 24-bit PCM
            </span>
          </div>
          <h4 className="text-2xl font-black text-white tracking-tight">
            {stemName || 'Stem Audio Preview'}
          </h4>
        </div>

        {/* Action badges: Loop and Download */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => setIsLooping(!isLooping)}
            className={`px-3 py-1.5 rounded-lg text-xs font-mono font-semibold transition-all border ${
              isLooping
                ? 'bg-purple-600/20 text-purple-300 border-purple-500/40 shadow-sm'
                : 'bg-white/5 text-slate-400 border-white/5 hover:text-white'
            }`}
            title="Toggle Seamless Loop"
          >
            🔁 {isLooping ? 'Loop: ON' : 'Loop: OFF'}
          </button>
        </div>
      </div>

      {/* Interactive Waveform Visualizer */}
      <div className="bg-[#080b11] border border-white/5 rounded-xl p-4 mb-4">
        <div className="h-20 flex items-center gap-1 overflow-hidden px-1">
          {[20, 45, 30, 65, 40, 85, 55, 75, 40, 95, 35, 70, 50, 60, 30, 80, 55, 40, 65, 80, 90, 45, 60, 30, 75, 50, 85, 40, 65, 35, 90, 55, 40, 70, 45, 80, 30, 60, 40, 25].map(
            (height, i) => {
              const progress = duration > 0 ? currentTime / duration : 0;
              const barProgress = i / 40;
              const isPast = barProgress <= progress;

              return (
                <div
                  key={i}
                  className={`flex-1 rounded-full transition-all duration-150 ${
                    isPast
                      ? 'bg-gradient-to-t from-purple-500 via-indigo-400 to-cyan-300'
                      : 'bg-slate-700/50 hover:bg-slate-600'
                  } ${isPlaying && isPast ? 'animate-pulse' : ''}`}
                  style={{
                    height: isPlaying
                      ? `${Math.max(15, (height * (0.8 + Math.sin((i + currentTime * 5)) * 0.2)))}%`
                      : `${height}%`,
                  }}
                />
              );
            }
          )}
        </div>

        {/* Scrubber Range Slider */}
        <div className="mt-2 flex items-center gap-3">
          <span className="text-xs font-mono text-slate-400 w-10 text-right">
            {formatTime(currentTime)}
          </span>
          <input
            type="range"
            min="0"
            max={duration || 30}
            step="0.05"
            value={currentTime}
            onChange={handleSeek}
            className="flex-1 h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-purple-500"
          />
          <span className="text-xs font-mono text-slate-400 w-10">
            {formatTime(duration)}
          </span>
        </div>
      </div>

      {/* Audio Controls Bar */}
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          {/* Main Play / Pause Button */}
          <button
            onClick={togglePlay}
            className="w-12 h-12 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white flex items-center justify-center transition-all shadow-lg shadow-purple-600/30 active:scale-95"
            title={isPlaying ? 'Pause' : 'Play'}
          >
            {isPlaying ? (
              <svg className="w-5 h-5 fill-current" viewBox="0 0 24 24">
                <path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z" />
              </svg>
            ) : (
              <svg className="w-5 h-5 fill-current ml-0.5" viewBox="0 0 24 24">
                <path d="M8 5v14l11-7z" />
              </svg>
            )}
          </button>

          <div className="flex flex-col">
            <span className="text-xs font-bold text-white">
              {isPlaying ? 'Playing Preview' : 'Paused'}
            </span>
            <span className="text-[11px] text-slate-400 font-mono">
              Stem Type: {stemType}
            </span>
          </div>
        </div>

        {/* Volume Slider */}
        <div className="hidden sm:flex items-center gap-2 bg-[#080b11] border border-white/5 rounded-xl px-3 py-2">
          <span className="text-xs text-slate-400">
            {volume === 0 ? '🔇' : volume < 0.5 ? '🔉' : '🔊'}
          </span>
          <input
            type="range"
            min="0"
            max="1"
            step="0.05"
            value={volume}
            onChange={(e) => setVolume(parseFloat(e.target.value))}
            className="w-20 h-1 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-purple-500"
            title="Volume"
          />
        </div>
      </div>
    </div>
  );
}
