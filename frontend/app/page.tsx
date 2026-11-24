import Link from "next/link";
import { db } from "@/lib/supabase";
import Waveform from "@/components/Waveform";
import ErrorBox from "@/components/ErrorBox";

export const dynamic = "force-dynamic";

interface CatalogRow {
  stem_id: number;
  stem_name: string;
  stem_type: string;
  is_ai_generated: boolean;
  track_title: string;
  genre: string | null;
  producer: string;
  is_minted: boolean;
  from_price_eth: number | null;
  license_count: number;
  review_count: number;
  avg_rating: number | null;
}

const FILTERS = ["All", "Vocal", "Bass", "Drum", "Melody", "AI-generated", "Minted"];
const SORTS: Record<string, string> = {
  newest: "Newest",
  popular: "Most licensed",
  rating: "Top rated",
  price: "Lowest price",
};

type Params = { q?: string; type?: string; sort?: string };

export default async function ExplorePage({ searchParams }: { searchParams: Promise<Params> }) {
  const sp = await searchParams;
  const active = sp.type ?? "All";
  const sort = sp.sort && SORTS[sp.sort] ? sp.sort : "newest";
  // Remove characters that have a special meaning in the search filter.
  const q = (sp.q ?? "").replace(/[,()%*\\]/g, " ").trim().slice(0, 60);

  const href = (over: Partial<Params>) => {
    const p = new URLSearchParams();
    const merged = { q: sp.q, type: sp.type, sort: sp.sort, ...over };
    if (merged.q) p.set("q", merged.q);
    if (merged.type && merged.type !== "All") p.set("type", merged.type);
    if (merged.sort && merged.sort !== "newest") p.set("sort", merged.sort);
    const s = p.toString();
    return s ? `/?${s}` : "/";
  };

  let query = db().from("v_stem_catalog").select("*");
  if (q) {
    const w = `*${q}*`;
    query = query.or(`stem_name.ilike.${w},track_title.ilike.${w},producer.ilike.${w},genre.ilike.${w}`);
  }
  if (["Vocal", "Bass", "Drum", "Melody"].includes(active)) query = query.eq("stem_type", active);
  if (active === "AI-generated") query = query.eq("is_ai_generated", true);
  if (active === "Minted") query = query.eq("is_minted", true);

  if (sort === "popular") query = query.order("license_count", { ascending: false }).order("stem_id");
  else if (sort === "rating") query = query.order("avg_rating", { ascending: false, nullsFirst: false }).order("stem_id");
  else if (sort === "price") query = query.order("from_price_eth", { ascending: true, nullsFirst: false }).order("stem_id");
  else query = query.order("stem_id", { ascending: false });

  const { data, error } = await query;
  if (error) return <ErrorBox message={error.message} />;
  const rows = (data ?? []) as CatalogRow[];

  return (
    <main className="wrap">
      <h1>Stems with proof of who made them</h1>
      <p className="muted" style={{ maxWidth: 640 }}>
        Search, license and verify audio stems. Every minted stem is anchored on the Sepolia blockchain.
      </p>

      <form className="search" action="/" method="get">
        <input name="q" defaultValue={sp.q ?? ""} placeholder="Search by stem, track, producer or genre" aria-label="Search stems" />
        {sp.type && <input type="hidden" name="type" value={sp.type} />}
        <select name="sort" defaultValue={sort} aria-label="Sort by">
          {Object.entries(SORTS).map(([k, label]) => <option key={k} value={k}>{label}</option>)}
        </select>
        <button className="btn-primary">Search</button>
      </form>

      <div className="chips">
        {FILTERS.map((f) => (
          <Link key={f} href={href({ type: f })} className={`chip${active === f ? " on" : ""}`}>
            {f}
          </Link>
        ))}
      </div>

      <p className="muted small" style={{ marginBottom: 16 }}>
        {rows.length} {rows.length === 1 ? "stem" : "stems"}
        {q ? ` matching “${q}”` : ""}
        {(q || active !== "All") && <> · <Link href="/" className="good">Clear filters</Link></>}
      </p>

      {rows.length === 0 ? (
        <p className="muted empty">No stems match your search.</p>
      ) : (
        <div className="grid">
          {rows.map((r) => {
            const reviews = Number(r.review_count);
            const licenses = Number(r.license_count);
            return (
              <Link key={r.stem_id} href={`/stems/${r.stem_id}`} className="card">
                <Waveform seed={r.stem_id} />
                <div className="row">
                  <span className="badges">
                    <span className="badge">{r.stem_type}</span>
                    {r.is_ai_generated && <span className="badge ai">AI-generated</span>}
                  </span>
                  {r.is_minted ? (
                    <span className="verified">Verified on-chain</span>
                  ) : (
                    <span className="muted small">Not minted</span>
                  )}
                </div>
                <h3>{r.stem_name}</h3>
                <p className="muted small">{r.track_title} · by {r.producer}</p>
                <div className="row" style={{ marginTop: 12 }}>
                  <span className="muted small">
                    {licenses} {licenses === 1 ? "license" : "licenses"} ·{" "}
                    {reviews > 0 ? `${Number(r.avg_rating).toFixed(1)} / 5` : "No reviews"}
                  </span>
                  {r.from_price_eth !== null && <span className="mono">from {Number(r.from_price_eth)} ETH</span>}
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </main>
  );
}
