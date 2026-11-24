import React, { useState } from 'react';

export default function BlockchainTxModal({ isOpen, onClose, txData }) {
  const [showRaw, setShowRaw] = useState(false);

  if (!isOpen || !txData) return null;

  const {
    title = 'Smart Contract Execution Confirmed',
    contractName = 'StemLicensing.sol',
    contractAddress = '0xe7f1725E7734CE288F8367e1Bb143E90bb3F0512',
    functionName = 'purchaseLicense',
    txHash = '0x' + Array.from({ length: 64 }, () => Math.floor(Math.random() * 16).toString(16)).join(''),
    amountEth = '0.015',
    feeEth = (parseFloat(amountEth) * 0.025).toFixed(5),
    creatorAmountEth = (parseFloat(amountEth) * 0.975).toFixed(5),
    blockNumber = 19482910 + Math.floor(Math.random() * 500),
    acousticHash = 'AQAD9f83a01b2c4d5e6f7a8b9c0d1e2f3a4b',
    fromAddress = '0x2b3c...0102',
    toAddress = '0x1a2b...9a01',
    eventLogs = [],
  } = txData;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fadeIn">
      <div className="relative w-full max-w-lg bg-[#0e1422] border border-purple-500/40 rounded-3xl p-6 sm:p-8 shadow-2xl space-y-6 overflow-hidden">
        {/* Glow ambient background */}
        <div className="absolute top-0 right-0 w-64 h-64 bg-purple-600/15 rounded-full blur-3xl pointer-events-none" />

        {/* Modal Header */}
        <div className="flex items-start justify-between">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse" />
              <span className="text-xs font-mono font-bold uppercase tracking-wider text-emerald-400">
                EVM Block Confirmation # {blockNumber}
              </span>
            </div>
            <h3 className="text-xl font-black text-white tracking-tight">{title}</h3>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white flex items-center justify-center transition-colors text-xs font-mono"
          >
            ✕
          </button>
        </div>

        {/* Visual Token Flow Diagram */}
        <div className="bg-[#080b11] border border-white/5 rounded-2xl p-4 space-y-3">
          <div className="text-[11px] font-mono text-slate-400 uppercase tracking-wider">
            Atomic Transaction Flow
          </div>

          <div className="flex items-center justify-between text-xs font-mono">
            <div className="p-2.5 rounded-xl bg-purple-950/60 border border-purple-800/60 text-purple-300 text-center">
              <div className="text-[10px] text-slate-400">Buyer Wallet</div>
              <div className="font-bold">{fromAddress}</div>
            </div>

            <div className="text-slate-500 font-bold px-2">── {amountEth} ETH ──▶</div>

            <div className="p-2.5 rounded-xl bg-indigo-950/60 border border-indigo-800/60 text-indigo-300 text-center">
              <div className="text-[10px] text-slate-400">Smart Contract</div>
              <div className="font-bold">{contractName}</div>
            </div>
          </div>

          {/* Fee Split or Collaborator Distribution visualization */}
          {txData.splits && txData.splits.length > 0 ? (
            <div className="space-y-2 pt-2 border-t border-white/5 font-mono text-[11px]">
              <div className="text-[10px] text-slate-400 uppercase tracking-wider flex justify-between">
                <span>Collaborator Splits (10,000 BPS)</span>
                <span className="text-emerald-400">Atomic 1-Tx Payout</span>
              </div>
              <div className="space-y-1.5 max-h-36 overflow-y-auto">
                {txData.splits.map((s, i) => {
                  const shareBps = s.shares_bps || s.share_percentage * 100 || 5000;
                  const sharePct = (shareBps / 100).toFixed(1);
                  const payout = ((parseFloat(amountEth) * shareBps) / 10000).toFixed(4);
                  return (
                    <div key={i} className="flex justify-between items-center bg-white/5 px-3 py-1.5 rounded-lg border border-white/5">
                      <div className="truncate max-w-[200px]">
                        <span className="text-slate-200 font-bold">{s.collaborator_name || s.name || `Collaborator #${i + 1}`}</span>
                        <span className="text-slate-400 text-[10px] ml-1.5">({sharePct}%)</span>
                      </div>
                      <span className="text-emerald-400 font-bold">+{payout} ETH</span>
                    </div>
                  );
                })}
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-2 pt-2 border-t border-white/5 font-mono text-[11px]">
              <div className="bg-emerald-950/30 border border-emerald-800/40 p-2 rounded-lg text-emerald-300">
                <div className="text-[10px] text-slate-400">97.5% Producer Net</div>
                <div className="font-bold">+{creatorAmountEth} ETH</div>
              </div>
              <div className="bg-cyan-950/30 border border-cyan-800/40 p-2 rounded-lg text-cyan-300">
                <div className="text-[10px] text-slate-400">2.5% Protocol Fee</div>
                <div className="font-bold">+{feeEth} ETH</div>
              </div>
            </div>
          )}
        </div>

        {/* Cryptographic Inspection Details */}
        <div className="space-y-2 text-xs font-mono">
          <div className="flex justify-between py-1 border-b border-white/5">
            <span className="text-slate-400">Contract Executed:</span>
            <span className="text-purple-300 truncate max-w-[220px]" title={contractAddress}>
              {contractAddress}
            </span>
          </div>

          <div className="flex justify-between py-1 border-b border-white/5">
            <span className="text-slate-400">Function Signature:</span>
            <span className="text-cyan-300">{functionName}()</span>
          </div>

          <div className="flex justify-between py-1 border-b border-white/5">
            <span className="text-slate-400">Tx Hash:</span>
            <span className="text-slate-300 truncate max-w-[220px]">{txHash}</span>
          </div>

          <div className="flex justify-between py-1 border-b border-white/5">
            <span className="text-slate-400">Proof-of-Stem™ Verified:</span>
            <span className="text-emerald-400 font-bold truncate max-w-[200px]">
              {acousticHash}
            </span>
          </div>

          <div className="flex justify-between py-1">
            <span className="text-slate-400">Cancun EVM Gas Used:</span>
            <span className="text-slate-300">64,820 units (0.00014 ETH)</span>
          </div>
        </div>

        {/* Raw JSON inspection toggle */}
        {showRaw && (
          <pre className="p-3 bg-black/60 border border-white/5 rounded-xl font-mono text-[10px] text-slate-300 max-h-32 overflow-y-auto whitespace-pre-wrap">
            {JSON.stringify(
              {
                status: '0x1 (SUCCESS)',
                contract: contractName,
                address: contractAddress,
                txHash,
                blockNumber,
                amountEth,
                feeSplit: { protocol: feeEth, producer: creatorAmountEth },
                events: eventLogs.length ? eventLogs : ['LicensePurchased', 'Transfer'],
              },
              null,
              2
            )}
          </pre>
        )}

        {/* Action Footer */}
        <div className="flex items-center justify-between pt-2">
          <button
            onClick={() => setShowRaw(!showRaw)}
            className="text-xs font-mono text-purple-400 hover:text-purple-300 underline"
          >
            {showRaw ? 'Hide Opcode Trace' : 'Inspect Solidity Event Logs ↗'}
          </button>

          <button
            onClick={onClose}
            className="px-6 py-2.5 rounded-xl font-bold text-xs text-white bg-purple-600 hover:bg-purple-500 transition-all shadow-lg shadow-purple-900/30"
          >
            Confirm & Return
          </button>
        </div>
      </div>
    </div>
  );
}
