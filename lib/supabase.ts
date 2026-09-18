import { createClient } from '@supabase/supabase-js';

const getEnvVariable = (key: string): string | undefined => {
  try {
    const metaEnv = (import.meta as any).env;
    if (metaEnv && metaEnv[key]) {
      return metaEnv[key];
    }
  } catch (e) {
    // ignore
  }

  try {
    if (typeof process !== 'undefined' && process.env && process.env[key]) {
      return process.env[key];
    }
  } catch (e) {
    // ignore
  }

  return undefined;
};

const supabaseUrl = 
  getEnvVariable('VITE_SUPABASE_URL') || 
  getEnvVariable('SUPABASE_URL') || 
  'https://ydusbkbfdoqkjnivuywp.supabase.co';

const supabaseAnonKey = 
  getEnvVariable('VITE_SUPABASE_ANON_KEY') || 
  getEnvVariable('SUPABASE_ANON_KEY') || 
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InlkdXNia2JmZG9xa2puaXZ1eXdwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzExNTE0MzYsImV4cCI6MjA4NjcyNzQzNn0.Xarf5PJ5Wp5JPnuJ5iy6PMbL9dNI6mDmhImp602Htns';

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
    storageKey: 'fish_farm_auth_token',
    storage: window.localStorage
  }
});
