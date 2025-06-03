import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// Create a direct client with the service role key to bypass RLS
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || '',
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '',
  {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  }
);

export async function GET() {
  try {
    // Return the SQL directly without trying to check the database
    const sqlScript = `
-- First, ensure the public schema exists and has correct permissions
CREATE SCHEMA IF NOT EXISTS public;

-- Grant basic schema usage to all roles
GRANT USAGE ON SCHEMA public TO postgres, anon, authenticated, service_role;
GRANT USAGE ON SCHEMA extensions TO postgres, anon, authenticated, service_role;

-- Drop the table if it exists (to avoid any corruption)
DROP TABLE IF EXISTS public.user_profiles;

-- Recreate the user_profiles table with proper settings
CREATE TABLE public.user_profiles (
    id UUID PRIMARY KEY DEFAULT extensions.uuid_generate_v4(),
    created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT now() NOT NULL,
    user_id UUID UNIQUE NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    username TEXT UNIQUE NOT NULL,
    email TEXT NOT NULL,
    occupation TEXT NOT NULL CHECK (occupation IN ('doctor', 'nurse', 'admin'))
);

-- Create function to update the updated_at column
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to automatically update the updated_at column
DROP TRIGGER IF EXISTS user_profiles_updated_at ON public.user_profiles;
CREATE TRIGGER user_profiles_updated_at
BEFORE UPDATE ON public.user_profiles
FOR EACH ROW
EXECUTE FUNCTION update_updated_at();

-- Enable Row Level Security
ALTER TABLE public.user_profiles ENABLE ROW LEVEL SECURITY;

-- Grant ALL permissions to service_role (bypasses RLS)
GRANT ALL ON public.user_profiles TO service_role;

-- For authenticated users, grant all operations
GRANT ALL ON public.user_profiles TO authenticated;

-- For anonymous users, grant at minimum SELECT and INSERT
GRANT SELECT, INSERT ON public.user_profiles TO anon;

-- Grant USAGE on extensions.uuid_generate_v4
GRANT EXECUTE ON FUNCTION extensions.uuid_generate_v4() TO anon, authenticated, service_role;

-- Grant usage on sequences
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO anon, authenticated, service_role;

-- Create policies - very permissive initially to get things working
DROP POLICY IF EXISTS "Anyone can insert" ON public.user_profiles;
CREATE POLICY "Anyone can insert"
  ON public.user_profiles
  FOR INSERT
  TO anon, authenticated
  WITH CHECK (true);

DROP POLICY IF EXISTS "Users can view any profile" ON public.user_profiles;
CREATE POLICY "Users can view any profile"
  ON public.user_profiles
  FOR SELECT
  TO anon, authenticated
  USING (true);

DROP POLICY IF EXISTS "Users can update any profile" ON public.user_profiles;
CREATE POLICY "Users can update any profile"
  ON public.user_profiles
  FOR UPDATE
  TO authenticated
  USING (true);

-- Set default privileges for future objects
ALTER DEFAULT PRIVILEGES IN SCHEMA public
GRANT ALL ON TABLES TO postgres, service_role;

ALTER DEFAULT PRIVILEGES IN SCHEMA public
GRANT SELECT, INSERT, UPDATE ON TABLES TO authenticated;

ALTER DEFAULT PRIVILEGES IN SCHEMA public
GRANT SELECT, INSERT ON TABLES TO anon;
`;

    return NextResponse.json({ 
      message: 'You need to run this SQL script in your Supabase dashboard SQL Editor:',
      sql: sqlScript
    });
  } catch (error) {
    console.error('Error in setup-db route:', error);
    return NextResponse.json(
      { 
        error: error instanceof Error ? error.message : 'Unknown error',
        message: 'Error occurred. Please run the SQL script in your Supabase dashboard SQL Editor.',
      },
      { status: 500 }
    );
  }
} 