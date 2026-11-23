import React, { useState } from 'react'
import { setRoyaltySplits } from '../api/harmoniq.js'

export default function RoyaltySplitForm({ trackId, existingSplits = [], onSaved }) {
  const [splits, setSplits] = useState(
    existingSplits.length > 0
      ? existingSplits.map((s) => ({
          collaborator_wallet: s.collaborator_wallet,
          share_percentage: s.share_percentage,
        }))
      : [{ collaborator_wallet: '', share_percentage: '' }]
  )
  const [loading, setLoading] = useState(false)
  const [status, setStatus] = useState({ error: null, success: null })

  const totalPercentage = splits.reduce(
    (acc, s) => acc + (parseFloat(s.share_percentage) || 0),
    0
  )

  const handleRowChange = (index, field, value) => {
    const updated = [...splits]
    updated[index][field] = value
    setSplits(updated)
    setStatus({ error: null, success: null })
  }

  const addRow = () => {
    setSplits([...splits, { collaborator_wallet: '', share_percentage: '' }])
  }

  const removeRow = (index) => {
    if (splits.length === 1) return
    setSplits(splits.filter((_, i) => i !== index))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (Math.abs(totalPercentage - 100) > 0.01) {
      setStatus({ error: `Total share percentage must equal 100% (currently ${totalPercentage}%)`, success: null })
      return
    }

    setLoading(true)
    setStatus({ error: null, success: null })

    try {
      const res = await setRoyaltySplits(trackId, splits)
      setStatus({ error: null, success: 'Royalty splits saved and synced to blockchain!' })
      if (onSaved) onSaved(res.splits)
    } catch (err) {
      setStatus({
        error: err.response?.data?.error || err.message || 'Failed to update royalty splits',
        success: null,
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="bg-gray-900 border border-gray-800 rounded-2xl p-6 shadow-xl">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h4 className="text-base font-bold text-white">Smart Contract Royalty Splits</h4>
          <p className="text-xs text-gray-400 mt-0.5">Automated on-chain payout to collaborators per license</p>
        </div>
        <div
          className={`px-3 py-1 rounded-full text-xs font-bold font-mono ${
            Math.abs(totalPercentage - 100) < 0.01
              ? 'bg-emerald-950 text-emerald-400 border border-emerald-800'
              : 'bg-rose-950 text-rose-400 border border-rose-800'
          }`}
        >
          Total: {totalPercentage}% / 100%
        </div>
      </div>

      <div className="space-y-3 mb-4">
        {splits.map((row, index) => (
          <div key={index} className="flex gap-3 items-center">
            <input
              type="text"
              placeholder="0x... collaborator wallet"
              value={row.collaborator_wallet}
              onChange={(e) => handleRowChange(index, 'collaborator_wallet', e.target.value)}
              required
              className="flex-1 bg-black/50 border border-gray-700/80 rounded-xl px-3 py-2 text-sm text-white font-mono placeholder:text-gray-600 focus:outline-none focus:border-purple-500"
            />
            <div className="w-24 relative">
              <input
                type="number"
                placeholder="Share"
                value={row.share_percentage}
                onChange={(e) => handleRowChange(index, 'share_percentage', e.target.value)}
                min="0.1"
                max="100"
                step="0.1"
                required
                className="w-full bg-black/50 border border-gray-700/80 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-purple-500"
              />
              <span className="absolute right-3 top-2 text-gray-500 text-sm">%</span>
            </div>
            {splits.length > 1 && (
              <button
                type="button"
                onClick={() => removeRow(index)}
                className="p-2 text-gray-500 hover:text-rose-400 transition-colors"
                title="Remove collaborator"
              >
                ✕
              </button>
            )}
          </div>
        ))}
      </div>

      <div className="flex items-center justify-between pt-2 border-t border-gray-800/80">
        <button
          type="button"
          onClick={addRow}
          className="text-xs font-semibold text-purple-400 hover:text-purple-300 transition-colors"
        >
          + Add Collaborator
        </button>

        <button
          type="submit"
          disabled={loading || Math.abs(totalPercentage - 100) > 0.01}
          className="py-2 px-5 rounded-xl text-xs font-bold text-white bg-purple-600 hover:bg-purple-500 transition-all disabled:opacity-40"
        >
          {loading ? 'Saving Splits...' : 'Save & Enforce Splits'}
        </button>
      </div>

      {status.error && <p className="text-xs text-rose-400 mt-3">{status.error}</p>}
      {status.success && <p className="text-xs text-emerald-400 mt-3">{status.success}</p>}
    </form>
  )
}
