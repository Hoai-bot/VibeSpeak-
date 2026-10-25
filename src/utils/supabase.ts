// src/utils/supabase.ts
import { createClient, SupabaseClient } from '@supabase/supabase-js';

// Đọc từ biến môi trường hoặc dùng URL và Key dự phòng trực tiếp của project
const supabaseUrl =
  process.env.EXPO_PUBLIC_SUPABASE_URL ||
  'https://hdifryokbfssibhsnpja.supabase.co';

const supabaseAnonKey =
  process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY ||
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImhkaWZyeW9rYmZzc2liaHNucGphIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODgyMDI5MTUsImV4cCI6MjEwMzc3ODkxNX0.z0Cq9HGZkGHW4xBVlUxT3O7AnDiE7HxM0h8EeuqaG_A'; // 

declare global {
  var __vibespeakSupabaseClient: SupabaseClient | undefined;
}

// 🎯 BỘ TẠO DÙNG CHUNG DUY NHẤT (SINGLETON) - TRÁNH LỖI TRÙNG LẶP GOTRUECLIENT
if (!globalThis.__vibespeakSupabaseClient) {
  globalThis.__vibespeakSupabaseClient = createClient(supabaseUrl, supabaseAnonKey, {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: false,
      storageKey: 'vibespeak_single_auth_token',
    },
  });
}

export const supabase = globalThis.__vibespeakSupabaseClient;