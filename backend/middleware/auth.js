import { supabase, supabaseAdmin, isSupabaseConfigured } from '../lib/supabase.js';

/**
 * Requires a logged-in Supabase user.
 * The website sends its Supabase access token as "Authorization: Bearer <token>".
 * On success, req.user is the auth user and req.producer is their row in `producers`
 * (producer_id, role, wallet_address, username).
 *
 * Set REQUIRE_AUTH=false only for local demos. Never in production.
 */
export async function requireAuth(req, res, next) {
  if (process.env.REQUIRE_AUTH === 'false') return next();

  const header = req.headers.authorization || '';
  const token = header.startsWith('Bearer ') ? header.slice(7).trim() : null;
  if (!token) return res.status(401).json({ error: 'Login required' });

  if (!isSupabaseConfigured) {
    return res.status(503).json({ error: 'Login check unavailable: Supabase is not configured on the server' });
  }

  try {
    const { data, error } = await supabase.auth.getUser(token);
    if (error || !data?.user) return res.status(401).json({ error: 'Invalid or expired login' });

    const { data: producer, error: pErr } = await supabaseAdmin
      .from('producers')
      .select('producer_id, username, role, wallet_address')
      .eq('auth_user_id', data.user.id)
      .maybeSingle();
    if (pErr) throw pErr;
    if (!producer) return res.status(403).json({ error: 'No Harmoniq profile for this account' });

    req.user = data.user;
    req.producer = producer;
    next();
  } catch (err) {
    next(err);
  }
}

/** Blocks anonymous writes. Reads (GET) stay public. */
export function writeGuard(req, res, next) {
  if (['GET', 'HEAD', 'OPTIONS'].includes(req.method)) return next();
  return requireAuth(req, res, next);
}
