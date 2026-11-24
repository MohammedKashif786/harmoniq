"use client";
import { FormEvent, useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { supabaseBrowser } from "@/lib/supabaseBrowser";
import { useProfile } from "@/lib/useProfile";
import { sha256Hex } from "@/lib/hash";
import { hasStoredFile } from "@/lib/download";

interface Offer { license_type: string; price_eth: number }
interface Stem {
  stem_id: number;
  stem_name: string;
  stem_type: string;
  is_ai_generated: boolean;
  file_url: string;
  stem_mints: unknown;
  license_offers: Offer[];
}
interface Track {
  track_id: number;
  title: string;
  bpm: number | null;
  musical_key: string | null;
  genre: string | null;
  audio_stems: Stem[];
}

const STEM_TYPES = ["Vocal", "Bass", "Drum", "Melody"];
const LICENSE_TYPES = ["Commercial", "Remix", "Exclusive"];

function must<T extends { error: { message: string } | null }>(r: T): T {
  if (r.error) throw new Error(r.error.message);
  return r;
}

export default function DashboardPage() {
  const { loading, profile, reload } = useProfile();
  const [tracks, setTracks] = useState<Track[]>([]);
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);
  const [busy, setBusy] = useState(false);
  const pid = profile?.producer_id;

  const loadTracks = useCallback(async () => {
    if (!pid) return;
    const { data, error } = await supabaseBrowser()
      .from("tracks")
      .select(
        "track_id,title,bpm,musical_key,genre,audio_stems(stem_id,stem_name,stem_type,is_ai_generated,file_url,stem_mints(mint_id),license_offers(license_type,price_eth))"
      )
      .eq("creator_id", pid)
      .order("track_id");
    if (error) setMsg({ ok: false, text: error.message });
    else setTracks((data ?? []) as unknown as Track[]);
  }, [pid]);

  useEffect(() => { loadTracks(); }, [loadTracks]);

  // Runs an action, shows the result, then refreshes the lists.
  async function act(fn: () => Promise<void>, okText: string) {
    setBusy(true);
    setMsg(null);
    try {
      await fn();
      setMsg({ ok: true, text: okText });
      await loadTracks();
    } catch (e) {
      setMsg({ ok: false, text: e instanceof Error ? e.message : String(e) });
    }
    setBusy(false);
  }

  if (loading) return <main className="wrap"><p className="muted">Loading…</p></main>;
  if (!profile)
    return (
      <main className="wrap">
        <h1>My stems</h1>
        <p className="muted" style={{ margin: "8px 0 18px" }}>Log in as a producer to manage your tracks and stems.</p>
        <Link href="/login" className="btn-primary">Log in</Link>
      </main>
    );
  if (profile.role !== "producer")
    return (
      <main className="wrap">
        <h1>My stems</h1>
        <p className="muted" style={{ margin: "8px 0 18px" }}>
          This page is for producer accounts. As a customer you can find and license stems from Explore.
        </p>
        <Link href="/" className="btn-primary">Browse stems</Link>
      </main>
    );

  return (
    <main className="wrap">
      <h1>My stems</h1>
      <p className="muted" style={{ marginBottom: 18 }}>
        Create tracks, upload and fingerprint stems, and set the prices others pay to use them.
      </p>
      {msg && <div className={`msg ${msg.ok ? "ok" : "err"}`}>{msg.text}</div>}

      <ProfilePanel profile={profile} busy={busy} act={act} reload={reload} />
      <NewTrackPanel busy={busy} act={act} />
      <NewStemPanel tracks={tracks} pid={profile.producer_id} busy={busy} act={act} />

      <h2 style={{ marginTop: 28 }}>Your tracks</h2>
      {tracks.length === 0 && <p className="muted">You have no tracks yet. Create one above.</p>}
      {tracks.map((t) => (
        <TrackCard key={t.track_id} track={t} busy={busy} act={act} />
      ))}
    </main>
  );
}

type Act = (fn: () => Promise<void>, okText: string) => Promise<void>;

