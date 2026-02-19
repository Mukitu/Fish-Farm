
import { createClient } from '@supabase/supabase-js';

/**
 * এনভায়রনমেন্ট ভেরিয়েবল নিরাপদে পাওয়ার জন্য একটি হেল্পার ফাংশন।
 * এটি প্রথমে Vite এর import.meta.env এবং পরে process.env চেক করে।
 */
const getEnvVariable = (key: string): string | undefined => {
  try {
    // Vite বা আধুনিক বিল্ড টুলের জন্য
    const metaEnv = (import.meta as any).env;
    if (metaEnv && metaEnv[key]) {
      return metaEnv[key];
    }
  } catch (e) {
    // import.meta.env না থাকলে ইগনোর করবে
  }

  try {
    // Vercel বা Node.js এনভায়রনমেন্টের জন্য
    if (typeof process !== 'undefined' && process.env && process.env[key]) {
      return process.env[key];
    }
  } catch (e) {
    // process.env না থাকলে ইগনোর করবে
  }

  return undefined;
};

// ডাটাবেস ইউআরএল এবং কী সেটআপ
// VITE_ এবং সাধারণ কি—উভয়ই চেক করা হচ্ছে সর্বোচ্চ সামঞ্জস্যতার জন্য
const supabaseUrl = 
  getEnvVariable('VITE_SUPABASE_URL') || 
  getEnvVariable('SUPABASE_URL') || 
  'https://ydusbkbfdoqkjnivuywp.supabase.co';

const supabaseAnonKey = 
  getEnvVariable('VITE_SUPABASE_ANON_KEY') || 
  getEnvVariable('SUPABASE_ANON_KEY') || 
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InlkdXNia2JmZG9xa2puaXZ1eXdwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzExNTE0MzYsImV4cCI6MjA4NjcyNzQzNn0.Xarf5PJ5Wp5JPnuJ5iy6PMbL9dNI6mDmhImp602Htns';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
