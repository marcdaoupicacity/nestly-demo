import { createClient } from '@supabase/supabase-js'
const url = import.meta.env.VITE_SUPABASE_URL as string | undefined
const key = import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined
if (!url || !key) console.warn('Missing VITE_SUPABASE_URL / VITE_SUPABASE_ANON_KEY')
export const supabase = createClient(url || 'http://localhost:54321', key || 'public-anon-key')
