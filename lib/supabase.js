import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://placeholder.supabase.co'
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'placeholder-anon-key'

// Check if Supabase is configured
export const isSupabaseConfigured = () => {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL || ''
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''
  
  return url && 
         key && 
         url !== 'https://placeholder.supabase.co' && 
         key !== 'placeholder-anon-key' &&
         !url.includes('your_supabase') &&
         !key.includes('your_supabase')
}

// Create Supabase client only if configured
let supabase = null
if (isSupabaseConfigured()) {
  supabase = createClient(supabaseUrl, supabaseAnonKey)
}

export { supabase }

// Server-side Supabase client with service role
// Server-side Supabase client with service role
export const getServiceSupabase = () => {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY
  
  if (!url || !serviceRoleKey || url === 'https://placeholder.supabase.co') {
    console.warn('Supabase not configured properly for server-side usage.')
    return null
  }

  return createClient(url, serviceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  })
}