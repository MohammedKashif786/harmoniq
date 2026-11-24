import { Router } from 'express';
import { supabase, supabaseAdmin } from '../lib/supabase.js';
import { validateWalletField } from '../middleware/validateWallet.js';
import { demoProducers, demoTracks } from '../lib/demoData.js';

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
    console.warn('[Producers] Supabase unavailable, serving demo producers:', err.message);
    res.json(demoProducers);
  }
});

// POST / — create a new producer
router.post('/', validateWalletField('wallet_address'), async (req, res, next) => {
  const { username, wallet_address, email } = req.body;
  try {
    const { data, error } = await supabaseAdmin
      .from('producers')
      .insert([{ username, wallet_address, email }])
      .select()
      .single();

    if (error) throw error;
    res.status(201).json(data);
  } catch (err) {
    console.warn('[Producers] Supabase unavailable, returning simulated created producer:', err.message);
    const newProducer = {
      producer_id: demoProducers.length + 1,
      username: username || 'new_producer',
      wallet_address,
      email: email || `${username}@example.com`,
      reputation_score: 5.0,
      created_at: new Date().toISOString(),
    };
    demoProducers.push(newProducer);
    res.status(201).json(newProducer);
  }
});

// GET /:id — producer + their tracks
router.get('/:id', async (req, res, next) => {
  const { id } = req.params;
  try {
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
    console.warn(`[Producers] Supabase unavailable, serving demo producer for id ${id}:`, err.message);
    const producer = demoProducers.find(p => String(p.producer_id) === String(id)) || demoProducers[0];
    const tracks = demoTracks.filter(t => String(t.creator_id) === String(id));
    res.json({ ...producer, tracks });
  }
});

// GET /:id/reputation — just the reputation score
router.get('/:id/reputation', async (req, res, next) => {
  const { id } = req.params;
  try {
    const { data, error } = await supabase
      .from('producers')
      .select('reputation_score')
      .eq('producer_id', id)
      .single();

    if (error) throw error;
    res.json({ reputation_score: data.reputation_score });
  } catch (err) {
    console.warn(`[Producers] Supabase unavailable, serving demo reputation for id ${id}:`, err.message);
    const producer = demoProducers.find(p => String(p.producer_id) === String(id)) || demoProducers[0];
    res.json({ reputation_score: producer.reputation_score });
  }
});

export default router;
