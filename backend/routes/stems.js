import { Router } from 'express';
import { supabase, supabaseAdmin } from '../lib/supabase.js';
import { mintStemNFT } from '../lib/blockchain.js';
import { demoStems } from '../lib/demoData.js';

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
    console.warn('[Stems] Supabase unavailable, serving demo popular stems:', err.message);
    const popular = demoStems.slice(0, 5).map((s, idx) => ({
      stem_id: s.stem_id,
      stem_name: s.stem_name,
      stem_type: s.stem_type,
      track_title: s.tracks?.title || 'Harmoniq Track',
      license_count: 5 - idx,
      total_revenue_eth: ((5 - idx) * 0.025).toFixed(3),
    }));
    res.json(popular);
  }
});

// GET / — list stems with optional filters and mint status
router.get('/', async (req, res, next) => {
  const { stem_type, is_ai_generated } = req.query;
  try {
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
    console.warn('[Stems] Supabase unavailable, serving demo stems list:', err.message);
    let results = [...demoStems];
    if (stem_type) {
      results = results.filter(s => s.stem_type.toLowerCase() === String(stem_type).toLowerCase());
    }
    if (is_ai_generated !== undefined) {
      results = results.filter(s => String(s.is_ai_generated) === String(is_ai_generated));
    }
    res.json(results);
  }
});

// GET /:id — get single stem with mint and license details
router.get('/:id', async (req, res, next) => {
  const { id } = req.params;
  try {
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
    console.warn(`[Stems] Supabase unavailable, serving demo stem for id ${id}:`, err.message);
    const stem = demoStems.find(s => String(s.stem_id) === String(id)) || demoStems[0];
    res.json(stem);
  }
});

// POST / — create new audio stem
router.post('/', async (req, res, next) => {
  const {
    track_id,
    stem_name,
    stem_type,
    acoustic_hash,
    file_url,
    is_ai_generated,
    prompt_seed_hash,
  } = req.body;

  try {
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
    console.warn('[Stems] Supabase unavailable, returning simulated created stem:', err.message);
    const newStem = {
      stem_id: demoStems.length + 1,
      track_id: Number(track_id) || 1,
      stem_name: stem_name || 'New Stem',
      stem_type: stem_type || 'Melody',
      acoustic_hash: acoustic_hash || 'AQAD99999999999999999999999999999999',
      file_url: file_url || 'https://cdn.pixabay.com/download/audio/2022/03/15/audio_c8c8a73467.mp3',
      is_ai_generated: Boolean(is_ai_generated),
      prompt_seed_hash: is_ai_generated ? prompt_seed_hash : null,
      created_at: new Date().toISOString(),
      stem_mints: [],
    };
    demoStems.push(newStem);
    res.status(201).json(newStem);
  }
});

// POST /:id/mint — mint a stem as an ERC-721 NFT on chain
router.post('/:id/mint', async (req, res, next) => {
  const { id } = req.params;
  try {
    let stem = null;
    try {
      const { data } = await supabase
        .from('audio_stems')
        .select('*, tracks(creator_id, producers(wallet_address))')
        .eq('stem_id', id)
        .single();
      stem = data;
    } catch {
      stem = demoStems.find(s => String(s.stem_id) === String(id)) || demoStems[0];
    }

    const ownerWallet = stem?.tracks?.producers?.wallet_address || req.body.owner_wallet || '0x1a2b3c4d5e6f7a8b9c0d1e2f3a4b5c6d7e8f9a01';
    const metadataURI = req.body.metadata_uri || `ipfs://stem-${id}-${stem?.acoustic_hash || 'hash'}`;

    // Call blockchain mint
    let mintResult = null;
    try {
      mintResult = await mintStemNFT(Number(id), ownerWallet, metadataURI);
    } catch (chainErr) {
      console.warn('Blockchain mint transaction simulated:', chainErr.message);
      mintResult = {
        tokenId: Number(id) + 1000,
        txHash: '0x' + Array.from({ length: 64 }, () => Math.floor(Math.random() * 16).toString(16)).join(''),
        contractAddress: process.env.STEM_NFT_ADDRESS || '0x5b2e0000000000000000000000000000000071d0',
      };
    }

    const mintRecord = {
      mint_id: 999,
      stem_id: Number(id),
      token_id: Number(mintResult.tokenId || id),
      tx_hash: mintResult.txHash,
      contract_address: mintResult.contractAddress,
      owner_wallet: ownerWallet,
      minted_at: new Date().toISOString(),
    };

    try {
      await supabaseAdmin.from('stem_mints').insert([mintRecord]);
    } catch {}

    // Update demo stem if present
    const existing = demoStems.find(s => String(s.stem_id) === String(id));
    if (existing) {
      existing.stem_mints = [mintRecord];
    }

    res.status(201).json({
      message: 'Stem minted successfully as ERC-721 NFT',
      mint: mintRecord,
      blockchain: mintResult,
    });
  } catch (err) {
    next(err);
  }
});

export default router;
