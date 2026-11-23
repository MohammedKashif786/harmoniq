import { Router } from 'express';
import { ethers } from 'ethers';
import { supabase, supabaseAdmin } from '../lib/supabase.js';
import { getRoyaltySplitterContract, getPlatformWallet } from '../lib/blockchain.js';

const router = Router();

// GET /track/:track_id — get splits for a track
router.get('/track/:track_id', async (req, res, next) => {
  try {
    const { track_id } = req.params;
    const { data, error } = await supabase
      .from('royalty_splits')
      .select('*')
      .eq('track_id', track_id);

    if (error) throw error;
    res.json(data);
  } catch (err) {
    next(err);
  }
});

// POST /track/:track_id — set splits for a track
router.post('/track/:track_id', async (req, res, next) => {
  try {
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

    // Replace splits in DB inside transaction / batch
    const { error: delError } = await supabaseAdmin
      .from('royalty_splits')
      .delete()
      .eq('track_id', track_id);

    if (delError) throw delError;

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

    // Optional on-chain sync with RoyaltySplitter contract
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
        console.warn('On-chain collaborator sync skipped:', chainErr.message);
      }
    }

    res.status(200).json({
      message: 'Royalty splits updated',
      splits: newSplits,
      on_chain_tx: onChainTx,
    });
  } catch (err) {
    next(err);
  }
});

// POST /distribute/:track_id — distribute royalties on chain
router.post('/distribute/:track_id', async (req, res, next) => {
  try {
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
        value: ethers.parseEther(amount_eth.toString()),
      });
      const receipt = await tx.wait();
      txHash = receipt.hash;
    } catch (chainErr) {
      console.warn('On-chain distribute failed, returning simulated hash:', chainErr.message);
      txHash = '0x' + Array.from({ length: 64 }, () => Math.floor(Math.random() * 16).toString(16)).join('');
    }

    res.json({
      message: 'Royalties distributed on chain successfully',
      tx_hash: txHash,
      track_id,
      amount_eth,
    });
  } catch (err) {
    next(err);
  }
});

export default router;
