// Mock database store seeded with exact records from sql/seed.sql
export const demoProducers = [
  { producer_id: 1, username: 'kilowave', wallet_address: '0x1a2b3c4d5e6f7a8b9c0d1e2f3a4b5c6d7e8f9a01', email: 'kilowave@harmoniq.io', reputation_score: 4.8 },
  { producer_id: 2, username: 'aria_lune', wallet_address: '0x2b3c4d5e6f7a8b9c0d1e2f3a4b5c6d7e8f9a0102', email: 'aria@harmoniq.io', reputation_score: 4.7 },
  { producer_id: 3, username: 'tomo_k', wallet_address: '0x3c4d5e6f7a8b9c0d1e2f3a4b5c6d7e8f9a010203', email: 'tomo@harmoniq.io', reputation_score: 4.5 },
  { producer_id: 4, username: 'mira_dev', wallet_address: '0x4d5e6f7a8b9c0d1e2f3a4b5c6d7e8f9a01020304', email: 'mira@harmoniq.io', reputation_score: 4.4 },
  { producer_id: 5, username: 'deltabeat', wallet_address: '0x5e6f7a8b9c0d1e2f3a4b5c6d7e8f9a0102030405', email: 'delta@harmoniq.io', reputation_score: 4.2 },
  { producer_id: 6, username: 'sana_rey', wallet_address: '0x6f7a8b9c0d1e2f3a4b5c6d7e8f9a010203040506', email: 'sana@harmoniq.io', reputation_score: 4.1 },
];

export const demoTracks = [
  { track_id: 1, title: 'Neon Hours', bpm: 124, musical_key: 'F minor', genre: 'Synthwave', acoustic_hash: 'AQAD9f83a01b2c4d5e6f7a8b9c0d1e2f3a4b', master_audio_url: 'https://example.com/audio/track1.wav', creator_id: 1 },
  { track_id: 2, title: 'Parking Lot Gospel', bpm: 98, musical_key: 'D major', genre: 'Lo-fi', acoustic_hash: 'AQAD8e72b01c3d4e5f6a7b8c9d0e1f2a3b4c', master_audio_url: 'https://example.com/audio/track2.wav', creator_id: 3 },
  { track_id: 3, title: 'Low Tide', bpm: 86, musical_key: 'A minor', genre: 'Ambient', acoustic_hash: 'AQAD7d61c01d4e5f6a7b8c9d0e1f2a3b4c5d', master_audio_url: 'https://example.com/audio/track3.wav', creator_id: 4 },
  { track_id: 4, title: 'Glass City', bpm: 110, musical_key: 'C# minor', genre: 'Pop', acoustic_hash: 'AQAD6c50d01e5f6a7b8c9d0e1f2a3b4c5d6e', master_audio_url: 'https://example.com/audio/track4.wav', creator_id: 2 },
  { track_id: 5, title: 'Static Bloom', bpm: 140, musical_key: 'G minor', genre: 'Electronic', acoustic_hash: 'AQAD5b49e01f6a7b8c9d0e1f2a3b4c5d6e7f', master_audio_url: 'https://example.com/audio/track5.wav', creator_id: 5 },
  { track_id: 6, title: 'Sunday Tape', bpm: 92, musical_key: 'E major', genre: 'Lo-fi', acoustic_hash: 'AQAD4a38f01a7b8c9d0e1f2a3b4c5d6e7f8a', master_audio_url: 'https://example.com/audio/track6.wav', creator_id: 6 },
  { track_id: 7, title: 'Redline', bpm: 128, musical_key: 'B minor', genre: 'House', acoustic_hash: 'AQAD3927a01b8c9d0e1f2a3b4c5d6e7f8a9b', master_audio_url: 'https://example.com/audio/track7.wav', creator_id: 1 },
  { track_id: 8, title: 'Paper Moons', bpm: 100, musical_key: 'F major', genre: 'Indie', acoustic_hash: 'AQAD2816b01c9d0e1f2a3b4c5d6e7f8a9b0c', master_audio_url: 'https://example.com/audio/track8.wav', creator_id: 2 },
];

