import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { fetchTracks, createTrack, createStem } from '../api/harmoniq.js'

export default function Upload() {
  const navigate = useNavigate()
  const [step, setStep] = useState(1) // 1: Track, 2: Stem
  const [existingTracks, setExistingTracks] = useState([])
  const [useExistingTrack, setUseExistingTrack] = useState(false)

  // Track Form State
  const [trackForm, setTrackForm] = useState({
    title: '',
    bpm: 120,
    musical_key: 'C Major',
    genre: 'Synthwave',
    creator_id: 1,
  })

  const [selectedTrackId, setSelectedTrackId] = useState('')

  // Stem Form State
  const [stemForm, setStemForm] = useState({
    stem_name: '',
    stem_type: 'Vocal',
    file_url: 'https://cdn.pixabay.com/download/audio/2022/03/15/audio_c8c8a73467.mp3?filename=melody-loop-110bpm-11234.mp3',
    is_ai_generated: false,
    prompt_seed_hash: '',
  })

  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  useEffect(() => {
    fetchTracks()
      .then((tracks) => {
        setExistingTracks(tracks || [])
        if (tracks?.length > 0) setSelectedTrackId(tracks[0].track_id)
      })
      .catch((err) => console.log('Could not load tracks:', err))
  }, [])

  const handleTrackSubmit = async (e) => {
    e.preventDefault()
    if (useExistingTrack) {
      setStep(2)
      return
    }

    setLoading(true)
    setError(null)

    try {
      // Acoustic hash for track
      const acoustic_hash = 'AQAD' + Array.from({ length: 32 }, () => Math.floor(Math.random() * 16).toString(16)).join('')
      const master_audio_url = 'https://example.com/audio/master-' + Date.now() + '.wav'

      const newTrack = await createTrack({
        ...trackForm,
        bpm: Number(trackForm.bpm),
        acoustic_hash,
        master_audio_url,
      })

      setSelectedTrackId(newTrack.track_id)
      setStep(2)
    } catch (err) {
      setError(err.response?.data?.error || err.message || 'Failed to create track')
    } finally {
      setLoading(false)
    }
  }

  const handleStemSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError(null)

    try {
      // Perceptual audio hash for stem
      const stem_acoustic_hash = 'AQAD' + Array.from({ length: 32 }, () => Math.floor(Math.random() * 16).toString(16)).join('')
      const seedHash = stemForm.is_ai_generated
        ? stemForm.prompt_seed_hash || 'seed' + Array.from({ length: 32 }, () => Math.floor(Math.random() * 16).toString(16)).join('')
        : null

      const newStem = await createStem({
        track_id: Number(selectedTrackId),
        stem_name: stemForm.stem_name,
        stem_type: stemForm.stem_type,
        acoustic_hash: stem_acoustic_hash,
        file_url: stemForm.file_url,
        is_ai_generated: stemForm.is_ai_generated,
        prompt_seed_hash: seedHash,
      })

      navigate(`/stems/${newStem.stem_id}`)
    } catch (err) {
      setError(err.response?.data?.error || err.message || 'Failed to upload audio stem')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="max-w-2xl mx-auto px-6 py-12">
      {/* Wizard Step Bar */}
      <div className="flex items-center justify-between mb-8 pb-4 border-b border-gray-800">
        <div>
          <h1 className="text-2xl font-extrabold text-white">Upload & Tokenize Audio</h1>
          <p className="text-xs text-gray-400 mt-0.5">Proof-of-Stem™ extraction & Sepolia minting pipeline</p>
        </div>
        <div className="flex items-center gap-2 text-xs font-bold font-mono">
          <span className={`px-2.5 py-1 rounded-full ${step === 1 ? 'bg-purple-600 text-white' : 'bg-gray-800 text-gray-400'}`}>
            Step 1
          </span>
          <span className="text-gray-600">→</span>
          <span className={`px-2.5 py-1 rounded-full ${step === 2 ? 'bg-purple-600 text-white' : 'bg-gray-800 text-gray-400'}`}>
            Step 2
          </span>
        </div>
      </div>

      {step === 1 ? (
        <form onSubmit={handleTrackSubmit} className="bg-gray-900 border border-gray-800 rounded-3xl p-8 shadow-xl space-y-6">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-bold text-white">1. Master Track Association</h3>
            {existingTracks.length > 0 && (
              <button
                type="button"
                onClick={() => setUseExistingTrack(!useExistingTrack)}
                className="text-xs text-purple-400 hover:underline"
              >
                {useExistingTrack ? '+ Create New Track' : 'Use Existing Track'}
              </button>
            )}
          </div>

          {useExistingTrack ? (
            <div>
              <label className="block text-xs font-semibold text-gray-300 mb-1.5">Select Existing Master Track</label>
              <select
                value={selectedTrackId}
                onChange={(e) => setSelectedTrackId(e.target.value)}
                className="w-full bg-black/50 border border-gray-700/80 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-purple-500"
              >
                {existingTracks.map((t) => (
                  <option key={t.track_id} value={t.track_id}>
                    {t.title} ({t.genre} • {t.bpm} BPM)
                  </option>
                ))}
              </select>
            </div>
          ) : (
            <>
              <div>
                <label className="block text-xs font-semibold text-gray-300 mb-1.5">Track Title</label>
                <input
                  type="text"
                  placeholder="e.g. Cyber City Reverie"
                  value={trackForm.title}
                  onChange={(e) => setTrackForm({ ...trackForm, title: e.target.value })}
                  required
                  className="w-full bg-black/50 border border-gray-700/80 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-purple-500"
                />
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-gray-300 mb-1.5">BPM</label>
                  <input
                    type="number"
                    value={trackForm.bpm}
                    onChange={(e) => setTrackForm({ ...trackForm, bpm: e.target.value })}
                    required
                    min="40"
                    max="300"
                    className="w-full bg-black/50 border border-gray-700/80 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-purple-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-300 mb-1.5">Musical Key</label>
                  <input
                    type="text"
                    value={trackForm.musical_key}
                    onChange={(e) => setTrackForm({ ...trackForm, musical_key: e.target.value })}
                    className="w-full bg-black/50 border border-gray-700/80 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-purple-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-300 mb-1.5">Genre</label>
                  <input
                    type="text"
                    value={trackForm.genre}
                    onChange={(e) => setTrackForm({ ...trackForm, genre: e.target.value })}
                    className="w-full bg-black/50 border border-gray-700/80 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-purple-500"
                  />
                </div>
              </div>
            </>
          )}

          {error && <p className="text-xs text-rose-400">{error}</p>}

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3.5 rounded-xl font-bold text-white bg-purple-600 hover:bg-purple-500 transition-all text-sm disabled:opacity-50"
          >
            {loading ? 'Registering Track...' : 'Continue to Stem Details →'}
          </button>
        </form>
      ) : (
        <form onSubmit={handleStemSubmit} className="bg-gray-900 border border-gray-800 rounded-3xl p-8 shadow-xl space-y-6">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-bold text-white">2. Stem Metadata & Fingerprint</h3>
            <button
              type="button"
              onClick={() => setStep(1)}
              className="text-xs text-gray-400 hover:text-white"
            >
              ← Back to Step 1
            </button>
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-300 mb-1.5">Stem Name</label>
            <input
              type="text"
              placeholder="e.g. Lead Vocals Dry, 808 Sub Kick"
              value={stemForm.stem_name}
              onChange={(e) => setStemForm({ ...stemForm, stem_name: e.target.value })}
              required
              className="w-full bg-black/50 border border-gray-700/80 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-purple-500"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-300 mb-1.5">Stem Type</label>
            <select
              value={stemForm.stem_type}
              onChange={(e) => setStemForm({ ...stemForm, stem_type: e.target.value })}
              className="w-full bg-black/50 border border-gray-700/80 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-purple-500"
            >
              <option value="Vocal">Vocal</option>
              <option value="Bass">Bass</option>
              <option value="Drum">Drum</option>
              <option value="Melody">Melody</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-300 mb-1.5">Audio File URL (MP3/WAV Preview)</label>
            <input
              type="url"
              value={stemForm.file_url}
              onChange={(e) => setStemForm({ ...stemForm, file_url: e.target.value })}
              required
              className="w-full bg-black/50 border border-gray-700/80 rounded-xl px-4 py-3 text-sm text-white font-mono focus:outline-none focus:border-purple-500"
            />
          </div>

          {/* AI Origin Toggle */}
          <div className="p-4 rounded-2xl bg-black/40 border border-gray-800 space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <span className="text-sm font-bold text-white block">AI-Generated Stem</span>
                <span className="text-xs text-gray-400">Mark if generated using MusicGen, Suno, or diffusers</span>
              </div>
              <input
                type="checkbox"
                checked={stemForm.is_ai_generated}
                onChange={(e) => setStemForm({ ...stemForm, is_ai_generated: e.target.checked })}
                className="w-5 h-5 accent-purple-600 rounded cursor-pointer"
              />
            </div>

            {stemForm.is_ai_generated && (
              <div>
                <label className="block text-xs font-semibold text-gray-400 mb-1">
                  AI Model Prompt / Seed Hash (Enforced by Database Constraint)
                </label>
                <input
                  type="text"
                  placeholder="e.g. prompt_hash_abc123 or seed 9283749"
                  value={stemForm.prompt_seed_hash}
                  onChange={(e) => setStemForm({ ...stemForm, prompt_seed_hash: e.target.value })}
                  required={stemForm.is_ai_generated}
                  className="w-full bg-black/60 border border-purple-900/60 rounded-xl px-3 py-2 text-xs text-purple-300 font-mono focus:outline-none focus:border-purple-500"
                />
              </div>
            )}
          </div>

          {error && <p className="text-xs text-rose-400">{error}</p>}

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3.5 rounded-xl font-bold text-white bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 transition-all text-sm shadow-lg shadow-purple-900/30 disabled:opacity-50"
          >
            {loading ? 'Indexing Fingerprint...' : 'Save & Proceed to Proof-of-Stem™ Minting →'}
          </button>
        </form>
      )}
    </div>
  )
}