function ProfilePanel({ profile, busy, act, reload }: {
  profile: NonNullable<ReturnType<typeof useProfile>["profile"]>;
  busy: boolean; act: Act; reload: () => void;
}) {
  const [wallet, setWallet] = useState(profile.wallet_address ?? "");

  function save(e: FormEvent) {
    e.preventDefault();
    const w = wallet.trim();
    act(async () => {
      if (w && !/^0x[0-9a-fA-F]{40}$/.test(w)) throw new Error("A wallet address looks like 0x followed by 40 letters or digits");
      must(await supabaseBrowser().from("producers").update({ wallet_address: w || null }).eq("producer_id", profile.producer_id));
      reload();
    }, "Wallet saved.");
  }

  return (
    <section className="panel">
      <h2>Your profile</h2>
      <p className="muted small" style={{ marginBottom: 12 }}>
        {profile.username} · {profile.email} · reputation {Number(profile.reputation_score).toFixed(2)} / 5
      </p>
      <form onSubmit={save}>
        <label className="field">
          <span>Wallet address (needed before you create a track; used for royalties and minting)</span>
          <input value={wallet} onChange={(e) => setWallet(e.target.value)} placeholder="0x…" />
        </label>
        <button className="btn-ghost" disabled={busy}>Save wallet</button>
      </form>
    </section>
  );
}

function NewTrackPanel({ busy, act }: { busy: boolean; act: Act }) {
  const [title, setTitle] = useState("");
  const [bpm, setBpm] = useState("");
  const [key, setKey] = useState("");
  const [genre, setGenre] = useState("");

  function submit(e: FormEvent) {
    e.preventDefault();
    act(async () => {
      must(await supabaseBrowser().rpc("create_track", {
        p_title: title.trim(), p_bpm: bpm ? Number(bpm) : null,
        p_key: key.trim() || null, p_genre: genre.trim() || null,
      }));
      setTitle(""); setBpm(""); setKey(""); setGenre("");
    }, "Track created. You now hold 100% of its royalty split.");
  }

  return (
    <section className="panel">
      <h2>New track</h2>
      <form onSubmit={submit}>
        <div className="formgrid">
          <label className="field"><span>Title</span><input value={title} onChange={(e) => setTitle(e.target.value)} required /></label>
          <label className="field"><span>BPM</span><input type="number" min={40} max={300} value={bpm} onChange={(e) => setBpm(e.target.value)} /></label>
          <label className="field"><span>Key</span><input value={key} onChange={(e) => setKey(e.target.value)} placeholder="F minor" /></label>
          <label className="field"><span>Genre</span><input value={genre} onChange={(e) => setGenre(e.target.value)} /></label>
        </div>
        <button className="btn-primary" disabled={busy}>Create track</button>
      </form>
    </section>
  );
}