export const demoStems = [
  { stem_id: 1, track_id: 1, stem_name: 'Midnight Sub', stem_type: 'Bass', acoustic_hash: 'AQAD11111111111111111111111111111111', file_url: 'https://cdn.pixabay.com/download/audio/2022/03/15/audio_c8c8a73467.mp3?filename=melody-loop-110bpm-11234.mp3', is_ai_generated: false, tracks: { title: 'Neon Hours', creator_id: 1, producers: { username: 'kilowave', wallet_address: '0x1a2b3c4d5e6f7a8b9c0d1e2f3a4b5c6d7e8f9a01' } }, stem_mints: [{ token_id: 1001, tx_hash: '0x3a4b5c6d7e8f9a0123456789abcdef0123456789abcdef0123456789abcdef01', contract_address: '0x5b2e0000000000000000000000000000000071d0' }] },
  { stem_id: 2, track_id: 1, stem_name: 'Glass Vox', stem_type: 'Vocal', acoustic_hash: 'AQAD22222222222222222222222222222222', file_url: 'https://cdn.pixabay.com/download/audio/2022/03/15/audio_c8c8a73467.mp3?filename=melody-loop-110bpm-11234.mp3', is_ai_generated: false, tracks: { title: 'Neon Hours', creator_id: 1, producers: { username: 'kilowave', wallet_address: '0x1a2b3c4d5e6f7a8b9c0d1e2f3a4b5c6d7e8f9a01' } }, stem_mints: [{ token_id: 1002, tx_hash: '0x4b5c6d7e8f9a0123456789abcdef0123456789abcdef0123456789abcdef02', contract_address: '0x5b2e0000000000000000000000000000000071d0' }] },
  { stem_id: 3, track_id: 1, stem_name: 'Neon Kit', stem_type: 'Drum', acoustic_hash: 'AQAD33333333333333333333333333333333', file_url: 'https://cdn.pixabay.com/download/audio/2022/03/15/audio_c8c8a73467.mp3?filename=melody-loop-110bpm-11234.mp3', is_ai_generated: false, tracks: { title: 'Neon Hours', creator_id: 1, producers: { username: 'kilowave', wallet_address: '0x1a2b3c4d5e6f7a8b9c0d1e2f3a4b5c6d7e8f9a01' } }, stem_mints: [{ token_id: 1003, tx_hash: '0x5c6d7e8f9a0123456789abcdef0123456789abcdef0123456789abcdef03', contract_address: '0x5b2e0000000000000000000000000000000071d0' }] },
  { stem_id: 4, track_id: 2, stem_name: 'Dust Breaks', stem_type: 'Drum', acoustic_hash: 'AQAD44444444444444444444444444444444', file_url: 'https://cdn.pixabay.com/download/audio/2022/03/15/audio_c8c8a73467.mp3?filename=melody-loop-110bpm-11234.mp3', is_ai_generated: false, tracks: { title: 'Parking Lot Gospel', creator_id: 3, producers: { username: 'tomo_k', wallet_address: '0x3c4d5e6f7a8b9c0d1e2f3a4b5c6d7e8f9a010203' } }, stem_mints: [{ token_id: 1004, tx_hash: '0x6d7e8f9a0123456789abcdef0123456789abcdef0123456789abcdef04', contract_address: '0x5b2e0000000000000000000000000000000071d0' }] },
  { stem_id: 5, track_id: 2, stem_name: 'Aurora Lead', stem_type: 'Melody', acoustic_hash: 'AQAD55555555555555555555555555555555', prompt_seed_hash: 'seed55555555555555555555555555555555', file_url: 'https://cdn.pixabay.com/download/audio/2022/03/15/audio_c8c8a73467.mp3?filename=melody-loop-110bpm-11234.mp3', is_ai_generated: true, tracks: { title: 'Parking Lot Gospel', creator_id: 3, producers: { username: 'tomo_k', wallet_address: '0x3c4d5e6f7a8b9c0d1e2f3a4b5c6d7e8f9a010203' } }, stem_mints: [{ token_id: 1005, tx_hash: '0x7e8f9a0123456789abcdef0123456789abcdef0123456789abcdef05', contract_address: '0x5b2e0000000000000000000000000000000071d0' }] },
  { stem_id: 6, track_id: 2, stem_name: 'Warm Bass', stem_type: 'Bass', acoustic_hash: 'AQAD66666666666666666666666666666666', file_url: 'https://cdn.pixabay.com/download/audio/2022/03/15/audio_c8c8a73467.mp3?filename=melody-loop-110bpm-11234.mp3', is_ai_generated: false, tracks: { title: 'Parking Lot Gospel', creator_id: 3, producers: { username: 'tomo_k', wallet_address: '0x3c4d5e6f7a8b9c0d1e2f3a4b5c6d7e8f9a010203' } }, stem_mints: [{ token_id: 1006, tx_hash: '0x8f9a0123456789abcdef0123456789abcdef0123456789abcdef06', contract_address: '0x5b2e0000000000000000000000000000000071d0' }] },
  { stem_id: 7, track_id: 3, stem_name: 'Tape Hiss Pad', stem_type: 'Melody', acoustic_hash: 'AQAD77777777777777777777777777777777', file_url: 'https://cdn.pixabay.com/download/audio/2022/03/15/audio_c8c8a73467.mp3?filename=melody-loop-110bpm-11234.mp3', is_ai_generated: false, tracks: { title: 'Low Tide', creator_id: 4, producers: { username: 'mira_dev', wallet_address: '0x4d5e6f7a8b9c0d1e2f3a4b5c6d7e8f9a01020304' } }, stem_mints: [] },
  { stem_id: 8, track_id: 3, stem_name: 'Choir Stack', stem_type: 'Vocal', acoustic_hash: 'AQAD88888888888888888888888888888888', file_url: 'https://cdn.pixabay.com/download/audio/2022/03/15/audio_c8c8a73467.mp3?filename=melody-loop-110bpm-11234.mp3', is_ai_generated: false, tracks: { title: 'Low Tide', creator_id: 4, producers: { username: 'mira_dev', wallet_address: '0x4d5e6f7a8b9c0d1e2f3a4b5c6d7e8f9a01020304' } }, stem_mints: [{ token_id: 1008, tx_hash: '0x9a0123456789abcdef0123456789abcdef0123456789abcdef08', contract_address: '0x5b2e0000000000000000000000000000000071d0' }] },
];

