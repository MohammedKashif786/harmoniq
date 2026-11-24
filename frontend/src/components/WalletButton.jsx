import { useState } from 'react';
import useWallet from '../hooks/useWallet.js';

export default function WalletButton() {
  const {
    isConnected,
    isConnecting,
    truncatedAddress,
    account,
    chainId,
    connectWallet,
    disconnectWallet,
    switchNetwork,
  } = useWallet();

  const [copied, setCopied] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);

  const copyAddress = (e) => {
    e.stopPropagation();
    if (account) {
      navigator.clipboard.writeText(account);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  if (typeof window !== 'undefined' && !window.ethereum) {
    return (
      <a
        href="https://metamask.io"
        target="_blank"
        rel="noopener noreferrer"
        className="bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-400 hover:to-orange-500 rounded-xl px-4 py-2 text-white text-xs font-bold shadow-lg shadow-orange-900/20 transition-all flex items-center gap-1.5"
      >
        <span className="text-sm">🦊</span> Install MetaMask
      </a>
    );
  }

  if (!isConnected) {
    return (
      <button
        onClick={connectWallet}
        disabled={isConnecting}
        className="relative group overflow-hidden rounded-xl p-[1px] font-bold text-xs transition-all disabled:opacity-60"
      >
        <div className="absolute inset-0 bg-gradient-to-r from-purple-600 via-indigo-600 to-cyan-500 rounded-xl transition-all group-hover:scale-105" />
        <div className="relative px-4 py-2 bg-[#0e1422] rounded-[11px] text-white flex items-center gap-2 group-hover:bg-opacity-80 transition-all">
          {isConnecting ? (
            <>
              <svg className="animate-spin h-3.5 w-3.5 text-purple-400" viewBox="0 0 24 24" fill="none">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
              </svg>
              <span>Connecting...</span>
            </>
          ) : (
            <>
              <span className="text-purple-400">⚡</span>
              <span>Connect Wallet</span>
            </>
          )}
        </div>
      </button>
    );
  }

  const isHardhat = chainId === '0x7a69' || chainId === 31337 || chainId === '31337';
  const isSepolia = chainId === '0xaa36a7' || chainId === 11155111 || chainId === '11155111';

  let networkLabel = 'Mainnet / Other';
  let networkColor = 'bg-slate-400';

  if (isHardhat) {
    networkLabel = 'Hardhat 31337';
    networkColor = 'bg-amber-400';
  } else if (isSepolia) {
    networkLabel = 'Sepolia';
    networkColor = 'bg-indigo-400';
  }

  return (
    <div className="relative">
      <div className="flex items-center gap-1.5 bg-surface-card border border-white/10 rounded-xl p-1 shadow-md">
        {/* Network Toggle Button */}
        <button
          onClick={() => switchNetwork(isHardhat ? 'sepolia' : 'hardhat')}
          title="Click to switch between Hardhat Local and Sepolia"
          className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[11px] font-mono font-semibold bg-white/5 hover:bg-white/10 text-slate-300 transition-all"
        >
          <span className={`w-1.5 h-1.5 rounded-full ${networkColor} animate-pulse`} />
          <span>{networkLabel}</span>
        </button>

        {/* Address and Dropdown Toggle */}
        <button
          onClick={() => setShowDropdown(!showDropdown)}
          className="flex items-center gap-2 px-2.5 py-1 rounded-lg bg-purple-600/15 border border-purple-500/20 hover:border-purple-500/40 text-purple-300 transition-all font-mono text-xs font-semibold"
        >
          <span className="w-2 h-2 rounded-full bg-emerald-400 inline-block" />
          <span>{truncatedAddress}</span>
          <svg className="w-3 h-3 text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
          </svg>
        </button>
      </div>

      {/* Wallet Options Dropdown */}
      {showDropdown && (
        <div
          className="absolute right-0 mt-2 w-52 bg-surface-panel border border-white/10 rounded-xl shadow-2xl p-2 z-50 animate-fadeIn"
          onMouseLeave={() => setShowDropdown(false)}
        >
          <div className="px-3 py-2 border-b border-white/5 mb-1">
            <div className="text-[10px] text-slate-400 uppercase font-mono">Connected Account</div>
            <div className="text-xs text-white font-mono truncate">{account}</div>
          </div>

          <button
            onClick={copyAddress}
            className="w-full text-left px-3 py-1.5 rounded-lg text-xs font-medium text-slate-300 hover:text-white hover:bg-white/5 flex items-center justify-between transition-colors"
          >
            <span>{copied ? '✓ Copied Address!' : '📋 Copy Address'}</span>
          </button>

          <button
            onClick={() => switchNetwork('hardhat')}
            className="w-full text-left px-3 py-1.5 rounded-lg text-xs font-medium text-slate-300 hover:text-white hover:bg-white/5 flex items-center justify-between transition-colors"
          >
            <span>Switch to Hardhat (Local)</span>
            {isHardhat && <span className="text-amber-400 text-xs">● Active</span>}
          </button>

          <button
            onClick={() => switchNetwork('sepolia')}
            className="w-full text-left px-3 py-1.5 rounded-lg text-xs font-medium text-slate-300 hover:text-white hover:bg-white/5 flex items-center justify-between transition-colors"
          >
            <span>Switch to Sepolia</span>
            {isSepolia && <span className="text-indigo-400 text-xs">● Active</span>}
          </button>

          <div className="border-t border-white/5 my-1" />

          <button
            onClick={() => {
              disconnectWallet();
              setShowDropdown(false);
            }}
            className="w-full text-left px-3 py-1.5 rounded-lg text-xs font-medium text-rose-400 hover:bg-rose-950/40 transition-colors flex items-center gap-2"
          >
            <span>✕ Disconnect Wallet</span>
          </button>
        </div>
      )}
    </div>
  );
}
