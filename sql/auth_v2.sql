-- ============================================================
-- Harmoniq: auth_v2.sql
-- Adds login, roles, ownership rules, license prices and file storage.
-- Run AFTER schema.sql and seed.sql. Safe to run more than once.
-- ============================================================

-- 1. LINK PRODUCERS TO SUPABASE AUTH --------------------------------
ALTER TABLE producers
    ADD COLUMN IF NOT EXISTS auth_user_id UUID UNIQUE REFERENCES auth.users(id) ON DELETE SET NULL,
    ADD COLUMN IF NOT EXISTS role TEXT NOT NULL DEFAULT 'producer'
        CHECK (role IN ('producer', 'customer'));

-- Customers do not need a wallet at sign-up; producers add one in their profile.
ALTER TABLE producers ALTER COLUMN wallet_address DROP NOT NULL;

-- A track can exist before its master audio is uploaded.
ALTER TABLE tracks ALTER COLUMN acoustic_hash    DROP NOT NULL;
ALTER TABLE tracks ALTER COLUMN master_audio_url DROP NOT NULL;

CREATE OR REPLACE VIEW v_public_producers AS
SELECT producer_id, username, wallet_address, reputation_score, created_at, role
FROM producers;

-- 2. LICENSE PRICES (new table: one row per stem + license type) -----
CREATE TABLE IF NOT EXISTS license_offers (
    stem_id      BIGINT NOT NULL REFERENCES audio_stems(stem_id) ON DELETE CASCADE,
    license_type TEXT   NOT NULL CHECK (license_type IN ('Commercial','Exclusive','Remix')),
    price_eth    NUMERIC(18,8) NOT NULL CHECK (price_eth >= 0),
    PRIMARY KEY (stem_id, license_type)
);
ALTER TABLE license_offers ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS public_read ON license_offers;
CREATE POLICY public_read ON license_offers FOR SELECT USING (true);
REVOKE INSERT, UPDATE, DELETE ON license_offers FROM anon, authenticated;

-- Prices for the sample stems so the demo has something to buy.
INSERT INTO license_offers (stem_id, license_type, price_eth)
SELECT s.stem_id, v.t, ROUND((0.010 + (s.stem_id % 5) * 0.005) * v.mult, 4)
FROM audio_stems s
CROSS JOIN (VALUES ('Commercial', 1), ('Remix', 2), ('Exclusive', 15)) AS v(t, mult)
ON CONFLICT DO NOTHING;

-- 3. HELPER FUNCTIONS ------------------------------------------------
CREATE OR REPLACE FUNCTION current_producer_id() RETURNS BIGINT
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
    SELECT producer_id FROM producers WHERE auth_user_id = auth.uid()
$$;

-- Create the profile row automatically when someone signs up.
CREATE OR REPLACE FUNCTION handle_new_user() RETURNS trigger
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
    base  TEXT;
    uname TEXT;
    r     TEXT;
BEGIN
    base := lower(regexp_replace(
                coalesce(NEW.raw_user_meta_data->>'username', split_part(NEW.email, '@', 1)),
                '[^a-zA-Z0-9_]', '', 'g'));
    IF base = '' THEN base := 'user'; END IF;
    uname := base;
    WHILE EXISTS (SELECT 1 FROM producers WHERE username = uname) LOOP
        uname := base || '_' || substr(md5(random()::text), 1, 4);
    END LOOP;
    r := CASE WHEN NEW.raw_user_meta_data->>'role' = 'customer' THEN 'customer' ELSE 'producer' END;
    INSERT INTO producers (auth_user_id, username, email, role)
    VALUES (NEW.id, uname, NEW.email, r);
    RETURN NEW;
END $$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
AFTER INSERT ON auth.users
FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- The reputation trigger updates another person's row, so it must run as the owner.
ALTER FUNCTION refresh_reputation() SECURITY DEFINER;
ALTER FUNCTION refresh_reputation() SET search_path = public;

