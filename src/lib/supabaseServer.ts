// src/lib/supabaseServer.ts
import { createServerClient } from '@supabase/ssr'
import { cookies as nextCookies } from 'next/headers'

export function createServerSupabaseClient() {
  // Get the Next.js cookie store for the current request
  const cookieStore = nextCookies()

  // Wrap it in the methods Supabase expects
  const cookieMethods = {
    get(name: string) {
      return cookieStore.get(name)?.value ?? null
    },
    set(name: string, value: string, options?: { path?: string; maxAge?: number }) {
      cookieStore.set({ name, value, ...options })
    },
    remove(name: string, options?: { path?: string }) {
      cookieStore.set({ name, value: '', ...options })
    },
  }

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: cookieMethods,
    }
  )
}
