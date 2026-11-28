import { ethers } from 'ethers';
import { CONTRACT_ADDRESSES, CONTRACT_ABIS } from '../config/contracts.js';

export async function getMetaMaskSigner() {
  if (!window.ethereum) {
    throw new Error('MetaMask is not installed. Please install MetaMask to interact with smart contracts.');
  }
  const provider = new ethers.BrowserProvider(window.ethereum);
  return provider.getSigner();
}

export function getStemNFTContract(signer) {
  const address = CONTRACT_ADDRESSES.stemNFT;
  return new ethers.Contract(address, CONTRACT_ABIS.stemNFT, signer);
}

export function getStemLicensingContract(signer) {
  const address = CONTRACT_ADDRESSES.stemLicensing;
  return new ethers.Contract(address, CONTRACT_ABIS.stemLicensing, signer);
}

export function getRoyaltySplitterContract(signer) {
  const address = CONTRACT_ADDRESSES.royaltySplitter;
  return new ethers.Contract(address, CONTRACT_ABIS.royaltySplitter, signer);
}
