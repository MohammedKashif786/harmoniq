// scripts/deploy-and-seed.js
// Complete deployment and on-chain state initialization for Harmoniq

const { ethers, network } = require("hardhat");
const fs = require("fs");
const path = require("path");

async function main() {
  console.log("=================================================");
  console.log("  HARMONIQ SMART CONTRACT DEPLOYMENT & SEEDING   ");
  console.log("=================================================");

  const signers = await ethers.getSigners();
  const deployer = signers[0];
  const collaborator2 = signers[1] || signers[0];

  console.log("Deployer Address :", deployer.address);
  console.log("Network          :", network.name);
  const balance = await ethers.provider.getBalance(deployer.address);
  console.log("Deployer Balance :", ethers.formatEther(balance), "ETH\n");

  // 1. Deploy StemNFT
  console.log("1. Deploying StemNFT (ERC-721 + ERC-2981)...");
  const StemNFT = await ethers.getContractFactory("StemNFT");
  const stemNFT = await StemNFT.deploy();
  await stemNFT.waitForDeployment();
  const stemNFTAddress = await stemNFT.getAddress();
  console.log("   -> StemNFT deployed at:", stemNFTAddress);

  // 2. Deploy StemLicensing
  console.log("2. Deploying StemLicensing...");
  const StemLicensing = await ethers.getContractFactory("StemLicensing");
  const stemLicensing = await StemLicensing.deploy(stemNFTAddress);
  await stemLicensing.waitForDeployment();
  const stemLicensingAddress = await stemLicensing.getAddress();
  console.log("   -> StemLicensing deployed at:", stemLicensingAddress);

  // 3. Deploy RoyaltySplitter
  console.log("3. Deploying RoyaltySplitter...");
  const RoyaltySplitter = await ethers.getContractFactory("RoyaltySplitter");
  const royaltySplitter = await RoyaltySplitter.deploy();
  await royaltySplitter.waitForDeployment();
  const royaltySplitterAddress = await royaltySplitter.getAddress();
  console.log("   -> RoyaltySplitter deployed at:", royaltySplitterAddress);

  // 4. Seed On-Chain Demo Stems (Minting StemNFTs)
  console.log("\n4. Minting Initial Stem NFTs...");
  const demoStems = [
    { stemId: 1, name: "Midnight Sub", uri: "ipfs://QmHarmoniqStem1MidnightSub" },
    { stemId: 2, name: "Glass Vox", uri: "ipfs://QmHarmoniqStem2GlassVox" },
    { stemId: 3, name: "Neon Kit", uri: "ipfs://QmHarmoniqStem3NeonKit" },
  ];

  for (const item of demoStems) {
    const tx = await stemNFT.mintStem(
      deployer.address,
      item.stemId,
      item.uri,
      deployer.address,
      500 // 5% ERC-2981 royalty
    );
    await tx.wait();
    console.log(`   -> Minted Token #${item.stemId} for '${item.name}' (Stem ID ${item.stemId})`);
  }

  // 5. Configure Licensing Prices on StemLicensing
  console.log("\n5. Configuring Stem Licensing Prices...");
  // LicenseType: 0 = Commercial, 1 = Exclusive, 2 = Remix
  await (await stemLicensing.setStemPrice(1, ethers.parseEther("0.015"), 0)).wait();
  console.log("   -> Token #1 price set to 0.015 ETH (Commercial)");

  await (await stemLicensing.setStemPrice(2, ethers.parseEther("0.040"), 0)).wait();
  console.log("   -> Token #2 price set to 0.040 ETH (Commercial)");

  await (await stemLicensing.setStemPrice(3, ethers.parseEther("0.020"), 0)).wait();
  console.log("   -> Token #3 price set to 0.020 ETH (Commercial)");

  // 6. Configure Collaborator Royalty Splits on RoyaltySplitter
  console.log("\n6. Configuring Collaborator Royalty Splits for Track #1...");
  const trackId = 1;
  const wallets = [deployer.address, collaborator2.address];
  const sharesBPS = [6000, 4000]; // 60% and 40% (sums to 10000 BPS)
  await (await royaltySplitter.setCollaborators(trackId, wallets, sharesBPS)).wait();
  console.log(`   -> Track #1 Royalty Splits: ${deployer.address.slice(0, 8)}... (60%), ${collaborator2.address.slice(0, 8)}... (40%)`);

  // 7. Write addresses to deployed-addresses.json
  const deployedAddresses = {
    stemNFT: stemNFTAddress,
    stemLicensing: stemLicensingAddress,
    royaltySplitter: royaltySplitterAddress,
    network: network.name,
    deployedAt: new Date().toISOString(),
  };

  const outputPath = path.join(__dirname, "deployed-addresses.json");
  fs.writeFileSync(outputPath, JSON.stringify(deployedAddresses, null, 2));
  console.log("\n7. Saved addresses to:", outputPath);

  // 8. Update backend .env and frontend .env
  const backendEnvPath = path.join(__dirname, "..", "..", "backend", ".env");
  const frontendEnvPath = path.join(__dirname, "..", "..", "frontend", ".env");

  const backendEnvContent = `PORT=3001
FRONTEND_URL=http://localhost:5173
STEM_NFT_ADDRESS=${stemNFTAddress}
STEM_LICENSING_ADDRESS=${stemLicensingAddress}
ROYALTY_SPLITTER_ADDRESS=${royaltySplitterAddress}
RPC_URL=http://127.0.0.1:8545
PLATFORM_PRIVATE_KEY=0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80
`;
  fs.writeFileSync(backendEnvPath, backendEnvContent);
  console.log("   -> Updated backend/.env");

  const frontendEnvContent = `VITE_API_URL=http://localhost:3001
VITE_STEM_NFT_ADDRESS=${stemNFTAddress}
VITE_STEM_LICENSING_ADDRESS=${stemLicensingAddress}
VITE_ROYALTY_SPLITTER_ADDRESS=${royaltySplitterAddress}
`;
  fs.writeFileSync(frontendEnvPath, frontendEnvContent);
  console.log("   -> Updated frontend/.env");

  // 9. Update frontend/src/config/contracts.js
  const frontendConfigPath = path.join(__dirname, "..", "..", "frontend", "src", "config", "contracts.js");
  const configContent = `// frontend/src/config/contracts.js
// Centralized Smart Contract addresses and network settings with automatic fallbacks

import StemNFTABI from '../abis/StemNFT.json';
import StemLicensingABI from '../abis/StemLicensing.json';
import RoyaltySplitterABI from '../abis/RoyaltySplitter.json';

export const CONTRACT_ADDRESSES = {
  stemNFT: '${stemNFTAddress}',
  stemLicensing: '${stemLicensingAddress}',
  royaltySplitter: '${royaltySplitterAddress}',
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
`;
  fs.writeFileSync(frontendConfigPath, configContent);
  console.log("   -> Updated frontend/src/config/contracts.js");

  console.log("\n=================================================");
  console.log("  BLOCKCHAIN DEPLOYMENT COMPLETE & READY TO USE  ");
  console.log("=================================================");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("Deployment failed:", error);
    process.exit(1);
  });
