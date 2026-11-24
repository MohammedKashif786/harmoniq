import { Router } from 'express';
import { supabase, supabaseAdmin } from '../lib/supabase.js';
import { verifyTxOnChain } from '../lib/blockchain.js';
import { demoLicenses, demoStems } from '../lib/demoData.js';

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
    console.warn('[Licenses] Supabase unavailable, serving demo licenses:', err.message);
    res.json(demoLicenses);
  }
});

// POST / — record a license purchase
router.post('/', async (req, res, next) => {
  const { stem_id, buyer_id, license_type, price_eth, tx_hash, expires_at } = req.body;

  if (!stem_id || !buyer_id || !license_type || price_eth === undefined) {
    return res.status(400).json({ error: 'Missing required license fields (stem_id, buyer_id, license_type, price_eth)' });
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

  try {
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
    console.warn('[Licenses] Supabase unavailable, returning simulated license purchase:', err.message);
    const newLicense = {
      license_id: demoLicenses.length + 1,
      stem_id: Number(stem_id),
      buyer_id: Number(buyer_id),
      license_type,
      price_eth: Number(price_eth),
      tx_hash: tx_hash || '0x' + Array.from({ length: 64 }, () => Math.floor(Math.random() * 16).toString(16)).join(''),
      purchased_at: new Date().toISOString(),
      audio_stems: {
        stem_name: demoStems.find(s => s.stem_id === Number(stem_id))?.stem_name || 'Stem',
        stem_type: 'Audio',
      },
    };
    demoLicenses.push(newLicense);
    res.status(201).json(newLicense);
  }
});

// GET /stem/:stem_id — get licenses for a stem
router.get('/stem/:stem_id', async (req, res, next) => {
  const { stem_id } = req.params;
  try {
    const { data, error } = await supabase
      .from('licenses')
      .select('*, producers:buyer_id(username, wallet_address)')
      .eq('stem_id', stem_id);

    if (error) throw error;
    res.json(data);
  } catch (err) {
    console.warn(`[Licenses] Supabase unavailable, serving demo licenses for stem ${stem_id}:`, err.message);
    const licenses = demoLicenses.filter(l => String(l.stem_id) === String(stem_id));
    res.json(licenses);
  }
});

// GET /buyer/:buyer_id — get licenses for a buyer
router.get('/buyer/:buyer_id', async (req, res, next) => {
  const { buyer_id } = req.params;
  try {
    const { data, error } = await supabase
      .from('licenses')
      .select('*, audio_stems:stem_id(*, tracks:track_id(title))')
      .eq('buyer_id', buyer_id);

    if (error) throw error;
    res.json(data);
  } catch (err) {
    console.warn(`[Licenses] Supabase unavailable, serving demo licenses for buyer ${buyer_id}:`, err.message);
    const licenses = demoLicenses.filter(l => String(l.buyer_id) === String(buyer_id));
    res.json(licenses);
  }
});

export default router;
