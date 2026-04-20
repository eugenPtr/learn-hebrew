import { createBrowserClient as _createBrowserClient } from '@supabase/ssr'
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

export function createBrowserClient() {
  return _createBrowserClient(supabaseUrl, supabaseAnonKey)
}

// Singleton for Server Components doing DB-only queries (no auth session needed)
export const supabase = createClient(supabaseUrl, supabaseAnonKey)
