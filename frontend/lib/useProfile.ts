"use client";
import { useCallback, useEffect, useState } from "react";
import { supabaseBrowser } from "@/lib/supabaseBrowser";

export interface Profile {
  producer_id: number;
  username: string;
  email: string;
  role: "producer" | "customer";
  wallet_address: string | null;
  reputation_score: number;
}

// Returns the logged-in person's profile (or null when logged out).
export function useProfile() {
  const [state, setState] = useState<{ loading: boolean; profile: Profile | null }>({
    loading: true,
    profile: null,
  });
  const [tick, setTick] = useState(0);
  const reload = useCallback(() => setTick((t) => t + 1), []);

  useEffect(() => {
    const sb = supabaseBrowser();
    let active = true;

    async function load() {
      const { data: auth } = await sb.auth.getSession();
      if (!auth.session) {
        if (active) setState({ loading: false, profile: null });
        return;
      }
      const { data } = await sb
        .from("producers")
        .select("producer_id,username,email,role,wallet_address,reputation_score")
        .eq("auth_user_id", auth.session.user.id)
        .maybeSingle();
      if (active) setState({ loading: false, profile: (data as Profile | null) ?? null });
    }

    load();
    // Do not call the database directly inside this callback; defer it.
    const { data: sub } = sb.auth.onAuthStateChange(() => {
      setTimeout(load, 0);
    });
    return () => {
      active = false;
      sub.subscription.unsubscribe();
    };
  }, [tick]);

  return { ...state, reload };
}
