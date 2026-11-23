// scripts/deploy.js
// Deploys StemNFT → StemLicensing → RoyaltySplitter and writes addresses to deployed-addresses.json

const { ethers, network } = require("hardhat");
const fs = require("fs");
const path = require("path");

async function main() {
  const [deployer] = await ethers.getSigners();
  console.log("Deploying contracts with account:", deployer.address);
  console.log("Network:", network.name);

  // ── 1. StemNFT ──────────────────────────────────────────────────────────────
  const StemNFT = await ethers.getContractFactory("StemNFT");
  const stemNFT = await StemNFT.deploy();
  await stemNFT.waitForDeployment();
  const stemNFTAddress = await stemNFT.getAddress();
  console.log("StemNFT deployed to:", stemNFTAddress);

  // ── 2. StemLicensing ────────────────────────────────────────────────────────
  const StemLicensing = await ethers.getContractFactory("StemLicensing");
  const stemLicensing = await StemLicensing.deploy(stemNFTAddress);
  await stemLicensing.waitForDeployment();
  const stemLicensingAddress = await stemLicensing.getAddress();
  console.log("StemLicensing deployed to:", stemLicensingAddress);

  // ── 3. RoyaltySplitter ──────────────────────────────────────────────────────
  const RoyaltySplitter = await ethers.getContractFactory("RoyaltySplitter");
  const royaltySplitter = await RoyaltySplitter.deploy();
  await royaltySplitter.waitForDeployment();
  const royaltySplitterAddress = await royaltySplitter.getAddress();
  console.log("RoyaltySplitter deployed to:", royaltySplitterAddress);

  // ── Write deployed-addresses.json ───────────────────────────────────────────
  const deployedAddresses = {
    stemNFT: stemNFTAddress,
    stemLicensing: stemLicensingAddress,
    royaltySplitter: royaltySplitterAddress,
    network: network.name,
    deployedAt: new Date().toISOString(),
  };

  const outputPath = path.join(__dirname, "deployed-addresses.json");
  fs.writeFileSync(outputPath, JSON.stringify(deployedAddresses, null, 2));
  console.log("Deployed addresses written to:", outputPath);
  console.log(deployedAddresses);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
