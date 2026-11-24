import { Link, useLocation } from 'react-router-dom';
import WalletButton from './WalletButton.jsx';

export default function Navbar() {
  const location = useLocation();

  const navLinks = [
    { to: '/', label: 'Home' },
    { to: '/marketplace', label: 'Marketplace' },
    { to: '/upload', label: 'Upload Studio' },
    { to: '/dashboard', label: 'Dashboard' },
    { to: '/leaderboard', label: 'Leaderboard' },
  ];

  const isActive = (path) => {
    if (path === '/' && location.pathname === '/') return true;
    if (path !== '/' && location.pathname.startsWith(path)) return true;
    return false;
  };

  return (
    <nav className="sticky top-0 z-50 backdrop-blur-xl bg-[#080b11]/85 border-b border-white/5 transition-all">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-18 py-3.5">
          {/* Left: Brand Identity */}
          <div className="flex items-center gap-8">
            <Link to="/" className="flex items-center gap-2.5 group">
              <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-purple-600 via-indigo-600 to-cyan-400 p-[1px] shadow-lg shadow-purple-500/20 group-hover:shadow-purple-500/40 transition-all">
                <div className="w-full h-full bg-[#0b0f19] rounded-[11px] flex items-center justify-center">
                  <span className="text-base font-bold bg-gradient-to-tr from-purple-400 to-cyan-300 bg-clip-text text-transparent">
                    ⚡
                  </span>
                </div>
              </div>
              <div className="flex flex-col">
                <div className="flex items-center gap-2">
                  <span className="text-white font-extrabold text-lg tracking-tight group-hover:text-purple-300 transition-colors">
                    HARMONIQ
                  </span>
                  <span className="text-[10px] font-mono font-semibold px-1.5 py-0.5 rounded bg-purple-500/10 text-purple-400 border border-purple-500/20">
                    v2.0
                  </span>
                </div>
                <span className="text-[11px] text-slate-400 font-medium tracking-tight -mt-1 hidden sm:inline">
                  Decentralized Song Stem Protocol
                </span>
              </div>
            </Link>

            {/* Desktop Nav Links */}
            <div className="hidden md:flex items-center gap-1 bg-surface-card/60 p-1 rounded-xl border border-white/5">
              {navLinks.map((link) => {
                const active = isActive(link.to);
                return (
                  <Link
                    key={link.to}
                    to={link.to}
                    className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                      active
                        ? 'bg-purple-600/20 text-purple-300 border border-purple-500/30 shadow-sm'
                        : 'text-slate-400 hover:text-white hover:bg-white/5'
                    }`}
                  >
                    {link.label}
                  </Link>
                );
              })}
            </div>
          </div>

          {/* Right: Actions & Web3 Wallet */}
          <div className="flex items-center gap-3">
            {/* Direct Backend API Explorer link for evaluators */}
            <a
              href="http://localhost:3001/"
              target="_blank"
              rel="noopener noreferrer"
              className="hidden lg:flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-indigo-950/40 border border-indigo-800/40 text-indigo-300 hover:text-white hover:bg-indigo-900/40 text-xs font-mono font-semibold transition-all"
              title="Open the interactive backend documentation and live test console"
            >
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
              API Explorer ↗
            </a>

            {/* Web3 Connect Wallet Button */}
            <WalletButton />
          </div>
        </div>
      </div>
    </nav>
  );
}
