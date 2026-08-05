import { createClient, type SupabaseClient } from '@supabase/supabase-js'

const url = process.env.NEXT_PUBLIC_SUPABASE_URL
const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

/** Public client for anon reads */
export const supabasePublic: SupabaseClient | null =
  url && anonKey ? createClient(url, anonKey, { auth: { persistSession: false } }) : null

/** Privileged service_role client for server-side admin operations (cached singleton) */
let _adminClient: SupabaseClient | null = null

export function supabaseAdmin(): SupabaseClient {
  if (_adminClient) return _adminClient
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!url || !serviceKey) {
    throw new Error(
      'Supabase admin not configured: set NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY.'
    )
  }
  _adminClient = createClient(url, serviceKey, { auth: { persistSession: false } })
  return _adminClient
}

export function isSupabaseConfigured(): boolean {
  return Boolean(url && anonKey)
}
