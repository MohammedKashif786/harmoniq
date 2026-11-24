import { Router } from 'express';
import { supabase } from '../lib/supabase.js';
import { demoTracks, demoStems, demoRoyaltySplits } from '../lib/demoData.js';

const router = Router();

// GET / — list tracks with optional genre / bpm filters
router.get('/', async (req, res, next) => {
  const { genre, bpm_min, bpm_max } = req.query;
  try {
    let query = supabase.from('tracks').select('*');

    if (genre) query = query.eq('genre', genre);
    if (bpm_min) query = query.gte('bpm', Number(bpm_min));
    if (bpm_max) query = query.lte('bpm', Number(bpm_max));

    const { data, error } = await query;
    if (error) throw error;
    res.json(data);
  } catch (err) {
    console.warn('[Tracks] Supabase unavailable, serving demo tracks:', err.message);
    let tracks = [...demoTracks];
    if (genre) tracks = tracks.filter(t => t.genre.toLowerCase() === genre.toLowerCase());
    if (bpm_min) tracks = tracks.filter(t => t.bpm >= Number(bpm_min));
    if (bpm_max) tracks = tracks.filter(t => t.bpm <= Number(bpm_max));
    res.json(tracks);
  }
});

// POST / — create a track
router.post('/', async (req, res, next) => {
  const { title, bpm, musical_key, genre, acoustic_hash, master_audio_url, creator_id } = req.body;
  try {
    const { data, error } = await supabase
      .from('tracks')
      .insert([{ title, bpm, musical_key, genre, acoustic_hash, master_audio_url, creator_id }])
      .select()
      .single();

    if (error) throw error;
    res.status(201).json(data);
  } catch (err) {
    console.warn('[Tracks] Supabase unavailable, returning simulated created track:', err.message);
    const newTrack = {
      track_id: demoTracks.length + 1,
      title: title || 'New Track',
      bpm: Number(bpm) || 120,
      musical_key: musical_key || 'C minor',
      genre: genre || 'Electronic',
      acoustic_hash: acoustic_hash || 'AQAD00000000000000000000000000000000',
      master_audio_url: master_audio_url || 'https://example.com/audio/master.wav',
      creator_id: Number(creator_id) || 1,
      created_at: new Date().toISOString(),
    };
    demoTracks.push(newTrack);
    res.status(201).json(newTrack);
  }
});

// GET /:id — track + stems + royalty_splits
router.get('/:id', async (req, res, next) => {
  const { id } = req.params;
  try {
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
    console.warn(`[Tracks] Supabase unavailable, serving demo track for id ${id}:`, err.message);
    const track = demoTracks.find(t => String(t.track_id) === String(id)) || demoTracks[0];
    const stems = demoStems.filter(s => String(s.track_id) === String(id));
    const splits = demoRoyaltySplits.filter(s => String(s.track_id) === String(id));
    res.json({
      ...track,
      stems,
      royalty_splits: splits,
    });
  }
});

// GET /:id/stems — stems for a track
router.get('/:id/stems', async (req, res, next) => {
  const { id } = req.params;
  try {
    const { data, error } = await supabase
      .from('audio_stems')
      .select('*')
      .eq('track_id', id);

    if (error) throw error;
    res.json(data);
  } catch (err) {
    console.warn(`[Tracks] Supabase unavailable, serving demo stems for track ${id}:`, err.message);
    const stems = demoStems.filter(s => String(s.track_id) === String(id));
    res.json(stems);
  }
});

export default router;
