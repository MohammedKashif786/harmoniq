"use client";
import { FormEvent, useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { supabaseBrowser } from "@/lib/supabaseBrowser";
import { useProfile } from "@/lib/useProfile";
import { downloadStem, hasStoredFile } from "@/lib/download";

interface Offer { license_type: string; price_eth: number }
interface MyLicense { license_id: number; license_type: string; expires_at: string | null }

interface Props {
  stemId: number;
  creatorId: number;
  fileUrl: string;
  offers: Offer[];
  exclusiveTaken: boolean;
  anyLicense: boolean;
}

const isActive = (l: MyLicense) => !l.expires_at || new Date(l.expires_at) > new Date();

export default function StemActions({ stemId, creatorId, fileUrl, offers, exclusiveTaken, anyLicense }: Props) {
  const router = useRouter();
  const { loading, profile } = useProfile();
  const [mine, setMine] = useState<MyLicense[]>([]);
  const [choice, setChoice] = useState("");
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState("");

  const pid = profile?.producer_id;

  const loadMine = useCallback(async () => {
    if (!pid) return;
    const { data } = await supabaseBrowser()
      .from("licenses")
      .select("license_id,license_type,expires_at")
      .eq("stem_id", stemId)
      .eq("buyer_id", pid);
    setMine((data ?? []) as MyLicense[]);
  }, [pid, stemId]);

  useEffect(() => { loadMine(); }, [loadMine]);

  const isOwner = pid === creatorId;
  const heldTypes = new Set(mine.filter(isActive).map((l) => l.license_type));
  const licensee = mine.some(isActive);
  const canDownload = (isOwner || licensee) && hasStoredFile(fileUrl);

  const disabled = (type: string) =>
    heldTypes.has(type) || exclusiveTaken || (type === "Exclusive" && anyLicense);

  async function buy() {
    if (!choice) return;
    setBusy(true);
    setMsg(null);
    const { error } = await supabaseBrowser().rpc("buy_license", { p_stem_id: stemId, p_type: choice });
    if (error) setMsg({ ok: false, text: error.message });
    else {
      setMsg({ ok: true, text: `${choice} license added to your account.` });
      setChoice("");
      await loadMine();
      router.refresh();
    }
    setBusy(false);
  }

  async function review(e: FormEvent) {
    e.preventDefault();
    if (!pid) return;
    setBusy(true);
    setMsg(null);
    const { error } = await supabaseBrowser()
      .from("stem_reviews")
      .insert({ stem_id: stemId, reviewer_id: pid, rating, comment_text: comment.trim() || null });
    if (error)
      setMsg({ ok: false, text: error.message.includes("duplicate") ? "You already reviewed this stem." : error.message });
    else {
      setMsg({ ok: true, text: "Thanks for your review." });
      setComment("");
      router.refresh();
    }
    setBusy(false);
  }

  async function download() {
    try {
      await downloadStem(fileUrl);
    } catch (e) {
      setMsg({ ok: false, text: e instanceof Error ? e.message : "Download failed" });
    }
  }

  if (loading) return <section className="panel"><p className="muted">Loading…</p></section>;

  const offerList = (
    <>
      {offers.length === 0 && <p className="muted">The producer has not set prices for this stem yet.</p>}
    </>
  );

  return (
    <section className="panel">
      <h2>Use this stem</h2>

      {!profile && (
        <>
          {offerList}
          {offers.map((o) => (
            <div className="kv" key={o.license_type}>
              <span>{o.license_type}</span>
              <span className="mono">{Number(o.price_eth)} ETH</span>
            </div>
          ))}
          <p className="muted small" style={{ margin: "12px 0" }}>Log in to license this stem.</p>
          <Link href="/login" className="btn-primary">Log in or sign up</Link>
        </>
      )}

      {profile && isOwner && (
        <>
          <p className="muted">This is your stem. You can change its name and prices in your dashboard.</p>
          <Link href="/dashboard" className="btn" style={{ marginRight: 8 }}>Open dashboard</Link>
        </>
      )}

      {profile && !isOwner && (
        <>
          {offerList}
          {offers.map((o) => {
            const off = disabled(o.license_type);
            return (
              <label key={o.license_type} className={`opt${off ? " off" : ""}`}>
                <span>
                  <input
                    type="radio"
                    name="lic"
                    disabled={off}
                    checked={choice === o.license_type}
                    onChange={() => setChoice(o.license_type)}
                  />{" "}
                  {o.license_type}
                  {heldTypes.has(o.license_type) && <span className="good small"> · you hold this</span>}
                </span>
                <span className="mono">{Number(o.price_eth)} ETH</span>
              </label>
            );
          })}
          {exclusiveTaken && <p className="muted small">This stem was sold exclusively, so it is no longer available.</p>}
          {offers.length > 0 && (
            <button className="btn-primary" style={{ width: "100%", marginTop: 14 }} disabled={busy || !choice} onClick={buy}>
              {busy ? "Please wait…" : "Get license"}
            </button>
          )}
          <p className="muted small" style={{ marginTop: 10 }}>
            Payment is simulated for now. Real on-chain payment arrives with the Sepolia step.
          </p>
        </>
      )}

      {canDownload && (
        <button className="btn-ghost" style={{ marginTop: 14 }} onClick={download}>
          Download stem file
        </button>
      )}

      {profile && !isOwner && licensee && (
        <form onSubmit={review} style={{ marginTop: 18 }}>
          <h2 style={{ fontSize: 15 }}>Review this stem</h2>
          <div className="formgrid">
            <label className="field">
              <span>Rating</span>
              <select value={rating} onChange={(e) => setRating(Number(e.target.value))}>
                {[5, 4, 3, 2, 1].map((n) => <option key={n} value={n}>{n} / 5</option>)}
              </select>
            </label>
          </div>
          <label className="field">
            <span>Comment (optional)</span>
            <input value={comment} onChange={(e) => setComment(e.target.value)} maxLength={300} />
          </label>
          <button className="btn-ghost" disabled={busy}>Post review</button>
        </form>
      )}

      {msg && <div className={`msg ${msg.ok ? "ok" : "err"}`}>{msg.text}</div>}
    </section>
  );
}
