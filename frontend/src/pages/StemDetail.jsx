import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { fetchStem, fetchStemReviews } from '../api/harmoniq.js';
import StemPlayer from '../components/StemPlayer.jsx';
import MintButton from '../components/MintButton.jsx';
import LicenseButton from '../components/LicenseButton.jsx';
import ReviewForm from '../components/ReviewForm.jsx';

export default function StemDetail() {
  const { id } = useParams();
  const [stem, setStem] = useState(null);
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [copiedHash, setCopiedHash] = useState(false);

  const loadStemData = async () => {
    try {
      const [stemData, revs] = await Promise.all([
        fetchStem(id),
        fetchStemReviews(id),
      ]);
      setStem(stemData);
      setReviews(revs || []);
    } catch (err) {
      console.error('Failed to load stem details:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadStemData();
  }, [id]);

  const copyHash = (hash) => {
    navigator.clipboard.writeText(hash);
    setCopiedHash(true);
    setTimeout(() => setCopiedHash(false), 2000);
  };

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto px-6 py-24 text-center space-y-4">
        <div className="animate-spin h-10 w-10 border-4 border-purple-500 border-t-transparent rounded-full mx-auto" />
        <p className="text-slate-400 text-xs font-mono">
          Loading stem provenance, cryptographic hashes, and on-chain records...
        </p>
      </div>
    );
  }

  if (!stem) {
    return (
      <div className="max-w-4xl mx-auto px-6 py-24 text-center space-y-4">
        <div className="text-4xl">⚠️</div>
        <h2 className="text-2xl font-bold text-white">Audio Stem Not Found</h2>
        <p className="text-sm text-slate-400">The requested audio stem could not be located in the catalog.</p>
        <Link
          to="/marketplace"
          className="inline-block px-5 py-2.5 rounded-xl bg-purple-600 text-white font-bold text-xs hover:bg-purple-500 transition-all"
        >
          Return to Marketplace
        </Link>
      </div>
    );
  }

  const mintRecord = stem.stem_mints?.[0] || null;
  const isMinted = Boolean(mintRecord);
  const tokenId = mintRecord?.token_id || stem.token_id || stem.stem_id;

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-10">
      {/* ─── Breadcrumb ─────────────────────────────────────────────────── */}
      <div className="flex items-center gap-2 text-xs font-mono text-slate-400">
        <Link to="/marketplace" className="hover:text-white transition-colors">
          Marketplace
        </Link>
        <span>/</span>
        <span className="text-slate-500">Stems</span>
        <span>/</span>
        <span className="text-purple-400 truncate max-w-xs">{stem.stem_name}</span>
      </div>

      {/* ─── Header & Mint Actions ──────────────────────────────────────── */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 pb-8 border-b border-white/5">
        <div className="space-y-3">
          <div className="flex flex-wrap items-center gap-2">
            <span className="px-3 py-1 rounded-xl text-xs font-bold bg-purple-600/20 text-purple-300 border border-purple-500/30">
              {stem.stem_type} Stem
            </span>

            {stem.is_ai_generated ? (
              <span className="px-2.5 py-1 rounded-xl text-xs font-mono font-bold bg-indigo-950/80 text-indigo-300 border border-indigo-800/80">
                AI Origin &bull; Seed Verified
              </span>
            ) : (
              <span className="px-2.5 py-1 rounded-xl text-xs font-mono font-semibold bg-emerald-950/80 text-emerald-400 border border-emerald-800/80">
                Human Performance
              </span>
            )}

            {isMinted && (
              <span className="px-3 py-1 rounded-xl text-xs font-mono font-bold bg-cyan-950/80 text-cyan-300 border border-cyan-800/80 flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-pulse" />
                Sepolia NFT #{tokenId}
              </span>
            )}
          </div>

          <h1 className="text-3xl sm:text-5xl font-black text-white tracking-tight">
            {stem.stem_name}
          </h1>

          <p className="text-slate-400 text-sm flex flex-wrap items-center gap-2">
            <span>From Master Track:</span>
            <Link
              to={`/tracks/${stem.track_id}`}
              className="text-purple-400 hover:text-purple-300 font-bold underline transition-colors"
            >
              {stem.tracks?.title || `Track #${stem.track_id}`}
            </Link>
            <span className="text-slate-600">&bull;</span>
            <span>Producer:</span>
            <span className="text-white font-medium">
              {stem.tracks?.producers?.username || 'Verified Creator'}
            </span>
          </p>
        </div>

        {/* Mint Button Box */}
        <div className="w-full lg:w-72 shrink-0">
          <MintButton
            stemId={stem.stem_id}
            isMinted={isMinted}
            mintData={mintRecord}
            onMinted={() => loadStemData()}
          />
        </div>
      </div>

      {/* ─── Studio Waveform Player ─────────────────────────────────────── */}
      <StemPlayer
        fileUrl={stem.file_url}
        stemName={stem.stem_name}
        stemType={stem.stem_type}
      />

      {/* ─── 2-Column: Cryptographic Hashes vs On-Chain Licensing ──────── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left: Proof-of-Stem™ Hashes */}
        <div className="bg-surface-card border border-white/5 rounded-2xl p-6 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-mono uppercase font-bold text-slate-300 tracking-wider flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-cyan-400" />
              Proof-of-Stem™ Provenance Hashes
            </h3>
            <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-cyan-950 text-cyan-300 border border-cyan-800">
              SHA-256 + Chromaprint
            </span>
          </div>

          <p className="text-xs text-slate-400">
            Acoustic fingerprints are mathematically extracted by our FastAPI microservice to detect uncredited samples and guarantee origin.
          </p>

          <div className="space-y-3 font-mono text-xs">
            <div className="bg-[#080b11] border border-white/5 rounded-xl p-3">
              <div className="flex items-center justify-between text-slate-500 text-[10px] uppercase mb-1">
                <span>Acoustic Chromaprint Fingerprint</span>
                <button
                  onClick={() => copyHash(stem.acoustic_hash)}
                  className="text-purple-400 hover:text-purple-300"
                >
                  {copiedHash ? '✓ Copied' : 'Copy'}
                </button>
              </div>
              <div className="text-purple-300 text-xs truncate selection:bg-purple-900">
                {stem.acoustic_hash}
              </div>
            </div>

            {stem.prompt_seed_hash && (
              <div className="bg-[#080b11] border border-white/5 rounded-xl p-3">
                <div className="text-slate-500 text-[10px] uppercase mb-1">
                  AI Model Synthesis Seed Digest
                </div>
                <div className="text-indigo-300 text-xs truncate">
                  {stem.prompt_seed_hash}
                </div>
              </div>
            )}

            <div className="bg-[#080b11] border border-white/5 rounded-xl p-3">
              <div className="text-slate-500 text-[10px] uppercase mb-1">Audio Master Location</div>
              <a
                href={stem.file_url}
                target="_blank"
                rel="noreferrer"
                className="text-slate-300 hover:text-white underline truncate block text-xs"
              >
                {stem.file_url}
              </a>
            </div>
          </div>
        </div>

        {/* Right: On-Chain Licensing Options */}
        <div className="bg-surface-card border border-white/5 rounded-2xl p-6 flex flex-col justify-between space-y-4">
          <div>
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-xs font-mono uppercase font-bold text-slate-300 tracking-wider flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-emerald-400" />
                Smart Contract Licensing Console
              </h3>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-950 text-emerald-300 border border-emerald-800">
                Sepolia Escrow
              </span>
            </div>
            <p className="text-xs text-slate-400">
              Purchases trigger <code>StemLicensing.sol</code>: 2.5% platform protocol fee retained, 97.5% paid atomically to the producer's wallet.
            </p>
          </div>

          <div className="space-y-3 pt-2">
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

      {/* ─── Community Audio Critiques & Reviews ────────────────────────── */}
      <div className="pt-8 border-t border-white/5 space-y-6">
        <div>
          <span className="text-xs font-mono font-bold text-purple-400 uppercase tracking-widest">
            Peer Feedback
          </span>
          <h2 className="text-2xl font-bold text-white tracking-tight">
            Community Audio Critiques ({reviews.length})
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Peer reviews dynamically calculate producer reputation scores via PostgreSQL trigger <code>trg_update_producer_reputation</code>.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <ReviewForm stemId={stem.stem_id} onReviewAdded={() => loadStemData()} />

          <div className="space-y-3">
            {reviews.length > 0 ? (
              reviews.map((rev) => (
                <div
                  key={rev.review_id}
                  className="bg-surface-card border border-white/5 rounded-xl p-4 space-y-2 hover:border-purple-500/20 transition-all"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-mono font-bold text-purple-300">
                      @{rev.producers?.username || `Producer #${rev.reviewer_id}`}
                    </span>
                    <span className="text-amber-400 text-xs font-mono">
                      {'★'.repeat(rev.rating)}{'☆'.repeat(5 - rev.rating)}
                    </span>
                  </div>
                  <p className="text-xs text-slate-300 leading-relaxed">{rev.comment_text}</p>
                </div>
              ))
            ) : (
              <div className="bg-surface-card border border-white/5 rounded-xl p-8 text-center text-xs text-slate-500 italic">
                No critiques submitted yet. Be the first producer to test and rate this stem.
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
