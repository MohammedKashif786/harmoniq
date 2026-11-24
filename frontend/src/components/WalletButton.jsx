import { useState } from 'react';
import useWallet from '../hooks/useWallet.js';

export default function WalletButton() {
  const {
    profile,
    profiles,
    account,
    balanceEth,
    truncatedAddress,
    switchProfile,
    connectMetaMask,
    isUsingMetaMask,
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

  return (
    <div className="relative">
      {/* Main Identity Pill */}
      <div className="flex items-center gap-1.5 bg-surface-card border border-white/10 rounded-2xl p-1 shadow-lg hover:border-purple-500/40 transition-all">
        {/* Profile Switcher Trigger */}
        <button
          onClick={() => setShowDropdown(!showDropdown)}
          className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-purple-600/15 border border-purple-500/20 hover:border-purple-500/50 text-white transition-all text-xs font-semibold"
        >
          <span className="text-base">{profile.avatar}</span>
          <div className="flex flex-col text-left">
            <span className="text-white font-bold leading-tight flex items-center gap-1">
              {profile.name}
              <svg className="w-3 h-3 text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
              </svg>
            </span>
            <span className="text-[10px] text-purple-300 font-mono font-medium -mt-0.5">
              {profile.usn}
            </span>
          </div>
        </button>

        {/* Live ETH Balance Pill */}
        <div className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#080b11] border border-white/5 text-xs font-mono font-bold text-emerald-400">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
          <span>{balanceEth} ETH</span>
        </div>

        {/* Address Pill with Copy */}
        <button
          onClick={copyAddress}
          className="hidden md:flex items-center gap-1 px-2.5 py-1.5 rounded-xl bg-white/5 hover:bg-white/10 text-slate-300 text-xs font-mono transition-colors"
          title="Click to copy Web3 address"
        >
          <span>{copied ? '✓ Copied' : truncatedAddress}</span>
        </button>
      </div>

      {/* Profile Switcher Modal / Dropdown */}
      {showDropdown && (
        <div
          className="absolute right-0 mt-2 w-72 bg-[#0e1422] border border-purple-500/30 rounded-2xl shadow-2xl p-3 z-50 animate-fadeIn"
          onMouseLeave={() => setShowDropdown(false)}
        >
          <div className="px-3 py-2 border-b border-white/5 mb-2">
            <div className="text-[10px] text-purple-400 uppercase font-mono font-bold tracking-wider">
              🎓 Switch Web3 Identity / Viva Mode
            </div>
            <p className="text-[11px] text-slate-400 mt-0.5">
              Simulate multi-user licensing & royalty flows with pre-funded wallets.
            </p>
          </div>

          <div className="space-y-1.5">
            {profiles.map((p) => {
              const isSelected = profile.id === p.id && !isUsingMetaMask;
              return (
                <button
                  key={p.id}
                  onClick={() => {
                    switchProfile(p.id);
                    setShowDropdown(false);
                  }}
                  className={`w-full text-left p-2.5 rounded-xl text-xs transition-all flex items-center justify-between border ${
                    isSelected
                      ? 'bg-purple-600/20 border-purple-500/50 text-white shadow-md'
                      : 'border-transparent text-slate-300 hover:bg-white/5 hover:text-white'
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <span className="text-xl">{p.avatar}</span>
                    <div>
                      <div className="font-bold flex items-center gap-1.5">
                        <span>{p.name}</span>
                        {isSelected && <span className="text-emerald-400 text-[10px]">● Active</span>}
                      </div>
                      <div className="text-[10px] text-slate-400 font-mono">{p.role}</div>
                    </div>
                  </div>
                  <div className="text-right font-mono font-bold text-emerald-400 text-xs">
                    {p.balanceEth.toFixed(2)} ETH
                  </div>
                </button>
              );
            })}
          </div>

          {typeof window !== 'undefined' && window.ethereum && (
            <div className="pt-2 mt-2 border-t border-white/5">
              <button
                onClick={() => {
                  connectMetaMask();
                  setShowDropdown(false);
                }}
                className="w-full text-left p-2 rounded-xl text-xs font-mono text-cyan-400 hover:bg-cyan-950/40 flex items-center gap-2 transition-colors"
              >
                <span>🦊</span>
                <span>Connect External MetaMask</span>
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
