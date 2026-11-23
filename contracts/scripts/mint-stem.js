// scripts/mint-stem.js
// Example script: mint a stem NFT using the deployed StemNFT contract.
//
// Usage:
//   npx hardhat run scripts/mint-stem.js --network sepolia
//
// Prerequisites:
//   1. Run deploy.js first so deployed-addresses.json exists.
//   2. Set PRIVATE_KEY and SEPOLIA_RPC_URL in your .env file.

const { ethers, network } = require("hardhat");
const fs = require("fs");
const path = require("path");

async function main() {
  // ── Load deployed addresses ──────────────────────────────────────────────────
  const addressesPath = path.join(__dirname, "deployed-addresses.json");
  if (!fs.existsSync(addressesPath)) {
    throw new Error("deployed-addresses.json not found. Run deploy.js first.");
  }
  const addresses = JSON.parse(fs.readFileSync(addressesPath, "utf8"));
  console.log("Using StemNFT at:", addresses.stemNFT);
  console.log("Network:", network.name);

  // ── Connect to the contract ──────────────────────────────────────────────────
  const [deployer] = await ethers.getSigners();
  const StemNFT = await ethers.getContractFactory("StemNFT");
  const stemNFT = StemNFT.attach(addresses.stemNFT);

  // ── Stem metadata (edit these values before running) ────────────────────────
  const recipient     = deployer.address;          // who receives the NFT
  const stemId        = 1;                         // Supabase audio_stems.stem_id
  const tokenURI      = "ipfs://QmExampleCIDHere"; // IPFS metadata URI
  const royaltyRecip  = deployer.address;          // royalty payment recipient
  const royaltyFee    = 500;                       // 500 BPS = 5 %

  console.log("\nMinting stem NFT...");
  console.log("  Recipient    :", recipient);
  console.log("  Stem ID      :", stemId);
  console.log("  Token URI    :", tokenURI);
  console.log("  Royalty Recip:", royaltyRecip);
  console.log("  Royalty Fee  :", royaltyFee, "BPS");

  const tx = await stemNFT.mintStem(
    recipient,
    stemId,
    tokenURI,
    royaltyRecip,
    royaltyFee
  );
  const receipt = await tx.wait();

  // Parse the StemMinted event
  const mintEvent = receipt.logs
    .map((log) => {
      try { return stemNFT.interface.parseLog(log); } catch { return null; }
    })
    .find((e) => e && e.name === "StemMinted");

  if (mintEvent) {
    console.log("\nStemMinted event:");
    console.log("  tokenId :", mintEvent.args.tokenId.toString());
    console.log("  stemId  :", mintEvent.args.stemId.toString());
    console.log("  owner   :", mintEvent.args.owner);
    console.log("  tokenURI:", mintEvent.args.tokenURI);
  }

  console.log("\nTransaction hash:", receipt.hash);
  console.log("Gas used:", receipt.gasUsed.toString());
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
