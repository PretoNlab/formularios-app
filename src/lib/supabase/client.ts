import { createBrowserClient } from "@supabase/ssr"

/**
 * Creates a Supabase client for use in Client Components ("use client").
 * Safe to call multiple times — always returns a fresh client with the
 * same underlying connection.
 */
export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )
}
