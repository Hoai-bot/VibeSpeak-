// src/utils/supabase.ts
import { createClient, SupabaseClient } from '@supabase/supabase-js';

const SUPABASE_URL =
  process.env.EXPO_PUBLIC_SUPABASE_URL || 'https://hdifryokbfssibhsnpja.supabase.co';
const SUPABASE_ANON_KEY =
  process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY ||
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...'; // Điền Anon Key đầy đủ của bạn ở đây

declare global {
  var __supabaseInstance: SupabaseClient | undefined;
}

// 🎯 Khởi tạo Singleton duy nhất trên global context
if (!globalThis.__supabaseInstance) {
  globalThis.__supabaseInstance = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: false,
    },
  });
}

export const supabase = globalThis.__supabaseInstance;