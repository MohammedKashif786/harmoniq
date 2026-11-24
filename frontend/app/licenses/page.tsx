"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { supabaseBrowser } from "@/lib/supabaseBrowser";
import { useProfile } from "@/lib/useProfile";
import { downloadStem, hasStoredFile } from "@/lib/download";
import { fmtDate } from "@/lib/format";

interface Row {
  license_id: number;
  license_type: string;
  price_eth: number;
  expires_at: string | null;
  audio_stems: { stem_id: number; stem_name: string; stem_type: string; file_url: string; tracks: { title: string } };
}

export default function LicensesPage() {
  const { loading, profile } = useProfile();
  const [rows, setRows] = useState<Row[]>([]);
  const [msg, setMsg] = useState<string | null>(null);
  const pid = profile?.producer_id;

  useEffect(() => {
    if (!pid) return;
    supabaseBrowser()
      .from("licenses")
      .select("license_id,license_type,price_eth,expires_at,audio_stems(stem_id,stem_name,stem_type,file_url,tracks(title))")
      .eq("buyer_id", pid)
      .order("license_id", { ascending: false })
      .then(({ data, error }) => {
        if (error) setMsg(error.message);
        else setRows((data ?? []) as unknown as Row[]);
      });
  }, [pid]);

  if (loading) return <main className="wrap"><p className="muted">Loading…</p></main>;
  if (!profile)
    return (
      <main className="wrap">
        <h1>My licenses</h1>
        <p className="muted" style={{ margin: "8px 0 18px" }}>Log in to see the stems you have licensed.</p>
        <Link href="/login" className="btn-primary">Log in</Link>
      </main>
    );

  return (
    <main className="wrap">
      <h1>My licenses</h1>
      <p className="muted" style={{ marginBottom: 22 }}>Stems you can use, and when each license ends.</p>
      {msg && <div className="msg err">{msg}</div>}
      <section className="panel">
        {rows.length === 0 ? (
          <p className="muted">You have no licenses yet. <Link href="/" className="good">Browse stems</Link></p>
        ) : (
          rows.map((r) => {
            const active = !r.expires_at || new Date(r.expires_at) > new Date();
            const s = r.audio_stems;
            return (
              <div className="item" key={r.license_id}>
                <div className="lic-row">
                  <div>
                    <Link href={`/stems/${s.stem_id}`}><strong>{s.stem_name}</strong></Link>{" "}
                    <span className="badge">{s.stem_type}</span>
                    <p className="muted small">
                      {s.tracks.title} · {r.license_type} · {Number(r.price_eth)} ETH ·{" "}
                      {r.expires_at ? `${active ? "valid until" : "expired"} ${fmtDate(r.expires_at)}` : "never expires"}
                    </p>
                  </div>
                  {active && hasStoredFile(s.file_url) ? (
                    <button
                      className="btn-ghost"
                      onClick={() => downloadStem(s.file_url).catch((e) => setMsg(e instanceof Error ? e.message : "Download failed"))}
                    >
                      Download
                    </button>
                  ) : (
                    <span className="muted small">{active ? "Sample stem (no file)" : "Expired"}</span>
                  )}
                </div>
              </div>
            );
          })
        )}
      </section>
    </main>
  );
}
