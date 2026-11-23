import React from 'react'
import { useNavigate } from 'react-router-dom'

const STEM_TYPE_COLORS = {
  Vocal: 'bg-pink-900/40 text-pink-400 border border-pink-700/50',
  Bass: 'bg-blue-900/40 text-blue-400 border border-blue-700/50',
  Drum: 'bg-amber-900/40 text-amber-400 border border-amber-700/50',
  Melody: 'bg-emerald-900/40 text-emerald-400 border border-emerald-700/50',
}

export default function StemCard({ stem }) {
  const navigate = useNavigate()

  const isMinted =
    (stem.stem_mints && stem.stem_mints.length > 0) ||
    stem.is_minted ||
    Boolean(stem.token_id)

  const trackTitle =
    stem.tracks?.title ||
    stem.track_title ||
    (stem.track_id ? `Track #${stem.track_id}` : 'Single')

  const typeStyle = STEM_TYPE_COLORS[stem.stem_type] || 'bg-purple-900/40 text-purple-400 border border-purple-700/50'

  return (
    <div
      onClick={() => navigate(`/stems/${stem.stem_id}`)}
      className="bg-gray-900/80 backdrop-blur-sm rounded-xl p-5 border border-gray-800 hover:border-purple-500/60 transition-all duration-200 cursor-pointer flex flex-col justify-between group shadow-lg hover:shadow-purple-900/10"
    >
      <div>
        <div className="flex items-center justify-between mb-3">
          <span className={`px-2.5 py-1 rounded-full text-xs font-semibold ${typeStyle}`}>
            {stem.stem_type}
          </span>
          <div className="flex items-center gap-2">
            {stem.is_ai_generated && (
              <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-purple-950 text-purple-300 border border-purple-800/60 uppercase tracking-wider">
                AI Stem
              </span>
            )}
            {isMinted ? (
              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-green-950 text-green-400 border border-green-800 flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-green-400"></span>
                NFT
              </span>
            ) : (
              <span className="px-2 py-0.5 rounded-full text-[10px] text-gray-400 bg-gray-800">
                Unminted
              </span>
            )}
          </div>
        </div>

        <h3 className="text-lg font-bold text-white group-hover:text-purple-400 transition-colors line-clamp-1">
          {stem.stem_name}
        </h3>
        <p className="text-gray-400 text-sm mt-1 mb-4 flex items-center gap-1">
          <svg className="w-3.5 h-3.5 text-gray-500" fill="currentColor" viewBox="0 0 20 20">
            <path d="M18 3a1 1 0 00-1.196-.98l-10 2A1 1 0 006 5v9.114A4.369 4.369 0 005 14c-1.657 0-3 .895-3 2s1.343 2 3 2 3-.895 3-2V7.82l8-1.6v5.894A4.37 4.37 0 0015 12c-1.657 0-3 .895-3 2s1.343 2 3 2 3-.895 3-2V3z"/>
          </svg>
          {trackTitle}
        </p>
      </div>

      <div className="pt-3 border-t border-gray-800/80 flex items-center justify-between">
        <span className="text-xs text-gray-500 font-mono">
          ID: #{stem.stem_id}
        </span>
        <button
          onClick={(e) => {
            e.stopPropagation()
            navigate(`/stems/${stem.stem_id}`)
          }}
          className="px-3 py-1 text-xs rounded-lg bg-purple-600/20 text-purple-300 group-hover:bg-purple-600 group-hover:text-white transition-all font-medium flex items-center gap-1"
        >
          View & License →
        </button>
      </div>
    </div>
  )
}
