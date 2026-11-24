import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';

import producersRouter from './routes/producers.js';
import tracksRouter from './routes/tracks.js';
import stemsRouter from './routes/stems.js';
import licensesRouter from './routes/licenses.js';
import royaltiesRouter from './routes/royalties.js';
import reviewsRouter from './routes/reviews.js';

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors());
app.use(
  helmet({
    contentSecurityPolicy: false, // Allow interactive inline scripts for API explorer
  })
);
app.use(morgan('dev'));
app.use(express.json());

// Interactive API Explorer & Viva Documentation Page
app.get(['/', '/docs', '/api/docs'], (req, res) => {
  res.setHeader('Content-Type', 'text/html');
  res.send(`<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Harmoniq Backend API Explorer</title>
  <link href="https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@400;500;700&family=Plus+Jakarta+Sans:wght@400;500;600;700;800&display=swap" rel="stylesheet">
  <style>
    :root {
      --bg: #0b0f19;
      --card-bg: #131b2e;
      --border: #232f48;
      --accent: #6366f1;
      --accent-glow: rgba(99, 102, 241, 0.25);
      --text: #f3f4f6;
      --text-muted: #9ca3af;
      --green: #10b981;
      --blue: #3b82f6;
      --purple: #a855f7;
      --amber: #f59e0b;
    }
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body {
      font-family: 'Plus Jakarta Sans', -apple-system, sans-serif;
      background: var(--bg);
      color: var(--text);
      line-height: 1.5;
      padding: 32px 20px 80px;
    }
    .container {
      max-width: 1100px;
      margin: 0 auto;
    }
    header {
      background: linear-gradient(135deg, rgba(99, 102, 241, 0.15) 0%, rgba(168, 85, 247, 0.1) 100%);
      border: 1px solid var(--border);
      border-radius: 16px;
      padding: 32px;
      margin-bottom: 32px;
      position: relative;
      overflow: hidden;
    }
    header::after {
      content: '';
      position: absolute;
      top: -50px;
      right: -50px;
      width: 200px;
      height: 200px;
      background: radial-gradient(circle, var(--accent-glow) 0%, transparent 70%);
      pointer-events: none;
    }
    .badge-row {
      display: flex;
      flex-wrap: wrap;
      gap: 8px;
      margin-bottom: 12px;
    }
    .badge {
      display: inline-flex;
      align-items: center;
      padding: 4px 10px;
      border-radius: 9999px;
      font-size: 11px;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 0.05em;
    }
    .badge-purple { background: rgba(168, 85, 247, 0.2); color: #c084fc; border: 1px solid rgba(168, 85, 247, 0.3); }
    .badge-blue { background: rgba(59, 130, 246, 0.2); color: #60a5fa; border: 1px solid rgba(59, 130, 246, 0.3); }
    .badge-green { background: rgba(16, 185, 129, 0.2); color: #34d399; border: 1px solid rgba(16, 185, 129, 0.3); }
    h1 {
      font-size: 32px;
      font-weight: 800;
      letter-spacing: -0.02em;
      margin-bottom: 8px;
      background: linear-gradient(to right, #ffffff, #cbd5e1);
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
    }
    .subtitle {
      color: var(--text-muted);
      font-size: 16px;
      margin-bottom: 16px;
    }
    .meta-box {
      background: rgba(0, 0, 0, 0.3);
      border: 1px solid var(--border);
      border-radius: 10px;
      padding: 12px 16px;
      font-size: 13px;
      display: flex;
      justify-content: space-between;
      flex-wrap: wrap;
      gap: 12px;
    }
    .meta-box strong { color: #fff; }
    .nav-bar {
      display: flex;
      gap: 12px;
      margin-top: 16px;
      flex-wrap: wrap;
    }
    .nav-btn {
      background: var(--card-bg);
      border: 1px solid var(--border);
      color: var(--text);
      text-decoration: none;
      padding: 8px 16px;
      border-radius: 8px;
      font-size: 13px;
      font-weight: 600;
      transition: all 0.2s;
      display: inline-flex;
      align-items: center;
      gap: 6px;
    }
    .nav-btn:hover {
      background: var(--border);
      border-color: var(--accent);
      color: #fff;
    }
    .section-title {
      font-size: 20px;
      font-weight: 700;
      margin: 32px 0 16px;
      display: flex;
      align-items: center;
      gap: 10px;
    }
    .card {
      background: var(--card-bg);
      border: 1px solid var(--border);
      border-radius: 12px;
      margin-bottom: 16px;
      overflow: hidden;
      transition: border-color 0.2s;
    }
    .card:hover {
      border-color: #3b4d75;
    }
    .card-header {
      padding: 16px 20px;
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 16px;
      cursor: pointer;
      user-select: none;
    }
    .endpoint-left {
      display: flex;
      align-items: center;
      gap: 12px;
      flex: 1;
      overflow: hidden;
    }
    .method {
      font-family: 'JetBrains Mono', monospace;
      font-size: 12px;
      font-weight: 700;
      padding: 4px 10px;
      border-radius: 6px;
      text-align: center;
      min-width: 58px;
    }
    .method-get { background: rgba(16, 185, 129, 0.2); color: #34d399; }
    .method-post { background: rgba(59, 130, 246, 0.2); color: #60a5fa; }
    .path {
      font-family: 'JetBrains Mono', monospace;
      font-size: 14px;
      font-weight: 600;
      color: #fff;
      word-break: break-all;
    }
    .desc {
      color: var(--text-muted);
      font-size: 13px;
    }
    .actions {
      display: flex;
      align-items: center;
      gap: 8px;
    }
    .btn {
      padding: 6px 12px;
      border-radius: 6px;
      font-size: 12px;
      font-weight: 600;
      cursor: pointer;
      border: 1px solid var(--border);
      background: #1a233a;
      color: var(--text);
      transition: all 0.2s;
      text-decoration: none;
      display: inline-flex;
      align-items: center;
      gap: 4px;
    }
    .btn:hover {
      background: var(--accent);
      color: #fff;
      border-color: var(--accent);
    }
    .btn-run {
      background: rgba(99, 102, 241, 0.2);
      border-color: rgba(99, 102, 241, 0.5);
      color: #a5b4fc;
    }
    .btn-run:hover {
      background: var(--accent);
      color: #fff;
    }
    .card-body {
      padding: 0 20px 20px;
      border-top: 1px solid rgba(255, 255, 255, 0.05);
      display: none;
    }
    .card-body.open {
      display: block;
      padding-top: 16px;
    }
    .db-note {
      font-size: 12px;
      color: #818cf8;
      background: rgba(99, 102, 241, 0.08);
      padding: 8px 12px;
      border-radius: 6px;
      margin-bottom: 12px;
      border-left: 3px solid var(--accent);
    }
    .response-box {
      background: #080c14;
      border: 1px solid var(--border);
      border-radius: 8px;
      padding: 12px;
      font-family: 'JetBrains Mono', monospace;
      font-size: 12px;
      color: #e2e8f0;
      max-height: 280px;
      overflow-y: auto;
      white-space: pre-wrap;
      word-break: break-all;
    }
    .status-bar {
      display: flex;
      justify-content: space-between;
      font-size: 11px;
      font-family: 'JetBrains Mono', monospace;
      margin-bottom: 6px;
      color: var(--text-muted);
    }
    .status-ok { color: var(--green); font-weight: bold; }
    .status-err { color: #f87171; font-weight: bold; }
    footer {
      text-align: center;
      margin-top: 60px;
      font-size: 13px;
      color: var(--text-muted);
    }
  </style>
</head>
<body>
  <div class="container">
    <header>
      <div class="badge-row">
        <span class="badge badge-purple">RVCE DBMS Project</span>
        <span class="badge badge-blue">REST API + Smart Contracts</span>
        <span class="badge badge-green">Live Server Active (:3001)</span>
      </div>
      <h1>Harmoniq API Explorer</h1>
      <p class="subtitle">Blockchain-Based Song Stem Management System with Proof-of-Stem™ & ERC-721 Tokenization</p>
      
      <div class="meta-box">
        <div><strong>Students:</strong> Milan Barik (1RV24IS070) & Mohammed Kashif Ashfiyaan (1RV24IS074)</div>
        <div><strong>Institution:</strong> Dept. of Information Science & Engineering, RVCE</div>
        <div><strong>Stack:</strong> Express 4, Supabase (PostgreSQL), Solidity (Cancun EVM), Ethers.js v6, FastAPI</div>
      </div>

      <div class="nav-bar">
        <a class="nav-btn" href="http://localhost:5173" target="_blank">🌐 Open Frontend Web App (:5173)</a>
        <a class="nav-btn" href="/api/health" target="_blank">🩺 Raw Health Status</a>
        <a class="nav-btn" href="https://github.com/MohammedKashif786/harmoniq" target="_blank">📂 GitHub Repository</a>
      </div>
    </header>

    <h2 class="section-title">🚀 1. System Health & Infrastructure</h2>

    <div class="card">
      <div class="card-header" onclick="toggleCard('health')">
        <div class="endpoint-left">
          <span class="method method-get">GET</span>
          <span class="path">/api/health</span>
          <span class="desc">— Backend uptime & timestamp verification</span>
        </div>
        <div class="actions">
          <button class="btn btn-run" onclick="runApi(event, '/api/health', 'health')">▶ Try Live</button>
          <a class="btn" href="/api/health" target="_blank">↗ New Tab</a>
        </div>
      </div>
      <div class="card-body" id="body-health">
        <div class="db-note">💡 Simple sanity check verifying Express server event loop and node lifecycle.</div>
        <div class="status-bar" id="status-health">Ready to query...</div>
        <div class="response-box" id="res-health">// Click "Try Live" to fetch real-time response</div>
      </div>
    </div>

    <h2 class="section-title">🎵 2. Audio Stems & Proof-of-Stem™ NFTs</h2>

    <div class="card">
      <div class="card-header" onclick="toggleCard('stems-all')">
        <div class="endpoint-left">
          <span class="method method-get">GET</span>
          <span class="path">/api/stems</span>
          <span class="desc">— List all stems with acoustic hashes & ERC-721 mints</span>
        </div>
        <div class="actions">
          <button class="btn btn-run" onclick="runApi(event, '/api/stems', 'stems-all')">▶ Try Live</button>
          <a class="btn" href="/api/stems" target="_blank">↗ New Tab</a>
        </div>
      </div>
      <div class="card-body" id="body-stems-all">
        <div class="db-note">💡 Queries <code>audio_stems</code> joined with <code>tracks</code>, <code>producers</code>, and <code>stem_mints</code>. Shows on-chain Token IDs and TX hashes.</div>
        <div class="status-bar" id="status-stems-all">Ready to query...</div>
        <div class="response-box" id="res-stems-all">// Click "Try Live" to fetch real-time response</div>
      </div>
    </div>

    <div class="card">
      <div class="card-header" onclick="toggleCard('stems-popular')">
        <div class="endpoint-left">
          <span class="method method-get">GET</span>
          <span class="path">/api/stems/popular</span>
          <span class="desc">— Top stems ranked by license volume</span>
        </div>
        <div class="actions">
          <button class="btn btn-run" onclick="runApi(event, '/api/stems/popular', 'stems-popular')">▶ Try Live</button>
          <a class="btn" href="/api/stems/popular" target="_blank">↗ New Tab</a>
        </div>
      </div>
      <div class="card-body" id="body-stems-popular">
        <div class="db-note">💡 Executes SQL View <code>v_stem_popularity</code>. Aggregates commercial, remix, and exclusive license sales per stem.</div>
        <div class="status-bar" id="status-stems-popular">Ready to query...</div>
        <div class="response-box" id="res-stems-popular">// Click "Try Live" to fetch real-time response</div>
      </div>
    </div>

    <div class="card">
      <div class="card-header" onclick="toggleCard('stem-single')">
        <div class="endpoint-left">
          <span class="method method-get">GET</span>
          <span class="path">/api/stems/1</span>
          <span class="desc">— Single stem details, track master info & licenses</span>
        </div>
        <div class="actions">
          <button class="btn btn-run" onclick="runApi(event, '/api/stems/1', 'stem-single')">▶ Try Live</button>
          <a class="btn" href="/api/stems/1" target="_blank">↗ New Tab</a>
        </div>
      </div>
      <div class="card-body" id="body-stem-single">
        <div class="db-note">💡 Fetches stem #1 ('Midnight Sub') with creator wallet, BPM, key, and smart contract mint data.</div>
        <div class="status-bar" id="status-stem-single">Ready to query...</div>
        <div class="response-box" id="res-stem-single">// Click "Try Live" to fetch real-time response</div>
      </div>
    </div>

    <h2 class="section-title">👤 3. Producer Registry & Web3 Wallets</h2>

    <div class="card">
      <div class="card-header" onclick="toggleCard('producers-all')">
        <div class="endpoint-left">
          <span class="method method-get">GET</span>
          <span class="path">/api/producers</span>
          <span class="desc">— Public producers with Ethereum addresses & reputation</span>
        </div>
        <div class="actions">
          <button class="btn btn-run" onclick="runApi(event, '/api/producers', 'producers-all')">▶ Try Live</button>
          <a class="btn" href="/api/producers" target="_blank">↗ New Tab</a>
        </div>
      </div>
      <div class="card-body" id="body-producers-all">
        <div class="db-note">💡 Executes SQL View <code>v_public_producers</code>. Hides sensitive emails while exposing verified wallet addresses and scores.</div>
        <div class="status-bar" id="status-producers-all">Ready to query...</div>
        <div class="response-box" id="res-producers-all">// Click "Try Live" to fetch real-time response</div>
      </div>
    </div>

    <div class="card">
      <div class="card-header" onclick="toggleCard('producer-single')">
        <div class="endpoint-left">
          <span class="method method-get">GET</span>
          <span class="path">/api/producers/1</span>
          <span class="desc">— Producer profile along with catalog of tracks</span>
        </div>
        <div class="actions">
          <button class="btn btn-run" onclick="runApi(event, '/api/producers/1', 'producer-single')">▶ Try Live</button>
          <a class="btn" href="/api/producers/1" target="_blank">↗ New Tab</a>
        </div>
      </div>
      <div class="card-body" id="body-producer-single">
        <div class="db-note">💡 Returns producer 'kilowave' and associated master compositions ('Neon Hours', 'Redline').</div>
        <div class="status-bar" id="status-producer-single">Ready to query...</div>
        <div class="response-box" id="res-producer-single">// Click "Try Live" to fetch real-time response</div>
      </div>
    </div>

    <h2 class="section-title">🎼 4. Master Tracks & Audio Metadata</h2>

    <div class="card">
      <div class="card-header" onclick="toggleCard('tracks-all')">
        <div class="endpoint-left">
          <span class="method method-get">GET</span>
          <span class="path">/api/tracks</span>
          <span class="desc">— All tracks with BPM, musical key & acoustic hashes</span>
        </div>
        <div class="actions">
          <button class="btn btn-run" onclick="runApi(event, '/api/tracks', 'tracks-all')">▶ Try Live</button>
          <a class="btn" href="/api/tracks" target="_blank">↗ New Tab</a>
        </div>
      </div>
      <div class="card-body" id="body-tracks-all">
        <div class="db-note">💡 Queries <code>tracks</code> table. Supports query parameters <code>?genre=Synthwave&bpm_min=100</code>.</div>
        <div class="status-bar" id="status-tracks-all">Ready to query...</div>
        <div class="response-box" id="res-tracks-all">// Click "Try Live" to fetch real-time response</div>
      </div>
    </div>

    <div class="card">
      <div class="card-header" onclick="toggleCard('track-single')">
        <div class="endpoint-left">
          <span class="method method-get">GET</span>
          <span class="path">/api/tracks/1</span>
          <span class="desc">— Track detail including stems and royalty splits</span>
        </div>
        <div class="actions">
          <button class="btn btn-run" onclick="runApi(event, '/api/tracks/1', 'track-single')">▶ Try Live</button>
          <a class="btn" href="/api/tracks/1" target="_blank">↗ New Tab</a>
        </div>
      </div>
      <div class="card-body" id="body-track-single">
        <div class="db-note">💡 Composite query joining <code>tracks</code>, <code>audio_stems</code>, and <code>royalty_splits</code>.</div>
        <div class="status-bar" id="status-track-single">Ready to query...</div>
        <div class="response-box" id="res-track-single">// Click "Try Live" to fetch real-time response</div>
      </div>
    </div>

    <h2 class="section-title">📜 5. Smart Contract Stem Licensing</h2>

    <div class="card">
      <div class="card-header" onclick="toggleCard('licenses-all')">
        <div class="endpoint-left">
          <span class="method method-get">GET</span>
          <span class="path">/api/licenses</span>
          <span class="desc">— On-chain license transactions (Commercial, Remix, Exclusive)</span>
        </div>
        <div class="actions">
          <button class="btn btn-run" onclick="runApi(event, '/api/licenses', 'licenses-all')">▶ Try Live</button>
          <a class="btn" href="/api/licenses" target="_blank">↗ New Tab</a>
        </div>
      </div>
      <div class="card-body" id="body-licenses-all">
        <div class="db-note">💡 Queries <code>licenses</code> table mapping on-chain ETH payments, 2.5% platform fee deduction, and buyer wallets.</div>
        <div class="status-bar" id="status-licenses-all">Ready to query...</div>
        <div class="response-box" id="res-licenses-all">// Click "Try Live" to fetch real-time response</div>
      </div>
    </div>

    <h2 class="section-title">🏆 6. Reputation & Feedback (SQL Triggers)</h2>

    <div class="card">
      <div class="card-header" onclick="toggleCard('leaderboard')">
        <div class="endpoint-left">
          <span class="method method-get">GET</span>
          <span class="path">/api/reviews/leaderboard</span>
          <span class="desc">— Top ranked producers via automated reputation trigger</span>
        </div>
        <div class="actions">
          <button class="btn btn-run" onclick="runApi(event, '/api/reviews/leaderboard', 'leaderboard')">▶ Try Live</button>
          <a class="btn" href="/api/reviews/leaderboard" target="_blank">↗ New Tab</a>
        </div>
      </div>
      <div class="card-body" id="body-leaderboard">
        <div class="db-note">💡 Demonstrates PostgreSQL trigger <code>trg_update_producer_reputation</code> automatically recalculating average ratings on stem review insertions.</div>
        <div class="status-bar" id="status-leaderboard">Ready to query...</div>
        <div class="response-box" id="res-leaderboard">// Click "Try Live" to fetch real-time response</div>
      </div>
    </div>

    <div class="card">
      <div class="card-header" onclick="toggleCard('reviews-stem')">
        <div class="endpoint-left">
          <span class="method method-get">GET</span>
          <span class="path">/api/reviews/stem/1</span>
          <span class="desc">— All community ratings and feedback for stem #1</span>
        </div>
        <div class="actions">
          <button class="btn btn-run" onclick="runApi(event, '/api/reviews/stem/1', 'reviews-stem')">▶ Try Live</button>
          <a class="btn" href="/api/reviews/stem/1" target="_blank">↗ New Tab</a>
        </div>
      </div>
      <div class="card-body" id="body-reviews-stem">
        <div class="db-note">💡 Returns reviews submitted for 'Midnight Sub' with reviewer usernames and 1-5 star ratings.</div>
        <div class="status-bar" id="status-reviews-stem">Ready to query...</div>
        <div class="response-box" id="res-reviews-stem">// Click "Try Live" to fetch real-time response</div>
      </div>
    </div>

    <h2 class="section-title">💰 7. Collaborator Royalty Splits (ERC-2981 Standard)</h2>

    <div class="card">
      <div class="card-header" onclick="toggleCard('royalty-splits')">
        <div class="endpoint-left">
          <span class="method method-get">GET</span>
          <span class="path">/api/royalties/track/1</span>
          <span class="desc">— Collaborator wallet shares in Basis Points (BPS)</span>
        </div>
        <div class="actions">
          <button class="btn btn-run" onclick="runApi(event, '/api/royalties/track/1', 'royalty-splits')">▶ Try Live</button>
          <a class="btn" href="/api/royalties/track/1" target="_blank">↗ New Tab</a>
        </div>
      </div>
      <div class="card-body" id="body-royalty-splits">
        <div class="db-note">💡 Corresponds to Solidity contract <code>RoyaltySplitter.sol</code>. Enforces 100% split invariant before on-chain payout distribution.</div>
        <div class="status-bar" id="status-royalty-splits">Ready to query...</div>
        <div class="response-box" id="res-royalty-splits">// Click "Try Live" to fetch real-time response</div>
      </div>
    </div>

    <footer>
      Harmoniq: Blockchain-Based Song Stem Management System &bull; RVCE DBMS Mini-Project &bull; Milan Barik & Mohammed Kashif Ashfiyaan
    </footer>
  </div>

  <script>
    function toggleCard(id) {
      const body = document.getElementById('body-' + id);
      if (body) {
        body.classList.toggle('open');
      }
    }

    async function runApi(e, url, id) {
      e.stopPropagation();
      const body = document.getElementById('body-' + id);
      const resBox = document.getElementById('res-' + id);
      const statusBar = document.getElementById('status-' + id);

      body.classList.add('open');
      statusBar.innerHTML = 'Fetching: ' + url + ' ...';
      resBox.innerText = 'Loading...';

      const startTime = performance.now();
      try {
        const res = await fetch(url);
        const data = await res.json();
        const duration = Math.round(performance.now() - startTime);

        statusBar.innerHTML = '<span class="status-ok">STATUS ' + res.status + ' OK</span> &bull; Latency: ' + duration + 'ms &bull; Type: ' + res.headers.get('content-type');
        resBox.innerText = JSON.stringify(data, null, 2);
      } catch (err) {
        const duration = Math.round(performance.now() - startTime);
        statusBar.innerHTML = '<span class="status-err">ERROR</span> &bull; Latency: ' + duration + 'ms';
        resBox.innerText = 'Fetch failed: ' + err.message;
      }
    }
  </script>
</body>
</html>`);
});

// Health check
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    project: 'Harmoniq: Blockchain-Based Song Stem Management System',
    evaluators_info: {
      institution: 'RV College of Engineering (RVCE)',
      department: 'Information Science & Engineering (ISE)',
      team: [
        { name: 'Milan Barik', usn: '1RV24IS070' },
        { name: 'Mohammed Kashif Ashfiyaan', usn: '1RV24IS074' },
      ],
    },
    blockchain_rpc: process.env.RPC_URL || 'http://127.0.0.1:8545',
    timestamp: new Date().toISOString(),
  });
});

// Routes
app.use('/api/producers', producersRouter);
app.use('/api/tracks', tracksRouter);
app.use('/api/stems', stemsRouter);
app.use('/api/licenses', licensesRouter);
app.use('/api/royalties', royaltiesRouter);
app.use('/api/reviews', reviewsRouter);

// Global error handler
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: 'Internal Server Error', message: err.message });
});

app.listen(PORT, () => {
  console.log(`Harmoniq backend running on port ${PORT}`);
  console.log(`API Explorer and Documentation live at: http://localhost:${PORT}/`);
});

export default app;
