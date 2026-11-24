"use client";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { supabaseBrowser } from "@/lib/supabaseBrowser";
import { useProfile } from "@/lib/useProfile";

export default function AuthNav() {
  const { loading, profile } = useProfile();
  const router = useRouter();
  const path = usePathname();

  async function signOut() {
    await supabaseBrowser().auth.signOut();
    router.push("/");
    router.refresh();
  }

  const cls = (p: string) => (path === p ? "on" : undefined);

  return (
    <>
      <nav>
        <Link href="/" className={cls("/")}>Explore</Link>
        {profile?.role === "producer" && (
          <Link href="/dashboard" className={cls("/dashboard")}>My stems</Link>
        )}
        {profile && <Link href="/licenses" className={cls("/licenses")}>My licenses</Link>}
      </nav>
      <div className="who">
        {loading ? null : profile ? (
          <>
            <span className="muted small">{profile.username}</span>
            <span className="badge">{profile.role}</span>
            <button className="btn-ghost" onClick={signOut}>Log out</button>
          </>
        ) : (
          <Link href="/login" className="btn-primary">Log in</Link>
        )}
      </div>
    </>
  );
}
