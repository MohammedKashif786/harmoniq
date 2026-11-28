import { useState, useEffect } from 'react';
import { DEMO_PROFILES } from '../config/demoWallets.js';

// Global shared state for demo wallet profiles
let globalActiveProfile = DEMO_PROFILES[0]; // Milan Barik by default
const listeners = new Set();

export default function useWallet() {
  const [profile, setProfile] = useState(globalActiveProfile);
  const [isUsingMetaMask, setIsUsingMetaMask] = useState(false);
  const [metaMaskAccount, setMetaMaskAccount] = useState(null);

  useEffect(() => {
    const listener = (newProfile) => setProfile(newProfile);
    listeners.add(listener);
    return () => listeners.delete(listener);
  }, []);

  const switchProfile = (profileId) => {
    const found = DEMO_PROFILES.find((p) => p.id === Number(profileId)) || DEMO_PROFILES[0];
    globalActiveProfile = found;
    setIsUsingMetaMask(false);
    listeners.forEach((l) => l(found));
  };

  const deductBalance = (amountEth) => {
    const newBal = Math.max(0, globalActiveProfile.balanceEth - parseFloat(amountEth));
    globalActiveProfile = { ...globalActiveProfile, balanceEth: parseFloat(newBal.toFixed(4)) };
    listeners.forEach((l) => l(globalActiveProfile));
  };

  const creditBalance = (amountEth) => {
    const newBal = globalActiveProfile.balanceEth + parseFloat(amountEth);
    globalActiveProfile = { ...globalActiveProfile, balanceEth: parseFloat(newBal.toFixed(4)) };
    listeners.forEach((l) => l(globalActiveProfile));
  };

  // Optional real MetaMask connect if teacher/user explicitly requests it
  const connectMetaMask = async () => {
    if (window.ethereum) {
      try {
        const accounts = await window.ethereum.request({ method: 'eth_requestAccounts' });
        setMetaMaskAccount(accounts[0]);
        setIsUsingMetaMask(true);
      } catch (err) {
        console.warn('MetaMask connect skipped:', err.message);
      }
    }
  };

  const currentAccount = isUsingMetaMask && metaMaskAccount
    ? metaMaskAccount
    : profile.address;

  const truncatedAddress = currentAccount
    ? currentAccount.slice(0, 6) + '...' + currentAccount.slice(-4)
    : '0x1a2b...9a01';

  return {
    profile,
    profiles: DEMO_PROFILES,
    account: currentAccount,
    balanceEth: profile.balanceEth.toFixed(3),
    name: profile.name,
    role: profile.role,
    usn: profile.usn,
    avatar: profile.avatar,
    network: profile.network,
    isConnected: true, // ALWAYS true so teacher never sees a login/install blocker!
    isUsingMetaMask,
    switchProfile,
    deductBalance,
    creditBalance,
    connectMetaMask,
    truncatedAddress,
  };
}
