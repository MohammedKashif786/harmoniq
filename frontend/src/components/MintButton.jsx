import React, { useState } from 'react';
import { mintStem } from '../api/harmoniq.js';
import useWallet from '../hooks/useWallet.js';

export default function MintButton({ stemId, isMinted, mintData, onMinted }) {
  const { isConnected, connectWallet } = useWallet();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [txHash, setTxHash] = useState(mintData?.tx_hash || null);
  const [tokenId, setTokenId] = useState(mintData?.token_id || null);

  const handleMint = async () => {
    if (!isConnected) {
      await connectWallet();
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const res = await mintStem(stemId);
      const mintRecord = res.mint || res.blockchain || {};
      setTxHash(mintRecord.txHash || mintRecord.tx_hash);
      setTokenId(mintRecord.tokenId || mintRecord.token_id);
      if (onMinted) onMinted(res);
    } catch (err) {
      console.error('Minting error:', err);
      setError(err.response?.data?.error || err.message || 'Minting failed');
    } finally {
      setLoading(false);
    }
  };

  if (isMinted || txHash) {
    return (
      <div className="bg-emerald-950/40 border border-emerald-800/80 rounded-2xl p-4 flex flex-col gap-2 shadow-lg">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-emerald-400 font-bold text-xs font-mono">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span>On-Chain NFT #{tokenId || '1'}</span>
          </div>
          <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-900/60 text-emerald-300">
            ERC-721 + ERC-2981
          </span>
        </div>

        {txHash && (
          <div className="pt-1">
            <a
              href={`https://sepolia.etherscan.io/tx/${txHash}`}
              target="_blank"
              rel="noopener noreferrer"
              className="text-[11px] text-purple-400 hover:text-purple-300 font-mono truncate underline block"
            >
              Tx: {txHash.slice(0, 10)}...{txHash.slice(-8)} ↗
            </a>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-2">
      <button
        onClick={handleMint}
        disabled={loading}
        className="w-full py-3 px-5 rounded-2xl font-bold text-xs text-white bg-gradient-to-r from-purple-600 via-indigo-600 to-cyan-500 hover:from-purple-500 hover:to-cyan-400 transition-all shadow-xl shadow-purple-900/30 disabled:opacity-50 flex items-center justify-center gap-2 active:scale-98"
      >
        {loading ? (
          <>
            <svg className="animate-spin h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
            </svg>
            <span>Minting on Sepolia...</span>
          </>
        ) : (
          <>
            <span>⚡</span>
            <span>Mint Proof-of-Stem™ NFT</span>
          </>
        )}
      </button>
      {error && <p className="text-[11px] text-rose-400 font-mono text-center">{error}</p>}
    </div>
  );
}
