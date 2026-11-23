import { Link } from 'react-router-dom'
import WalletButton from './WalletButton.jsx'

export default function Navbar() {
  return (
    <nav className="bg-gray-900 border-b border-gray-800 px-6 py-4 flex items-center justify-between sticky top-0 z-50">
      {/* Left: Logo */}
      <Link to="/" className="text-white font-bold text-xl hover:text-purple-400 transition">
        🎵 Harmoniq
      </Link>

      {/* Center: Nav Links */}
      <div className="hidden md:flex items-center gap-6">
        <Link to="/" className="text-gray-300 hover:text-white text-sm transition">
          Home
        </Link>
        <Link to="/marketplace" className="text-gray-300 hover:text-white text-sm transition">
          Marketplace
        </Link>
        <Link to="/upload" className="text-gray-300 hover:text-white text-sm transition">
          Upload
        </Link>
        <Link to="/dashboard" className="text-gray-300 hover:text-white text-sm transition">
          Dashboard
        </Link>
        <Link to="/leaderboard" className="text-gray-300 hover:text-white text-sm transition">
          Leaderboard
        </Link>
      </div>

      {/* Right: Wallet */}
      <WalletButton />
    </nav>
  )
}
