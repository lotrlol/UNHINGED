import { createClient } from '@supabase/supabase-js'
import { Database } from '../types/database'

// Debug: Log all environment variables available in import.meta.env
console.log('All import.meta.env variables:', Object.keys(import.meta.env).filter(key => key.startsWith('VITE_')));

// Get environment variables with fallbacks
const supabaseUrl = 
  import.meta.env.VITE_SUPABASE_URL || 
  process.env.VITE_SUPABASE_URL || 
  'https://asmapzgkvfztqnztnipb.supabase.co';

const supabaseAnonKey = 
  import.meta.env.VITE_SUPABASE_ANON_KEY || 
  process.env.VITE_SUPABASE_ANON_KEY || 
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFzbWFwemdrdmZ6dHFuenRuaXBiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTc3Nzk5NTIsImV4cCI6MjA3MzM1NTk1Mn0.mrqXK_Zf4OxlWDaq0dVtTgZNrsSRALpSCv6Hyq1xUhI';

// Debug: Log the actual values we're using
console.log('Using Supabase URL:', supabaseUrl ? 'Set' : 'Not Set');
console.log('Using Supabase Key:', supabaseAnonKey ? 'Set' : 'Not Set');

if (!supabaseUrl || !supabaseAnonKey) {
  const errorMessage = 'Missing Supabase environment variables. Please check your .env file and ensure VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY are set correctly.'
  console.error(errorMessage)
  console.error('Current values:', {
    VITE_SUPABASE_URL: supabaseUrl || 'Not Set',
    VITE_SUPABASE_ANON_KEY: supabaseAnonKey ? 'Present' : 'Missing'
  })
  throw new Error(errorMessage)
}

// Validate URL format
try {
  new URL(supabaseUrl)
} catch (error) {
  console.error('Invalid Supabase URL format:', supabaseUrl)
  throw new Error(`Invalid Supabase URL format: ${supabaseUrl}. Please check your VITE_SUPABASE_URL in the .env file.`)
}

// Create a type-safe client
export const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey, {
  db: {
    schema: 'public',
  },
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true,
  },
})

export type Tables<T extends keyof Database['public']['Tables']> = Database['public']['Tables'][T]['Row']
export type Inserts<T extends keyof Database['public']['Tables']> = Database['public']['Tables'][T]['Insert']
export type Updates<T extends keyof Database['public']['Tables']> = Database['public']['Tables'][T]['Update']

// Helper function to perform type-safe updates
export const updateTable = <T extends keyof Database['public']['Tables']>(
  table: T,
  updates: Partial<Database['public']['Tables'][T]['Update']>,
  id: string
) => {
  return supabase
    .from(table)
    .update(updates as any)
    .eq('id', id)
    .select()
    .single<Database['public']['Tables'][T]['Row']>();
};

// Helper function to perform type-safe inserts
export const insertIntoTable = <T extends keyof Database['public']['Tables']>(
  table: T,
  values: Database['public']['Tables'][T]['Insert']
) => {
  return supabase
    .from(table)
    .insert(values as any)
    .select()
    .single<Database['public']['Tables'][T]['Row']>();
};