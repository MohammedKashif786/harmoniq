import React, { useState } from 'react';
import { setRoyaltySplits } from '../api/harmoniq.js';

const SEGMENT_COLORS = [
  'bg-purple-500',
  'bg-cyan-400',
  'bg-amber-400',
  'bg-emerald-400',
  'bg-rose-400',
];

export default function RoyaltySplitForm({ trackId, existingSplits = [], onSaved }) {
  const [splits, setSplits] = useState(
    existingSplits.length > 0
      ? existingSplits.map((s) => ({
          collaborator_wallet: s.collaborator_wallet,
          share_percentage: s.share_percentage,
        }))
      : [
          { collaborator_wallet: '0x1a2b3c4d5e6f7a8b9c0d1e2f3a4b5c6d7e8f9a01', share_percentage: '60' },
          { collaborator_wallet: '0x2b3c4d5e6f7a8b9c0d1e2f3a4b5c6d7e8f9a0102', share_percentage: '40' },
        ]
  );
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState({ error: null, success: null });

  const totalPercentage = splits.reduce(
    (acc, s) => acc + (parseFloat(s.share_percentage) || 0),
    0
  );

  const isValidTotal = Math.abs(totalPercentage - 100) < 0.01;

  const handleRowChange = (index, field, value) => {
    const updated = [...splits];
    updated[index][field] = value;
    setSplits(updated);
    setStatus({ error: null, success: null });
  };

  const addRow = () => {
    setSplits([...splits, { collaborator_wallet: '', share_percentage: '' }]);
  };

  const removeRow = (index) => {
    if (splits.length === 1) return;
    setSplits(splits.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!isValidTotal) {
      setStatus({
        error: `Total share percentage must equal exactly 100% (currently ${totalPercentage}%)`,
        success: null,
      });
      return;
    }

    setLoading(true);
    setStatus({ error: null, success: null });

    try {
      const res = await setRoyaltySplits(trackId, splits);
      setStatus({ error: null, success: 'Royalty splits saved & synced to RoyaltySplitter.sol!' });
      if (onSaved) onSaved(res.splits);
    } catch (err) {
      setStatus({
        error: err.response?.data?.error || err.message || 'Failed to update royalty splits',
        success: null,
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="bg-surface-card border border-white/5 rounded-2xl p-6 shadow-xl space-y-5"
    >
      <div className="flex items-center justify-between">
        <div>
          <h4 className="text-sm font-bold text-white flex items-center gap-2">
            <span>Collaborator Splits Configuration</span>
          </h4>
          <p className="text-xs text-slate-400 mt-0.5">
            Defines on-chain shares in Basis Points (100% = 10,000 BPS)
          </p>
        </div>

        <div
          className={`px-3 py-1 rounded-full text-xs font-bold font-mono border ${
            isValidTotal
              ? 'bg-emerald-950/80 text-emerald-400 border-emerald-800'
              : 'bg-rose-950/80 text-rose-400 border-rose-800'
          }`}
        >
          {totalPercentage}% / 100%
        </div>
      </div>

      {/* Visual Percentage Breakdown Bar */}
      <div className="h-2 w-full bg-[#080b11] rounded-full overflow-hidden flex border border-white/5">
        {splits.map((row, idx) => {
          const width = Math.max(0, Math.min(100, parseFloat(row.share_percentage) || 0));
          return (
            <div
              key={idx}
              className={`h-full ${SEGMENT_COLORS[idx % SEGMENT_COLORS.length]} transition-all`}
              style={{ width: `${width}%` }}
              title={`Collaborator ${idx + 1}: ${width}%`}
            />
          );
        })}
      </div>

      {/* Split Rows */}
      <div className="space-y-3">
        {splits.map((row, index) => (
          <div key={index} className="flex gap-2 items-center">
            <div className="flex-1 relative">
              <input
                type="text"
                placeholder="0x... collaborator wallet address"
                value={row.collaborator_wallet}
                onChange={(e) => handleRowChange(index, 'collaborator_wallet', e.target.value)}
                required
                className="w-full bg-[#080b11] border border-white/10 rounded-xl px-3.5 py-2 text-xs text-white font-mono placeholder:text-slate-600 focus:outline-none focus:border-purple-500/60"
              />
            </div>

            <div className="w-24 relative">
              <input
                type="number"
                placeholder="%"
                value={row.share_percentage}
                onChange={(e) => handleRowChange(index, 'share_percentage', e.target.value)}
                min="0.1"
                max="100"
                step="0.1"
                required
                className="w-full bg-[#080b11] border border-white/10 rounded-xl pl-3 pr-7 py-2 text-xs text-white font-mono focus:outline-none focus:border-purple-500/60"
              />
              <span className="absolute right-2.5 top-2 text-xs text-slate-500 font-mono font-bold">
                %
              </span>
            </div>

            {splits.length > 1 && (
              <button
                type="button"
                onClick={() => removeRow(index)}
                className="w-8 h-8 rounded-xl bg-rose-950/30 text-rose-400 border border-rose-800/30 hover:bg-rose-900/40 text-xs flex items-center justify-center transition-colors"
                title="Remove collaborator"
              >
                ✕
              </button>
            )}
          </div>
        ))}
      </div>

      {/* Action Buttons */}
      <div className="flex items-center justify-between pt-2">
        <button
          type="button"
          onClick={addRow}
          className="text-xs font-mono font-semibold text-purple-400 hover:text-purple-300 transition-colors flex items-center gap-1"
        >
          <span>+ Add Collaborator</span>
        </button>

        <button
          type="submit"
          disabled={loading || !isValidTotal}
          className="px-5 py-2.5 rounded-xl font-bold text-xs text-white bg-purple-600 hover:bg-purple-500 transition-all shadow-md shadow-purple-900/20 disabled:opacity-50"
        >
          {loading ? 'Saving Splits...' : 'Save & Sync on Chain'}
        </button>
      </div>

      {status.success && (
        <p className="text-xs text-emerald-400 font-mono bg-emerald-950/40 p-2.5 rounded-xl border border-emerald-800/60">
          ✓ {status.success}
        </p>
      )}

      {status.error && (
        <p className="text-xs text-rose-400 font-mono bg-rose-950/40 p-2.5 rounded-xl border border-rose-800/60">
          ✕ {status.error}
        </p>
      )}
    </form>
  );
}
