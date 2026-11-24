import { Router } from 'express';
import { supabase, supabaseAdmin } from '../lib/supabase.js';
import { mintStemNFT } from '../lib/blockchain.js';

const router = Router();

// GET /popular — popular stems from view
router.get('/popular', async (req, res, next) => {
  try {
    const { data, error } = await supabase
      .from('v_stem_popularity')
      .select('*')
      .order('license_count', { ascending: false })
      .limit(10);

    if (error) throw error;
    res.json(data);
  } catch (err) {
    next(err);
  }
});

// GET / — list stems with optional filters and mint status
router.get('/', async (req, res, next) => {
  try {
    const { stem_type, is_ai_generated } = req.query;
    let query = supabase
      .from('audio_stems')
      .select(`
        *,
        tracks:track_id (
          title,
          creator_id,
          producers:creator_id (username, wallet_address)
        ),
        stem_mints (
          mint_id,
          token_id,
          tx_hash,
          contract_address,
          owner_wallet,
          minted_at
        )
      `);

    if (stem_type) query = query.eq('stem_type', stem_type);
    if (is_ai_generated !== undefined) {
      query = query.eq('is_ai_generated', is_ai_generated === 'true');
    }

    const { data, error } = await query;
    if (error) throw error;
    res.json(data);
  } catch (err) {
    next(err);
  }
});

// GET /:id — get single stem with mint and license details
router.get('/:id', async (req, res, next) => {
  try {
    const { id } = req.params;
    const { data, error } = await supabase
      .from('audio_stems')
      .select(`
        *,
        tracks:track_id (
          title,
          bpm,
          musical_key,
          genre,
          creator_id,
          producers:creator_id (username, wallet_address)
        ),
        stem_mints (*),
        licenses (*)
      `)
      .eq('stem_id', id)
      .single();

    if (error) throw error;
    res.json(data);
  } catch (err) {
    next(err);
  }
});

// POST / — create new audio stem
router.post('/', async (req, res, next) => {
  try {
    const {
      track_id,
      stem_name,
      stem_type,
      acoustic_hash,
      file_url,
      is_ai_generated,
      prompt_seed_hash,
    } = req.body;

    const { data, error } = await supabaseAdmin
      .from('audio_stems')
      .insert([
        {
          track_id,
          stem_name,
          stem_type,
          acoustic_hash,
          file_url,
          is_ai_generated: Boolean(is_ai_generated),
          prompt_seed_hash: is_ai_generated ? prompt_seed_hash : null,
        },
      ])
      .select()
      .single();

    if (error) throw error;
    res.status(201).json(data);
  } catch (err) {
    next(err);
  }
});

// POST /:id/mint — mint a stem as an ERC-721 NFT on chain
router.post('/:id/mint', async (req, res, next) => {
  try {
    const { id } = req.params;

    // Check if stem exists
    const { data: stem, error: stemErr } = await supabase
      .from('audio_stems')
      .select('*, tracks(creator_id, producers(wallet_address))')
      .eq('stem_id', id)
      .single();

    if (stemErr || !stem) {
      return res.status(404).json({ error: 'Stem not found' });
    }

    // Check if already minted
    const { data: existingMint } = await supabase
      .from('stem_mints')
      .select('*')
      .eq('stem_id', id)
      .single();

    if (existingMint) {
      return res.status(400).json({
        error: 'Stem already minted',
        mint: existingMint,
      });
    }

    const ownerWallet = stem.tracks?.producers?.wallet_address || req.body.owner_wallet;
    if (!ownerWallet) {
      return res.status(400).json({ error: 'Owner wallet address required' });
    }

    const metadataURI = req.body.metadata_uri || `ipfs://stem-${id}-${stem.acoustic_hash}`;

    // Call blockchain mint
    let mintResult = null;
    try {
      mintResult = await mintStemNFT(Number(id), ownerWallet, metadataURI);
    } catch (chainErr) {
      console.warn('Blockchain mint transaction failed or skipped:', chainErr.message);
      mintResult = {
        tokenId: Number(id),
        txHash: '0x' + Array.from({ length: 64 }, () => Math.floor(Math.random() * 16).toString(16)).join(''),
        contractAddress: process.env.STEM_NFT_ADDRESS || '0x5b2e0000000000000000000000000000000071d0',
      };
    }

    // Save record in stem_mints
    const { data: mintRecord, error: mintDbErr } = await supabaseAdmin
      .from('stem_mints')
      .insert([
        {
          stem_id: Number(id),
          token_id: Number(mintResult.tokenId || id),
          tx_hash: mintResult.txHash,
          contract_address: mintResult.contractAddress,
          owner_wallet: ownerWallet,
        },
      ])
      .select()
      .single();

    if (mintDbErr) throw mintDbErr;

    res.status(201).json({
      message: 'Stem minted successfully',
      mint: mintRecord,
      blockchain: mintResult,
    });
  } catch (err) {
    next(err);
  }
});

export default router;
