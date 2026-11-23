import { useState, useEffect } from 'react'

export default function useWallet() {
  const [account, setAccount] = useState(null)
  const [chainId, setChainId] = useState(null)
  const [isConnecting, setIsConnecting] = useState(false)
  const [error, setError] = useState(null)

  const connectWallet = async () => {
    if (!window.ethereum) {
      setError('MetaMask not installed')
      return
    }
    setIsConnecting(true)
    setError(null)
    try {
      const accounts = await window.ethereum.request({ method: 'eth_requestAccounts' })
      setAccount(accounts[0])
      const chain = await window.ethereum.request({ method: 'eth_chainId' })
      setChainId(chain)
    } catch (err) {
      setError(err.message || 'Failed to connect wallet')
    } finally {
      setIsConnecting(false)
    }
  }

  const disconnectWallet = () => {
    setAccount(null)
    setChainId(null)
  }

  useEffect(() => {
    if (!window.ethereum) return

    // Auto-connect if previously connected
    window.ethereum
      .request({ method: 'eth_accounts' })
      .then((accounts) => {
        if (accounts.length > 0) {
          setAccount(accounts[0])
          window.ethereum.request({ method: 'eth_chainId' }).then(setChainId)
        }
      })
      .catch(() => {})

    const handleAccountsChanged = (accounts) => {
      setAccount(accounts.length > 0 ? accounts[0] : null)
    }

    const handleChainChanged = () => {
      window.location.reload()
    }

    window.ethereum.on('accountsChanged', handleAccountsChanged)
    window.ethereum.on('chainChanged', handleChainChanged)

    return () => {
      window.ethereum.removeListener('accountsChanged', handleAccountsChanged)
      window.ethereum.removeListener('chainChanged', handleChainChanged)
    }
  }, [])

  const truncatedAddress = account
    ? account.slice(0, 6) + '...' + account.slice(-4)
    : null

  return {
    account,
    chainId,
    isConnected: !!account,
    isConnecting,
    error,
    connectWallet,
    disconnectWallet,
    truncatedAddress,
  }
}
