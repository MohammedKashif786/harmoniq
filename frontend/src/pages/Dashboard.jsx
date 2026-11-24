import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { fetchStems, fetchBuyerLicenses, fetchTracks } from '../api/harmoniq.js';
import useWallet from '../hooks/useWallet.js';
import StemCard from '../components/StemCard.jsx';

export default function Dashboard() {
  const {
    profile,
    profiles,
    switchProfile,
    account,
    balanceEth,
  } = useWallet();

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
          fetchBuyerLicenses(profile.id || 1),
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
  }, [profile.id]);

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
      {/* ─── Profile & Viva Identity Banner ─────────────────────────────── */}
      <div className="relative overflow-hidden bg-gradient-to-r from-surface-card via-surface-panel to-surface-card border border-white/10 rounded-3xl p-6 sm:p-8 flex flex-col md:flex-row md:items-center justify-between gap-6 shadow-2xl">
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-purple-600 via-indigo-600 to-cyan-400 p-[1.5px] shadow-lg shadow-purple-900/40 shrink-0">
            <div className="w-full h-full bg-[#080b11] rounded-[14px] flex items-center justify-center text-3xl font-bold">
              {profile.avatar}
            </div>
          </div>
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="text-2xl font-black text-white tracking-tight">{profile.name}</h1>
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold bg-purple-950 text-purple-300 border border-purple-800">
                {profile.usn}
              </span>
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold bg-emerald-950 text-emerald-400 border border-emerald-800">
                ● {balanceEth} ETH Pre-Funded
              </span>
            </div>
            <p className="text-xs font-mono text-slate-400 mt-1 truncate max-w-lg">
              {profile.role} &bull; <span className="text-purple-300">{account}</span>
            </p>
          </div>
        </div>

        {/* Quick Identity Switcher for Teacher */}
        <div className="flex flex-wrap items-center gap-2 bg-[#080b11] p-1.5 rounded-2xl border border-white/5">
          <span className="text-[10px] font-mono uppercase text-slate-500 pl-2">
            Switch View:
          </span>
          {profiles.map((p) => (
            <button
              key={p.id}
              onClick={() => switchProfile(p.id)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
                profile.id === p.id
                  ? 'bg-purple-600 text-white shadow-md'
                  : 'text-slate-400 hover:text-white hover:bg-white/5'
              }`}
            >
              <span>{p.avatar}</span>
              <span>{p.name.split(' ')[0]}</span>
            </button>
          ))}
        </div>
      </div>

      {/* ─── Metric Pills ───────────────────────────────────────────────── */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 font-mono text-xs">
        <div className="bg-surface-card border border-white/5 rounded-2xl p-4">
          <span className="text-slate-400 text-[11px] block">Active Stems</span>
          <span className="text-2xl font-black text-white">{stems.length}</span>
        </div>
        <div className="bg-surface-card border border-white/5 rounded-2xl p-4">
          <span className="text-slate-400 text-[11px] block">Licenses Held</span>
          <span className="text-2xl font-black text-purple-400">{licenses.length}</span>
        </div>
        <div className="bg-surface-card border border-white/5 rounded-2xl p-4">
          <span className="text-slate-400 text-[11px] block">Master Compositions</span>
          <span className="text-2xl font-black text-cyan-400">{tracks.length}</span>
        </div>
        <div className="bg-surface-card border border-white/5 rounded-2xl p-4">
          <span className="text-slate-400 text-[11px] block">Available Balance</span>
          <span className="text-2xl font-black text-emerald-400">{balanceEth} ETH</span>
        </div>
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
          Smart Contract Licenses ({licenses.length})
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
          <p className="text-xs font-mono text-slate-400">Syncing with blockchain ledger...</p>
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
                <th className="p-4">Stem Track</th>
                <th className="p-4">Tier</th>
                <th className="p-4">ETH Paid</th>
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
                        {lic.tx_hash.slice(0, 10)}...{lic.tx_hash.slice(-8)}
                      </span>
                    ) : (
                      '0xlic1...3a4b'
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
