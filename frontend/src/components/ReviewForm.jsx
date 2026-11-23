import React, { useState } from 'react'
import { addReview } from '../api/harmoniq.js'

export default function ReviewForm({ stemId, onReviewAdded }) {
  const [rating, setRating] = useState(5)
  const [comment, setComment] = useState('')
  const [loading, setLoading] = useState(false)
  const [status, setStatus] = useState({ error: null, success: null })

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    setStatus({ error: null, success: null })

    try {
      const res = await addReview({
        stem_id: stemId,
        reviewer_id: 1, // Default connected producer ID
        rating: Number(rating),
        comment_text: comment,
      })

      setStatus({ error: null, success: 'Review submitted! Reputation updated automatically.' })
      setComment('')
      if (onReviewAdded) onReviewAdded(res)
    } catch (err) {
      setStatus({
        error: err.response?.data?.error || err.message || 'Failed to submit review',
        success: null,
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="bg-gray-900 border border-gray-800 rounded-2xl p-6 shadow-xl">
      <h4 className="text-base font-bold text-white mb-2">Leave a Producer Review</h4>
      <p className="text-xs text-gray-400 mb-4">
        Feedback automatically calculates producer on-chain reputation scores via database triggers.
      </p>

      <div className="mb-4">
        <label className="block text-xs font-semibold text-gray-300 mb-1.5">Rating (1 to 5 Stars)</label>
        <div className="flex gap-2">
          {[1, 2, 3, 4, 5].map((star) => (
            <button
              type="button"
              key={star}
              onClick={() => setRating(star)}
              className="text-2xl transition-transform hover:scale-110 focus:outline-none"
            >
              {star <= rating ? '★' : '☆'}
            </button>
          ))}
        </div>
      </div>

      <div className="mb-4">
        <label className="block text-xs font-semibold text-gray-300 mb-1.5">Critique / Audio Feedback</label>
        <textarea
          rows="3"
          placeholder="e.g. Crisp percussion, sits nicely in the mix without extra EQ..."
          value={comment}
          onChange={(e) => setComment(e.target.value)}
          required
          className="w-full bg-black/50 border border-gray-700/80 rounded-xl px-3 py-2 text-sm text-white placeholder:text-gray-600 focus:outline-none focus:border-purple-500"
        />
      </div>

      <div className="flex justify-end">
        <button
          type="submit"
          disabled={loading}
          className="py-2.5 px-6 rounded-xl text-xs font-bold text-white bg-purple-600 hover:bg-purple-500 transition-all disabled:opacity-50"
        >
          {loading ? 'Submitting...' : 'Post Stem Critique'}
        </button>
      </div>

      {status.error && <p className="text-xs text-rose-400 mt-2">{status.error}</p>}
      {status.success && <p className="text-xs text-emerald-400 mt-2">{status.success}</p>}
    </form>
  )
}
