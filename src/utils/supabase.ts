// src/utils/supabase.ts
import { createClient, SupabaseClient } from '@supabase/supabase-js';

const SUPABASE_URL =
  process.env.EXPO_PUBLIC_SUPABASE_URL || 'https://hdifryokbfssibhsnpja.supabase.co';
const SUPABASE_ANON_KEY =
  process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY ||
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...';

declare global {
  var __vibespeakSupabaseClient: SupabaseClient | undefined;
}

// 🎯 BỘ TẠO DÙNG CHUNG DUY NHẤT - KHÔNG CHO PHÉP ĐĂNG KÝ TRÙNG LẶP GOTRUECLIENT
if (!globalThis.__vibespeakSupabaseClient) {
  globalThis.__vibespeakSupabaseClient = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: false,
      storageKey: 'vibespeak_single_auth_token', // Đặt khóa cố định để tránh trùng khớp với khóa tự động của Supabase
    },
  });
}

export const supabase = globalThis.__vibespeakSupabaseClient;