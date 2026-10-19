// src/utils/supabase.ts
import { createClient } from '@supabase/supabase-js';

// Lấy biến môi trường hoặc dùng giá trị fallback để tránh sập web
const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL || "https://your-supabase-project-id.supabase.co";
const supabaseKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY || "your-anon-key-here";

export const supabase = createClient(supabaseUrl, supabaseKey);