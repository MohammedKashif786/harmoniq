const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("Harmoniq Smart Contracts", function () {
  let stemNFT, stemLicensing, royaltySplitter;
  let owner, producer, buyer, collaborator1, collaborator2;

  beforeEach(async function () {
    [owner, producer, buyer, collaborator1, collaborator2] = await ethers.getSigners();

    // 1. Deploy StemNFT
    const StemNFT = await ethers.getContractFactory("StemNFT");
    stemNFT = await StemNFT.deploy();
    await stemNFT.waitForDeployment();

    // 2. Deploy StemLicensing
    const StemLicensing = await ethers.getContractFactory("StemLicensing");
    stemLicensing = await StemLicensing.deploy(await stemNFT.getAddress());
    await stemLicensing.waitForDeployment();

    // 3. Deploy RoyaltySplitter
    const RoyaltySplitter = await ethers.getContractFactory("RoyaltySplitter");
    royaltySplitter = await RoyaltySplitter.deploy();
    await royaltySplitter.waitForDeployment();
  });

  describe("StemNFT", function () {
    it("Should mint a new stem NFT with metadata and royalty", async function () {
      const stemId = 42;
      const tokenURI = "ipfs://QmTestStemMetadata42";
      const royaltyFee = 500; // 5%

      const tx = await stemNFT.mintStem(
        producer.address,
        stemId,
        tokenURI,
        producer.address,
        royaltyFee
      );
      await tx.wait();

      expect(await stemNFT.ownerOf(1)).to.equal(producer.address);
      expect(await stemNFT.getStemId(1)).to.equal(stemId);
      expect(await stemNFT.tokenURI(1)).to.equal(tokenURI);

      const [royaltyRecipient, royaltyAmount] = await stemNFT.royaltyInfo(1, ethers.parseEther("1"));
      expect(royaltyRecipient).to.equal(producer.address);
      expect(royaltyAmount).to.equal(ethers.parseEther("0.05"));
    });

    it("Should reject minting by non-owner", async function () {
      await expect(
        stemNFT.connect(producer).mintStem(
          producer.address,
          1,
          "ipfs://fail",
          producer.address,
          500
        )
      ).to.be.revertedWithCustomError(stemNFT, "OwnableUnauthorizedAccount");
    });
  });

  describe("StemLicensing", function () {
    beforeEach(async function () {
      await stemNFT.mintStem(producer.address, 1, "ipfs://stem1", producer.address, 500);
    });

    it("Should allow stem owner to set license price", async function () {
      const price = ethers.parseEther("0.1");
      await stemLicensing.connect(producer).setStemPrice(1, price, 0); // 0 = Commercial

      const priceInfo = await stemLicensing.stemPrices(1);
      expect(priceInfo.priceWei).to.equal(price);
      expect(priceInfo.licenseType).to.equal(0);
      expect(priceInfo.active).to.be.true;
    });

    it("Should allow buyer to purchase a license with ETH", async function () {
      const price = ethers.parseEther("0.1");
      await stemLicensing.connect(producer).setStemPrice(1, price, 0);

      const producerBalanceBefore = await ethers.provider.getBalance(producer.address);

      const tx = await stemLicensing.connect(buyer).purchaseLicense(1, { value: price });
      await tx.wait();

      const buyerLicenses = await stemLicensing.getLicenses(buyer.address);
      expect(buyerLicenses.length).to.equal(1);
      expect(buyerLicenses[0].stemTokenId).to.equal(1);
      expect(buyerLicenses[0].buyer).to.equal(buyer.address);

      const producerBalanceAfter = await ethers.provider.getBalance(producer.address);
      expect(producerBalanceAfter).to.be.greaterThan(producerBalanceBefore);
    });
  });

  describe("RoyaltySplitter", function () {
    it("Should set collaborators and distribute royalties", async function () {
      const trackId = 101;
      const wallets = [collaborator1.address, collaborator2.address];
      const shares = [6000, 4000]; // 60% and 40%

      await royaltySplitter.setCollaborators(trackId, wallets, shares);

      const [storedWallets, storedShares] = await royaltySplitter.getCollaborators(trackId);
      expect(storedWallets.length).to.equal(2);
      expect(storedShares[0]).to.equal(6000n);
      expect(storedShares[1]).to.equal(4000n);

      const c1BalanceBefore = await ethers.provider.getBalance(collaborator1.address);
      const c2BalanceBefore = await ethers.provider.getBalance(collaborator2.address);

      const totalSplit = ethers.parseEther("1.0");
      await royaltySplitter.distributeRoyalties(trackId, { value: totalSplit });

      const c1BalanceAfter = await ethers.provider.getBalance(collaborator1.address);
      const c2BalanceAfter = await ethers.provider.getBalance(collaborator2.address);

      expect(c1BalanceAfter - c1BalanceBefore).to.equal(ethers.parseEther("0.6"));
      expect(c2BalanceAfter - c2BalanceBefore).to.equal(ethers.parseEther("0.4"));
    });
  });
});
