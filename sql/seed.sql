-- ============================================================
-- Harmoniq: seed.sql  (sample data)
-- Run AFTER schema.sql. Safe to re-run: it empties the tables first.
-- All wallets and hashes are fake, generated with md5() so they
-- have the right format.
-- ============================================================

BEGIN;

TRUNCATE stem_reviews, licenses, royalty_splits, stem_mints,
         audio_stems, tracks, producers RESTART IDENTITY CASCADE;

-- helper: fake 0x wallet from a number (dropped at the end)
CREATE FUNCTION seed_wallet(n INT) RETURNS TEXT AS $$
    SELECT '0x' || substr(md5('wallet' || n) || md5('w2' || n), 1, 40)
$$ LANGUAGE sql IMMUTABLE;

-- PRODUCERS (ids 1-6) ----------------------------------------
INSERT INTO producers (username, wallet_address, email)
SELECT u, seed_wallet(n), u || '@example.com'
FROM (VALUES (1,'kilowave'),(2,'aria_lune'),(3,'tomo_k'),
             (4,'mira_dev'),(5,'deltabeat'),(6,'sana_rey')) AS v(n,u)
ORDER BY n;

-- TRACKS (ids 1-8) -------------------------------------------
INSERT INTO tracks (title, bpm, musical_key, genre, acoustic_hash, master_audio_url, creator_id)
SELECT title, bpm, k, genre, 'AQAD' || md5('track' || n),
       'https://example.com/audio/track' || n || '.wav', creator
FROM (VALUES
  (1,'Neon Hours',124,'F minor','Synthwave',1),
  (2,'Parking Lot Gospel',98,'D major','Lo-fi',3),
  (3,'Low Tide',86,'A minor','Ambient',4),
  (4,'Glass City',110,'C# minor','Pop',2),
  (5,'Static Bloom',140,'G minor','Electronic',5),
  (6,'Sunday Tape',92,'E major','Lo-fi',6),
  (7,'Redline',128,'B minor','House',1),
  (8,'Paper Moons',100,'F major','Indie',2)
) AS v(n,title,bpm,k,genre,creator)
ORDER BY n;

-- AUDIO_STEMS (ids 1-20; 5, 11 and 14 are AI-generated) ------
INSERT INTO audio_stems (track_id, stem_name, stem_type, acoustic_hash,
                         prompt_seed_hash, file_url, is_ai_generated)
SELECT trk, name, typ, 'AQAD' || md5('stem' || n),
       CASE WHEN ai THEN 'seed' || md5('seed' || n) END,
       'https://example.com/audio/stem' || n || '.wav', ai
FROM (VALUES
  (1,1,'Midnight Sub','Bass',false),   (2,1,'Glass Vox','Vocal',false),
  (3,1,'Neon Kit','Drum',false),       (4,2,'Dust Breaks','Drum',false),
  (5,2,'Aurora Lead','Melody',true),   (6,2,'Warm Bass','Bass',false),
  (7,3,'Tape Hiss Pad','Melody',false),(8,3,'Choir Stack','Vocal',false),
  (9,4,'City Lights Vox','Vocal',false),(10,4,'Glass Snares','Drum',false),
  (11,4,'Prism Keys','Melody',true),   (12,5,'Static Reese','Bass',false),
  (13,5,'Bloom Breaks','Drum',false),  (14,5,'Arp Garden','Melody',true),
  (15,6,'Tape Chords','Melody',false), (16,6,'Sunday Brush','Drum',false),
  (17,7,'Redline Sub','Bass',false),   (18,7,'Red Kit','Drum',false),
  (19,8,'Moon Harmony','Vocal',false), (20,8,'Paper Piano','Melody',false)
) AS v(n,trk,name,typ,ai)
ORDER BY n;

