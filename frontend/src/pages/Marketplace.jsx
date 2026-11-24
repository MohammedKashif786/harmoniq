import React, { useEffect, useState } from 'react'
import { fetchStems } from '../api/harmoniq.js'
import StemCard from '../components/StemCard.jsx'

const STEM_TYPES = ['All', 'Vocal', 'Bass', 'Drum', 'Melody']

export default function Marketplace() {
  const [stems, setStems] = useState([])
  const [loading, setLoading] = useState(true)
  const [selectedType, setSelectedType] = useState('All')
  const [filterAi, setFilterAi] = useState('all') // 'all', 'human', 'ai'
  const [searchTerm, setSearchTerm] = useState('')

  useEffect(() => {
    async function loadStems() {
      setLoading(true)
      try {
        const data = await fetchStems()
        setStems(data)
      } catch (err) {
        console.error('Failed to load marketplace stems:', err)
      } finally {
        setLoading(false)
      }
    }
    loadStems()
  }, [])

  const filteredStems = stems.filter((s) => {
    // Type filter
    if (selectedType !== 'All' && s.stem_type !== selectedType) return false

    // AI filter
    if (filterAi === 'human' && s.is_ai_generated) return false
    if (filterAi === 'ai' && !s.is_ai_generated) return false

    // Search term
    if (searchTerm.trim()) {
      const term = searchTerm.toLowerCase()
      const name = (s.stem_name || '').toLowerCase()
      const track = (s.tracks?.title || '').toLowerCase()
      return name.includes(term) || track.includes(term)
    }

    return true
  })

  return (
    <div className="max-w-7xl mx-auto px-6 py-10">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-10 pb-6 border-b border-gray-800">
        <div>
          <h1 className="text-3xl font-extrabold text-white">Stem Marketplace</h1>
          <p className="text-sm text-gray-400 mt-1">
            Browse, preview, and license verified audio stems secured on Sepolia testnet
          </p>
        </div>

        {/* Search Bar */}
        <div className="w-full md:w-72">
          <input
            type="text"
            placeholder="Search stems or tracks..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-gray-900 border border-gray-700/80 rounded-xl px-4 py-2 text-sm text-white placeholder:text-gray-500 focus:outline-none focus:border-purple-500"
          />
        </div>
      </div>

      {/* Filter Toolbar */}
      <div className="flex flex-wrap items-center justify-between gap-4 mb-8">
        {/* Type Filter Buttons */}
        <div className="flex flex-wrap gap-2">
          {STEM_TYPES.map((type) => (
            <button
              key={type}
              onClick={() => setSelectedType(type)}
              className={`px-4 py-1.5 rounded-full text-xs font-semibold transition-all ${
                selectedType === type
                  ? 'bg-purple-600 text-white shadow-md shadow-purple-900/30'
                  : 'bg-gray-900 text-gray-400 hover:text-white border border-gray-800'
              }`}
            >
              {type}
            </button>
          ))}
        </div>

        {/* Human vs AI Origin Toggle */}
        <div className="flex items-center gap-1 bg-gray-900 p-1 rounded-xl border border-gray-800">
          <button
            onClick={() => setFilterAi('all')}
            className={`px-3 py-1 rounded-lg text-xs font-medium transition-all ${
              filterAi === 'all' ? 'bg-purple-600 text-white' : 'text-gray-400 hover:text-white'
            }`}
          >
            All Origins
          </button>
          <button
            onClick={() => setFilterAi('human')}
            className={`px-3 py-1 rounded-lg text-xs font-medium transition-all ${
              filterAi === 'human' ? 'bg-purple-600 text-white' : 'text-gray-400 hover:text-white'
            }`}
          >
            Human
          </button>
          <button
            onClick={() => setFilterAi('ai')}
            className={`px-3 py-1 rounded-lg text-xs font-medium transition-all ${
              filterAi === 'ai' ? 'bg-purple-600 text-white' : 'text-gray-400 hover:text-white'
            }`}
          >
            AI Stems
          </button>
        </div>
      </div>

      {/* Stem Grid */}
      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3, 4, 5, 6].map((n) => (
            <div key={n} className="h-44 rounded-xl bg-gray-900/50 animate-pulse border border-gray-800" />
          ))}
        </div>
      ) : filteredStems.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredStems.map((stem) => (
            <StemCard key={stem.stem_id} stem={stem} />
          ))}
        </div>
      ) : (
        <div className="text-center py-20 bg-gray-900/30 rounded-2xl border border-dashed border-gray-800">
          <p className="text-gray-400 text-sm">No stems match your filter selection.</p>
          <button
            onClick={() => {
              setSelectedType('All')
              setFilterAi('all')
              setSearchTerm('')
            }}
            className="mt-3 text-xs text-purple-400 hover:underline"
          >
            Reset Filters
          </button>
        </div>
      )}
    </div>
  )
}
