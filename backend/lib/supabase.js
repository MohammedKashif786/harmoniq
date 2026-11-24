import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY;

export const isSupabaseConfigured = Boolean(
  supabaseUrl &&
  !supabaseUrl.includes('placeholder') &&
  supabaseAnonKey &&
  !supabaseAnonKey.includes('placeholder')
);

function createFastFallbackClient() {
  const handler = {
    get(target, prop) {
      if (prop === 'then') {
        return (resolve) => resolve({ data: null, error: new Error('Instant Local Demo Mode (Supabase URL unconfigured)') });
      }
      return (..._args) => new Proxy({}, handler);
    }
  };
  return new Proxy({}, handler);
}

export const supabase = isSupabaseConfigured
  ? createClient(supabaseUrl, supabaseAnonKey)
  : createFastFallbackClient();

export const supabaseAdmin = isSupabaseConfigured
  ? createClient(supabaseUrl, supabaseServiceKey || supabaseAnonKey)
  : createFastFallbackClient();


