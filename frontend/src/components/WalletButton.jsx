import { useState } from 'react';
import useWallet from '../hooks/useWallet.js';

export default function WalletButton() {
  const {
    isConnected,
    isConnecting,
    truncatedAddress,
    chainId,
    connectWallet,
    disconnectWallet,
    switchNetwork,
  } = useWallet();

  const [hovered, setHovered] = useState(false);

  if (typeof window !== 'undefined' && !window.ethereum) {
    return (
      <button
        onClick={() => window.open('https://metamask.io', '_blank')}
        className="bg-orange-600 hover:bg-orange-700 rounded-lg px-4 py-2 text-white text-sm font-medium transition"
      >
        Install MetaMask
      </button>
    );
  }

  if (!isConnected) {
    return (
      <button
        onClick={connectWallet}
        disabled={isConnecting}
        className="bg-purple-600 hover:bg-purple-700 disabled:opacity-60 rounded-lg px-4 py-2 text-white text-sm font-medium flex items-center gap-2 transition"
      >
        {isConnecting ? (
          <>
            <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
            </svg>
            Connecting...
          </>
        ) : (
          'Connect Wallet'
        )}
      </button>
    );
  }

  const isHardhat = chainId === '0x7a69' || chainId === 31337 || chainId === '31337';
  const isSepolia = chainId === '0xaa36a7' || chainId === 11155111 || chainId === '11155111';

  let networkLabel = 'Unknown Net';
  let networkClass = 'bg-gray-800 text-gray-400 border-gray-700';

  if (isHardhat) {
    networkLabel = 'Hardhat 31337';
    networkClass = 'bg-amber-950/60 text-amber-400 border-amber-800/80';
  } else if (isSepolia) {
    networkLabel = 'Sepolia';
    networkClass = 'bg-indigo-950/60 text-indigo-400 border-indigo-800/80';
  }

  return (
    <div className="flex items-center gap-2">
      {/* Network Switcher Pill */}
      <button
        onClick={() => switchNetwork(isHardhat ? 'sepolia' : 'hardhat')}
        title="Click to toggle between Hardhat Local and Sepolia"
        className={`border rounded-full px-2.5 py-1 text-xs font-mono font-semibold transition hover:brightness-125 ${networkClass}`}
      >
        ● {networkLabel}
      </button>

      {/* Account Info Pill */}
      <div
        className="bg-gray-800 border border-gray-700 rounded-full px-3.5 py-1.5 flex items-center gap-2 cursor-pointer hover:bg-gray-700 transition"
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
        onClick={hovered ? disconnectWallet : undefined}
        title="Click to disconnect"
      >
        <span className="w-2 h-2 rounded-full bg-emerald-400 inline-block" />
        <span className="text-white text-xs font-mono font-semibold">{truncatedAddress}</span>
        {hovered && (
          <span className="text-red-400 text-[11px] ml-1 font-bold">✕ Disconnect</span>
        )}
      </div>
    </div>
  );
}
