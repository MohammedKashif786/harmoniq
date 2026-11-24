import { Router } from 'express';
import { supabase, supabaseAdmin } from '../lib/supabase.js';
import { demoReviews, demoProducers } from '../lib/demoData.js';

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
    console.warn('[Reviews] Supabase unavailable, serving demo leaderboard:', err.message);
    const sorted = [...demoProducers].sort((a, b) => (b.reputation_score || 0) - (a.reputation_score || 0));
    res.json(sorted);
  }
});

// GET /stem/:stem_id — reviews for a stem
router.get('/stem/:stem_id', async (req, res, next) => {
  const { stem_id } = req.params;
  try {
    const { data, error } = await supabase
      .from('stem_reviews')
      .select('*, producers:reviewer_id(username, wallet_address)')
      .eq('stem_id', stem_id)
      .order('created_at', { ascending: false });

    if (error) throw error;
    res.json(data);
  } catch (err) {
    console.warn(`[Reviews] Supabase unavailable, serving demo reviews for stem ${stem_id}:`, err.message);
    const reviews = demoReviews.filter(r => String(r.stem_id) === String(stem_id));
    res.json(reviews.length ? reviews : demoReviews);
  }
});

// POST / — submit a review for a stem
router.post('/', async (req, res, next) => {
  const { stem_id, reviewer_id, rating, comment_text } = req.body;

  if (!stem_id || !reviewer_id || !rating) {
    return res.status(400).json({ error: 'stem_id, reviewer_id and rating are required' });
  }

  const numRating = Number(rating);
  if (numRating < 1 || numRating > 5) {
    return res.status(400).json({ error: 'Rating must be between 1 and 5' });
  }

  try {
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
    console.warn('[Reviews] Supabase unavailable, returning simulated review:', err.message);
    const newRev = {
      review_id: demoReviews.length + 1,
      stem_id: Number(stem_id),
      reviewer_id: Number(reviewer_id),
      rating: numRating,
      comment_text: comment_text || '',
      created_at: new Date().toISOString(),
      producers: { username: 'current_user' },
    };
    demoReviews.push(newRev);
    res.status(201).json(newRev);
  }
});

export default router;
