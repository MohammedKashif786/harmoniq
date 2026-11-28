// frontend/src/config/contracts.js
// Centralized Smart Contract addresses and network settings with automatic fallbacks

import StemNFTABI from '../abis/StemNFT.json';
import StemLicensingABI from '../abis/StemLicensing.json';
import RoyaltySplitterABI from '../abis/RoyaltySplitter.json';

export const CONTRACT_ADDRESSES = {
  stemNFT: '0x5FbDB2315678afecb367f032d93F642f64180aa3',
  stemLicensing: '0xe7f1725E7734CE288F8367e1Bb143E90bb3F0512',
  royaltySplitter: '0x9fE46736679d2D9a65F0992F2272dE9f3c7fa6e0',
};

export const CONTRACT_ABIS = {
  stemNFT: StemNFTABI,
  stemLicensing: StemLicensingABI,
  royaltySplitter: RoyaltySplitterABI,
};

export const SUPPORTED_NETWORKS = {
  hardhat: {
    chainId: '0x7a69', // 31337
    chainName: 'Hardhat Localhost',
    rpcUrls: ['http://127.0.0.1:8545'],
    nativeCurrency: { name: 'Ether', symbol: 'ETH', decimals: 18 },
  },
  sepolia: {
    chainId: '0xaa36a7', // 11155111
    chainName: 'Sepolia Testnet',
    rpcUrls: ['https://rpc.sepolia.org'],
    blockExplorerUrls: ['https://sepolia.etherscan.io'],
    nativeCurrency: { name: 'Sepolia Ether', symbol: 'ETH', decimals: 18 },
  },
};
