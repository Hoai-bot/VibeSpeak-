// src/utils/supabase.ts
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL || "https://your-supabase-project-id.supabase.co";
const supabaseKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY || "your-anon-key-here";

// Khai báo biến singleton trên global window để tránh tạo lại Client khi HMR/Reload
const globalForSupabase = globalThis as unknown as { supabase: any };

export const supabase =
  globalForSupabase.supabase ||
  createClient(supabaseUrl, supabaseKey, {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: false,
    },
  });

if (process.env.NODE_ENV !== 'production') {
  globalForSupabase.supabase = supabase;
}