export const demoLicenses = [
  { license_id: 1, stem_id: 1, buyer_id: 2, license_type: 'Commercial', price_eth: 0.015, tx_hash: '0xlic1a2b3c4d5e6f7a8b9c0d1e2f3a4b5c6d7e8f9a0123456789abcdef01234567', audio_stems: { stem_name: 'Midnight Sub', stem_type: 'Bass', tracks: { title: 'Neon Hours' } }, producers: { username: 'aria_lune', wallet_address: '0x2b3c4d5e6f7a8b9c0d1e2f3a4b5c6d7e8f9a0102' } },
  { license_id: 2, stem_id: 1, buyer_id: 5, license_type: 'Remix', price_eth: 0.030, tx_hash: '0xlic2a2b3c4d5e6f7a8b9c0d1e2f3a4b5c6d7e8f9a0123456789abcdef01234567', audio_stems: { stem_name: 'Midnight Sub', stem_type: 'Bass', tracks: { title: 'Neon Hours' } }, producers: { username: 'deltabeat', wallet_address: '0x5e6f7a8b9c0d1e2f3a4b5c6d7e8f9a0102030405' } },
  { license_id: 3, stem_id: 2, buyer_id: 3, license_type: 'Commercial', price_eth: 0.040, tx_hash: '0xlic3a2b3c4d5e6f7a8b9c0d1e2f3a4b5c6d7e8f9a0123456789abcdef01234567', audio_stems: { stem_name: 'Glass Vox', stem_type: 'Vocal', tracks: { title: 'Neon Hours' } }, producers: { username: 'tomo_k', wallet_address: '0x3c4d5e6f7a8b9c0d1e2f3a4b5c6d7e8f9a010203' } },
  { license_id: 4, stem_id: 2, buyer_id: 6, license_type: 'Exclusive', price_eth: 0.250, tx_hash: '0xlic4a2b3c4d5e6f7a8b9c0d1e2f3a4b5c6d7e8f9a0123456789abcdef01234567', audio_stems: { stem_name: 'Glass Vox', stem_type: 'Vocal', tracks: { title: 'Neon Hours' } }, producers: { username: 'sana_rey', wallet_address: '0x6f7a8b9c0d1e2f3a4b5c6d7e8f9a010203040506' } },
];

export const demoReviews = [
  { review_id: 1, stem_id: 1, reviewer_id: 2, rating: 5, comment_text: 'Huge low end, sits well under vocals.', producers: { username: 'aria_lune', wallet_address: '0x2b3c4d5e6f7a8b9c0d1e2f3a4b5c6d7e8f9a0102' } },
  { review_id: 2, stem_id: 1, reviewer_id: 3, rating: 4, comment_text: 'Clean, but needs a touch of saturation.', producers: { username: 'tomo_k', wallet_address: '0x3c4d5e6f7a8b9c0d1e2f3a4b5c6d7e8f9a010203' } },
  { review_id: 3, stem_id: 2, reviewer_id: 3, rating: 5, comment_text: 'Airy and well recorded.', producers: { username: 'tomo_k', wallet_address: '0x3c4d5e6f7a8b9c0d1e2f3a4b5c6d7e8f9a010203' } },
];

export const demoRoyaltySplits = [
  { split_id: 1, track_id: 1, collaborator_wallet: '0x1a2b3c4d5e6f7a8b9c0d1e2f3a4b5c6d7e8f9a01', share_percentage: 60 },
  { split_id: 2, track_id: 1, collaborator_wallet: '0x2b3c4d5e6f7a8b9c0d1e2f3a4b5c6d7e8f9a0102', share_percentage: 40 },
  { split_id: 3, track_id: 2, collaborator_wallet: '0x3c4d5e6f7a8b9c0d1e2f3a4b5c6d7e8f9a010203', share_percentage: 70 },
  { split_id: 4, track_id: 2, collaborator_wallet: '0x4d5e6f7a8b9c0d1e2f3a4b5c6d7e8f9a01020304', share_percentage: 30 },
  { split_id: 5, track_id: 3, collaborator_wallet: '0x4d5e6f7a8b9c0d1e2f3a4b5c6d7e8f9a01020304', share_percentage: 100 },
];
