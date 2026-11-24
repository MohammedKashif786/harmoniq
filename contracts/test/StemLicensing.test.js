const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("StemLicensing Contract", function () {
  let stemNFT, stemLicensing;
  let owner, producer, buyer, unauthorized;

  beforeEach(async function () {
    [owner, producer, buyer, unauthorized] = await ethers.getSigners();

    // Deploy StemNFT
    const StemNFT = await ethers.getContractFactory("StemNFT");
    stemNFT = await StemNFT.deploy();
    await stemNFT.waitForDeployment();

    // Deploy StemLicensing with StemNFT address
    const StemLicensing = await ethers.getContractFactory("StemLicensing");
    stemLicensing = await StemLicensing.deploy(await stemNFT.getAddress());
    await stemLicensing.waitForDeployment();

    // Mint token 1 to producer
    await stemNFT.mintStem(
      producer.address,
      1, // stemId
      "ipfs://QmStemMetadata1",
      producer.address,
      500 // 5% royalty
    );
  });

  describe("Stem Pricing", function () {
    it("Should allow the stem NFT owner to set license price and type", async function () {
      const price = ethers.parseEther("0.05");
      // LicenseType: 0 = Commercial, 1 = Exclusive, 2 = Remix
      await expect(stemLicensing.connect(producer).setStemPrice(1, price, 0))
        .to.emit(stemLicensing, "StemPriceSet")
        .withArgs(1, price, 0);

      const priceInfo = await stemLicensing.stemPrices(1);
      expect(priceInfo.priceWei).to.equal(price);
      expect(priceInfo.licenseType).to.equal(0);
      expect(priceInfo.active).to.be.true;
    });

    it("Should reject non-stem-owner trying to set license price", async function () {
      const price = ethers.parseEther("0.05");
      await expect(
        stemLicensing.connect(unauthorized).setStemPrice(1, price, 0)
      ).to.be.revertedWith("StemLicensing: caller is not stem owner");
    });
  });

  describe("License Purchasing & Fee Deduction", function () {
    const price = ethers.parseEther("0.1"); // 0.1 ETH

    beforeEach(async function () {
      await stemLicensing.connect(producer).setStemPrice(1, price, 0);
    });

    it("Should purchase license, deduct 2.5% platform fee, and send 97.5% to producer", async function () {
      const producerBalBefore = await ethers.provider.getBalance(producer.address);

      const tx = await stemLicensing.connect(buyer).purchaseLicense(1, { value: price });
      await expect(tx)
        .to.emit(stemLicensing, "LicensePurchased")
        .withArgs(1, buyer.address, 0, price);

      const producerBalAfter = await ethers.provider.getBalance(producer.address);

      // Fee: 2.5% of 0.1 ETH = 0.0025 ETH; Seller gets 0.0975 ETH
      const expectedSellerAmount = ethers.parseEther("0.0975");
      expect(producerBalAfter - producerBalBefore).to.equal(expectedSellerAmount);

      // Verify platform accumulated fees
      const fees = await stemLicensing.accumulatedFees();
      expect(fees).to.equal(ethers.parseEther("0.0025"));

      // Verify buyer licenses
      const buyerLicenses = await stemLicensing.getLicenses(buyer.address);
      expect(buyerLicenses.length).to.equal(1);
      expect(buyerLicenses[0].stemTokenId).to.equal(1);
      expect(buyerLicenses[0].buyer).to.equal(buyer.address);
      expect(buyerLicenses[0].paidAmount).to.equal(price);

      // Verify stem licenses
      const stemLicenses = await stemLicensing.getStemLicenses(1);
      expect(stemLicenses.length).to.equal(1);
      expect(stemLicenses[0].buyer).to.equal(buyer.address);
    });

    it("Should revert if stem is not listed (not active)", async function () {
      await expect(
        stemLicensing.connect(buyer).purchaseLicense(999, { value: price })
      ).to.be.revertedWith("StemLicensing: stem not listed for licensing");
    });

    it("Should revert if buyer sends insufficient ETH", async function () {
      const lowPrice = ethers.parseEther("0.01");
      await expect(
        stemLicensing.connect(buyer).purchaseLicense(1, { value: lowPrice })
      ).to.be.revertedWith("StemLicensing: insufficient payment");
    });
  });

  describe("Platform Fee Withdrawal", function () {
    it("Should allow contract owner to withdraw accumulated platform fees", async function () {
      const price = ethers.parseEther("1.0");
      await stemLicensing.connect(producer).setStemPrice(1, price, 1); // Exclusive
      await stemLicensing.connect(buyer).purchaseLicense(1, { value: price });

      const fee = ethers.parseEther("0.025"); // 2.5%
      expect(await stemLicensing.accumulatedFees()).to.equal(fee);

      const ownerBalBefore = await ethers.provider.getBalance(owner.address);
      const tx = await stemLicensing.connect(owner).withdrawFees();
      const receipt = await tx.wait();
      const gasCost = receipt.gasUsed * receipt.gasPrice;

      const ownerBalAfter = await ethers.provider.getBalance(owner.address);
      expect(ownerBalAfter + gasCost - ownerBalBefore).to.equal(fee);
      expect(await stemLicensing.accumulatedFees()).to.equal(0n);
    });

    it("Should reject non-owner withdrawing platform fees", async function () {
      await expect(
        stemLicensing.connect(unauthorized).withdrawFees()
      ).to.be.revertedWithCustomError(stemLicensing, "OwnableUnauthorizedAccount");
    });
  });
});