-- 4. PRODUCERS: you can read and edit only your own profile ----------
REVOKE INSERT, UPDATE, DELETE ON producers FROM anon, authenticated;
GRANT UPDATE (username, wallet_address) ON producers TO authenticated;   -- role cannot be changed
DROP POLICY IF EXISTS own_profile_read   ON producers;
DROP POLICY IF EXISTS own_profile_update ON producers;
CREATE POLICY own_profile_read ON producers FOR SELECT TO authenticated
    USING (auth_user_id = auth.uid());
CREATE POLICY own_profile_update ON producers FOR UPDATE TO authenticated
    USING (auth_user_id = auth.uid()) WITH CHECK (auth_user_id = auth.uid());

-- 5. TRACKS: only the creator can edit or delete -----------------------
REVOKE INSERT, UPDATE, DELETE ON tracks FROM anon, authenticated;
GRANT UPDATE (title, bpm, musical_key, genre) ON tracks TO authenticated;
GRANT DELETE ON tracks TO authenticated;
DROP POLICY IF EXISTS owner_update ON tracks;
DROP POLICY IF EXISTS owner_delete ON tracks;
CREATE POLICY owner_update ON tracks FOR UPDATE TO authenticated
    USING (creator_id = current_producer_id()) WITH CHECK (creator_id = current_producer_id());
CREATE POLICY owner_delete ON tracks FOR DELETE TO authenticated
    USING (creator_id = current_producer_id());

-- Creating a track also creates the creator's 100% royalty split, in one transaction.
CREATE OR REPLACE FUNCTION create_track(p_title TEXT, p_bpm INT, p_key TEXT, p_genre TEXT)
RETURNS BIGINT LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
    v_pid BIGINT;
    v_wallet TEXT;
    v_tid BIGINT;
BEGIN
    SELECT producer_id, wallet_address INTO v_pid, v_wallet
    FROM producers WHERE auth_user_id = auth.uid() AND role = 'producer';
    IF v_pid IS NULL THEN RAISE EXCEPTION 'Only producers can create tracks'; END IF;
    IF v_wallet IS NULL THEN RAISE EXCEPTION 'Add your wallet address in your profile first'; END IF;
    INSERT INTO tracks (title, bpm, musical_key, genre, creator_id)
    VALUES (p_title, p_bpm, p_key, p_genre, v_pid) RETURNING track_id INTO v_tid;
    INSERT INTO royalty_splits (track_id, collaborator_wallet, share_percentage)
    VALUES (v_tid, v_wallet, 100);
    RETURN v_tid;
END $$;

-- 6. AUDIO_STEMS: only the track creator can add, rename or delete -----
REVOKE INSERT, UPDATE, DELETE ON audio_stems FROM anon, authenticated;
GRANT INSERT (track_id, stem_name, stem_type, acoustic_hash, prompt_seed_hash, file_url, is_ai_generated)
    ON audio_stems TO authenticated;
GRANT UPDATE (stem_name) ON audio_stems TO authenticated;
GRANT DELETE ON audio_stems TO authenticated;
DROP POLICY IF EXISTS owner_insert ON audio_stems;
DROP POLICY IF EXISTS owner_update ON audio_stems;
DROP POLICY IF EXISTS owner_delete ON audio_stems;
CREATE POLICY owner_insert ON audio_stems FOR INSERT TO authenticated
    WITH CHECK (EXISTS (SELECT 1 FROM tracks t
                        WHERE t.track_id = audio_stems.track_id AND t.creator_id = current_producer_id()));
CREATE POLICY owner_update ON audio_stems FOR UPDATE TO authenticated
    USING (EXISTS (SELECT 1 FROM tracks t
                   WHERE t.track_id = audio_stems.track_id AND t.creator_id = current_producer_id()))
    WITH CHECK (EXISTS (SELECT 1 FROM tracks t
                        WHERE t.track_id = audio_stems.track_id AND t.creator_id = current_producer_id()));
CREATE POLICY owner_delete ON audio_stems FOR DELETE TO authenticated
    USING (EXISTS (SELECT 1 FROM tracks t
                   WHERE t.track_id = audio_stems.track_id AND t.creator_id = current_producer_id()));

