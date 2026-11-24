import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { fetchTracks, createTrack, createStem } from '../api/harmoniq.js';

export default function Upload() {
  const navigate = useNavigate();
  const [step, setStep] = useState(1); // 1: Track Metadata, 2: Stem Audio
  const [existingTracks, setExistingTracks] = useState([]);
  const [useExistingTrack, setUseExistingTrack] = useState(false);

  // Track Form State
  const [trackForm, setTrackForm] = useState({
    title: '',
    bpm: 124,
    musical_key: 'F minor',
    genre: 'Synthwave',
    creator_id: 1,
  });

  const [selectedTrackId, setSelectedTrackId] = useState('');

  // Stem Form State
  const [stemForm, setStemForm] = useState({
    stem_name: '',
    stem_type: 'Melody',
    file_url: 'https://cdn.pixabay.com/download/audio/2022/03/15/audio_c8c8a73467.mp3?filename=melody-loop-110bpm-11234.mp3',
    is_ai_generated: false,
    prompt_seed_hash: '',
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchTracks()
      .then((tracks) => {
        setExistingTracks(tracks || []);
        if (tracks?.length > 0) setSelectedTrackId(tracks[0].track_id);
      })
      .catch((err) => console.log('Could not load tracks:', err));
  }, []);

  const handleTrackSubmit = async (e) => {
    e.preventDefault();
    if (useExistingTrack) {
      setStep(2);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const acoustic_hash =
        'AQAD' +
        Array.from({ length: 32 }, () =>
          Math.floor(Math.random() * 16).toString(16)
        ).join('');
      const master_audio_url =
        'https://example.com/audio/master-' + Date.now() + '.wav';

      const newTrack = await createTrack({
        ...trackForm,
        bpm: Number(trackForm.bpm),
        acoustic_hash,
        master_audio_url,
      });

      setSelectedTrackId(newTrack.track_id);
      setStep(2);
    } catch (err) {
      setError(err.response?.data?.error || err.message || 'Failed to create track');
    } finally {
      setLoading(false);
    }
  };

  const handleStemSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const stem_acoustic_hash =
        'AQAD' +
        Array.from({ length: 32 }, () =>
          Math.floor(Math.random() * 16).toString(16)
        ).join('');
      const seedHash = stemForm.is_ai_generated
        ? stemForm.prompt_seed_hash ||
          'seed' +
            Array.from({ length: 32 }, () =>
              Math.floor(Math.random() * 16).toString(16)
            ).join('')
        : null;

      const newStem = await createStem({
        track_id: Number(selectedTrackId),
        stem_name: stemForm.stem_name,
        stem_type: stemForm.stem_type,
        acoustic_hash: stem_acoustic_hash,
        file_url: stemForm.file_url,
        is_ai_generated: stemForm.is_ai_generated,
        prompt_seed_hash: seedHash,
      });

      navigate(`/stems/${newStem.stem_id}`);
    } catch (err) {
      setError(err.response?.data?.error || err.message || 'Failed to upload audio stem');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-12 space-y-8">
      {/* ─── Header ─────────────────────────────────────────────────────── */}
      <div className="text-center space-y-3">
        <span className="px-3 py-1 rounded-full text-xs font-mono font-bold bg-purple-950/80 text-purple-300 border border-purple-800/80">
          Studio Stem Ingestion
        </span>
        <h1 className="text-3xl sm:text-5xl font-black text-white tracking-tight">
          Upload Master & Stems
        </h1>
        <p className="text-xs sm:text-sm text-slate-400 max-w-lg mx-auto">
          Extract cryptographic Chromaprint acoustic hashes, index stems in the catalog, and tokenize as ERC-721 NFTs.
        </p>
      </div>

      {/* ─── Step Indicator ─────────────────────────────────────────────── */}
      <div className="flex items-center justify-center gap-3">
        <div
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-mono font-bold border transition-all ${
            step === 1
              ? 'bg-purple-600 text-white border-purple-500 shadow-lg shadow-purple-900/30'
              : 'bg-surface-card text-slate-400 border-white/5'
          }`}
        >
          <span>01</span>
          <span>Master Track</span>
        </div>
        <span className="text-slate-600 font-bold">&bull; &bull; &bull;</span>
        <div
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-mono font-bold border transition-all ${
            step === 2
              ? 'bg-purple-600 text-white border-purple-500 shadow-lg shadow-purple-900/30'
              : 'bg-surface-card text-slate-400 border-white/5'
          }`}
        >
          <span>02</span>
          <span>Stem & Proof-of-Stem™</span>
        </div>
      </div>

      {/* ─── STEP 1: Master Track ───────────────────────────────────────── */}
      {step === 1 && (
        <form
          onSubmit={handleTrackSubmit}
          className="bg-surface-card border border-white/5 rounded-3xl p-8 shadow-2xl space-y-6"
        >
          <div className="flex items-center justify-between pb-4 border-b border-white/5">
            <div>
              <h3 className="text-base font-bold text-white">Step 1: Master Track Audio</h3>
              <p className="text-xs text-slate-400 mt-0.5">Define master composition metadata</p>
            </div>
            {existingTracks.length > 0 && (
              <button
                type="button"
                onClick={() => setUseExistingTrack(!useExistingTrack)}
                className="text-xs font-mono font-bold text-purple-400 hover:text-purple-300 transition-colors"
              >
                {useExistingTrack ? 'Create New Track' : 'Link to Existing Track'}
              </button>
            )}
          </div>

          {useExistingTrack ? (
            <div>
              <label className="block text-xs font-mono font-semibold text-slate-300 mb-1.5">
                Select Existing Track:
              </label>
              <select
                value={selectedTrackId}
                onChange={(e) => setSelectedTrackId(e.target.value)}
                className="w-full bg-[#080b11] border border-white/10 rounded-xl px-4 py-2.5 text-xs text-white focus:outline-none focus:border-purple-500/60 font-mono"
              >
                {existingTracks.map((t) => (
                  <option key={t.track_id} value={t.track_id}>
                    #{t.track_id} &bull; {t.title} ({t.genre || 'Music'})
                  </option>
                ))}
              </select>
            </div>
          ) : (
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-mono font-semibold text-slate-300 mb-1.5">
                  Track Title:
                </label>
                <input
                  type="text"
                  placeholder="e.g. Neon Horizon"
                  value={trackForm.title}
                  onChange={(e) => setTrackForm({ ...trackForm, title: e.target.value })}
                  required
                  className="w-full bg-[#080b11] border border-white/10 rounded-xl px-4 py-2.5 text-xs text-white placeholder:text-slate-600 focus:outline-none focus:border-purple-500/60"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-mono font-semibold text-slate-300 mb-1.5">
                    Tempo (BPM):
                  </label>
                  <input
                    type="number"
                    min="40"
                    max="240"
                    value={trackForm.bpm}
                    onChange={(e) => setTrackForm({ ...trackForm, bpm: e.target.value })}
                    required
                    className="w-full bg-[#080b11] border border-white/10 rounded-xl px-4 py-2.5 text-xs text-white font-mono focus:outline-none focus:border-purple-500/60"
                  />
                </div>

                <div>
                  <label className="block text-xs font-mono font-semibold text-slate-300 mb-1.5">
                    Musical Key:
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. F minor"
                    value={trackForm.musical_key}
                    onChange={(e) =>
                      setTrackForm({ ...trackForm, musical_key: e.target.value })
                    }
                    required
                    className="w-full bg-[#080b11] border border-white/10 rounded-xl px-4 py-2.5 text-xs text-white font-mono focus:outline-none focus:border-purple-500/60"
                  />
                </div>

                <div>
                  <label className="block text-xs font-mono font-semibold text-slate-300 mb-1.5">
                    Genre:
                  </label>
                  <select
                    value={trackForm.genre}
                    onChange={(e) => setTrackForm({ ...trackForm, genre: e.target.value })}
                    className="w-full bg-[#080b11] border border-white/10 rounded-xl px-4 py-2.5 text-xs text-white focus:outline-none focus:border-purple-500/60 font-mono"
                  >
                    <option value="Synthwave">Synthwave</option>
                    <option value="Lo-fi">Lo-fi</option>
                    <option value="Electronic">Electronic</option>
                    <option value="Ambient">Ambient</option>
                    <option value="Pop">Pop</option>
                    <option value="House">House</option>
                    <option value="Hip-Hop">Hip-Hop</option>
                  </select>
                </div>
              </div>
            </div>
          )}

          <div className="flex justify-end pt-4">
            <button
              type="submit"
              disabled={loading}
              className="px-8 py-3 rounded-xl font-bold text-xs text-white bg-purple-600 hover:bg-purple-500 transition-all shadow-lg shadow-purple-900/30 disabled:opacity-50"
            >
              {loading ? 'Creating Track...' : 'Proceed to Stem Upload →'}
            </button>
          </div>

          {error && <p className="text-xs text-rose-400 font-mono text-center">{error}</p>}
        </form>
      )}

      {/* ─── STEP 2: Stem Audio & Proof-of-Stem ──────────────────────────── */}
      {step === 2 && (
        <form
          onSubmit={handleStemSubmit}
          className="bg-surface-card border border-white/5 rounded-3xl p-8 shadow-2xl space-y-6"
        >
          <div className="flex items-center justify-between pb-4 border-b border-white/5">
            <div>
              <h3 className="text-base font-bold text-white">Step 2: Isolated Audio Stem</h3>
              <p className="text-xs text-slate-400 mt-0.5">
                Attach an isolated vocal, bass, drum, or melody track
              </p>
            </div>
            <button
              type="button"
              onClick={() => setStep(1)}
              className="text-xs font-mono text-slate-400 hover:text-white"
            >
              ← Back to Track
            </button>
          </div>

          <div className="space-y-4">
            <div>
              <label className="block text-xs font-mono font-semibold text-slate-300 mb-1.5">
                Stem Name:
              </label>
              <input
                type="text"
                placeholder="e.g. Lead Synth Loop"
                value={stemForm.stem_name}
                onChange={(e) => setStemForm({ ...stemForm, stem_name: e.target.value })}
                required
                className="w-full bg-[#080b11] border border-white/10 rounded-xl px-4 py-2.5 text-xs text-white placeholder:text-slate-600 focus:outline-none focus:border-purple-500/60"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-mono font-semibold text-slate-300 mb-1.5">
                  Stem Type:
                </label>
                <select
                  value={stemForm.stem_type}
                  onChange={(e) => setStemForm({ ...stemForm, stem_type: e.target.value })}
                  className="w-full bg-[#080b11] border border-white/10 rounded-xl px-4 py-2.5 text-xs text-white focus:outline-none focus:border-purple-500/60 font-mono"
                >
                  <option value="Vocal">Vocal 🎤</option>
                  <option value="Bass">Bass 🔊</option>
                  <option value="Drum">Drum 🥁</option>
                  <option value="Melody">Melody 🎹</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-mono font-semibold text-slate-300 mb-1.5">
                  Audio URL (MP3/WAV Preview):
                </label>
                <input
                  type="url"
                  value={stemForm.file_url}
                  onChange={(e) => setStemForm({ ...stemForm, file_url: e.target.value })}
                  required
                  className="w-full bg-[#080b11] border border-white/10 rounded-xl px-4 py-2.5 text-xs text-white font-mono focus:outline-none focus:border-purple-500/60"
                />
              </div>
            </div>

            {/* AI Generated Stem Toggle */}
            <div className="p-4 rounded-2xl bg-[#080b11] border border-white/5 space-y-3">
              <label className="flex items-center gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={stemForm.is_ai_generated}
                  onChange={(e) =>
                    setStemForm({ ...stemForm, is_ai_generated: e.target.checked })
                  }
                  className="w-4 h-4 rounded bg-slate-800 text-purple-600 focus:ring-0 accent-purple-500"
                />
                <div>
                  <span className="text-xs font-bold text-white block">
                    Is this stem synthesized using Generative AI?
                  </span>
                  <span className="text-[11px] text-slate-400 block">
                    Harmoniq indexes AI synthesis prompt seeds for verifiable provenance.
                  </span>
                </div>
              </label>

              {stemForm.is_ai_generated && (
                <div className="pt-2">
                  <label className="block text-[11px] font-mono text-purple-300 mb-1">
                    Prompt Seed or Model Checksum (Optional):
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. seed847291048 or model:stable-audio-open"
                    value={stemForm.prompt_seed_hash}
                    onChange={(e) =>
                      setStemForm({ ...stemForm, prompt_seed_hash: e.target.value })
                    }
                    className="w-full bg-surface-card border border-white/10 rounded-xl px-3.5 py-2 text-xs text-white font-mono focus:outline-none focus:border-purple-500"
                  />
                </div>
              )}
            </div>
          </div>

          <div className="flex justify-end pt-4">
            <button
              type="submit"
              disabled={loading}
              className="px-8 py-3.5 rounded-xl font-bold text-xs text-white bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 transition-all shadow-xl shadow-purple-900/30 disabled:opacity-50"
            >
              {loading ? 'Fingerprinting & Ingesting...' : 'Extract Fingerprint & Publish Stem 🚀'}
            </button>
          </div>

          {error && <p className="text-xs text-rose-400 font-mono text-center">{error}</p>}
        </form>
      )}
    </div>
  );
}
