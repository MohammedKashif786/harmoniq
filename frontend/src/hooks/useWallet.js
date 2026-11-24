import { useState, useEffect } from 'react';
import { SUPPORTED_NETWORKS } from '../config/contracts.js';

export default function useWallet() {
  const [account, setAccount] = useState(null);
  const [chainId, setChainId] = useState(null);
  const [isConnecting, setIsConnecting] = useState(false);
  const [error, setError] = useState(null);

  const connectWallet = async () => {
    if (!window.ethereum) {
      setError('MetaMask not installed');
      return;
    }
    setIsConnecting(true);
    setError(null);
    try {
      const accounts = await window.ethereum.request({ method: 'eth_requestAccounts' });
      setAccount(accounts[0]);
      const chain = await window.ethereum.request({ method: 'eth_chainId' });
      setChainId(chain);
    } catch (err) {
      setError(err.message || 'Failed to connect wallet');
    } finally {
      setIsConnecting(false);
    }
  };

  const switchNetwork = async (networkName = 'hardhat') => {
    if (!window.ethereum) return;
    const target = SUPPORTED_NETWORKS[networkName];
    if (!target) return;
    try {
      await window.ethereum.request({
        method: 'wallet_switchEthereumChain',
        params: [{ chainId: target.chainId }],
      });
    } catch (switchError) {
      if (switchError.code === 4902) {
        await window.ethereum.request({
          method: 'wallet_addEthereumChain',
          params: [target],
        });
      } else {
        console.warn('Network switch failed:', switchError.message);
      }
    }
  };

  const disconnectWallet = () => {
    setAccount(null);
    setChainId(null);
  };

  useEffect(() => {
    if (!window.ethereum) return;

    window.ethereum
      .request({ method: 'eth_accounts' })
      .then((accounts) => {
        if (accounts.length > 0) {
          setAccount(accounts[0]);
          window.ethereum.request({ method: 'eth_chainId' }).then(setChainId);
        }
      })
      .catch(() => {});

    const handleAccountsChanged = (accounts) => {
      setAccount(accounts.length > 0 ? accounts[0] : null);
    };

    const handleChainChanged = () => {
      window.location.reload();
    };

    window.ethereum.on('accountsChanged', handleAccountsChanged);
    window.ethereum.on('chainChanged', handleChainChanged);

    return () => {
      window.ethereum.removeListener('accountsChanged', handleAccountsChanged);
      window.ethereum.removeListener('chainChanged', handleChainChanged);
    };
  }, []);

  const truncatedAddress = account
    ? account.slice(0, 6) + '...' + account.slice(-4)
    : null;

  return {
    account,
    chainId,
    isConnected: !!account,
    isConnecting,
    error,
    connectWallet,
    disconnectWallet,
    switchNetwork,
    truncatedAddress,
  };
}
