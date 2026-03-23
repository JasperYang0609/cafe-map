import 'react-native-url-polyfill/auto';
import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://fykzbocjhsbljrlriewv.supabase.co';

const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZ5a3pib2NqaHNibGpybHJpZXd2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzM5OTI3NzMsImV4cCI6MjA4OTU2ODc3M30.NswKBPGdClnjLRlBjQHRZG2omL4gywu3BDgAeCqvt08';

export const supabase = createClient(SUPABASE_URL, SUPABASE_KEY, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: false,
  },
});
