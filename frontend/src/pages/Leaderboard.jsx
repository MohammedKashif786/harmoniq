import React, { useEffect, useState } from 'react';
import { fetchLeaderboard } from '../api/harmoniq.js';

export default function Leaderboard() {
  const [producers, setProducers] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadLeaderboard() {
      try {
        const data = await fetchLeaderboard();
        setProducers(data || []);
      } catch (err) {
        console.error('Failed to load leaderboard:', err);
      } finally {
        setLoading(false);
      }
    }
    loadLeaderboard();
  }, []);

  const topThree = producers.slice(0, 3);
  const remaining = producers.slice(3);

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-12 space-y-12">
      {/* ─── Header ─────────────────────────────────────────────────────── */}
      <div className="text-center max-w-xl mx-auto space-y-3">
        <span className="px-3 py-1 rounded-full text-xs font-mono font-bold bg-purple-950/80 text-purple-300 border border-purple-800/80">
          Decentralized Audio Reputation
        </span>
        <h1 className="text-3xl sm:text-5xl font-black text-white tracking-tight">
          Producer Leaderboard
        </h1>
        <p className="text-xs sm:text-sm text-slate-400">
          Reputation scores are calculated automatically in PostgreSQL triggers from all verified stem critiques across tracks.
        </p>
      </div>

      {loading ? (
        <div className="bg-surface-card border border-white/5 rounded-3xl p-16 text-center space-y-3">
          <div className="animate-spin h-8 w-8 border-3 border-purple-500 border-t-transparent rounded-full mx-auto" />
          <p className="text-xs font-mono text-slate-400">Computing real-time producer rankings...</p>
        </div>
      ) : producers.length > 0 ? (
        <div className="space-y-8">
          {/* Top 3 Podium Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-4">
            {topThree.map((p, idx) => {
              const medals = ['🥇 1st Place', '🥈 2nd Place', '🥉 3rd Place'];
              const borders = ['border-amber-500/40', 'border-slate-400/40', 'border-amber-700/40'];
              const glows = ['shadow-amber-500/10', 'shadow-slate-400/10', 'shadow-amber-700/10'];
              const score = parseFloat(p.reputation_score) || 0;

              return (
                <div
                  key={p.producer_id}
                  className={`bg-surface-card border ${borders[idx]} rounded-2xl p-6 flex flex-col items-center text-center space-y-4 shadow-xl ${glows[idx]} relative overflow-hidden`}
                >
                  <span className="text-xs font-mono font-bold px-3 py-1 rounded-full bg-white/5 border border-white/10 text-white">
                    {medals[idx]}
                  </span>

                  <div className="w-16 h-16 rounded-full bg-gradient-to-tr from-purple-600 via-indigo-600 to-cyan-400 p-[2px]">
                    <div className="w-full h-full bg-[#080b11] rounded-full flex items-center justify-center text-xl font-bold text-white">
                      {p.username?.charAt(0).toUpperCase()}
                    </div>
                  </div>

                  <div>
                    <h3 className="text-lg font-bold text-white">@{p.username}</h3>
                    <p className="text-[11px] font-mono text-slate-400 mt-0.5 truncate max-w-[200px]">
                      {p.wallet_address || '0x...'}
                    </p>
                  </div>

                  <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#080b11] border border-white/10">
                    <span className="text-amber-400 text-sm">★</span>
                    <span className="text-sm font-bold font-mono text-white">
                      {score.toFixed(2)}
                    </span>
                    <span className="text-[10px] text-slate-500 font-mono">/ 5.0</span>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Remaining Table */}
          {remaining.length > 0 && (
            <div className="bg-surface-card border border-white/5 rounded-2xl overflow-hidden shadow-xl">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="border-b border-white/5 bg-[#080b11] text-[11px] font-mono uppercase text-slate-400">
                    <th className="p-4 pl-6">Rank</th>
                    <th className="p-4">Producer</th>
                    <th className="p-4">Ethereum Wallet Address</th>
                    <th className="p-4 text-right pr-6">Reputation Score</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5 font-medium">
                  {remaining.map((p, index) => {
                    const score = parseFloat(p.reputation_score) || 0;
                    return (
                      <tr key={p.producer_id} className="hover:bg-white/5 transition-colors">
                        <td className="p-4 pl-6 font-mono font-bold text-slate-400">
                          #{index + 4}
                        </td>
                        <td className="p-4 font-bold text-white">
                          @{p.username}
                        </td>
                        <td className="p-4 font-mono text-slate-400">
                          {p.wallet_address ? (
                            <span className="text-slate-300">
                              {p.wallet_address.slice(0, 10)}...{p.wallet_address.slice(-8)}
                            </span>
                          ) : (
                            '—'
                          )}
                        </td>
                        <td className="p-4 text-right pr-6">
                          <div className="inline-flex items-center gap-1 bg-[#080b11] px-2.5 py-1 rounded-lg border border-white/5">
                            <span className="text-amber-400 text-xs">★</span>
                            <span className="font-mono font-bold text-white">
                              {score.toFixed(2)}
                            </span>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      ) : (
        <div className="bg-surface-card border border-white/5 rounded-2xl p-12 text-center text-xs text-slate-500 italic">
          No producers registered in the database yet.
        </div>
      )}
    </div>
  );
}
