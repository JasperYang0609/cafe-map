import 'react-native-url-polyfill/auto';
import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://fykzbocjhsbljrlriewv.supabase.co';

// TODO: Replace with actual anon key from Supabase Dashboard → Settings → API → anon public
// For now using service role key for development (NEVER ship this in production!)
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZ5a3pib2NqaHNibGpybHJpZXd2Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3Mzk5Mjc3MywiZXhwIjoyMDg5NTY4NzczfQ.OPP-uh_X0ehcYIOL48V8bCAHJe9BinVUMjlCLBixdmU';

export const supabase = createClient(SUPABASE_URL, SUPABASE_KEY, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: false,
  },
});