-- 7. PRICING: only the stem owner sets prices -----------------------
CREATE OR REPLACE FUNCTION set_license_offer(p_stem_id BIGINT, p_type TEXT, p_price NUMERIC)
RETURNS VOID LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM audio_stems s JOIN tracks t ON t.track_id = s.track_id
                   WHERE s.stem_id = p_stem_id AND t.creator_id = current_producer_id()) THEN
        RAISE EXCEPTION 'You can only price your own stems';
    END IF;
    INSERT INTO license_offers (stem_id, license_type, price_eth)
    VALUES (p_stem_id, p_type, p_price)
    ON CONFLICT (stem_id, license_type) DO UPDATE SET price_eth = EXCLUDED.price_eth;
END $$;

CREATE OR REPLACE FUNCTION remove_license_offer(p_stem_id BIGINT, p_type TEXT)
RETURNS VOID LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM audio_stems s JOIN tracks t ON t.track_id = s.track_id
                   WHERE s.stem_id = p_stem_id AND t.creator_id = current_producer_id()) THEN
        RAISE EXCEPTION 'You can only price your own stems';
    END IF;
    DELETE FROM license_offers WHERE stem_id = p_stem_id AND license_type = p_type;
END $$;

-- 8. BUYING A LICENSE: the price is read from the database, never from the browser
CREATE OR REPLACE FUNCTION buy_license(p_stem_id BIGINT, p_type TEXT)
RETURNS BIGINT LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
    v_buyer BIGINT;
    v_owner BIGINT;
    v_price NUMERIC;
    v_lid   BIGINT;
BEGIN
    SELECT producer_id INTO v_buyer FROM producers WHERE auth_user_id = auth.uid();
    IF v_buyer IS NULL THEN RAISE EXCEPTION 'Please log in first'; END IF;

    SELECT t.creator_id INTO v_owner
    FROM audio_stems s JOIN tracks t ON t.track_id = s.track_id WHERE s.stem_id = p_stem_id;
    IF v_owner IS NULL THEN RAISE EXCEPTION 'Stem not found'; END IF;
    IF v_owner = v_buyer THEN RAISE EXCEPTION 'You cannot license your own stem'; END IF;

    SELECT price_eth INTO v_price FROM license_offers
    WHERE stem_id = p_stem_id AND license_type = p_type;
    IF v_price IS NULL THEN RAISE EXCEPTION 'This license type is not offered for this stem'; END IF;

    IF EXISTS (SELECT 1 FROM licenses WHERE stem_id = p_stem_id AND license_type = 'Exclusive'
               AND (expires_at IS NULL OR expires_at > now())) THEN
        RAISE EXCEPTION 'This stem has been sold exclusively';
    END IF;
    IF p_type = 'Exclusive' AND EXISTS (SELECT 1 FROM licenses WHERE stem_id = p_stem_id) THEN
        RAISE EXCEPTION 'Exclusive is no longer available because this stem is already licensed';
    END IF;
    IF EXISTS (SELECT 1 FROM licenses WHERE stem_id = p_stem_id AND buyer_id = v_buyer
               AND license_type = p_type AND (expires_at IS NULL OR expires_at > now())) THEN
        RAISE EXCEPTION 'You already hold this license';
    END IF;

    INSERT INTO licenses (stem_id, buyer_id, license_type, price_eth, expires_at)
    VALUES (p_stem_id, v_buyer, p_type, v_price,
            CASE WHEN p_type = 'Exclusive' THEN NULL ELSE now() + interval '1 year' END)
    RETURNING license_id INTO v_lid;
    RETURN v_lid;
END $$;

REVOKE EXECUTE ON FUNCTION create_track(TEXT, INT, TEXT, TEXT)       FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION set_license_offer(BIGINT, TEXT, NUMERIC)  FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION remove_license_offer(BIGINT, TEXT)        FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION buy_license(BIGINT, TEXT)                 FROM PUBLIC, anon;
GRANT  EXECUTE ON FUNCTION create_track(TEXT, INT, TEXT, TEXT)       TO authenticated;
GRANT  EXECUTE ON FUNCTION set_license_offer(BIGINT, TEXT, NUMERIC)  TO authenticated;
GRANT  EXECUTE ON FUNCTION remove_license_offer(BIGINT, TEXT)        TO authenticated;
GRANT  EXECUTE ON FUNCTION buy_license(BIGINT, TEXT)                 TO authenticated;

