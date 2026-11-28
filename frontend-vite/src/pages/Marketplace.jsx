import React, { useEffect, useState } from 'react';
import { fetchStems } from '../api/harmoniq.js';
import StemCard from '../components/StemCard.jsx';

const STEM_CATEGORIES = [
  { id: 'All', label: 'All Stems', icon: '🎧' },
  { id: 'Vocal', label: 'Vocals', icon: '🎤' },
  { id: 'Bass', label: 'Basslines', icon: '🔊' },
  { id: 'Drum', label: 'Drum Loops', icon: '🥁' },
  { id: 'Melody', label: 'Melodies & Synths', icon: '🎹' },
];

export default function Marketplace() {
  const [stems, setStems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedType, setSelectedType] = useState('All');
  const [filterAi, setFilterAi] = useState('all'); // 'all', 'human', 'ai'
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    async function loadStems() {
      setLoading(true);
      try {
        const data = await fetchStems();
        setStems(data);
      } catch (err) {
        console.error('Failed to load marketplace stems:', err);
      } finally {
        setLoading(false);
      }
    }
    loadStems();
  }, []);

  const filteredStems = stems.filter((s) => {
    if (selectedType !== 'All' && s.stem_type !== selectedType) return false;
    if (filterAi === 'human' && s.is_ai_generated) return false;
    if (filterAi === 'ai' && !s.is_ai_generated) return false;

    if (searchTerm.trim()) {
      const term = searchTerm.toLowerCase();
      const name = (s.stem_name || '').toLowerCase();
      const track = (s.tracks?.title || '').toLowerCase();
      const producer = (s.tracks?.producers?.username || '').toLowerCase();
      return name.includes(term) || track.includes(term) || producer.includes(term);
    }
    return true;
  });

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
      {/* ─── Header & Search ────────────────────────────────────────────── */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 pb-6 border-b border-white/5">
        <div>
          <span className="text-xs font-mono font-bold text-purple-400 uppercase tracking-widest">
            Stem Catalog
          </span>
          <h1 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight mt-1">
            Browse & License Stems
          </h1>
          <p className="text-sm text-slate-400 mt-1 max-w-xl">
            Isolated instrument tracks protected with Proof-of-Stem™ acoustic fingerprints and ERC-721 smart contracts.
          </p>
        </div>

        {/* Search Input Box */}
        <div className="w-full md:w-80 relative">
          <input
            type="text"
            placeholder="Search stems, tracks, producers..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-surface-card border border-white/10 rounded-xl pl-10 pr-4 py-2.5 text-xs text-white placeholder:text-slate-500 focus:outline-none focus:border-purple-500/60 transition-all font-medium"
          />
          <svg
            className="w-4 h-4 text-slate-500 absolute left-3.5 top-3"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          {searchTerm && (
            <button
              onClick={() => setSearchTerm('')}
              className="absolute right-3 top-2.5 text-xs text-slate-400 hover:text-white"
            >
              ✕
            </button>
          )}
        </div>
      </div>

      {/* ─── Filter Toolbar ─────────────────────────────────────────────── */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        {/* Category Pills */}
        <div className="flex flex-wrap items-center gap-2">
          {STEM_CATEGORIES.map((cat) => (
            <button
              key={cat.id}
              onClick={() => setSelectedType(cat.id)}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-all flex items-center gap-1.5 border ${
                selectedType === cat.id
                  ? 'bg-purple-600/20 text-purple-300 border-purple-500/40 shadow-sm'
                  : 'bg-surface-card text-slate-400 hover:text-white border-white/5 hover:bg-white/5'
              }`}
            >
              <span>{cat.icon}</span>
              <span>{cat.label}</span>
            </button>
          ))}
        </div>

        {/* Human vs AI Origin Toggle */}
        <div className="flex items-center gap-1 bg-surface-card p-1 rounded-xl border border-white/5">
          <button
            onClick={() => setFilterAi('all')}
            className={`px-3 py-1 rounded-lg text-xs font-semibold transition-all ${
              filterAi === 'all'
                ? 'bg-purple-600 text-white shadow-sm'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            All Origins
          </button>
          <button
            onClick={() => setFilterAi('human')}
            className={`px-3 py-1 rounded-lg text-xs font-semibold transition-all ${
              filterAi === 'human'
                ? 'bg-purple-600 text-white shadow-sm'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            Human Only
          </button>
          <button
            onClick={() => setFilterAi('ai')}
            className={`px-3 py-1 rounded-lg text-xs font-semibold transition-all ${
              filterAi === 'ai'
                ? 'bg-purple-600 text-white shadow-sm'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            AI Generated
          </button>
        </div>
      </div>

      {/* ─── Stems Grid ─────────────────────────────────────────────────── */}
      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 py-12">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div
              key={i}
              className="bg-surface-card border border-white/5 rounded-2xl p-6 h-64 animate-pulse flex flex-col justify-between"
            >
              <div className="h-6 w-24 bg-slate-800 rounded-lg" />
              <div className="space-y-2">
                <div className="h-4 w-48 bg-slate-800 rounded" />
                <div className="h-3 w-32 bg-slate-800 rounded" />
              </div>
              <div className="h-10 bg-slate-800 rounded-xl" />
            </div>
          ))}
        </div>
      ) : filteredStems.length === 0 ? (
        <div className="text-center py-24 bg-surface-card border border-white/5 rounded-3xl space-y-4">
          <div className="text-4xl">🔍</div>
          <h3 className="text-lg font-bold text-white">No Stems Found</h3>
          <p className="text-xs text-slate-400 max-w-sm mx-auto">
            No audio stems matched your active filter criteria. Try resetting your search filters.
          </p>
          <button
            onClick={() => {
              setSelectedType('All');
              setFilterAi('all');
              setSearchTerm('');
            }}
            className="px-4 py-2 rounded-xl text-xs font-bold text-white bg-purple-600 hover:bg-purple-500 transition-all"
          >
            Reset Filters
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredStems.map((stem) => (
            <StemCard key={stem.stem_id} stem={stem} />
          ))}
        </div>
      )}
    </div>
  );
}
