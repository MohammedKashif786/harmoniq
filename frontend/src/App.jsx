import { Routes, Route } from 'react-router-dom'
import Navbar from './components/Navbar.jsx'
import Home from './pages/Home.jsx'
import Marketplace from './pages/Marketplace.jsx'
import StemDetail from './pages/StemDetail.jsx'
import TrackDetail from './pages/TrackDetail.jsx'
import Upload from './pages/Upload.jsx'
import Dashboard from './pages/Dashboard.jsx'
import Leaderboard from './pages/Leaderboard.jsx'
import RemixStudio from './pages/RemixStudio.jsx'

export default function App() {
  return (
    <div className="min-h-screen bg-[#0F0F0F]">
      <Navbar />
      <main>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/marketplace" element={<Marketplace />} />
          <Route path="/studio" element={<RemixStudio />} />
          <Route path="/remix" element={<RemixStudio />} />
          <Route path="/stems/:id" element={<StemDetail />} />
          <Route path="/tracks/:id" element={<TrackDetail />} />
          <Route path="/upload" element={<Upload />} />
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/leaderboard" element={<Leaderboard />} />
        </Routes>
      </main>
    </div>
  )
}
