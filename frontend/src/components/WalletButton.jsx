import { useState } from 'react'
import useWallet from '../hooks/useWallet.js'

export default function WalletButton() {
  const { isConnected, isConnecting, truncatedAddress, connectWallet, disconnectWallet } =
    useWallet()
  const [hovered, setHovered] = useState(false)

  if (typeof window !== 'undefined' && !window.ethereum) {
    return (
      <button
        onClick={() => window.open('https://metamask.io', '_blank')}
        className="bg-orange-600 hover:bg-orange-700 rounded-lg px-4 py-2 text-white text-sm font-medium transition"
      >
        Install MetaMask
      </button>
    )
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
    )
  }

  return (
    <div
      className="bg-gray-800 rounded-full px-4 py-2 flex items-center gap-2 cursor-pointer hover:bg-gray-700 transition"
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      onClick={hovered ? disconnectWallet : undefined}
      title="Click to disconnect"
    >
      <span className="w-2 h-2 rounded-full bg-green-400 inline-block" />
      <span className="text-white text-sm font-mono">{truncatedAddress}</span>
      {hovered && (
        <span className="text-red-400 text-xs ml-1">✕ Disconnect</span>
      )}
    </div>
  )
}
