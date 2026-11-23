# Harmoniq: Blockchain-Based Song Stem Management System

A hybrid **PostgreSQL (Supabase) + Ethereum (Sepolia testnet)** music stem marketplace and provenance platform.

---

## 🏛️ Architecture Overview

Harmoniq solves copyright ambiguities, unauthorized sample reuse, and synthetic voice cloning through a dual-tier hybrid architecture:

1. **Relational Layer (Supabase / PostgreSQL)**:
   - High-throughput metadata querying for producers, tracks, audio stems, reviews, and stream metrics.
   - Database triggers enforce constraints (e.g. royalty shares must strictly total 100%, and producer reputation is dynamically updated from critique ratings).

2. **Decentralized Layer (Ethereum / Sepolia Testnet)**:
   - **StemNFT (`StemNFT.sol`)**: ERC-721 token representing permanent stem copyright and EIP-2981 royalty standards. Links token IDs directly to off-chain stem IDs and perceptual acoustic hashes ("Proof-of-Stem™").
   - **StemLicensing (`StemLicensing.sol`)**: Handles on-chain licensing purchases (Commercial, Remix, Exclusive) with ETH payments. Deducts a 2.5% platform fee and transfers the remainder directly to the stem owner.
   - **RoyaltySplitter (`RoyaltySplitter.sol`)**: Automatically splits incoming ETH license disbursements among track collaborators by basis-point share percentage (10,000 BPS = 100%).

---

## 📁 Repository Structure

```
harmoniq/
├── contracts/                  # Hardhat Ethereum Smart Contracts
│   ├── contracts/
│   │   ├── StemNFT.sol         # ERC-721 + ERC-2981 + Ownable
│   │   ├── StemLicensing.sol   # ETH Licensing & automated revenue routing
│   │   └── RoyaltySplitter.sol # Collaborator percentage distribution
│   ├── scripts/
│   │   ├── deploy.js           # Multi-contract deployment script
│   │   └── mint-stem.js        # On-chain minting execution script
│   ├── test/
│   │   └── StemNFT.test.js     # Comprehensive unit tests
│   └── hardhat.config.js       # Hardhat network config (Local + Sepolia)
│
├── backend/                    # Express.js REST API
│   ├── lib/
│   │   ├── blockchain.js       # ethers.js v6 providers & contract interactions
│   │   └── supabase.js         # Supabase client (Anon + Service Role)
│   ├── routes/
│   │   ├── stems.js            # Stem indexing & POST /api/stems/:id/mint
│   │   ├── licenses.js         # On-chain license verification & recording
│   │   ├── royalties.js        # Split configuration & distributeRoyalties
│   │   ├── tracks.js           # Master track catalog
│   │   ├── producers.js        # Producer registry & wallet validation
│   │   └── reviews.js          # Stem critiques & reputation leaderboard
│   └── server.js               # Express entry point (:3001)
│
├── frontend/                   # React 18 + Vite + TailwindCSS
│   ├── src/
│   │   ├── hooks/
│   │   │   ├── useWallet.js    # MetaMask connect, accountsChanged, chainChanged
│   │   │   └── useContract.js  # ethers v6 Contract instances from BrowserProvider
│   │   ├── components/
│   │   │   ├── Navbar.jsx      # Navigation bar + Wallet status
│   │   │   ├── WalletButton.jsx# Connect / Disconnect MetaMask pill
│   │   │   ├── StemCard.jsx    # Audio stem card with type and NFT badges
│   │   │   ├── StemPlayer.jsx  # Audio player with waveform visualization
│   │   │   ├── MintButton.jsx  # Proof-of-Stem™ Sepolia minting trigger
│   │   │   ├── LicenseButton.jsx # MetaMask ETH payment trigger
│   │   │   ├── RoyaltySplitForm.jsx # Collaborator shares validator (must total 100%)
│   │   │   └── ReviewForm.jsx  # 1-5 star critique submitting
│   │   └── pages/
│   │       ├── Home.jsx        # Landing hero, stats & trending stems
│   │       ├── Marketplace.jsx # Search & filters (Vocal/Bass/Drum/Melody, Human/AI)
│   │       ├── StemDetail.jsx  # Audio playback, cryptographic hashes, licensing
│   │       ├── TrackDetail.jsx # Master track, stem list, on-chain ETH disbursement
│   │       ├── Upload.jsx      # 2-step track & stem upload with acoustic hash
│   │       ├── Dashboard.jsx   # Connected producer stems, licenses, and tracks
│   │       └── Leaderboard.jsx # Producer reputation ranking from DB triggers
│   └── vite.config.js          # Vite config (:5173 with backend proxy)
│
└── sql/                        # Database Schemas & Scripts
    ├── schema.sql              # Core tables, triggers, indexes & RLS policies
    ├── seed.sql                # Sample producers, tracks, stems & licenses
    └── queries.sql             # Viva / Demo validation queries
```

---

## 🚀 Getting Started

### 1. Smart Contracts (`contracts/`)

```bash
cd contracts
npm install

# Compile contracts
npx hardhat compile

# Run tests
npx hardhat test

# Deploy to local network
npx hardhat node
npx hardhat run scripts/deploy.js --network localhost

# Deploy to Sepolia testnet (set PRIVATE_KEY & SEPOLIA_RPC_URL in .env)
npx hardhat run scripts/deploy.js --network sepolia
```

### 2. Backend (`backend/`)

```bash
cd backend
npm install

# Configure environment variables
cp .env.example .env
# Fill in SUPABASE_URL, SUPABASE_ANON_KEY, and deployed contract addresses

# Start backend server
npm start
# API runs on http://localhost:3001
```

### 3. Frontend (`frontend/`)

```bash
cd frontend
npm install

# Configure environment variables
cp .env.example .env
# Set VITE_STEM_NFT_ADDRESS, VITE_STEM_LICENSING_ADDRESS, VITE_ROYALTY_SPLITTER_ADDRESS

# Run Vite dev server
npm run dev
# Open http://localhost:5173
```

---

## 🔒 Security & Best Practices

- **Zero Private Key Storage**: Users sign all licensing and distribution transactions through their own MetaMask wallet via `ethers.BrowserProvider`.
- **Proof-of-Stem™ Verification**: AI-generated stems require prompt seed parameters enforced by database constraints (`CHECK (NOT is_ai_generated OR prompt_seed_hash IS NOT NULL)`).
- **ACID-Compliant Royalty Validation**: Database triggers (`trg_royalty_total`) enforce that collaborator shares total exactly 100% at transaction commit time.
- **Dynamic Reputation**: Trigger `trg_reputation` recalculates average ratings across all stems for each producer automatically.