-- 9. REVIEWS: only people holding a license can review ----------------
REVOKE INSERT, UPDATE, DELETE ON stem_reviews FROM anon, authenticated;
GRANT INSERT (stem_id, reviewer_id, rating, comment_text) ON stem_reviews TO authenticated;
GRANT UPDATE (rating, comment_text) ON stem_reviews TO authenticated;
GRANT DELETE ON stem_reviews TO authenticated;
DROP POLICY IF EXISTS licensee_insert ON stem_reviews;
DROP POLICY IF EXISTS own_update      ON stem_reviews;
DROP POLICY IF EXISTS own_delete      ON stem_reviews;
CREATE POLICY licensee_insert ON stem_reviews FOR INSERT TO authenticated
    WITH CHECK (stem_reviews.reviewer_id = current_producer_id()
                AND EXISTS (SELECT 1 FROM licenses l
                            WHERE l.stem_id = stem_reviews.stem_id
                              AND l.buyer_id = stem_reviews.reviewer_id));
CREATE POLICY own_update ON stem_reviews FOR UPDATE TO authenticated
    USING (reviewer_id = current_producer_id()) WITH CHECK (reviewer_id = current_producer_id());
CREATE POLICY own_delete ON stem_reviews FOR DELETE TO authenticated
    USING (reviewer_id = current_producer_id());

-- 10. SEARCH VIEW: one row per stem with everything the Explore page needs
CREATE OR REPLACE VIEW v_stem_catalog AS
SELECT s.stem_id, s.stem_name, s.stem_type, s.is_ai_generated, s.track_id,
       t.title AS track_title, t.genre, t.bpm, t.musical_key,
       p.producer_id AS creator_id, p.username AS producer,
       (m.mint_id IS NOT NULL) AS is_minted,
       (SELECT MIN(o.price_eth) FROM license_offers o WHERE o.stem_id = s.stem_id) AS from_price_eth,
       (SELECT COUNT(*) FROM licenses l WHERE l.stem_id = s.stem_id)      AS license_count,
       (SELECT COUNT(*) FROM stem_reviews r WHERE r.stem_id = s.stem_id)  AS review_count,
       (SELECT ROUND(AVG(r.rating), 2) FROM stem_reviews r WHERE r.stem_id = s.stem_id) AS avg_rating
FROM audio_stems s
JOIN tracks t    ON t.track_id = s.track_id
JOIN producers p ON p.producer_id = t.creator_id
LEFT JOIN stem_mints m ON m.stem_id = s.stem_id;
GRANT SELECT ON v_stem_catalog, v_public_producers TO anon, authenticated;

-- 11. PRIVATE FILE STORAGE -------------------------------------------
-- Files live in a private bucket. A file can be downloaded only by its owner
-- or by someone holding an active license for that stem.
INSERT INTO storage.buckets (id, name, public) VALUES ('stems', 'stems', false)
ON CONFLICT (id) DO NOTHING;

DROP POLICY IF EXISTS stems_upload_own  ON storage.objects;
DROP POLICY IF EXISTS stems_delete_own  ON storage.objects;
DROP POLICY IF EXISTS stems_read_access ON storage.objects;
CREATE POLICY stems_upload_own ON storage.objects FOR INSERT TO authenticated
    WITH CHECK (bucket_id = 'stems'
                AND (storage.foldername(name))[1] = public.current_producer_id()::text);
CREATE POLICY stems_delete_own ON storage.objects FOR DELETE TO authenticated
    USING (bucket_id = 'stems'
           AND (storage.foldername(name))[1] = public.current_producer_id()::text);
CREATE POLICY stems_read_access ON storage.objects FOR SELECT TO authenticated
    USING (bucket_id = 'stems' AND (
        (storage.foldername(name))[1] = public.current_producer_id()::text
        OR EXISTS (SELECT 1 FROM public.audio_stems s
                   JOIN public.licenses l ON l.stem_id = s.stem_id
                   WHERE s.file_url = storage.objects.name
                     AND l.buyer_id = public.current_producer_id()
                     AND (l.expires_at IS NULL OR l.expires_at > now()))));
