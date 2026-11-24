// scripts/sync-abis.js
// Extracts full ABIs from Hardhat artifacts and syncs them to backend/abis and frontend/src/abis

const fs = require('fs');
const path = require('path');

const contracts = ['StemNFT', 'StemLicensing', 'RoyaltySplitter'];

const artifactsDir = path.join(__dirname, '..', 'artifacts', 'contracts');
const backendAbisDir = path.join(__dirname, '..', '..', 'backend', 'abis');
const frontendAbisDir = path.join(__dirname, '..', '..', 'frontend', 'src', 'abis');

fs.mkdirSync(backendAbisDir, { recursive: true });
fs.mkdirSync(frontendAbisDir, { recursive: true });

for (const name of contracts) {
  const artifactFile = path.join(artifactsDir, `${name}.sol`, `${name}.json`);
  if (!fs.existsSync(artifactFile)) {
    console.error(`Artifact not found: ${artifactFile}`);
    continue;
  }

  const artifact = JSON.parse(fs.readFileSync(artifactFile, 'utf8'));
  const abi = artifact.abi;

  const backendTarget = path.join(backendAbisDir, `${name}.json`);
  const frontendTarget = path.join(frontendAbisDir, `${name}.json`);

  fs.writeFileSync(backendTarget, JSON.stringify(abi, null, 2));
  fs.writeFileSync(frontendTarget, JSON.stringify(abi, null, 2));

  console.log(`Synced ${name} ABI (${abi.length} items) -> backend & frontend`);
}
