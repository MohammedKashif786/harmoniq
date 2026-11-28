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

// POST /:id/mint — mint a stem as an ERC-721 token (stem owner only).
// A mint is only saved if the blockchain transaction really happened.
// DEMO_MODE=true returns a simulated result and writes NOTHING to the database.
router.post('/:id/mint', async (req, res, next) => {
  const stemId = Number(req.params.id);
  if (!Number.isInteger(stemId) || stemId < 1) {
    return res.status(400).json({ error: 'Invalid stem id' });
  }
  const demo = process.env.DEMO_MODE === 'true';

  try {
    const { data: stem, error } = await supabaseAdmin
      .from('audio_stems')
      .select('stem_id, acoustic_hash, tracks(creator_id)')
      .eq('stem_id', stemId)
      .maybeSingle();
    if (error) throw error;
    if (!stem) return res.status(404).json({ error: 'Stem not found' });

    const producer = req.producer;
    if (!producer || producer.role !== 'producer' || stem.tracks?.creator_id !== producer.producer_id) {
      return res.status(403).json({ error: 'Only the owner of this stem can mint it' });
    }
    if (!producer.wallet_address) {
      return res.status(400).json({ error: 'Add your wallet address to your profile first' });
    }

    const { data: already } = await supabaseAdmin
      .from('stem_mints').select('mint_id').eq('stem_id', stemId).maybeSingle();
    if (already) return res.status(409).json({ error: 'This stem is already minted' });

    const metadataURI = req.body?.metadata_uri || `ipfs://stem-${stemId}-${stem.acoustic_hash}`;

    let result;
    try {
      result = await mintStemNFT(stemId, producer.wallet_address, metadataURI);
    } catch (chainErr) {
      if (!demo) {
        return res.status(502).json({ error: `Blockchain mint failed: ${chainErr.message}` });
      }
      return res.status(200).json({
        simulated: true,
        message: 'DEMO_MODE is on: nothing was written to the blockchain or the database.',
      });
    }

    const { data: mint, error: insertError } = await supabaseAdmin
      .from('stem_mints')
      .insert([{
        stem_id: stemId,
        token_id: Number(result.tokenId),
        tx_hash: result.txHash,
        contract_address: result.contractAddress,
        owner_wallet: producer.wallet_address,
      }])
      .select()
      .single();
    if (insertError) {
      return res.status(500).json({
        error: `Minted on chain but the record could not be saved. Keep this transaction hash: ${result.txHash}`,
        blockchain: result,
      });
    }

    res.status(201).json({ message: 'Stem minted as an ERC-721 token', mint, blockchain: result });
  } catch (err) {
    next(err);
  }
});

export default router;
