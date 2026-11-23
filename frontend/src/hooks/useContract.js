import { ethers } from 'ethers'
import StemNFTABI from '../abis/StemNFT.json'
import StemLicensingABI from '../abis/StemLicensing.json'
import RoyaltySplitterABI from '../abis/RoyaltySplitter.json'

export async function getMetaMaskSigner() {
  const provider = new ethers.BrowserProvider(window.ethereum)
  return provider.getSigner()
}

export function getStemNFTContract(signer) {
  return new ethers.Contract(
    import.meta.env.VITE_STEM_NFT_ADDRESS,
    StemNFTABI,
    signer
  )
}

export function getStemLicensingContract(signer) {
  return new ethers.Contract(
    import.meta.env.VITE_STEM_LICENSING_ADDRESS,
    StemLicensingABI,
    signer
  )
}

export function getRoyaltySplitterContract(signer) {
  return new ethers.Contract(
    import.meta.env.VITE_ROYALTY_SPLITTER_ADDRESS,
    RoyaltySplitterABI,
    signer
  )
}
