import React, { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { fetchStems, fetchBuyerLicenses, fetchTracks } from '../api/harmoniq.js'
import useWallet from '../hooks/useWallet.js'
import StemCard from '../components/StemCard.jsx'

export default function Dashboard() {
  const { isConnected, account, connectWallet, truncatedAddress } = useWallet()
  const [activeTab, setActiveTab] = useState('stems') // 'stems' | 'licenses' | 'splits'
  const [stems, setStems] = useState([])
  const [licenses, setLicenses] = useState([])
  const [tracks, setTracks] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function loadDashboardData() {
      setLoading(true)
      try {
        const [allStems, allLicenses, allTracks] = await Promise.all([
          fetchStems(),
          fetchBuyerLicenses(1), // default producer ID
          fetchTracks(),
        ])
        setStems(allStems || [])
        setLicenses(allLicenses || [])
        setTracks(allTracks || [])
      } catch (err) {
        console.error('Error loading dashboard data:', err)
      } finally {
        setLoading(false)
      }
    }
    loadDashboardData()
  }, [account])

  if (!isConnected) {
    return (
      <div className="max-w-xl mx-auto px-6 py-24 text-center">
        <div className="w-16 h-16 rounded-3xl bg-purple-950/60 border border-purple-800 text-purple-400 flex items-center justify-center mx-auto mb-6 text-2xl">
          🦊
        </div>
        <h2 className="text-2xl font-bold text-white mb-2">Connect Your Web3 Wallet</h2>
        <p className="text-sm text-gray-400 mb-8 leading-relaxed">
          Connect your MetaMask account on Sepolia testnet to access your minted stem NFTs, track licenses, and claim collaborator royalties.
        </p>
        <button
          onClick={connectWallet}
          className="px-8 py-3.5 rounded-xl font-bold text-white bg-purple-600 hover:bg-purple-500 transition-all shadow-lg shadow-purple-900/30 text-sm"
        >
          Connect MetaMask Wallet
        </button>
      </div>
    )
  }

  return (
    <div className="max-w-6xl mx-auto px-6 py-10 space-y-8">
      {/* Producer Profile Banner */}
      <div className="bg-gradient-to-r from-gray-900 via-purple-950/20 to-gray-900 border border-gray-800 rounded-3xl p-6 sm:p-8 flex flex-col sm:flex-row sm:items-center justify-between gap-6 shadow-xl">
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-purple-600 to-indigo-600 flex items-center justify-center text-white text-2xl font-bold shadow-lg shadow-purple-900/40">
            🎧
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-extrabold text-white">Producer Dashboard</h1>
              <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-950 text-emerald-400 border border-emerald-800">
                Connected
              </span>
            </div>
            <p className="text-xs font-mono text-purple-300 mt-1">
              Wallet: {account}
            </p>
          </div>
        </div>

        <Link
          to="/upload"
          className="py-2.5 px-5 rounded-xl text-xs font-bold text-white bg-purple-600 hover:bg-purple-500 transition-all text-center"
        >
          + Upload New Stem
        </Link>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-gray-800 gap-8">
        <button
          onClick={() => setActiveTab('stems')}
          className={`pb-3 text-sm font-semibold transition-all relative ${
            activeTab === 'stems' ? 'text-white' : 'text-gray-400 hover:text-white'
          }`}
        >
          My Stems & Proof-of-Stem™ Mints ({stems.length})
          {activeTab === 'stems' && (
            <span className="absolute bottom-0 left-0 w-full h-0.5 bg-purple-500 rounded-full" />
          )}
        </button>

        <button
          onClick={() => setActiveTab('licenses')}
          className={`pb-3 text-sm font-semibold transition-all relative ${
            activeTab === 'licenses' ? 'text-white' : 'text-gray-400 hover:text-white'
          }`}
        >
          Purchased Stem Licenses ({licenses.length})
          {activeTab === 'licenses' && (
            <span className="absolute bottom-0 left-0 w-full h-0.5 bg-purple-500 rounded-full" />
          )}
        </button>

        <button
          onClick={() => setActiveTab('splits')}
          className={`pb-3 text-sm font-semibold transition-all relative ${
            activeTab === 'splits' ? 'text-white' : 'text-gray-400 hover:text-white'
          }`}
        >
          Master Tracks ({tracks.length})
          {activeTab === 'splits' && (
            <span className="absolute bottom-0 left-0 w-full h-0.5 bg-purple-500 rounded-full" />
          )}
        </button>
      </div>

      {/* Tab 1: Stems */}
      {activeTab === 'stems' && (
        <div>
          {loading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {[1, 2, 3].map((n) => (
                <div key={n} className="h-44 rounded-xl bg-gray-900/50 animate-pulse border border-gray-800" />
              ))}
            </div>
          ) : stems.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {stems.map((stem) => (
                <StemCard key={stem.stem_id} stem={stem} />
              ))}
            </div>
          ) : (
            <p className="text-gray-500 text-sm">No stems uploaded yet.</p>
          )}
        </div>
      )}

      {/* Tab 2: Licenses */}
      {activeTab === 'licenses' && (
        <div className="bg-gray-900 border border-gray-800 rounded-2xl overflow-hidden shadow-xl">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-sm">
              <thead>
                <tr className="border-b border-gray-800 bg-black/40 text-xs font-semibold text-gray-400">
                  <th className="p-4">License ID</th>
                  <th className="p-4">Stem</th>
                  <th className="p-4">License Type</th>
                  <th className="p-4">ETH Paid</th>
                  <th className="p-4">On-Chain Tx Hash</th>
                  <th className="p-4">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-800/80">
                {licenses.map((lic) => (
                  <tr key={lic.license_id} className="hover:bg-purple-950/10">
                    <td className="p-4 font-mono text-xs text-gray-500">#{lic.license_id}</td>
                    <td className="p-4 font-semibold text-white">
                      {lic.audio_stems?.stem_name || `Stem #${lic.stem_id}`}
                    </td>
                    <td className="p-4">
                      <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-purple-900/40 text-purple-300 border border-purple-800">
                        {lic.license_type}
                      </span>
                    </td>
                    <td className="p-4 font-mono text-emerald-400">{lic.price_eth} ETH</td>
                    <td className="p-4 font-mono text-xs text-gray-400">
                      {lic.tx_hash ? (
                        <a
                          href={`https://sepolia.etherscan.io/tx/${lic.tx_hash}`}
                          target="_blank"
                          rel="noreferrer"
                          className="hover:text-purple-400 underline"
                        >
                          {lic.tx_hash.slice(0, 10)}...{lic.tx_hash.slice(-6)} ↗
                        </a>
                      ) : (
                        '—'
                      )}
                    </td>
                    <td className="p-4">
                      <Link
                        to={`/stems/${lic.stem_id}`}
                        className="text-xs text-purple-400 hover:underline font-semibold"
                      >
                        Play Audio →
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Tab 3: Master Tracks */}
      {activeTab === 'splits' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {tracks.map((t) => (
            <div key={t.track_id} className="bg-gray-900 border border-gray-800 rounded-2xl p-6 flex flex-col justify-between">
              <div>
                <span className="text-xs font-mono text-purple-400">{t.genre} • {t.bpm} BPM</span>
                <h3 className="text-xl font-bold text-white mt-1 mb-2">{t.title}</h3>
                <p className="text-xs text-gray-500 font-mono truncate mb-4">
                  Hash: {t.acoustic_hash}
                </p>
              </div>

              <Link
                to={`/tracks/${t.track_id}`}
                className="w-full py-2.5 rounded-xl bg-purple-600/20 hover:bg-purple-600 text-purple-300 hover:text-white transition-all text-xs font-bold text-center block"
              >
                Manage Stems & Royalty Splits →
              </Link>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
