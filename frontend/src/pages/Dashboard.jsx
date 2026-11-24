import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { fetchStems, fetchBuyerLicenses, fetchTracks } from '../api/harmoniq.js';
import useWallet from '../hooks/useWallet.js';
import StemCard from '../components/StemCard.jsx';

export default function Dashboard() {
  const { isConnected, account, connectWallet, truncatedAddress } = useWallet();
  const [activeTab, setActiveTab] = useState('stems'); // 'stems' | 'licenses' | 'tracks'
  const [stems, setStems] = useState([]);
  const [licenses, setLicenses] = useState([]);
  const [tracks, setTracks] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadDashboardData() {
      setLoading(true);
      try {
        const [allStems, allLicenses, allTracks] = await Promise.all([
          fetchStems(),
          fetchBuyerLicenses(1),
          fetchTracks(),
        ]);
        setStems(allStems || []);
        setLicenses(allLicenses || []);
        setTracks(allTracks || []);
      } catch (err) {
        console.error('Error loading dashboard data:', err);
      } finally {
        setLoading(false);
      }
    }
    loadDashboardData();
  }, [account]);

  if (!isConnected) {
    return (
      <div className="max-w-xl mx-auto px-6 py-24 text-center space-y-6">
        <div className="w-20 h-20 rounded-3xl bg-surface-card border border-white/10 text-purple-400 flex items-center justify-center mx-auto text-3xl shadow-2xl">
          ⚡
        </div>
        <div className="space-y-2">
          <h2 className="text-3xl font-extrabold text-white tracking-tight">Connect Web3 Wallet</h2>
          <p className="text-xs sm:text-sm text-slate-400 leading-relaxed max-w-sm mx-auto">
            Connect your MetaMask wallet on Hardhat Localhost or Sepolia testnet to inspect your minted stem NFTs, licensed audio stems, and collaborator splits.
          </p>
        </div>
        <button
          onClick={connectWallet}
          className="px-8 py-3.5 rounded-xl font-bold text-white bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 transition-all shadow-xl shadow-purple-900/30 text-xs active:scale-98"
        >
          Connect MetaMask Wallet
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
      {/* ─── Profile Banner ─────────────────────────────────────────────── */}
      <div className="relative overflow-hidden bg-gradient-to-r from-surface-card via-surface-panel to-surface-card border border-white/10 rounded-3xl p-6 sm:p-8 flex flex-col sm:flex-row sm:items-center justify-between gap-6 shadow-2xl">
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-purple-600 to-cyan-500 p-[1.5px] shadow-lg shadow-purple-900/40">
            <div className="w-full h-full bg-[#080b11] rounded-[14px] flex items-center justify-center text-2xl font-bold text-white">
              🎧
            </div>
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-black text-white tracking-tight">Producer Dashboard</h1>
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold bg-emerald-950 text-emerald-400 border border-emerald-800">
                ● Connected
              </span>
            </div>
            <p className="text-xs font-mono text-purple-300 mt-1 truncate max-w-md">
              Wallet: {account}
            </p>
          </div>
        </div>

        <Link
          to="/upload"
          className="py-2.5 px-5 rounded-xl text-xs font-bold text-white bg-purple-600 hover:bg-purple-500 transition-all text-center shrink-0 shadow-md shadow-purple-900/30"
        >
          + Upload Studio Stems
        </Link>
      </div>

      {/* ─── Tabs ───────────────────────────────────────────────────────── */}
      <div className="flex border-b border-white/5 gap-6 sm:gap-8">
        <button
          onClick={() => setActiveTab('stems')}
          className={`pb-3 text-xs sm:text-sm font-semibold transition-all relative ${
            activeTab === 'stems' ? 'text-white' : 'text-slate-400 hover:text-white'
          }`}
        >
          My Audio Stems ({stems.length})
          {activeTab === 'stems' && (
            <span className="absolute bottom-0 left-0 w-full h-0.5 bg-purple-500 rounded-full" />
          )}
        </button>

        <button
          onClick={() => setActiveTab('licenses')}
          className={`pb-3 text-xs sm:text-sm font-semibold transition-all relative ${
            activeTab === 'licenses' ? 'text-white' : 'text-slate-400 hover:text-white'
          }`}
        >
          Acquired Licenses ({licenses.length})
          {activeTab === 'licenses' && (
            <span className="absolute bottom-0 left-0 w-full h-0.5 bg-purple-500 rounded-full" />
          )}
        </button>

        <button
          onClick={() => setActiveTab('tracks')}
          className={`pb-3 text-xs sm:text-sm font-semibold transition-all relative ${
            activeTab === 'tracks' ? 'text-white' : 'text-slate-400 hover:text-white'
          }`}
        >
          Master Tracks ({tracks.length})
          {activeTab === 'tracks' && (
            <span className="absolute bottom-0 left-0 w-full h-0.5 bg-purple-500 rounded-full" />
          )}
        </button>
      </div>

      {/* ─── Tab Content ────────────────────────────────────────────────── */}
      {loading ? (
        <div className="py-20 text-center space-y-3">
          <div className="animate-spin h-8 w-8 border-3 border-purple-500 border-t-transparent rounded-full mx-auto" />
          <p className="text-xs font-mono text-slate-400">Loading user catalog & licenses...</p>
        </div>
      ) : activeTab === 'stems' ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {stems.map((stem) => (
            <StemCard key={stem.stem_id} stem={stem} />
          ))}
        </div>
      ) : activeTab === 'licenses' ? (
        <div className="bg-surface-card border border-white/5 rounded-2xl overflow-hidden shadow-xl">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="border-b border-white/5 bg-[#080b11] text-[11px] font-mono uppercase text-slate-400">
                <th className="p-4 pl-6">License ID</th>
                <th className="p-4">Stem Name</th>
                <th className="p-4">License Type</th>
                <th className="p-4">Paid Amount</th>
                <th className="p-4 text-right pr-6">On-Chain Tx Hash</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5 font-medium">
              {licenses.map((lic) => (
                <tr key={lic.license_id} className="hover:bg-white/5 transition-colors">
                  <td className="p-4 pl-6 font-mono text-purple-400">#{lic.license_id}</td>
                  <td className="p-4 font-bold text-white">
                    {lic.audio_stems?.stem_name || 'Midnight Sub'}
                  </td>
                  <td className="p-4">
                    <span className="px-2.5 py-1 rounded-md text-[11px] font-mono font-bold bg-purple-950 text-purple-300 border border-purple-800">
                      {lic.license_type}
                    </span>
                  </td>
                  <td className="p-4 font-mono text-emerald-400 font-bold">
                    {lic.price_eth} ETH
                  </td>
                  <td className="p-4 text-right pr-6 font-mono text-slate-400 text-[11px]">
                    {lic.tx_hash ? (
                      <span className="text-slate-300">
                        {lic.tx_hash.slice(0, 8)}...{lic.tx_hash.slice(-6)}
                      </span>
                    ) : (
                      'Simulated On-Chain'
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {tracks.map((track) => (
            <Link
              key={track.track_id}
              to={`/tracks/${track.track_id}`}
              className="bg-surface-card border border-white/5 rounded-2xl p-6 hover:border-purple-500/40 transition-all space-y-3 group"
            >
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-mono px-2.5 py-1 rounded-lg bg-purple-600/20 text-purple-300 border border-purple-500/30">
                  {track.genre}
                </span>
                <span className="text-xs font-mono text-slate-400">{track.bpm} BPM</span>
              </div>
              <h3 className="text-lg font-bold text-white group-hover:text-purple-300 transition-colors">
                {track.title}
              </h3>
              <p className="text-xs font-mono text-slate-500 truncate">
                Hash: {track.acoustic_hash}
              </p>
              <div className="text-xs font-bold text-purple-400 flex items-center gap-1 pt-2">
                <span>Manage Stems & Splits</span>
                <span>→</span>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
