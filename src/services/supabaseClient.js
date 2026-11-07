import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = "https://qlenbutdedkxscwrlniu.supabase.co";
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFsZW5idXRkZWRreHNjd3Jsbml1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzg5MTg2ODcsImV4cCI6MjA5NDQ5NDY4N30.t9ThaW86Gls4EZalj2E6d8pIqsRHGFeTCmjAvviMlwI";

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true
  },
  realtime: {
    enabled: false
  }
});
