// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/access/Ownable.sol";

/**
 * @title RoyaltySplitter
 * @dev Manages on-chain royalty splits for Harmoniq tracks.
 *      Collaborator shares are stored in basis points (BPS) where 10 000 = 100 %.
 *      Anyone can send ETH via distributeRoyalties() and all collaborators
 *      receive their proportional share in the same transaction.
 */
contract RoyaltySplitter is Ownable {
    // ─── Structs ──────────────────────────────────────────────────────────────

    struct Collaborator {
        address wallet;
        uint256 sharesBPS;   // e.g. 5000 = 50 %
    }

    // ─── State ────────────────────────────────────────────────────────────────

    /// @notice Collaborator list per track ID
    mapping(uint256 => Collaborator[]) public trackCollaborators;

    // ─── Events ───────────────────────────────────────────────────────────────

    event CollaboratorsSet(
        uint256 indexed trackId,
        uint256 collaboratorCount
    );

    event RoyaltiesDistributed(
        uint256 indexed trackId,
        uint256 totalAmount,
        uint256 collaboratorCount
    );

    // ─── Constructor ──────────────────────────────────────────────────────────

    constructor() Ownable(msg.sender) {}

    // ─── External Functions ───────────────────────────────────────────────────

    /**
     * @notice Set (or replace) the collaborator list for a track.
     * @dev The sum of all sharesBPS values must equal exactly 10 000.
     * @param trackId   The Harmoniq track ID
     * @param wallets   Collaborator wallet addresses
     * @param sharesBPS Corresponding shares in basis points (must sum to 10 000)
     */
    function setCollaborators(
        uint256 trackId,
        address[] calldata wallets,
        uint256[] calldata sharesBPS
    ) external {
        require(wallets.length == sharesBPS.length, "RoyaltySplitter: length mismatch");
        require(wallets.length > 0, "RoyaltySplitter: no collaborators");

        uint256 total = 0;
        for (uint256 i = 0; i < sharesBPS.length; i++) {
            require(wallets[i] != address(0), "RoyaltySplitter: zero address");
            total += sharesBPS[i];
        }
        require(total == 10000, "RoyaltySplitter: shares must sum to 10000 BPS");

        // Replace existing collaborator list
        delete trackCollaborators[trackId];
        for (uint256 i = 0; i < wallets.length; i++) {
            trackCollaborators[trackId].push(
                Collaborator({ wallet: wallets[i], sharesBPS: sharesBPS[i] })
            );
        }

        emit CollaboratorsSet(trackId, wallets.length);
    }

    /**
     * @notice Distribute royalties to all collaborators of a track.
     * @dev Send ETH along with this call; it is split proportionally.
     * @param trackId The Harmoniq track ID
     */
    function distributeRoyalties(uint256 trackId) external payable {
        require(msg.value > 0, "RoyaltySplitter: no ETH sent");
        Collaborator[] storage collaborators = trackCollaborators[trackId];
        require(collaborators.length > 0, "RoyaltySplitter: no collaborators for track");

        uint256 totalSent = msg.value;
        for (uint256 i = 0; i < collaborators.length; i++) {
            uint256 share = (totalSent * collaborators[i].sharesBPS) / 10000;
            (bool success, ) = collaborators[i].wallet.call{value: share}("");
            require(success, "RoyaltySplitter: transfer failed");
        }

        emit RoyaltiesDistributed(trackId, totalSent, collaborators.length);
    }

    /**
     * @notice Get the collaborator wallets and their shares for a track.
     * @param trackId The Harmoniq track ID
     * @return wallets Array of collaborator wallet addresses
     * @return shares  Corresponding basis-point shares
     */
    function getCollaborators(uint256 trackId)
        external
        view
        returns (address[] memory wallets, uint256[] memory shares)
    {
        Collaborator[] storage collaborators = trackCollaborators[trackId];
        wallets = new address[](collaborators.length);
        shares  = new uint256[](collaborators.length);
        for (uint256 i = 0; i < collaborators.length; i++) {
            wallets[i] = collaborators[i].wallet;
            shares[i]  = collaborators[i].sharesBPS;
        }
    }

    /**
     * @notice Remove all collaborators for a track (admin only).
     * @param trackId The Harmoniq track ID
     */
    function clearCollaborators(uint256 trackId) external onlyOwner {
        delete trackCollaborators[trackId];
    }

    // ─── Receive ──────────────────────────────────────────────────────────────

    receive() external payable {}
}
