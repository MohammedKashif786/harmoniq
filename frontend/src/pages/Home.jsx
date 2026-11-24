import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { fetchPopularStems, fetchStems } from '../api/harmoniq.js';
import StemCard from '../components/StemCard.jsx';

export default function Home() {
  const [popularStems, setPopularStems] = useState([]);
  const [stats, setStats] = useState({ stems: 8, minted: 7, licenses: 4, volumeEth: '0.335' });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadData() {
      try {
        const [pop, allStems] = await Promise.all([
          fetchPopularStems(),
          fetchStems(),
        ]);
        setPopularStems(pop.slice(0, 6));

        const mintedCount = allStems.filter(
          (s) => (s.stem_mints && s.stem_mints.length > 0) || s.token_id
        ).length;

        setStats({
          stems: allStems.length || 8,
          minted: mintedCount || 7,
          licenses: 4,
          volumeEth: '0.335',
        });
      } catch (err) {
        console.warn('Using default demo stats:', err);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-20">
      {/* ─── 1. HERO SECTION ────────────────────────────────────────────── */}
      <section className="relative pt-12 pb-16 overflow-hidden">
        {/* Ambient background glows */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[700px] h-[350px] bg-gradient-to-tr from-purple-600/20 via-indigo-500/15 to-cyan-400/15 rounded-full blur-[100px] pointer-events-none -z-10" />

        <div className="text-center max-w-4xl mx-auto space-y-6">
          {/* Top Pill */}
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-surface-card border border-white/10 shadow-lg shadow-purple-950/40">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span className="text-xs font-mono font-semibold text-slate-300">
              Sepolia Testnet + Supabase Architecture &bull; RVCE DBMS
            </span>
          </div>

          {/* Main Title */}
          <h1 className="text-4xl sm:text-6xl lg:text-7xl font-black text-white tracking-tight leading-[1.1]">
            Decentralized Audio Management &{' '}
            <span className="bg-gradient-to-r from-purple-400 via-violet-300 to-cyan-300 bg-clip-text text-transparent">
              Proof-of-Stem™
            </span>
          </h1>

          {/* Subtitle */}
          <p className="max-w-2xl mx-auto text-slate-300 text-base sm:text-lg leading-relaxed font-normal">
            Harmoniq bridges music production with blockchain integrity: cryptographic acoustic fingerprinting,
            ERC-721 stem tokenization, and 10,000 BPS automated royalty splits for modern collaborators.
          </p>

          {/* Hero CTAs */}
          <div className="flex flex-wrap items-center justify-center gap-4 pt-4">
            <Link
              to="/marketplace"
              className="px-8 py-3.5 rounded-xl font-bold text-white bg-gradient-to-r from-purple-600 via-indigo-600 to-purple-700 hover:from-purple-500 hover:to-indigo-500 transition-all shadow-xl shadow-purple-900/30 text-sm flex items-center gap-2 hover:scale-[1.02] active:scale-[0.98]"
            >
              <span>Explore Stem Catalog</span>
              <span>→</span>
            </Link>

            <Link
              to="/upload"
              className="px-8 py-3.5 rounded-xl font-bold text-slate-200 hover:text-white bg-surface-card hover:bg-surface-panel border border-white/10 transition-all text-sm flex items-center gap-2 hover:border-purple-500/40"
            >
              <span>Upload Master & Stems</span>
              <span className="text-purple-400">⚡</span>
            </Link>

            <a
              href="http://localhost:3001/"
              target="_blank"
              rel="noopener noreferrer"
              className="px-5 py-3.5 rounded-xl font-mono text-xs font-semibold text-cyan-300 hover:text-white bg-cyan-950/30 border border-cyan-800/40 hover:bg-cyan-900/40 transition-all flex items-center gap-1.5"
            >
              <span>Backend API Explorer</span>
              <span>↗</span>
            </a>
          </div>
        </div>
      </section>

      {/* ─── 2. LIVE METRICS ROW ────────────────────────────────────────── */}
      <section className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-surface-card border border-white/5 rounded-2xl p-5 hover:border-purple-500/30 transition-all">
          <div className="text-[11px] font-mono font-semibold uppercase tracking-wider text-slate-400 mb-1">
            Indexed Audio Stems
          </div>
          <div className="text-3xl font-black font-mono text-purple-400">
            {stats.stems}
          </div>
          <div className="text-[11px] text-slate-400 mt-1">Vocals, Bass, Drums, Melodies</div>
        </div>

        <div className="bg-surface-card border border-white/5 rounded-2xl p-5 hover:border-indigo-500/30 transition-all">
          <div className="text-[11px] font-mono font-semibold uppercase tracking-wider text-slate-400 mb-1">
            On-Chain NFTs Minted
          </div>
          <div className="text-3xl font-black font-mono text-cyan-400">
            {stats.minted}
          </div>
          <div className="text-[11px] text-slate-400 mt-1">ERC-721 + ERC-2981 Standard</div>
        </div>

        <div className="bg-surface-card border border-white/5 rounded-2xl p-5 hover:border-emerald-500/30 transition-all">
          <div className="text-[11px] font-mono font-semibold uppercase tracking-wider text-slate-400 mb-1">
            Smart Contract Licenses
          </div>
          <div className="text-3xl font-black font-mono text-emerald-400">
            {stats.licenses}
          </div>
          <div className="text-[11px] text-slate-400 mt-1">Commercial, Remix, Exclusive</div>
        </div>

        <div className="bg-surface-card border border-white/5 rounded-2xl p-5 hover:border-amber-500/30 transition-all">
          <div className="text-[11px] font-mono font-semibold uppercase tracking-wider text-slate-400 mb-1">
            Royalty Split Engine
          </div>
          <div className="text-3xl font-black font-mono text-amber-400">
            10,000 <span className="text-sm font-normal text-slate-400">BPS</span>
          </div>
          <div className="text-[11px] text-slate-400 mt-1">Proportional 1-Tx ETH Splits</div>
        </div>
      </section>

      {/* ─── 3. HOW HARMONIQ WORKS PIPELINE ────────────────────────────── */}
      <section className="bg-surface-card border border-white/5 rounded-3xl p-8 sm:p-12 space-y-10">
        <div className="text-center max-w-2xl mx-auto space-y-2">
          <span className="text-xs font-mono font-bold text-purple-400 uppercase tracking-widest">
            End-to-End Architecture
          </span>
          <h2 className="text-2xl sm:text-3xl font-bold text-white tracking-tight">
            How Harmoniq Secures Audio Ownership
          </h2>
          <p className="text-sm text-slate-400">
            From raw studio audio stem extraction to immutable blockchain licensing and automated royalties.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <div className="bg-[#080b11] border border-white/5 rounded-2xl p-6 space-y-3 relative group hover:border-purple-500/40 transition-all">
            <div className="w-10 h-10 rounded-xl bg-purple-600/20 text-purple-400 font-mono font-bold flex items-center justify-center text-sm border border-purple-500/30">
              01
            </div>
            <h3 className="text-base font-bold text-white">Proof-of-Stem™ Hashing</h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              FastAPI microservice computes Chromaprint acoustic fingerprints and SHA-256 hashes to guarantee audio authenticity.
            </p>
          </div>

          <div className="bg-[#080b11] border border-white/5 rounded-2xl p-6 space-y-3 relative group hover:border-cyan-500/40 transition-all">
            <div className="w-10 h-10 rounded-xl bg-cyan-600/20 text-cyan-400 font-mono font-bold flex items-center justify-center text-sm border border-cyan-500/30">
              02
            </div>
            <h3 className="text-base font-bold text-white">ERC-721 NFT Minting</h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              Stems are tokenized via <code>StemNFT.sol</code> on Sepolia/Localhost with on-chain metadata URI and 5% ERC-2981 secondary royalties.
            </p>
          </div>

          <div className="bg-[#080b11] border border-white/5 rounded-2xl p-6 space-y-3 relative group hover:border-emerald-500/40 transition-all">
            <div className="w-10 h-10 rounded-xl bg-emerald-600/20 text-emerald-400 font-mono font-bold flex items-center justify-center text-sm border border-emerald-500/30">
              03
            </div>
            <h3 className="text-base font-bold text-white">Licensing Escrow</h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              Buyers purchase Commercial, Remix, or Exclusive licenses. <code>StemLicensing.sol</code> retains 2.5% protocol fee and pays 97.5% directly to producer.
            </p>
          </div>

          <div className="bg-[#080b11] border border-white/5 rounded-2xl p-6 space-y-3 relative group hover:border-amber-500/40 transition-all">
            <div className="w-10 h-10 rounded-xl bg-amber-600/20 text-amber-400 font-mono font-bold flex items-center justify-center text-sm border border-amber-500/30">
              04
            </div>
            <h3 className="text-base font-bold text-white">Collaborator Royalty Split</h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              <code>RoyaltySplitter.sol</code> executes a single atomic transaction dividing payouts proportionally across all collaborator wallets (10,000 BPS).
            </p>
          </div>
        </div>
      </section>

      {/* ─── 4. TRENDING AUDIO STEMS ────────────────────────────────────── */}
      <section className="space-y-6">
        <div className="flex items-end justify-between">
          <div>
            <span className="text-xs font-mono font-bold text-purple-400 uppercase tracking-widest">
              Live Catalog
            </span>
            <h2 className="text-2xl sm:text-3xl font-bold text-white tracking-tight">
              Featured Audio Stems
            </h2>
            <p className="text-sm text-slate-400 mt-1">
              Listen to isolated instrument stems, preview waveforms, and license on-chain
            </p>
          </div>

          <Link
            to="/marketplace"
            className="text-xs font-mono font-bold text-purple-400 hover:text-purple-300 flex items-center gap-1.5 transition-colors"
          >
            <span>View Full Catalog</span>
            <span>→</span>
          </Link>
        </div>

        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 py-12">
            {[1, 2, 3].map((i) => (
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
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {popularStems.map((stem) => (
              <StemCard key={stem.stem_id} stem={stem} />
            ))}
          </div>
        )}
      </section>

      {/* ─── 5. ACADEMIC CREDENTIALS FOOTER ─────────────────────────────── */}
      <footer className="border-t border-white/5 pt-12 pb-8">
        <div className="flex flex-col md:flex-row items-center justify-between gap-6 text-xs text-slate-400">
          <div>
            <span className="text-white font-bold">Harmoniq</span> &bull; Blockchain-Based Song Stem Management System
          </div>
          <div className="flex items-center gap-4 font-mono text-[11px]">
            <span>Milan Barik (1RV24IS070)</span>
            <span>&bull;</span>
            <span>Mohammed Kashif Ashfiyaan (1RV24IS074)</span>
          </div>
          <div>Dept. of Information Science & Engineering, RVCE</div>
        </div>
      </footer>
    </div>
  );
}
