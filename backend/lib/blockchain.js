import 'dotenv/config';
import { ethers } from 'ethers';
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const StemNFTABI = JSON.parse(readFileSync(join(__dirname, '../abis/StemNFT.json'), 'utf8'));
const StemLicensingABI = JSON.parse(readFileSync(join(__dirname, '../abis/StemLicensing.json'), 'utf8'));
const RoyaltySplitterABI = JSON.parse(readFileSync(join(__dirname, '../abis/RoyaltySplitter.json'), 'utf8'));

export function getProvider() {
  const rpcUrl = process.env.RPC_URL || 'http://127.0.0.1:8545';
  return new ethers.JsonRpcProvider(rpcUrl);
}

export function getPlatformWallet() {
  const privateKey =
    process.env.PLATFORM_PRIVATE_KEY ||
    '0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80'; // standard local Hardhat key #0
  return new ethers.Wallet(privateKey, getProvider());
}

export function getStemNFTContract(signerOrProvider) {
  const address = process.env.STEM_NFT_ADDRESS || '0x5FbDB2315678afecb367f032d93F642f64180aa3';
  return new ethers.Contract(address, StemNFTABI, signerOrProvider);
}

export function getStemLicensingContract(signerOrProvider) {
  const address = process.env.STEM_LICENSING_ADDRESS || '0xe7f1725E7734CE288F8367e1Bb143E90bb3F0512';
  return new ethers.Contract(address, StemLicensingABI, signerOrProvider);
}

export function getRoyaltySplitterContract(signerOrProvider) {
  const address = process.env.ROYALTY_SPLITTER_ADDRESS || '0x9fE46736679d2D9a65F0992F2272dE9f3c7fa6e0';
  return new ethers.Contract(address, RoyaltySplitterABI, signerOrProvider);
}

export async function mintStemNFT(stemId, ownerAddress, metadataURI) {
  const wallet = getPlatformWallet();
  const stemNFT = getStemNFTContract(wallet);

  const tx = await stemNFT.mintStem(ownerAddress, stemId, metadataURI, ownerAddress, 500);
  const receipt = await tx.wait();

  // Parse StemMinted event to get tokenId
  const iface = new ethers.Interface(StemNFTABI);
  let tokenId = null;

  for (const log of receipt.logs) {
    try {
      const parsed = iface.parseLog(log);
      if (parsed && parsed.name === 'StemMinted') {
        tokenId = parsed.args.tokenId.toString();
        break;
      }
    } catch {
      // skip non-matching logs
    }
  }

  return {
    tokenId,
    txHash: receipt.hash,
    contractAddress: process.env.STEM_NFT_ADDRESS,
  };
}

export async function verifyTxOnChain(txHash) {
  try {
    const provider = getProvider();
    const receipt = await provider.getTransactionReceipt(txHash);
    if (!receipt) return null;
    return {
      success: receipt.status === 1,
      blockNumber: receipt.blockNumber,
      from: receipt.from,
      to: receipt.to,
    };
  } catch {
    return null;
  }
}
