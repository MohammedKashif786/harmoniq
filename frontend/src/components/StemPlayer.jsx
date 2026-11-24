import React, { useState, useRef } from 'react'

export default function StemPlayer({ fileUrl, stemName }) {
  const [isPlaying, setIsPlaying] = useState(false)
  const audioRef = useRef(null)

  const togglePlay = () => {
    if (!audioRef.current) return
    if (isPlaying) {
      audioRef.current.pause()
      setIsPlaying(false)
    } else {
      audioRef.current.play().catch((e) => console.log('Audio playback error:', e))
      setIsPlaying(true)
    }
  }

  return (
    <div className="bg-gradient-to-r from-gray-900 via-purple-950/30 to-gray-900 border border-purple-900/30 rounded-2xl p-6 shadow-xl">
      <div className="flex items-center justify-between mb-4">
        <div>
          <span className="text-xs uppercase font-bold text-purple-400 tracking-wider">Audio Stem Preview</span>
          <h4 className="text-xl font-bold text-white mt-0.5">{stemName || 'Stem Audio'}</h4>
        </div>
        <button
          onClick={togglePlay}
          className="w-12 h-12 rounded-full bg-purple-600 hover:bg-purple-500 text-white flex items-center justify-center transition-transform hover:scale-105 shadow-lg shadow-purple-600/30"
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
      </div>

      {/* Stylized Audio Waveform Graphic */}
      <div className="h-16 flex items-center gap-1.5 px-4 py-2 bg-black/40 rounded-xl border border-gray-800/80 mb-4 overflow-hidden">
        {[24, 48, 32, 60, 40, 75, 55, 30, 68, 85, 45, 90, 35, 70, 50, 65, 40, 80, 60, 45, 70, 30, 55, 75, 90, 60, 40, 50, 35, 65, 80, 45, 60, 30, 20].map((h, i) => (
          <div
            key={i}
            className={`flex-1 rounded-full transition-all duration-300 ${
              isPlaying
                ? 'bg-gradient-to-t from-purple-500 to-violet-300 animate-pulse'
                : 'bg-gray-700 hover:bg-purple-500/50'
            }`}
            style={{ height: `${h}%`, animationDelay: `${(i % 5) * 100}ms` }}
          />
        ))}
      </div>

      <audio
        ref={audioRef}
        src={fileUrl}
        onEnded={() => setIsPlaying(false)}
        onPause={() => setIsPlaying(false)}
        onPlay={() => setIsPlaying(true)}
        className="w-full h-10 accent-purple-600 rounded"
        controls
      />
    </div>
  )
}
