// src/utils/supabase.ts
import { createClient, SupabaseClient } from '@supabase/supabase-js';

// Đọc URL và ANON KEY từ biến môi trường, có sẵn fallback trực tiếp cho VibeSpeak
const SUPABASE_URL =
  process.env.EXPO_PUBLIC_SUPABASE_URL || 'https://hdifryokbfssibhsnpja.supabase.co';
const SUPABASE_ANON_KEY =
  process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY ||
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...'; // Anon Key dự án của bạn

// Tải hoặc lưu duy nhất 1 instance duy nhất trên window/global context
declare global {
  var __supabaseInstance: SupabaseClient | undefined;
}

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