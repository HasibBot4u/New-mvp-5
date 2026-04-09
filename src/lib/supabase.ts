import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL as string;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string;

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('⚠️ Missing VITE_SUPABASE_URL or VITE_SUPABASE_ANON_KEY in environment variables');
}

export const supabase = createClient(supabaseUrl || '', supabaseAnonKey || '', {
  auth: { autoRefreshToken: true, persistSession: true, detectSessionInUrl: true }
});

export async function logActivity(userId: string, action: string, details: any = {}) {
  try {
    await supabase.from('activity_logs').insert({
      user_id: userId,
      action,
      details
    });
  } catch (e) {
    console.error('Failed to log activity:', e);
  }
}