function NewStemPanel({ tracks, pid, busy, act }: { tracks: Track[]; pid: number; busy: boolean; act: Act }) {
  const [trackId, setTrackId] = useState("");
  const [name, setName] = useState("");
  const [type, setType] = useState("Bass");
  const [ai, setAi] = useState(false);
  const [prompt, setPrompt] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [prices, setPrices] = useState<Record<string, string>>({ Commercial: "", Remix: "", Exclusive: "" });

  function submit(e: FormEvent) {
    e.preventDefault();
    act(async () => {
      const sb = supabaseBrowser();
      const tid = Number(trackId || tracks[0]?.track_id);
      if (!tid) throw new Error("Create a track first");
      if (!file) throw new Error("Choose an audio file");
      if (ai && !prompt.trim()) throw new Error("AI-generated stems need the prompt or seed that made them");

      // Proof-of-Stem v0: exact-match fingerprint of the file.
      const hash = "sha256:" + (await sha256Hex(await file.arrayBuffer()));
      const dup = await sb.from("audio_stems").select("stem_id,stem_name").eq("acoustic_hash", hash).maybeSingle();
      if (dup.data) throw new Error(`This exact audio is already registered as "${dup.data.stem_name}" (stem #${dup.data.stem_id}).`);

      const path = `${pid}/${crypto.randomUUID()}-${file.name.replace(/[^a-zA-Z0-9._-]/g, "_")}`;
      must(await sb.storage.from("stems").upload(path, file, { contentType: file.type || undefined }));

      const ins = await sb.from("audio_stems").insert({
        track_id: tid,
        stem_name: name.trim(),
        stem_type: type,
        acoustic_hash: hash,
        prompt_seed_hash: ai ? "seed:" + (await sha256Hex(prompt.trim())) : null,
        file_url: path,
        is_ai_generated: ai,
      }).select("stem_id").single();
      if (ins.error) {
        await sb.storage.from("stems").remove([path]);
        throw new Error(ins.error.message);
      }
      for (const lt of LICENSE_TYPES) {
        const p = prices[lt];
        if (p !== "" && Number(p) >= 0) {
          must(await sb.rpc("set_license_offer", { p_stem_id: ins.data.stem_id, p_type: lt, p_price: Number(p) }));
        }
      }
      setName(""); setAi(false); setPrompt(""); setFile(null);
      setPrices({ Commercial: "", Remix: "", Exclusive: "" });
    }, "Stem uploaded and fingerprinted.");
  }

  return (
    <section className="panel">
      <h2>Upload a stem</h2>
      <form onSubmit={submit}>
        <div className="formgrid">
          <label className="field">
            <span>Track</span>
            <select value={trackId} onChange={(e) => setTrackId(e.target.value)}>
              {tracks.map((t) => <option key={t.track_id} value={t.track_id}>{t.title}</option>)}
            </select>
          </label>
          <label className="field"><span>Stem name</span><input value={name} onChange={(e) => setName(e.target.value)} required /></label>
          <label className="field">
            <span>Type</span>
            <select value={type} onChange={(e) => setType(e.target.value)}>
              {STEM_TYPES.map((t) => <option key={t}>{t}</option>)}
            </select>
          </label>
        </div>
        <label className="field"><span>Audio file</span>
          <input type="file" accept="audio/*" onChange={(e) => setFile(e.target.files?.[0] ?? null)} />
        </label>
        <label className="field" style={{ display: "flex", gap: 8, alignItems: "center" }}>
          <input type="checkbox" checked={ai} onChange={(e) => setAi(e.target.checked)} />
          <span style={{ margin: 0 }}>This stem is AI-generated</span>
        </label>
        {ai && (
          <label className="field"><span>Prompt or seed used to generate it</span>
            <input value={prompt} onChange={(e) => setPrompt(e.target.value)} />
          </label>
        )}
        <p className="muted small" style={{ marginBottom: 8 }}>License prices in ETH. Leave a box empty to not offer that license.</p>
        <div className="formgrid">
          {LICENSE_TYPES.map((lt) => (
            <label className="field" key={lt}><span>{lt}</span>
              <input type="number" step="any" min={0} value={prices[lt]} onChange={(e) => setPrices({ ...prices, [lt]: e.target.value })} />
            </label>
          ))}
        </div>
        <button className="btn-primary" disabled={busy || tracks.length === 0}>Upload and fingerprint</button>
        {tracks.length === 0 && <p className="muted small" style={{ marginTop: 8 }}>Create a track first.</p>}
      </form>
    </section>
  );
}

function TrackCard({ track, busy, act }: { track: Track; busy: boolean; act: Act }) {
  const [title, setTitle] = useState(track.title);
  const [bpm, setBpm] = useState(track.bpm?.toString() ?? "");
  const [key, setKey] = useState(track.musical_key ?? "");
  const [genre, setGenre] = useState(track.genre ?? "");

  function save(e: FormEvent) {
    e.preventDefault();
    act(async () => {
      must(await supabaseBrowser().from("tracks").update({
        title: title.trim(), bpm: bpm ? Number(bpm) : null,
        musical_key: key.trim() || null, genre: genre.trim() || null,
      }).eq("track_id", track.track_id));
    }, "Track updated.");
  }

  function remove() {
    if (!confirm(`Delete "${track.title}" and all of its stems? This cannot be undone.`)) return;
    act(async () => {
      const sb = supabaseBrowser();
      const files = track.audio_stems.map((s) => s.file_url).filter(hasStoredFile);
      must(await sb.from("tracks").delete().eq("track_id", track.track_id));
      if (files.length) await sb.storage.from("stems").remove(files);
    }, "Track deleted.");
  }

  return (
    <section className="panel">
      <div className="row">
        <div>
          <h2 style={{ margin: 0 }}>{track.title}</h2>
          <p className="muted small">{[track.bpm && `${track.bpm} BPM`, track.musical_key, track.genre].filter(Boolean).join(" · ") || "No details yet"}</p>
        </div>
        <button className="btn-danger" disabled={busy} onClick={remove}>Delete track</button>
      </div>

      <details className="manage">
        <summary>Edit track details</summary>
        <form onSubmit={save}>
          <div className="formgrid">
            <label className="field"><span>Title</span><input value={title} onChange={(e) => setTitle(e.target.value)} required /></label>
            <label className="field"><span>BPM</span><input type="number" value={bpm} onChange={(e) => setBpm(e.target.value)} /></label>
            <label className="field"><span>Key</span><input value={key} onChange={(e) => setKey(e.target.value)} /></label>
            <label className="field"><span>Genre</span><input value={genre} onChange={(e) => setGenre(e.target.value)} /></label>
          </div>
          <button className="btn-ghost" disabled={busy}>Save track</button>
        </form>
      </details>

      <div style={{ marginTop: 14 }}>
        {track.audio_stems.length === 0 && <p className="muted small">No stems on this track yet.</p>}
        {track.audio_stems.map((s) => <StemRow key={s.stem_id} stem={s} busy={busy} act={act} />)}
      </div>
    </section>
  );
}

