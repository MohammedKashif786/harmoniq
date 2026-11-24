"use client";
import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { supabaseBrowser } from "@/lib/supabaseBrowser";

export default function LoginPage() {
  const router = useRouter();
  const [mode, setMode] = useState<"login" | "signup">("login");
  const [role, setRole] = useState<"producer" | "customer">("producer");
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);

  async function submit(e: FormEvent) {
    e.preventDefault();
    setBusy(true);
    setMsg(null);
    const sb = supabaseBrowser();
    if (mode === "login") {
      const { error } = await sb.auth.signInWithPassword({ email, password });
      if (error) setMsg({ ok: false, text: error.message });
      else {
        router.push("/");
        router.refresh();
      }
    } else {
      const { data, error } = await sb.auth.signUp({
        email,
        password,
        options: { data: { username: username.trim(), role } },
      });
      if (error) setMsg({ ok: false, text: error.message });
      else if (!data.session)
        setMsg({ ok: true, text: "Account created. Check your email to confirm it, then log in." });
      else {
        router.push(role === "producer" ? "/dashboard" : "/");
        router.refresh();
      }
    }
    setBusy(false);
  }

  return (
    <main className="wrap">
      <div className="narrow">
        <h1>{mode === "login" ? "Log in" : "Create your account"}</h1>
        <p className="muted" style={{ marginBottom: 22 }}>
          Producers upload and price stems. Customers search and license them.
        </p>

        <div className="tabs">
          <button type="button" className={mode === "login" ? "btn-primary" : "btn-ghost"} onClick={() => setMode("login")}>
            Log in
          </button>
          <button type="button" className={mode === "signup" ? "btn-primary" : "btn-ghost"} onClick={() => setMode("signup")}>
            Sign up
          </button>
        </div>

        <form className="panel" onSubmit={submit}>
          {mode === "signup" && (
            <>
              <label className="field">
                <span>I want to</span>
                <select value={role} onChange={(e) => setRole(e.target.value as "producer" | "customer")}>
                  <option value="producer">Upload and license my stems (Producer)</option>
                  <option value="customer">Find and license stems (Customer)</option>
                </select>
              </label>
              <label className="field">
                <span>Username</span>
                <input value={username} onChange={(e) => setUsername(e.target.value)} required minLength={3} maxLength={30} />
              </label>
            </>
          )}
          <label className="field">
            <span>Email</span>
            <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
          </label>
          <label className="field">
            <span>Password (at least 6 characters)</span>
            <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} required minLength={6} />
          </label>
          <button className="btn-primary" disabled={busy} style={{ width: "100%" }}>
            {busy ? "Please wait…" : mode === "login" ? "Log in" : "Create account"}
          </button>
          {msg && <div className={`msg ${msg.ok ? "ok" : "err"}`}>{msg.text}</div>}
        </form>
      </div>
    </main>
  );
}
