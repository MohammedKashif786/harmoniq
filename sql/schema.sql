-- ============================================================
-- Harmoniq: schema.sql   (PostgreSQL / Supabase)
-- Run this first in Supabase -> SQL Editor.
-- The DROP block at the top makes it safe to re-run while developing.
-- ============================================================

DROP VIEW  IF EXISTS v_stem_popularity, v_public_producers CASCADE;
DROP TABLE IF EXISTS stem_reviews, licenses, royalty_splits, stem_mints,
                     audio_stems, tracks, producers CASCADE;
DROP FUNCTION IF EXISTS check_royalty_total() CASCADE;
DROP FUNCTION IF EXISTS refresh_reputation() CASCADE;

-- 1. PRODUCERS ------------------------------------------------
CREATE TABLE producers (
    producer_id      BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    username         TEXT        NOT NULL UNIQUE,
    wallet_address   TEXT        NOT NULL UNIQUE
                     CHECK (wallet_address ~ '^0x[0-9a-fA-F]{40}$'),
    email            TEXT        NOT NULL UNIQUE,
    reputation_score NUMERIC(3,2) NOT NULL DEFAULT 0
                     CHECK (reputation_score BETWEEN 0 AND 5),
    created_at       TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 2. TRACKS ---------------------------------------------------
CREATE TABLE tracks (
    track_id         BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    title            TEXT        NOT NULL,
    bpm              INT         CHECK (bpm BETWEEN 40 AND 300),
    musical_key      TEXT,
    genre            TEXT,
    acoustic_hash    TEXT        NOT NULL UNIQUE,
    master_audio_url TEXT        NOT NULL,
    creator_id       BIGINT      NOT NULL REFERENCES producers(producer_id),
    created_at       TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 3. AUDIO_STEMS ----------------------------------------------
-- stem_name and acoustic_hash are additions to the synopsis:
--   stem_name     -> so the website can show "Midnight Sub" etc.
--   acoustic_hash -> Proof-of-Stem works per stem, the unit that is owned/minted.
CREATE TABLE audio_stems (
    stem_id          BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    track_id         BIGINT      NOT NULL REFERENCES tracks(track_id) ON DELETE CASCADE,
    stem_name        TEXT        NOT NULL,
    stem_type        TEXT        NOT NULL
                     CHECK (stem_type IN ('Vocal','Bass','Drum','Melody')),
    acoustic_hash    TEXT        NOT NULL UNIQUE,
    prompt_seed_hash TEXT,
    file_url         TEXT        NOT NULL,
    is_ai_generated  BOOLEAN     NOT NULL DEFAULT FALSE,
    created_at       TIMESTAMPTZ NOT NULL DEFAULT now(),
    CONSTRAINT ai_stem_needs_seed
        CHECK (NOT is_ai_generated OR prompt_seed_hash IS NOT NULL)
);

-- 4. STEM_MINTS (1-to-1 with AUDIO_STEMS, optional) ----------
CREATE TABLE stem_mints (
    mint_id          BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    stem_id          BIGINT      NOT NULL UNIQUE
                     REFERENCES audio_stems(stem_id) ON DELETE CASCADE,
    token_id         BIGINT      NOT NULL,
    tx_hash          TEXT        NOT NULL UNIQUE
                     CHECK (tx_hash ~ '^0x[0-9a-fA-F]{64}$'),
    contract_address TEXT        NOT NULL
                     CHECK (contract_address ~ '^0x[0-9a-fA-F]{40}$'),
    owner_wallet     TEXT        NOT NULL
                     CHECK (owner_wallet ~ '^0x[0-9a-fA-F]{40}$'),
    minted_at        TIMESTAMPTZ NOT NULL DEFAULT now(),
    UNIQUE (contract_address, token_id)
);

-- 5. ROYALTY_SPLITS ------------------------------------------
CREATE TABLE royalty_splits (
    split_id           BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    track_id           BIGINT      NOT NULL REFERENCES tracks(track_id) ON DELETE CASCADE,
    collaborator_wallet TEXT       NOT NULL
                       CHECK (collaborator_wallet ~ '^0x[0-9a-fA-F]{40}$'),
    share_percentage   NUMERIC(5,2) NOT NULL
                       CHECK (share_percentage > 0 AND share_percentage <= 100),
    created_at         TIMESTAMPTZ NOT NULL DEFAULT now(),
    UNIQUE (track_id, collaborator_wallet)
);

-- 6. LICENSES -------------------------------------------------
CREATE TABLE licenses (
    license_id   BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    stem_id      BIGINT      NOT NULL REFERENCES audio_stems(stem_id),
    buyer_id     BIGINT      NOT NULL REFERENCES producers(producer_id),
    license_type TEXT        NOT NULL
                 CHECK (license_type IN ('Commercial','Exclusive','Remix')),
    price_eth    NUMERIC(18,8) NOT NULL CHECK (price_eth >= 0),
    tx_hash      TEXT        UNIQUE CHECK (tx_hash ~ '^0x[0-9a-fA-F]{64}$'),
    expires_at   TIMESTAMPTZ            -- NULL = never expires
);

-- 7. STEM_REVIEWS ---------------------------------------------
CREATE TABLE stem_reviews (
    review_id    BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    stem_id      BIGINT      NOT NULL REFERENCES audio_stems(stem_id) ON DELETE CASCADE,
    reviewer_id  BIGINT      NOT NULL REFERENCES producers(producer_id) ON DELETE CASCADE,
    rating       SMALLINT    NOT NULL CHECK (rating BETWEEN 1 AND 5),
    comment_text TEXT,
    created_at   TIMESTAMPTZ NOT NULL DEFAULT now(),
    UNIQUE (reviewer_id, stem_id)       -- one review per person per stem
);

-- INDEXES on the columns used for joins ----------------------
CREATE INDEX idx_tracks_creator    ON tracks(creator_id);
CREATE INDEX idx_stems_track       ON audio_stems(track_id);
CREATE INDEX idx_splits_track      ON royalty_splits(track_id);
CREATE INDEX idx_licenses_stem     ON licenses(stem_id);
CREATE INDEX idx_licenses_buyer    ON licenses(buyer_id);
CREATE INDEX idx_reviews_stem      ON stem_reviews(stem_id);

-- TRIGGER 1: royalty shares of a track must total 100 --------
-- DEFERRABLE INITIALLY DEFERRED = checked at COMMIT, so you can insert
-- the splits one by one inside a transaction.
CREATE FUNCTION check_royalty_total() RETURNS trigger
LANGUAGE plpgsql AS $$
DECLARE
    t     BIGINT;
    total NUMERIC;
BEGIN
    FOR t IN
        SELECT DISTINCT x FROM unnest(ARRAY[NEW.track_id, OLD.track_id]) AS x
        WHERE x IS NOT NULL
    LOOP
        SELECT COALESCE(SUM(share_percentage), 0) INTO total
        FROM royalty_splits WHERE track_id = t;
        IF total <> 0 AND total <> 100 THEN
            RAISE EXCEPTION 'Royalty shares for track % total %, must be 100', t, total;
        END IF;
    END LOOP;
    RETURN NULL;
END $$;

CREATE CONSTRAINT TRIGGER trg_royalty_total
AFTER INSERT OR UPDATE OR DELETE ON royalty_splits
DEFERRABLE INITIALLY DEFERRED
FOR EACH ROW EXECUTE FUNCTION check_royalty_total();

-- TRIGGER 2: keep producers.reputation_score = average rating
-- of all reviews on stems of that producer's tracks ----------
CREATE FUNCTION refresh_reputation() RETURNS trigger
LANGUAGE plpgsql AS $$
DECLARE
    pid BIGINT;
BEGIN
    SELECT t.creator_id INTO pid
    FROM audio_stems s JOIN tracks t ON t.track_id = s.track_id
    WHERE s.stem_id = COALESCE(NEW.stem_id, OLD.stem_id);

    UPDATE producers p
    SET reputation_score = COALESCE((
        SELECT ROUND(AVG(r.rating), 2)
        FROM stem_reviews r
        JOIN audio_stems s ON s.stem_id = r.stem_id
        JOIN tracks t      ON t.track_id = s.track_id
        WHERE t.creator_id = pid), 0)
    WHERE p.producer_id = pid;
    RETURN NULL;
END $$;

CREATE TRIGGER trg_reputation
AFTER INSERT OR UPDATE OR DELETE ON stem_reviews
FOR EACH ROW EXECUTE FUNCTION refresh_reputation();

-- VIEWS --------------------------------------------------------
-- Public-safe producer info (no email).
CREATE VIEW v_public_producers AS
SELECT producer_id, username, wallet_address, reputation_score, created_at
FROM producers;

-- Stem popularity: licenses + reviews per stem.
CREATE VIEW v_stem_popularity AS
SELECT s.stem_id, s.stem_name, s.stem_type, t.title AS track_title,
       p.username AS producer,
       COUNT(DISTINCT l.license_id) AS license_count,
       COUNT(DISTINCT r.review_id)  AS review_count,
       ROUND(AVG(r.rating), 2)      AS avg_rating
FROM audio_stems s
JOIN tracks t    ON t.track_id = s.track_id
JOIN producers p ON p.producer_id = t.creator_id
LEFT JOIN licenses l     ON l.stem_id = s.stem_id
LEFT JOIN stem_reviews r ON r.stem_id = s.stem_id
GROUP BY s.stem_id, s.stem_name, s.stem_type, t.title, p.username;

-- ROW LEVEL SECURITY -------------------------------------------
-- The website uses the public "anon" key, so lock the tables down:
-- anyone can READ (except producers, which holds emails), nobody can
-- WRITE with the anon key. Your backend writes with the service-role key.
ALTER TABLE producers      ENABLE ROW LEVEL SECURITY;
ALTER TABLE tracks         ENABLE ROW LEVEL SECURITY;
ALTER TABLE audio_stems    ENABLE ROW LEVEL SECURITY;
ALTER TABLE stem_mints     ENABLE ROW LEVEL SECURITY;
ALTER TABLE royalty_splits ENABLE ROW LEVEL SECURITY;
ALTER TABLE licenses       ENABLE ROW LEVEL SECURITY;
ALTER TABLE stem_reviews   ENABLE ROW LEVEL SECURITY;

CREATE POLICY public_read ON tracks         FOR SELECT USING (true);
CREATE POLICY public_read ON audio_stems    FOR SELECT USING (true);
CREATE POLICY public_read ON stem_mints     FOR SELECT USING (true);
CREATE POLICY public_read ON royalty_splits FOR SELECT USING (true);
CREATE POLICY public_read ON licenses       FOR SELECT USING (true);
CREATE POLICY public_read ON stem_reviews   FOR SELECT USING (true);

GRANT SELECT ON v_public_producers, v_stem_popularity TO anon, authenticated;
