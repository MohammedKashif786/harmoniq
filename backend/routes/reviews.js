import { Router } from 'express';
import { supabase, supabaseAdmin } from '../lib/supabase.js';

const router = Router();

// GET /leaderboard — producers ranked by reputation score
router.get('/leaderboard', async (req, res, next) => {
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

// GET /stem/:stem_id — reviews for a stem
router.get('/stem/:stem_id', async (req, res, next) => {
  try {
    const { stem_id } = req.params;
    const { data, error } = await supabase
      .from('stem_reviews')
      .select('*, producers:reviewer_id(username, wallet_address)')
      .eq('stem_id', stem_id)
      .order('created_at', { ascending: false });

    if (error) throw error;
    res.json(data);
  } catch (err) {
    next(err);
  }
});

// POST / — submit a review for a stem
router.post('/', async (req, res, next) => {
  try {
    const { stem_id, reviewer_id, rating, comment_text } = req.body;

    if (!stem_id || !reviewer_id || !rating) {
      return res.status(400).json({ error: 'stem_id, reviewer_id and rating are required' });
    }

    const numRating = Number(rating);
    if (numRating < 1 || numRating > 5) {
      return res.status(400).json({ error: 'Rating must be between 1 and 5' });
    }

    const { data, error } = await supabaseAdmin
      .from('stem_reviews')
      .insert([
        {
          stem_id,
          reviewer_id,
          rating: numRating,
          comment_text: comment_text || null,
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

export default router;
