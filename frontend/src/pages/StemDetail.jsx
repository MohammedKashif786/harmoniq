import React, { useEffect, useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import { fetchStem, fetchStemReviews } from '../api/harmoniq.js'
import StemPlayer from '../components/StemPlayer.jsx'
import MintButton from '../components/MintButton.jsx'
import LicenseButton from '../components/LicenseButton.jsx'
import ReviewForm from '../components/ReviewForm.jsx'

export default function StemDetail() {
  const { id } = useParams()
  const [stem, setStem] = useState(null)
  const [reviews, setReviews] = useState([])
  const [loading, setLoading] = useState(true)

  const loadStemData = async () => {
    try {
      const [stemData, revs] = await Promise.all([
        fetchStem(id),
        fetchStemReviews(id),
      ])
      setStem(stemData)
      setReviews(revs || [])
    } catch (err) {
      console.error('Failed to load stem details:', err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadStemData()
  }, [id])

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto px-6 py-20 text-center">
        <div className="animate-spin h-8 w-8 border-4 border-purple-500 border-t-transparent rounded-full mx-auto mb-4" />
        <p className="text-gray-400 text-sm">Loading stem provenance and on-chain records...</p>
      </div>
    )
  }

  if (!stem) {
    return (
      <div className="max-w-4xl mx-auto px-6 py-20 text-center">
        <h2 className="text-2xl font-bold text-white mb-2">Stem Not Found</h2>
        <Link to="/marketplace" className="text-purple-400 hover:underline text-sm">
          Return to Marketplace
        </Link>
      </div>
    )
  }

  const mintRecord = stem.stem_mints?.[0] || null
  const isMinted = Boolean(mintRecord)
  const tokenId = mintRecord?.token_id || stem.token_id || 1

  return (
    <div className="max-w-5xl mx-auto px-6 py-10 space-y-10">
      {/* Back link */}
      <Link to="/marketplace" className="text-xs text-gray-400 hover:text-white flex items-center gap-1">
        ← Back to Marketplace
      </Link>

      {/* Header Info */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 pb-6 border-b border-gray-800">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <span className="px-3 py-1 rounded-full text-xs font-bold bg-purple-900/40 text-purple-400 border border-purple-700/50">
              {stem.stem_type} Stem
            </span>
            {stem.is_ai_generated && (
              <span className="px-2.5 py-0.5 rounded text-[10px] font-bold bg-indigo-950 text-indigo-300 border border-indigo-800 uppercase">
                AI Generated
              </span>
            )}
          </div>
          <h1 className="text-3xl sm:text-4xl font-extrabold text-white">{stem.stem_name}</h1>
          <p className="text-gray-400 text-sm mt-1">
            Track:{' '}
            <Link to={`/tracks/${stem.track_id}`} className="text-purple-400 hover:underline font-semibold">
              {stem.tracks?.title || `Track #${stem.track_id}`}
            </Link>{' '}
            • Creator: <span className="text-gray-300">{stem.tracks?.producers?.username || 'Producer'}</span>
          </p>
        </div>

        <div className="w-full md:w-64">
          <MintButton
            stemId={stem.stem_id}
            isMinted={isMinted}
            mintData={mintRecord}
            onMinted={() => loadStemData()}
          />
        </div>
      </div>

      {/* Audio Player */}
      <StemPlayer fileUrl={stem.file_url} stemName={stem.stem_name} />

      {/* Provenance & Proof-of-Stem Verification Card */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-gray-900 border border-gray-800 rounded-2xl p-6 shadow-lg">
          <h3 className="text-sm uppercase font-bold text-gray-400 tracking-wider mb-4 flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-purple-400" />
            Proof-of-Stem™ Cryptographic Hashes
          </h3>
          <div className="space-y-3 font-mono text-xs">
            <div>
              <span className="text-gray-500 block text-[11px] mb-0.5">Acoustic Chromaprint Hash:</span>
              <span className="bg-black/60 px-2 py-1 rounded text-purple-300 block truncate">
                {stem.acoustic_hash}
              </span>
            </div>
            {stem.prompt_seed_hash && (
              <div>
                <span className="text-gray-500 block text-[11px] mb-0.5">AI Synthesis Prompt Seed Hash:</span>
                <span className="bg-black/60 px-2 py-1 rounded text-indigo-300 block truncate">
                  {stem.prompt_seed_hash}
                </span>
              </div>
            )}
            <div>
              <span className="text-gray-500 block text-[11px] mb-0.5">Stem Audio URL:</span>
              <a href={stem.file_url} target="_blank" rel="noreferrer" className="text-gray-400 hover:text-white underline truncate block">
                {stem.file_url}
              </a>
            </div>
          </div>
        </div>

        {/* Sepolia Smart Contract Licensing Options */}
        <div className="bg-gray-900 border border-gray-800 rounded-2xl p-6 shadow-lg flex flex-col justify-between">
          <div>
            <h3 className="text-sm uppercase font-bold text-gray-400 tracking-wider mb-2 flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-emerald-400" />
              On-Chain Licensing Smart Contract
            </h3>
            <p className="text-xs text-gray-400 mb-4">
              Funds are held and split automatically by Sepolia contract 2.5% platform fee, remainder to collaborator splits.
            </p>
          </div>

          <div className="space-y-2.5">
            <LicenseButton
              stemId={stem.stem_id}
              stemTokenId={tokenId}
              priceEth="0.015"
              licenseType="Remix"
              onPurchased={() => loadStemData()}
            />
            <LicenseButton
              stemId={stem.stem_id}
              stemTokenId={tokenId}
              priceEth="0.025"
              licenseType="Commercial"
              onPurchased={() => loadStemData()}
            />
            <LicenseButton
              stemId={stem.stem_id}
              stemTokenId={tokenId}
              priceEth="0.250"
              licenseType="Exclusive"
              onPurchased={() => loadStemData()}
            />
          </div>
        </div>
      </div>

      {/* Community Critiques & Reviews Section */}
      <div className="pt-6 border-t border-gray-800 space-y-6">
        <h2 className="text-xl font-bold text-white">Community Audio Critiques ({reviews.length})</h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <ReviewForm stemId={stem.stem_id} onReviewAdded={() => loadStemData()} />

          <div className="space-y-3">
            {reviews.length > 0 ? (
              reviews.map((rev) => (
                <div key={rev.review_id} className="bg-gray-900/60 border border-gray-800 rounded-xl p-4">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs font-semibold text-purple-300">
                      @{rev.producers?.username || `Producer #${rev.reviewer_id}`}
                    </span>
                    <span className="text-amber-400 text-xs">
                      {'★'.repeat(rev.rating)}{'☆'.repeat(5 - rev.rating)}
                    </span>
                  </div>
                  <p className="text-xs text-gray-300 mt-1">{rev.comment_text}</p>
                </div>
              ))
            ) : (
              <p className="text-xs text-gray-500 italic py-6">No critiques posted yet. Be the first producer to review this stem.</p>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
