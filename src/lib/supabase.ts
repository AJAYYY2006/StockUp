import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://msgrvxdktosctkyuekpb.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1zZ3J2eGRrdG9zY3RreXVla3BiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzYwMTQ3NzgsImV4cCI6MjA5MTU5MDc3OH0.FXfRDWccXMxA7BqAeTLyEAyM1VbHHv8u6wCnIRlhCJw';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
