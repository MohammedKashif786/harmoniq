// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@openzeppelin/contracts/access/Ownable.sol";

/**
 * @title IStemNFT
 * @dev Minimal interface used by StemLicensing to verify stem ownership.
 */
interface IStemNFT {
    function ownerOf(uint256 tokenId) external view returns (address);
}

/**
 * @title StemLicensing
 * @dev Handles licensing of Harmoniq stems.
 *      Stem owners set a price & license type; buyers pay ETH.
 *      A platform fee (2.5 %) is retained; the remainder goes to the stem owner.
 */
contract StemLicensing is Ownable {
    // ─── Enums ────────────────────────────────────────────────────────────────

    enum LicenseType { Commercial, Exclusive, Remix }

    // ─── Structs ──────────────────────────────────────────────────────────────

    struct StemPrice {
        uint256 priceWei;
        LicenseType licenseType;
        bool active;
    }

    struct License {
        uint256 stemTokenId;
        address buyer;
        LicenseType licenseType;
        uint256 paidAmount;
        uint256 purchasedAt;
        uint256 expiresAt;      // 0 = perpetual
    }

    // ─── State ────────────────────────────────────────────────────────────────

    /// @notice Price configuration per stem token ID
    mapping(uint256 => StemPrice) public stemPrices;

    /// @notice All licenses held by a buyer address
    mapping(address => License[]) public buyerLicenses;

    /// @notice All licenses issued for a stem token ID
    mapping(uint256 => License[]) public stemLicenses;

    /// @notice Platform fee in tenths of a percent (25 → 2.5 %)
    uint256 public platformFeePercent = 25;

    /// @notice Reference to the StemNFT contract for ownership checks
    IStemNFT public stemNFT;

    /// @notice Platform fees accumulated, withdrawable by owner
    uint256 public accumulatedFees;

    // ─── Events ───────────────────────────────────────────────────────────────

    event LicensePurchased(
        uint256 indexed stemTokenId,
        address indexed buyer,
        LicenseType licenseType,
        uint256 amountPaid
    );

    event StemPriceSet(
        uint256 indexed stemTokenId,
        uint256 priceWei,
        LicenseType licenseType
    );

    // ─── Constructor ──────────────────────────────────────────────────────────

    constructor(address stemNFTAddress) Ownable(msg.sender) {
        stemNFT = IStemNFT(stemNFTAddress);
    }

    // ─── External Functions ───────────────────────────────────────────────────

    /**
     * @notice Set the price and license type for a stem.
     * @dev Only the current owner of the stem NFT may call this.
     * @param stemTokenId  The NFT token ID of the stem
     * @param priceWei     Price in wei
     * @param licenseType  Commercial, Exclusive, or Remix
     */
    function setStemPrice(
        uint256 stemTokenId,
        uint256 priceWei,
        LicenseType licenseType
    ) external {
        require(
            stemNFT.ownerOf(stemTokenId) == msg.sender,
            "StemLicensing: caller is not stem owner"
        );
        stemPrices[stemTokenId] = StemPrice({
            priceWei: priceWei,
            licenseType: licenseType,
            active: true
        });
        emit StemPriceSet(stemTokenId, priceWei, licenseType);
    }

    /**
     * @notice Purchase a license for a stem by sending the required ETH.
     * @param stemTokenId The NFT token ID of the stem to license
     */
    function purchaseLicense(uint256 stemTokenId) external payable {
        StemPrice memory sp = stemPrices[stemTokenId];
        require(sp.active, "StemLicensing: stem not listed for licensing");
        require(
            msg.value >= sp.priceWei,
            "StemLicensing: insufficient payment"
        );

        // Calculate platform fee (2.5 % = 25/1000)
        uint256 fee = (msg.value * platformFeePercent) / 1000;
        uint256 sellerAmount = msg.value - fee;

        accumulatedFees += fee;

        // Pay the stem owner
        address stemOwner = stemNFT.ownerOf(stemTokenId);
        (bool success, ) = stemOwner.call{value: sellerAmount}("");
        require(success, "StemLicensing: transfer to stem owner failed");

        // Record the license
        License memory newLicense = License({
            stemTokenId: stemTokenId,
            buyer: msg.sender,
            licenseType: sp.licenseType,
            paidAmount: msg.value,
            purchasedAt: block.timestamp,
            expiresAt: 0
        });

        buyerLicenses[msg.sender].push(newLicense);
        stemLicenses[stemTokenId].push(newLicense);

        emit LicensePurchased(stemTokenId, msg.sender, sp.licenseType, msg.value);
    }

    /**
     * @notice Get all licenses held by a buyer.
     * @param buyer The buyer's wallet address
     * @return      Array of License structs
     */
    function getLicenses(address buyer) external view returns (License[] memory) {
        return buyerLicenses[buyer];
    }

    /**
     * @notice Get all licenses issued for a specific stem.
     * @param stemTokenId The NFT token ID of the stem
     * @return            Array of License structs
     */
    function getStemLicenses(uint256 stemTokenId) external view returns (License[] memory) {
        return stemLicenses[stemTokenId];
    }

    /**
     * @notice Withdraw accumulated platform fees to the contract owner.
     */
    function withdrawFees() external onlyOwner {
        uint256 amount = accumulatedFees;
        require(amount > 0, "StemLicensing: no fees to withdraw");
        accumulatedFees = 0;
        (bool success, ) = owner().call{value: amount}("");
        require(success, "StemLicensing: fee withdrawal failed");
    }

    // ─── Receive ──────────────────────────────────────────────────────────────

    receive() external payable {}
}
