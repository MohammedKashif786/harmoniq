-- ============================================================
-- Harmoniq: queries.sql  (demo queries for the viva)
-- Run one at a time in the Supabase SQL Editor.
-- ============================================================

-- Q1. Revenue earned per producer from licenses on their stems
--     (4-table JOIN + GROUP BY + ORDER BY)
SELECT p.username, COUNT(l.license_id) AS licenses_sold,
       SUM(l.price_eth) AS total_eth
FROM producers p
JOIN tracks t       ON t.creator_id = p.producer_id
JOIN audio_stems s  ON s.track_id   = t.track_id
JOIN licenses l     ON l.stem_id    = s.stem_id
GROUP BY p.username
ORDER BY total_eth DESC;

-- Q2. Tracks whose royalty shares do NOT total 100  (should return 0 rows)
SELECT track_id, SUM(share_percentage) AS total_pct
FROM royalty_splits
GROUP BY track_id
HAVING SUM(share_percentage) <> 100;

-- Q3. Top-rated stems with at least 3 reviews  (GROUP BY + HAVING)
SELECT s.stem_name, s.stem_type, ROUND(AVG(r.rating), 2) AS avg_rating,
       COUNT(*) AS reviews
FROM audio_stems s
JOIN stem_reviews r ON r.stem_id = s.stem_id
GROUP BY s.stem_id, s.stem_name, s.stem_type
HAVING COUNT(*) >= 3
ORDER BY avg_rating DESC, reviews DESC;

-- Q4. Stems that are NOT minted yet  (LEFT JOIN + IS NULL)
SELECT s.stem_id, s.stem_name, t.title AS track
FROM audio_stems s
JOIN tracks t ON t.track_id = s.track_id
LEFT JOIN stem_mints m ON m.stem_id = s.stem_id
WHERE m.mint_id IS NULL;

-- Q5. What each collaborator earns from licenses, based on their split %
--     (shows why ROYALTY_SPLITS exists)
SELECT COALESCE(p.username, rs.collaborator_wallet) AS collaborator,
       ROUND(SUM(l.price_eth * rs.share_percentage / 100), 6) AS earned_eth
FROM licenses l
JOIN audio_stems s     ON s.stem_id  = l.stem_id
JOIN royalty_splits rs ON rs.track_id = s.track_id
LEFT JOIN producers p  ON p.wallet_address = rs.collaborator_wallet
GROUP BY collaborator
ORDER BY earned_eth DESC;

-- Q6. Most popular stems, using the view
SELECT * FROM v_stem_popularity
ORDER BY license_count DESC, avg_rating DESC NULLS LAST
LIMIT 5;

-- Q7. AI-generated vs human stems  (aggregate with FILTER)
SELECT COUNT(*) FILTER (WHERE is_ai_generated)      AS ai_stems,
       COUNT(*) FILTER (WHERE NOT is_ai_generated)  AS human_stems
FROM audio_stems;

-- Q8. Reputation leaderboard (filled automatically by the trigger)
SELECT username, reputation_score FROM producers
ORDER BY reputation_score DESC;

-- ------------------------------------------------------------
-- LIVE DEMOS OF CONSTRAINTS: each of these should FAIL. Run one at a time.
-- ------------------------------------------------------------
-- (a) Duplicate fingerprint is rejected (UNIQUE on audio_stems.acoustic_hash)
-- INSERT INTO audio_stems (track_id, stem_name, stem_type, acoustic_hash, file_url)
-- SELECT 1, 'Copycat', 'Bass', acoustic_hash, 'x.wav' FROM audio_stems WHERE stem_id = 1;

-- (b) Same stem minted twice is rejected (UNIQUE on stem_mints.stem_id)
-- INSERT INTO stem_mints (stem_id, token_id, tx_hash, contract_address, owner_wallet)
-- VALUES (1, 5000, '0x' || repeat('a', 64), '0x' || repeat('b', 40), '0x' || repeat('c', 40));

-- (c) Rating outside 1-5 is rejected (CHECK)
-- INSERT INTO stem_reviews (stem_id, reviewer_id, rating) VALUES (7, 1, 9);

-- (d) Royalty shares not totalling 100 are rejected at COMMIT (trigger)
-- BEGIN;
-- INSERT INTO royalty_splits (track_id, collaborator_wallet, share_percentage)
-- VALUES (3, '0x' || repeat('d', 40), 20);   -- track 3 would now total 120
-- COMMIT;                                     -- raises the exception here
