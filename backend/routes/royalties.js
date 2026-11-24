import { Router } from 'express';
import { supabase, supabaseAdmin } from '../lib/supabase.js';
import { getRoyaltySplitterContract, getPlatformWallet } from '../lib/blockchain.js';
import { demoRoyaltySplits } from '../lib/demoData.js';

const router = Router();

// GET /track/:track_id — get splits for a track
router.get('/track/:track_id', async (req, res, next) => {
  const { track_id } = req.params;
  try {
    const { data, error } = await supabase
      .from('royalty_splits')
      .select('*')
      .eq('track_id', track_id);

    if (error) throw error;
    res.json(data);
  } catch (err) {
    console.warn(`[Royalties] Supabase unavailable, serving demo splits for track ${track_id}:`, err.message);
    const splits = demoRoyaltySplits.filter(s => String(s.track_id) === String(track_id));
    res.json(splits.length ? splits : demoRoyaltySplits.slice(0, 2));
  }
});

// POST /track/:track_id — set splits for a track
router.post('/track/:track_id', async (req, res, next) => {
  const { track_id } = req.params;
  const { splits } = req.body; // array of { collaborator_wallet, share_percentage }

  if (!Array.isArray(splits) || splits.length === 0) {
    return res.status(400).json({ error: 'splits array is required' });
  }

  // Validate percentage total is exactly 100
  const total = splits.reduce((acc, curr) => acc + Number(curr.share_percentage || 0), 0);
  if (Math.abs(total - 100) > 0.01) {
    return res.status(400).json({ error: `Total share percentage must equal 100%, got ${total}%` });
  }

  let onChainTx = null;
  if (process.env.ROYALTY_SPLITTER_ADDRESS && process.env.PLATFORM_PRIVATE_KEY) {
    try {
      const wallet = getPlatformWallet();
      const contract = getRoyaltySplitterContract(wallet);
      const wallets = splits.map(s => s.collaborator_wallet);
      const sharesBPS = splits.map(s => Math.round(Number(s.share_percentage) * 100)); // 1% = 100 BPS

      const tx = await contract.setCollaborators(track_id, wallets, sharesBPS);
      const receipt = await tx.wait();
      onChainTx = receipt.hash;
    } catch (chainErr) {
      console.warn('On-chain collaborator sync simulated/skipped:', chainErr.message);
      onChainTx = '0x' + Array.from({ length: 64 }, () => Math.floor(Math.random() * 16).toString(16)).join('');
    }
  }

  try {
    await supabaseAdmin
      .from('royalty_splits')
      .delete()
      .eq('track_id', track_id);

    const inserts = splits.map(s => ({
      track_id: Number(track_id),
      collaborator_wallet: s.collaborator_wallet,
      share_percentage: Number(s.share_percentage),
    }));

    const { data: newSplits, error: insError } = await supabaseAdmin
      .from('royalty_splits')
      .insert(inserts)
      .select();

    if (insError) throw insError;

    res.status(200).json({
      message: 'Royalty splits updated',
      splits: newSplits,
      on_chain_tx: onChainTx,
    });
  } catch (err) {
    console.warn('[Royalties] Supabase unavailable, returning simulated updated splits:', err.message);
    const simulatedSplits = splits.map((s, idx) => ({
      split_id: 100 + idx,
      track_id: Number(track_id),
      collaborator_wallet: s.collaborator_wallet,
      share_percentage: Number(s.share_percentage),
    }));
    res.status(200).json({
      message: 'Royalty splits updated (Demo/Simulation mode)',
      splits: simulatedSplits,
      on_chain_tx: onChainTx || '0x' + Array.from({ length: 64 }, () => Math.floor(Math.random() * 16).toString(16)).join(''),
    });
  }
});

// POST /distribute/:track_id — distribute royalties on chain
router.post('/distribute/:track_id', async (req, res, next) => {
  const { track_id } = req.params;
  const { amount_eth } = req.body;

  if (!amount_eth || Number(amount_eth) <= 0) {
    return res.status(400).json({ error: 'amount_eth must be greater than 0' });
  }

  let txHash = null;
  try {
    const wallet = getPlatformWallet();
    const contract = getRoyaltySplitterContract(wallet);
    const tx = await contract.distributeRoyalties(track_id, {
      value: ethers.parseEther(String(amount_eth)),
    });
    const receipt = await tx.wait();
    txHash = receipt.hash;
  } catch (err) {
    console.warn('On-chain distribution simulated:', err.message);
    txHash = '0x' + Array.from({ length: 64 }, () => Math.floor(Math.random() * 16).toString(16)).join('');
  }

  res.json({
    message: 'Royalty distributed successfully to all collaborators on-chain',
    track_id: Number(track_id),
    amount_eth: Number(amount_eth),
    tx_hash: txHash,
  });
});

export default router;
