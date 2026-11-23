import React, { useEffect, useState } from 'react'
import { fetchLeaderboard } from '../api/harmoniq.js'

export default function Leaderboard() {
  const [producers, setProducers] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function loadLeaderboard() {
      try {
        const data = await fetchLeaderboard()
        setProducers(data || [])
      } catch (err) {
        console.error('Failed to load leaderboard:', err)
      } finally {
        setLoading(false)
      }
    }
    loadLeaderboard()
  }, [])

  return (
    <div className="max-w-4xl mx-auto px-6 py-12">
      <div className="text-center max-w-xl mx-auto mb-10">
        <span className="px-3 py-1 rounded-full text-xs font-semibold bg-purple-950 text-purple-400 border border-purple-800">
          Decentralized Audio Reputation
        </span>
        <h1 className="text-3xl font-extrabold text-white mt-3 mb-2">Producer Leaderboard</h1>
        <p className="text-sm text-gray-400">
          Reputation scores are calculated automatically in PostgreSQL triggers from all verified stem critiques across tracks.
        </p>
      </div>

      <div className="bg-gray-900 border border-gray-800 rounded-3xl overflow-hidden shadow-2xl">
        {loading ? (
          <div className="p-12 text-center text-gray-400 text-sm">
            <div className="animate-spin h-6 w-6 border-2 border-purple-500 border-t-transparent rounded-full mx-auto mb-3" />
            Calculating rankings...
          </div>
        ) : producers.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-sm">
              <thead>
                <tr className="border-b border-gray-800 bg-black/40 text-xs font-semibold text-gray-400">
                  <th className="p-4 pl-6">Rank</th>
                  <th className="p-4">Producer</th>
                  <th className="p-4">Ethereum Wallet</th>
                  <th className="p-4 text-right pr-6">Reputation Score</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-800/60 font-medium">
                {producers.map((p, index) => {
                  const score = parseFloat(p.reputation_score) || 0
                  return (
                    <tr key={p.producer_id} className="hover:bg-purple-950/10 transition-colors">
                      <td className="p-4 pl-6 font-bold text-gray-400">
                        {index === 0 && <span className="text-amber-400 text-base mr-1">🥇</span>}
                        {index === 1 && <span className="text-slate-300 text-base mr-1">🥈</span>}
                        {index === 2 && <span className="text-amber-600 text-base mr-1">🥉</span>}
                        {index > 2 && <span className="text-gray-500 font-mono text-xs">#{index + 1}</span>}
                      </td>
                      <td className="p-4">
                        <span className="font-bold text-white block">@{p.username}</span>
                      </td>
                      <td className="p-4 font-mono text-xs text-gray-400">
                        {p.wallet_address ? (
                          <a
                            href={`https://sepolia.etherscan.io/address/${p.wallet_address}`}
                            target="_blank"
                            rel="noreferrer"
                            className="hover:text-purple-400 hover:underline"
                          >
                            {p.wallet_address.slice(0, 8)}...{p.wallet_address.slice(-6)} ↗
                          </a>
                        ) : (
                          '—'
                        )}
                      </td>
                      <td className="p-4 text-right pr-6">
                        <div className="inline-flex items-center gap-1.5 bg-black/40 px-3 py-1 rounded-full border border-gray-800">
                          <span className="text-amber-400 text-xs">★</span>
                          <span className="text-white font-bold font-mono text-xs">
                            {score.toFixed(2)}
                          </span>
                          <span className="text-gray-500 text-[10px]">/ 5.0</span>
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="p-8 text-center text-gray-500 text-sm">
            No producers registered in the database yet.
          </div>
        )}
      </div>
    </div>
  )
}
