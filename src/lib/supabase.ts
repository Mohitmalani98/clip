
import { createClient } from '@supabase/supabase-js';

let supabase: any = null;

export async function getSupabase() {
  if (supabase) return supabase;

  const url = process.env.SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY; 
  
  if (!url || !serviceKey) {
    throw new Error('Supabase URL or SUPABASE_SERVICE_ROLE_KEY are not set in environment variables.');
  }

  // Initialize with the service_role key to bypass RLS for admin operations
  supabase = createClient(url, serviceKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  });
  return supabase;
}
