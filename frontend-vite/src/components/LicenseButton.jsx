import React, { useState } from 'react';
import { recordLicense } from '../api/harmoniq.js';
import useWallet from '../hooks/useWallet.js';
import BlockchainTxModal from './BlockchainTxModal.jsx';

const TIER_COLORS = {
  Remix: {
    bg: 'bg-purple-600/15 border-purple-500/30 hover:border-purple-500',
    btn: 'bg-purple-600 hover:bg-purple-500',
    tag: 'Non-Exclusive / Attribution',
  },
  Commercial: {
    bg: 'bg-indigo-600/15 border-indigo-500/30 hover:border-indigo-500',
    btn: 'bg-indigo-600 hover:bg-indigo-500',
    tag: 'Commercial Sync & Streaming',
  },
  Exclusive: {
    bg: 'bg-cyan-600/15 border-cyan-500/30 hover:border-cyan-500',
    btn: 'bg-cyan-600 hover:bg-cyan-500',
    tag: 'Full Master Buyout',
  },
};

export default function LicenseButton({
  stemId,
  stemTokenId,
  priceEth,
  licenseType = 'Commercial',
  onPurchased,
}) {
  const { account, profile, deductBalance } = useWallet();
  const [loading, setLoading] = useState(false);
  const [modalData, setModalData] = useState(null);

  const tier = TIER_COLORS[licenseType] || TIER_COLORS.Commercial;

  const handlePurchase = async () => {
    setLoading(true);

    try {
      const txHash =
        '0x' +
        Array.from({ length: 64 }, () =>
          Math.floor(Math.random() * 16).toString(16)
        ).join('');

      // Deduct balance from active demo profile
      deductBalance(priceEth);

      // Save license to backend database
      await recordLicense({
        stem_id: stemId,
        buyer_id: profile.id || 1,
        license_type: licenseType,
        price_eth: Number(priceEth),
        tx_hash: txHash,
      });

      // Open high-tech blockchain visualizer modal
      setModalData({
        title: `${licenseType} License Acquired On-Chain`,
        contractName: 'StemLicensing.sol',
        contractAddress: '0xe7f1725E7734CE288F8367e1Bb143E90bb3F0512',
        functionName: 'purchaseLicense',
        txHash,
        amountEth: priceEth.toString(),
        fromAddress: account,
        toAddress: '0x1a2b...9a01',
        acousticHash: 'AQAD9f83a01b2c4d5e6f7a8b9c0d1e2f3a4b',
        eventLogs: [
          `LicensePurchased(stemTokenId=${stemTokenId || stemId || 1}, buyer=${account}, type=${licenseType}, value=${priceEth} ETH)`,
          `PlatformFeeRetained(amount=${(parseFloat(priceEth) * 0.025).toFixed(5)} ETH, rate=2.5%)`,
          `PayoutTransferred(recipient=0x1a2b...9a01, amount=${(parseFloat(priceEth) * 0.975).toFixed(5)} ETH)`,
        ],
      });

      if (onPurchased) onPurchased(txHash);
    } catch (err) {
      console.warn('Purchase handled via demo fallback:', err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <div className={`border rounded-xl p-3.5 transition-all ${tier.bg} flex items-center justify-between gap-3`}>
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-white">{licenseType} License</span>
            <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-white/5 text-slate-300">
              {tier.tag}
            </span>
          </div>
          <p className="text-[11px] text-slate-400 mt-0.5 font-mono">
            Smart Contract: 2.5% protocol fee &bull; 97.5% creator payout
          </p>
        </div>

        <button
          onClick={handlePurchase}
          disabled={loading}
          className={`px-4 py-2.5 rounded-xl font-bold text-xs text-white ${tier.btn} transition-all shadow-md shrink-0 disabled:opacity-50 active:scale-95 flex items-center gap-2`}
        >
          {loading ? (
            <span className="flex items-center gap-1.5 font-mono">
              <svg className="animate-spin h-3.5 w-3.5 text-white" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
              </svg>
              <span>Mining...</span>
            </span>
          ) : (
            <>
              <span>⚡ Buy</span>
              <span className="font-mono">{priceEth} ETH</span>
            </>
          )}
        </button>
      </div>

      <BlockchainTxModal
        isOpen={Boolean(modalData)}
        onClose={() => setModalData(null)}
        txData={modalData}
      />
    </>
  );
}
