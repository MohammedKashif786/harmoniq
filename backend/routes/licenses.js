import { Router } from 'express';
import { supabase, supabaseAdmin } from '../lib/supabase.js';
import { verifyTxOnChain } from '../lib/blockchain.js';

const router = Router();

// GET / — list all licenses with stem & buyer info
router.get('/', async (req, res, next) => {
  try {
    const { data, error } = await supabase
      .from('licenses')
      .select(`
        *,
        audio_stems:stem_id (
          stem_name,
          stem_type,
          tracks:track_id (title)
        ),
        producers:buyer_id (username, wallet_address)
      `)
      .order('license_id', { ascending: false });

    if (error) throw error;
    res.json(data);
  } catch (err) {
    next(err);
  }
});

// POST / — record a license purchase
router.post('/', async (req, res, next) => {
  try {
    const { stem_id, buyer_id, license_type, price_eth, tx_hash, expires_at } = req.body;

    if (!stem_id || !buyer_id || !license_type || price_eth === undefined) {
      return res.status(400).json({ error: 'Missing required license fields' });
    }

    // Verify on-chain transaction if tx_hash provided
    if (tx_hash && process.env.RPC_URL) {
      try {
        const txVerification = await verifyTxOnChain(tx_hash);
        if (txVerification && !txVerification.success) {
          return res.status(400).json({ error: 'On-chain transaction failed' });
        }
      } catch (chainErr) {
        console.warn('Could not verify on-chain tx, proceeding with DB insert:', chainErr.message);
      }
    }

    const { data, error } = await supabaseAdmin
      .from('licenses')
      .insert([
        {
          stem_id,
          buyer_id,
          license_type,
          price_eth,
          tx_hash: tx_hash || null,
          expires_at: expires_at || null,
        },
      ])
      .select()
      .single();

    if (error) throw error;
    res.status(201).json(data);
  } catch (err) {
    next(err);
  }
});

// GET /stem/:stem_id — get licenses for a stem
router.get('/stem/:stem_id', async (req, res, next) => {
  try {
    const { stem_id } = req.params;
    const { data, error } = await supabase
      .from('licenses')
      .select('*, producers:buyer_id(username, wallet_address)')
      .eq('stem_id', stem_id);

    if (error) throw error;
    res.json(data);
  } catch (err) {
    next(err);
  }
});

// GET /buyer/:buyer_id — get licenses for a buyer
router.get('/buyer/:buyer_id', async (req, res, next) => {
  try {
    const { buyer_id } = req.params;
    const { data, error } = await supabase
      .from('licenses')
      .select('*, audio_stems:stem_id(*, tracks:track_id(title))')
      .eq('buyer_id', buyer_id);

    if (error) throw error;
    res.json(data);
  } catch (err) {
    next(err);
  }
});

export default router;
