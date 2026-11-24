import Link from "next/link";
import { notFound } from "next/navigation";
import { db } from "@/lib/supabase";
import { short, fmtDate } from "@/lib/format";
import Waveform from "@/components/Waveform";
import StemActions from "@/components/StemActions";
import ErrorBox from "@/components/ErrorBox";

export const dynamic = "force-dynamic";

interface Producer {
  producer_id: number;
  username: string;
  wallet_address: string;
}

export default async function StemPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const stemId = Number(id);
  if (!Number.isInteger(stemId) || stemId < 1) notFound();

  const supabase = db();

  const stemRes = await supabase
    .from("audio_stems")
    .select("*, tracks(*)")
    .eq("stem_id", stemId)
    .maybeSingle();
  if (stemRes.error) return <ErrorBox message={stemRes.error.message} />;
  if (!stemRes.data) notFound();

  const stem = stemRes.data;
  const track = stem.tracks;

  const [mintRes, licRes, splitRes, revRes, prodRes, offerRes] = await Promise.all([
    supabase.from("stem_mints").select("*").eq("stem_id", stemId).maybeSingle(),
    supabase.from("licenses").select("*").eq("stem_id", stemId).order("license_id"),
    supabase.from("royalty_splits").select("*").eq("track_id", stem.track_id).order("share_percentage", { ascending: false }),
    supabase.from("stem_reviews").select("*").eq("stem_id", stemId).order("review_id"),
    supabase.from("v_public_producers").select("producer_id,username,wallet_address"),
    supabase.from("license_offers").select("license_type,price_eth").eq("stem_id", stemId).order("price_eth"),
  ]);
  const err = mintRes.error ?? licRes.error ?? splitRes.error ?? revRes.error ?? prodRes.error ?? offerRes.error;
  if (err) return <ErrorBox message={err.message} />;

  const producers = (prodRes.data ?? []) as Producer[];
  const nameById = new Map(producers.map((p) => [p.producer_id, p.username]));
  const nameByWallet = new Map(producers.map((p) => [p.wallet_address.toLowerCase(), p.username]));

  const offers = (offerRes.data ?? []) as { license_type: string; price_eth: number }[];
  const mint = mintRes.data;
  const licenses = licRes.data ?? [];
  const splits = splitRes.data ?? [];
  const reviews = revRes.data ?? [];
  const now = new Date();
  const exclusiveTaken = (licRes.data ?? []).some(
    (l) => l.license_type === "Exclusive" && (!l.expires_at || new Date(l.expires_at) > now)
  );
  const avg = reviews.length
    ? reviews.reduce((sum, r) => sum + Number(r.rating), 0) / reviews.length
    : null;

  return (
    <main className="wrap">
      <p className="muted small crumbs">
        <Link href="/">Explore</Link> / {track.title} / {stem.stem_name}
      </p>

      <div className="cols">
        <div className="main">
          <div className="row start" style={{ marginBottom: 6 }}>
            <h1 style={{ margin: 0 }}>{stem.stem_name}</h1>
            <span className="badge">{stem.stem_type}</span>
            {stem.is_ai_generated && <span className="badge ai">AI-generated</span>}
            {mint && <span className="verified">Verified on-chain</span>}
          </div>
          <p className="muted" style={{ marginBottom: 22 }}>
            Stem of {track.title} · by {nameById.get(track.creator_id) ?? "unknown"}
          </p>

          <section className="panel">
            <Waveform seed={stem.stem_id} height={96} />
          </section>

          <section className="panel">
            <h2>Details</h2>
            <div className="kv"><span className="muted">BPM</span><span>{track.bpm ?? "-"}</span></div>
            <div className="kv"><span className="muted">Key</span><span>{track.musical_key ?? "-"}</span></div>
            <div className="kv"><span className="muted">Genre</span><span>{track.genre ?? "-"}</span></div>
            <div className="kv"><span className="muted">AI-generated</span><span>{stem.is_ai_generated ? "Yes" : "No"}</span></div>
            <div className="kv"><span className="muted">Created</span><span>{fmtDate(stem.created_at)}</span></div>
          </section>

          <section className="panel">
            <h2>Proof-of-Stem</h2>
            <div className="kv"><span className="muted">Acoustic hash</span><span className="mono">{short(stem.acoustic_hash, 12, 6)}</span></div>
            <div className="kv">
              <span className="muted">Prompt/seed hash</span>
              {stem.prompt_seed_hash ? (
                <span className="mono">{short(stem.prompt_seed_hash, 12, 6)}</span>
              ) : (
                <span className="muted">Not applicable</span>
              )}
            </div>
            <p className="good small" style={{ marginTop: 10 }}>
              Unique in the database: no other stem has this fingerprint.
            </p>
          </section>

          <section className="panel">
            <h2>On-chain record</h2>
            {mint ? (
              <>
                <div className="kv"><span className="muted">Token ID</span><span className="mono">#{mint.token_id}</span></div>
                <div className="kv"><span className="muted">Transaction</span><span className="mono">{short(mint.tx_hash, 8, 6)}</span></div>
                <div className="kv"><span className="muted">Contract</span><span className="mono">{short(mint.contract_address, 8, 6)}</span></div>
                <div className="kv"><span className="muted">Owner</span><span className="mono">{short(mint.owner_wallet, 8, 6)}</span></div>
                <div className="kv"><span className="muted">Minted</span><span>{fmtDate(mint.minted_at)}</span></div>
                <a
                  className="btn"
                  href={`https://sepolia.etherscan.io/tx/${mint.tx_hash}`}
                  target="_blank"
                  rel="noreferrer"
                >
                  View on Etherscan
                </a>
              </>
            ) : (
              <p className="muted">This stem has not been minted yet.</p>
            )}
          </section>
        </div>

        <div className="side">
          <StemActions
            stemId={stem.stem_id}
            creatorId={track.creator_id}
            fileUrl={stem.file_url}
            offers={offers}
            exclusiveTaken={exclusiveTaken}
            anyLicense={licenses.length > 0}
          />
          <section className="panel">
            <h2>License history</h2>
            {licenses.length === 0 ? (
              <p className="muted">No licenses sold yet.</p>
            ) : (
              licenses.map((l) => (
                <div className="kv" key={l.license_id}>
                  <span>
                    {l.license_type}
                    <span className="muted small"> · {nameById.get(l.buyer_id) ?? "unknown"}</span>
                  </span>
                  <span className="mono">{Number(l.price_eth)} ETH</span>
                </div>
              ))
            )}
          </section>

          <section className="panel">
            <h2>Royalty splits</h2>
            {splits.map((s) => {
              const pct = Number(s.share_percentage);
              const name = nameByWallet.get(String(s.collaborator_wallet).toLowerCase());
              return (
                <div key={s.split_id} style={{ marginBottom: 6 }}>
                  <div className="kv">
                    <span>
                      {name ?? <span className="mono">{short(s.collaborator_wallet)}</span>}
                    </span>
                    <span>{pct}%</span>
                  </div>
                  <div className="bar"><div style={{ width: `${pct}%` }} /></div>
                </div>
              );
            })}
            <p className="muted small" style={{ marginTop: 12 }}>
              Shares total {splits.reduce((sum, s) => sum + Number(s.share_percentage), 0)}%.
            </p>
          </section>

          <section className="panel">
            <h2>Reviews</h2>
            {avg === null ? (
              <p className="muted">No reviews yet.</p>
            ) : (
              <>
                <p style={{ marginBottom: 10 }}>
                  <strong>{avg.toFixed(1)} / 5</strong>{" "}
                  <span className="muted">from {reviews.length} {reviews.length === 1 ? "review" : "reviews"}</span>
                </p>
                {reviews.map((r) => (
                  <div className="review" key={r.review_id}>
                    <div className="row">
                      <span>{r.comment_text}</span>
                      <span className="muted">{r.rating}/5</span>
                    </div>
                    <p className="muted small">{nameById.get(r.reviewer_id) ?? "unknown"}</p>
                  </div>
                ))}
              </>
            )}
          </section>
        </div>
      </div>
    </main>
  );
}
