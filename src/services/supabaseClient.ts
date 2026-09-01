import { createClient } from '@supabase/supabase-js'; //[cite: 7]
import AsyncStorage from '@react-native-async-storage/async-storage'; //[cite: 7]

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL as string; //[cite: 7]
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY as string; //[cite: 7]

if (!supabaseUrl || !supabaseAnonKey) { //[cite: 7]
  console.warn('⚠️ Thiếu cấu hình Supabase! Vui lòng kiểm tra lại file .env của bạn.'); //[cite: 7]
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey, { //[cite: 7]
  auth: { //[cite: 7]
    storage: AsyncStorage, //[cite: 7]
    autoRefreshToken: true, //[cite: 7]
    persistSession: true, //[cite: 7]
    detectSessionInUrl: false, //[cite: 7]
  },
}); //[cite: 7]