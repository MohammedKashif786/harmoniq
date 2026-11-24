import { Router } from 'express';
import { supabase, supabaseAdmin } from '../lib/supabase.js';
import { validateWalletField } from '../middleware/validateWallet.js';

const router = Router();

// GET / — list all public producers ordered by reputation
router.get('/', async (req, res, next) => {
  try {
    const { data, error } = await supabase
      .from('v_public_producers')
      .select('*')
      .order('reputation_score', { ascending: false });

    if (error) throw error;
    res.json(data);
  } catch (err) {
    next(err);
  }
});

// POST / — create a new producer
router.post('/', validateWalletField('wallet_address'), async (req, res, next) => {
  try {
    const { username, wallet_address, email } = req.body;
    const { data, error } = await supabaseAdmin
      .from('producers')
      .insert([{ username, wallet_address, email }])
      .select()
      .single();

    if (error) throw error;
    res.status(201).json(data);
  } catch (err) {
    next(err);
  }
});

// GET /:id — producer + their tracks
router.get('/:id', async (req, res, next) => {
  try {
    const { id } = req.params;

    const { data: producer, error: pErr } = await supabase
      .from('v_public_producers')
      .select('*')
      .eq('producer_id', id)
      .single();

    if (pErr) throw pErr;

    const { data: tracks, error: tErr } = await supabase
      .from('tracks')
      .select('*')
      .eq('creator_id', id);

    if (tErr) throw tErr;

    res.json({ ...producer, tracks });
  } catch (err) {
    next(err);
  }
});

// GET /:id/reputation — just the reputation score
router.get('/:id/reputation', async (req, res, next) => {
  try {
    const { id } = req.params;
    const { data, error } = await supabase
      .from('producers')
      .select('reputation_score')
      .eq('producer_id', id)
      .single();

    if (error) throw error;
    res.json({ reputation_score: data.reputation_score });
  } catch (err) {
    next(err);
  }
});

export default router;
