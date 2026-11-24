const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("RoyaltySplitter Contract", function () {
  let royaltySplitter;
  let owner, artist, producer, vocalist, stranger;

  beforeEach(async function () {
    [owner, artist, producer, vocalist, stranger] = await ethers.getSigners();

    const RoyaltySplitter = await ethers.getContractFactory("RoyaltySplitter");
    royaltySplitter = await RoyaltySplitter.deploy();
    await royaltySplitter.waitForDeployment();
  });

  describe("Collaborator Configuration", function () {
    it("Should set collaborators correctly when shares sum to 10000 BPS (100%)", async function () {
      const trackId = 1;
      const wallets = [artist.address, producer.address, vocalist.address];
      const shares = [5000, 3000, 2000]; // 50%, 30%, 20%

      await expect(royaltySplitter.setCollaborators(trackId, wallets, shares))
        .to.emit(royaltySplitter, "CollaboratorsSet")
        .withArgs(trackId, 3);

      const [storedWallets, storedShares] = await royaltySplitter.getCollaborators(trackId);
      expect(storedWallets.length).to.equal(3);
      expect(storedWallets[0]).to.equal(artist.address);
      expect(storedWallets[1]).to.equal(producer.address);
      expect(storedWallets[2]).to.equal(vocalist.address);
      expect(storedShares[0]).to.equal(5000n);
      expect(storedShares[1]).to.equal(3000n);
      expect(storedShares[2]).to.equal(2000n);
    });

    it("Should reject if shares do not sum to 10000 BPS", async function () {
      const trackId = 1;
      const wallets = [artist.address, producer.address];
      const shares = [6000, 3000]; // 90% != 100%

      await expect(
        royaltySplitter.setCollaborators(trackId, wallets, shares)
      ).to.be.revertedWith("RoyaltySplitter: shares must sum to 10000 BPS");
    });

    it("Should reject if array lengths mismatch", async function () {
      const trackId = 1;
      const wallets = [artist.address, producer.address];
      const shares = [10000];

      await expect(
        royaltySplitter.setCollaborators(trackId, wallets, shares)
      ).to.be.revertedWith("RoyaltySplitter: length mismatch");
    });

    it("Should reject if a collaborator address is zero address", async function () {
      const trackId = 1;
      const wallets = [artist.address, ethers.ZeroAddress];
      const shares = [5000, 5000];

      await expect(
        royaltySplitter.setCollaborators(trackId, wallets, shares)
      ).to.be.revertedWith("RoyaltySplitter: zero address");
    });
  });

  describe("Royalty Distribution", function () {
    const trackId = 42;

    beforeEach(async function () {
      const wallets = [artist.address, producer.address];
      const shares = [7000, 3000]; // 70% and 30%
      await royaltySplitter.setCollaborators(trackId, wallets, shares);
    });

    it("Should distribute ETH proportionally in a single transaction", async function () {
      const artistBalBefore = await ethers.provider.getBalance(artist.address);
      const producerBalBefore = await ethers.provider.getBalance(producer.address);

      const distributeAmount = ethers.parseEther("2.0"); // 2 ETH

      const tx = await royaltySplitter.connect(stranger).distributeRoyalties(trackId, {
        value: distributeAmount,
      });

      await expect(tx)
        .to.emit(royaltySplitter, "RoyaltiesDistributed")
        .withArgs(trackId, distributeAmount, 2);

      const artistBalAfter = await ethers.provider.getBalance(artist.address);
      const producerBalAfter = await ethers.provider.getBalance(producer.address);

      // 70% of 2 ETH = 1.4 ETH, 30% of 2 ETH = 0.6 ETH
      expect(artistBalAfter - artistBalBefore).to.equal(ethers.parseEther("1.4"));
      expect(producerBalAfter - producerBalBefore).to.equal(ethers.parseEther("0.6"));
    });

    it("Should revert if no ETH is sent (0 value)", async function () {
      await expect(
        royaltySplitter.distributeRoyalties(trackId, { value: 0 })
      ).to.be.revertedWith("RoyaltySplitter: no ETH sent");
    });

    it("Should revert if track has no collaborators configured", async function () {
      await expect(
        royaltySplitter.distributeRoyalties(999, { value: ethers.parseEther("0.5") })
      ).to.be.revertedWith("RoyaltySplitter: no collaborators for track");
    });
  });

  describe("Clear Collaborators", function () {
    it("Should allow owner to clear collaborators for a track", async function () {
      const trackId = 10;
      await royaltySplitter.setCollaborators(trackId, [artist.address], [10000]);

      await royaltySplitter.connect(owner).clearCollaborators(trackId);

      const [wallets] = await royaltySplitter.getCollaborators(trackId);
      expect(wallets.length).to.equal(0);
    });

    it("Should reject non-owner clearing collaborators", async function () {
      await expect(
        royaltySplitter.connect(stranger).clearCollaborators(10)
      ).to.be.revertedWithCustomError(royaltySplitter, "OwnableUnauthorizedAccount");
    });
  });
});