function StemRow({ stem, busy, act }: { stem: Stem; busy: boolean; act: Act }) {
  const minted = Array.isArray(stem.stem_mints) ? stem.stem_mints.length > 0 : !!stem.stem_mints;
  const priceOf = (lt: string) => stem.license_offers.find((o) => o.license_type === lt)?.price_eth;
  const [name, setName] = useState(stem.stem_name);
  const [prices, setPrices] = useState<Record<string, string>>(
    Object.fromEntries(LICENSE_TYPES.map((lt) => [lt, priceOf(lt) !== undefined ? String(Number(priceOf(lt))) : ""]))
  );

  function saveAll(e: FormEvent) {
    e.preventDefault();
    act(async () => {
      const sb = supabaseBrowser();
      if (name.trim() && name.trim() !== stem.stem_name) {
        must(await sb.from("audio_stems").update({ stem_name: name.trim() }).eq("stem_id", stem.stem_id));
      }
      for (const lt of LICENSE_TYPES) {
        const p = prices[lt];
        if (p === "") must(await sb.rpc("remove_license_offer", { p_stem_id: stem.stem_id, p_type: lt }));
        else must(await sb.rpc("set_license_offer", { p_stem_id: stem.stem_id, p_type: lt, p_price: Number(p) }));
      }
    }, "Stem updated.");
  }

  function remove() {
    if (!confirm(`Delete the stem "${stem.stem_name}"?`)) return;
    act(async () => {
      const sb = supabaseBrowser();
      const res = await sb.from("audio_stems").delete().eq("stem_id", stem.stem_id);
      if (res.error)
        throw new Error(res.error.message.includes("foreign key")
          ? "This stem has licenses, so it cannot be deleted."
          : res.error.message);
      if (hasStoredFile(stem.file_url)) await sb.storage.from("stems").remove([stem.file_url]);
    }, "Stem deleted.");
  }

  return (
    <div className="item">
      <div className="row">
        <div>
          <Link href={`/stems/${stem.stem_id}`}><strong>{stem.stem_name}</strong></Link>{" "}
          <span className="badge">{stem.stem_type}</span>{" "}
          {stem.is_ai_generated && <span className="badge ai">AI-generated</span>}{" "}
          {minted ? <span className="verified">Verified on-chain</span> : <span className="muted small">Not minted</span>}
        </div>
      </div>
      <details className="manage">
        <summary>Rename, set prices or delete</summary>
        <form onSubmit={saveAll}>
          <label className="field"><span>Stem name</span><input value={name} onChange={(e) => setName(e.target.value)} required /></label>
          <div className="formgrid">
            {LICENSE_TYPES.map((lt) => (
              <label className="field" key={lt}><span>{lt} price (ETH)</span>
                <input type="number" step="any" min={0} value={prices[lt]} onChange={(e) => setPrices({ ...prices, [lt]: e.target.value })} />
              </label>
            ))}
          </div>
          <div className="row start">
            <button className="btn-ghost" disabled={busy}>Save changes</button>
            <button type="button" className="btn-danger" disabled={busy} onClick={remove}>Delete stem</button>
          </div>
        </form>
      </details>
    </div>
  );
}
