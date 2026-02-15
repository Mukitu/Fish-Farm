
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://ydusbkbfdoqkjnivuywp.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InlkdXNia2JmZG9xa2puaXZ1eXdwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzExNTE0MzYsImV4cCI6MjA4NjcyNzQzNn0.Xarf5PJ5Wp5JPnuJ5iy6PMbL9dNI6mDmhImp602Htns';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
