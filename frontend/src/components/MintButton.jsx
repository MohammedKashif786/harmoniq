import React, { useState } from 'react'
import { mintStem } from '../api/harmoniq.js'
import useWallet from '../hooks/useWallet.js'

export default function MintButton({ stemId, isMinted, mintData, onMinted }) {
  const { isConnected, account, connectWallet } = useWallet()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [txHash, setTxHash] = useState(mintData?.tx_hash || null)
  const [tokenId, setTokenId] = useState(mintData?.token_id || null)

  const handleMint = async () => {
    if (!isConnected) {
      await connectWallet()
      return
    }

    setLoading(true)
    setError(null)

    try {
      const res = await mintStem(stemId)
      const mintRecord = res.mint || res.blockchain || {}
      setTxHash(mintRecord.txHash || mintRecord.tx_hash)
      setTokenId(mintRecord.tokenId || mintRecord.token_id)
      if (onMinted) onMinted(res)
    } catch (err) {
      console.error('Minting error:', err)
      setError(err.response?.data?.error || err.message || 'Minting failed')
    } finally {
      setLoading(false)
    }
  }

  if (isMinted || txHash) {
    return (
      <div className="bg-emerald-950/40 border border-emerald-800/80 rounded-xl p-4 flex flex-col gap-2">
        <div className="flex items-center gap-2 text-emerald-400 font-semibold text-sm">
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          Minted on Sepolia (Token #{tokenId || '1'})
        </div>
        {txHash && (
          <a
            href={`https://sepolia.etherscan.io/tx/${txHash}`}
            target="_blank"
            rel="noopener noreferrer"
            className="text-xs text-purple-400 hover:text-purple-300 font-mono truncate underline"
          >
            Verify on Etherscan: {txHash.slice(0, 10)}...{txHash.slice(-8)} ↗
          </a>
        )}
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-2">
      <button
        onClick={handleMint}
        disabled={loading}
        className="w-full py-3 px-5 rounded-xl font-bold text-white bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 transition-all shadow-lg shadow-purple-900/30 disabled:opacity-50 flex items-center justify-center gap-2"
      >
        {loading ? (
          <>
            <svg className="animate-spin h-5 w-5 text-white" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
            </svg>
            Minting on Sepolia...
          </>
        ) : (
          <>
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z" />
            </svg>
            Mint Proof-of-Stem™ NFT
          </>
        )}
      </button>
      {error && <p className="text-xs text-rose-400 text-center">{error}</p>}
    </div>
  )
}
