import { Router } from 'express';
import { supabase } from '../lib/supabase.js';

const router = Router();

// GET / — list tracks with optional genre / bpm filters
router.get('/', async (req, res, next) => {
  try {
    const { genre, bpm_min, bpm_max } = req.query;
    let query = supabase.from('tracks').select('*');

    if (genre) query = query.eq('genre', genre);
    if (bpm_min) query = query.gte('bpm', Number(bpm_min));
    if (bpm_max) query = query.lte('bpm', Number(bpm_max));

    const { data, error } = await query;
    if (error) throw error;
    res.json(data);
  } catch (err) {
    next(err);
  }
});

// POST / — create a track
router.post('/', async (req, res, next) => {
  try {
    const { title, bpm, musical_key, genre, acoustic_hash, master_audio_url, creator_id } = req.body;
    const { data, error } = await supabase
      .from('tracks')
      .insert([{ title, bpm, musical_key, genre, acoustic_hash, master_audio_url, creator_id }])
      .select()
      .single();

    if (error) throw error;
    res.status(201).json(data);
  } catch (err) {
    next(err);
  }
});

// GET /:id — track + stems + royalty_splits
router.get('/:id', async (req, res, next) => {
  try {
    const { id } = req.params;

    const [trackRes, stemsRes, splitsRes] = await Promise.all([
      supabase.from('tracks').select('*').eq('track_id', id).single(),
      supabase.from('audio_stems').select('*').eq('track_id', id),
      supabase.from('royalty_splits').select('*').eq('track_id', id),
    ]);

    if (trackRes.error) throw trackRes.error;
    if (stemsRes.error) throw stemsRes.error;
    if (splitsRes.error) throw splitsRes.error;

    res.json({
      ...trackRes.data,
      stems: stemsRes.data,
      royalty_splits: splitsRes.data,
    });
  } catch (err) {
    next(err);
  }
});

// GET /:id/stems — stems for a track
router.get('/:id/stems', async (req, res, next) => {
  try {
    const { id } = req.params;
    const { data, error } = await supabase
      .from('audio_stems')
      .select('*')
      .eq('track_id', id);

    if (error) throw error;
    res.json(data);
  } catch (err) {
    next(err);
  }
});

export default router;