-- STEM_MINTS: 14 of the 20 stems are minted; owner = track creator
INSERT INTO stem_mints (stem_id, token_id, tx_hash, contract_address, owner_wallet, minted_at)
SELECT s.stem_id, 1000 + s.stem_id,
       '0x' || md5('tx' || s.stem_id) || md5('tx2' || s.stem_id),
       '0x5b2e0000000000000000000000000000000071d0'::text,
       p.wallet_address,
       now() - (s.stem_id || ' days')::interval
FROM audio_stems s
JOIN tracks t    ON t.track_id = s.track_id
JOIN producers p ON p.producer_id = t.creator_id
WHERE s.stem_id IN (1,2,3,4,5,6,8,9,10,11,12,13,17,19);

-- ROYALTY_SPLITS: every track totals exactly 100 --------------
INSERT INTO royalty_splits (track_id, collaborator_wallet, share_percentage)
SELECT trk, seed_wallet(prod), pct
FROM (VALUES
  (1,1,60),(1,2,25),(1,3,15),
  (2,3,70),(2,4,30),
  (3,4,100),
  (4,2,50),(4,5,50),
  (5,5,60),(5,1,40),
  (6,6,80),(6,3,20),
  (7,1,55),(7,5,45),
  (8,2,65),(8,6,35)
) AS v(trk,prod,pct);

-- LICENSES ------------------------------------------------------
INSERT INTO licenses (stem_id, buyer_id, license_type, price_eth, tx_hash, expires_at)
SELECT stem, buyer, typ, price,
       '0x' || md5('lic' || n) || md5('lic2' || n),
       CASE WHEN typ = 'Exclusive' THEN NULL ELSE now() + interval '1 year' END
FROM (VALUES
  (1,1,2,'Commercial',0.015),(2,1,5,'Remix',0.030),
  (3,2,3,'Commercial',0.040),(4,2,6,'Exclusive',0.250),
  (5,4,1,'Commercial',0.008),(6,4,4,'Remix',0.012),
  (7,5,1,'Commercial',0.022),(8,6,2,'Commercial',0.010),
  (9,8,3,'Commercial',0.030),(10,9,5,'Commercial',0.035),
  (11,10,6,'Remix',0.015),   (12,12,3,'Commercial',0.018),
  (13,17,4,'Exclusive',0.300),(14,19,1,'Commercial',0.028)
) AS v(n,stem,buyer,typ,price);

-- STEM_REVIEWS (the reputation trigger fills producers.reputation_score)
INSERT INTO stem_reviews (stem_id, reviewer_id, rating, comment_text) VALUES
  (1,2,5,'Huge low end, sits well under vocals.'),
  (1,3,4,'Clean, but needs a touch of saturation.'),
  (1,5,5,'Locked in with my kick instantly.'),
  (2,3,5,'Airy and well recorded.'),
  (2,6,4,'Great top end.'),
  (4,1,4,'Punchy and dry, easy to layer.'),
  (4,4,5,'Perfect lo-fi swing.'),
  (4,2,4,'Needs a little more room tone.'),
  (5,1,3,'Interesting idea, a bit repetitive.'),
  (5,2,4,'Nice texture for a pad.'),
  (6,2,5,'Warm and round.'),
  (6,5,4,'Solid foundation.'),
  (8,3,5,'Beautiful stack.'),
  (8,1,4,'Lovely dynamics.'),
  (9,5,4,'Emotional delivery.'),
  (9,1,5,'Sits in a mix easily.'),
  (9,6,5,'My favourite vocal here.'),
  (10,6,3,'A bit thin in the low mids.'),
  (10,3,4,'Crisp.'),
  (12,3,4,'Aggressive and tight.'),
  (12,4,5,'Great growl.'),
  (17,4,5,'Powerful sub.'),
  (17,2,4,'Clean low end.'),
  (19,1,5,'Gorgeous harmonies.'),
  (19,5,4,'Fits a bridge perfectly.');

DROP FUNCTION seed_wallet(INT);

COMMIT;
