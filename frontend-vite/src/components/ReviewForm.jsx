import React, { useState } from 'react';
import { addReview } from '../api/harmoniq.js';

export default function ReviewForm({ stemId, onReviewAdded }) {
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState('');
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState({ error: null, success: null });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setStatus({ error: null, success: null });

    try {
      const res = await addReview({
        stem_id: stemId,
        reviewer_id: 1, // Default connected producer ID
        rating: Number(rating),
        comment_text: comment,
      });

      setStatus({
        error: null,
        success: 'Critique posted! Reputation trigger automatically updated producer score.',
      });
      setComment('');
      if (onReviewAdded) onReviewAdded(res);
    } catch (err) {
      setStatus({
        error: err.response?.data?.error || err.message || 'Failed to submit review',
        success: null,
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="bg-surface-card border border-white/5 rounded-2xl p-6 shadow-xl space-y-4"
    >
      <div>
        <h4 className="text-sm font-bold text-white flex items-center gap-2">
          <span>Leave an Audio Critique</span>
        </h4>
        <p className="text-xs text-slate-400 mt-0.5">
          Reviews trigger PostgreSQL function <code>fn_update_producer_reputation()</code>.
        </p>
      </div>

      <div>
        <label className="block text-xs font-semibold text-slate-300 mb-1.5 font-mono">
          Score Rating (1 to 5 Stars):
        </label>
        <div className="flex gap-1.5">
          {[1, 2, 3, 4, 5].map((star) => (
            <button
              type="button"
              key={star}
              onClick={() => setRating(star)}
              className="text-2xl transition-transform hover:scale-125 focus:outline-none"
            >
              <span className={star <= rating ? 'text-amber-400' : 'text-slate-600'}>
                ★
              </span>
            </button>
          ))}
          <span className="ml-2 text-xs font-mono font-bold text-amber-400 self-center">
            {rating}.0 / 5.0
          </span>
        </div>
      </div>

      <div>
        <label className="block text-xs font-semibold text-slate-300 mb-1.5 font-mono">
          Mix Feedback & Sound Design Notes:
        </label>
        <textarea
          rows="3"
          placeholder="e.g., Clean transient punch, sub-bass sits tightly without clipping..."
          value={comment}
          onChange={(e) => setComment(e.target.value)}
          required
          className="w-full bg-[#080b11] border border-white/10 rounded-xl p-3 text-xs text-white placeholder:text-slate-600 focus:outline-none focus:border-purple-500/60 leading-relaxed font-sans"
        />
      </div>

      <div className="flex justify-end">
        <button
          type="submit"
          disabled={loading}
          className="px-5 py-2.5 rounded-xl text-xs font-bold text-white bg-purple-600 hover:bg-purple-500 transition-all shadow-md shadow-purple-900/20 disabled:opacity-50"
        >
          {loading ? 'Submitting...' : 'Post Critique'}
        </button>
      </div>

      {status.error && (
        <p className="text-xs text-rose-400 font-mono bg-rose-950/40 p-2.5 rounded-xl border border-rose-800/60">
          ✕ {status.error}
        </p>
      )}

      {status.success && (
        <p className="text-xs text-emerald-400 font-mono bg-emerald-950/40 p-2.5 rounded-xl border border-emerald-800/60">
          ✓ {status.success}
        </p>
      )}
    </form>
  );
}
