import { createClient } from '@supabase/supabase-js';

const DEPRECATED_URL = 'sxgbxraovasblbzvoyyt.supabase.co';
const DEFAULT_URL = 'https://chkmkquhfubvkvmddzvl.supabase.co';
const DEFAULT_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNoa21rcXVoZnVidmt2bWRkenZsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODg0Njk3MDQsImV4cCI6MjEwNDA0NTcwNH0.M5uPyG041MIPtNUQO51ye1yTwp7yUlba7GOmlsP3B6c';

let envUrl = import.meta.env.VITE_SUPABASE_URL;
let envKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

// Si no está definida o contiene la URL antigua deprecada, usar las credenciales activas
if (!envUrl || envUrl.includes(DEPRECATED_URL) || envUrl === 'https://tu-proyecto.supabase.co') {
  envUrl = DEFAULT_URL;
}

if (!envKey || envKey === 'tu-anon-key-aqui' || envKey.length < 20 || envUrl === DEFAULT_URL && (!envKey || envKey.includes('jcIQwrOafzRQrypf5zZnBPBXlZZ_8kHWPeues-ahYm0'))) {
  envKey = DEFAULT_KEY;
}

export const supabaseUrl = envUrl;
export const supabaseAnonKey = envKey;

export const isSupabaseConfigured = Boolean(
  supabaseUrl &&
  supabaseAnonKey &&
  typeof supabaseUrl === 'string' &&
  typeof supabaseAnonKey === 'string' &&
  supabaseUrl.startsWith('https://') &&
  supabaseAnonKey.length > 20
);

export const supabase = isSupabaseConfigured
  ? createClient(supabaseUrl, supabaseAnonKey, {
      auth: { persistSession: true },
      global: {
        headers: {
          apikey: supabaseAnonKey
        }
      }
    })
  : null;
