// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@openzeppelin/contracts/token/ERC721/extensions/ERC721URIStorage.sol";
import "@openzeppelin/contracts/token/common/ERC2981.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

/**
 * @title StemNFT
 * @dev ERC-721 NFT contract for Harmoniq music stems.
 *      Each stem (Vocal, Bass, Drum, Melody) is minted as a unique NFT
 *      with on-chain royalty support via ERC-2981.
 */
contract StemNFT is ERC721URIStorage, ERC2981, Ownable {
    // ─── State ────────────────────────────────────────────────────────────────

    /// @notice Maps tokenId → off-chain stemId (Supabase PK)
    mapping(uint256 => uint256) public tokenToStemId;

    /// @dev Auto-incrementing token ID counter (starts at 0, first token = 1)
    uint256 private _tokenIds;

    // ─── Events ───────────────────────────────────────────────────────────────

    event StemMinted(
        uint256 indexed tokenId,
        uint256 indexed stemId,
        address indexed owner,
        string tokenURI
    );

    // ─── Constructor ──────────────────────────────────────────────────────────

    constructor() ERC721("HarmoniqStem", "HSTEM") Ownable(msg.sender) {}

    // ─── External Functions ───────────────────────────────────────────────────

    /**
     * @notice Mint a new stem NFT.
     * @param to               Recipient address (stem creator / producer)
     * @param stemId           Off-chain stem ID from Supabase
     * @param tokenURI_        IPFS / Arweave metadata URI
     * @param royaltyRecipient Address that receives secondary-sale royalties
     * @param royaltyFee       Royalty fee in basis points (e.g. 500 = 5 %)
     * @return tokenId         The newly minted token ID
     */
    function mintStem(
        address to,
        uint256 stemId,
        string memory tokenURI_,
        address royaltyRecipient,
        uint96 royaltyFee
    ) external onlyOwner returns (uint256 tokenId) {
        _tokenIds++;
        tokenId = _tokenIds;

        _safeMint(to, tokenId);
        _setTokenURI(tokenId, tokenURI_);
        _setTokenRoyalty(tokenId, royaltyRecipient, royaltyFee);

        tokenToStemId[tokenId] = stemId;

        emit StemMinted(tokenId, stemId, to, tokenURI_);
    }

    /**
     * @notice Retrieve the off-chain stem ID for a given token.
     * @param tokenId The NFT token ID
     * @return        The corresponding Supabase stem ID
     */
    function getStemId(uint256 tokenId) external view returns (uint256) {
        return tokenToStemId[tokenId];
    }

    // ─── Interface Support ────────────────────────────────────────────────────

    /**
     * @dev Override required by Solidity when multiple base contracts define
     *      supportsInterface (ERC721URIStorage and ERC2981 both do).
     */
    function supportsInterface(bytes4 interfaceId)
        public
        view
        override(ERC721URIStorage, ERC2981)
        returns (bool)
    {
        return super.supportsInterface(interfaceId);
    }
}
