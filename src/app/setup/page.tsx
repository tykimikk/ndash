'use client';
import { useState } from 'react';
import { Button } from '@/components/Button';

export default function SetupPage() {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<string | null>(null);
  const [sqlScript, setSqlScript] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function runSetup() {
    setLoading(true);
    setResult(null);
    setSqlScript(null);
    setError(null);

    try {
      const response = await fetch('/api/setup-db');
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || 'Unknown error occurred');
      }
      
      setResult(data.message || 'Setup completed successfully');
      
      if (data.sql) {
        setSqlScript(data.sql);
      }
    } catch (err) {
      console.error('Setup error:', err);
      setError(err instanceof Error ? err.message : 'An error occurred');
      
      // Even if there's an error, provide the SQL script
      setSqlScript(`
-- Create users table
CREATE TABLE IF NOT EXISTS public.user_profiles (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    username TEXT NOT NULL UNIQUE,
    email TEXT NOT NULL,
    occupation TEXT CHECK (occupation IN ('doctor', 'nurse', 'admin')),
    UNIQUE(user_id)
);

-- Make sure update_updated_at function exists
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Add trigger for updated_at
DROP TRIGGER IF EXISTS user_profiles_updated_at ON public.user_profiles;
CREATE TRIGGER user_profiles_updated_at 
BEFORE UPDATE ON public.user_profiles 
FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- Set up Row Level Security (RLS)
ALTER TABLE public.user_profiles ENABLE ROW LEVEL SECURITY;

-- Create policies that allow users to only see and edit their own profile
DROP POLICY IF EXISTS "Allow select own profile" ON public.user_profiles;
CREATE POLICY "Allow select own profile" ON public.user_profiles FOR
SELECT TO authenticated USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Allow insert own profile" ON public.user_profiles;
CREATE POLICY "Allow insert own profile" ON public.user_profiles FOR
INSERT TO authenticated WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Allow update own profile" ON public.user_profiles;
CREATE POLICY "Allow update own profile" ON public.user_profiles FOR
UPDATE TO authenticated USING (auth.uid() = user_id);

-- Grant privileges to the user profiles table
GRANT ALL PRIVILEGES ON public.user_profiles TO authenticated;
GRANT ALL PRIVILEGES ON public.user_profiles TO service_role;
      `);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4">
      <div className="bg-white dark:bg-gray-800 p-8 rounded-lg shadow-md max-w-2xl w-full">
        <h1 className="text-2xl font-bold mb-6">Database Setup</h1>
        <p className="mb-6 text-gray-600 dark:text-gray-300">
          This page will help set up the database for user profiles.
        </p>

        {result && (
          <div className="mb-4 p-3 bg-green-50 text-green-700 rounded-md">
            {result}
          </div>
        )}

        {error && (
          <div className="mb-4 p-3 bg-red-50 text-red-700 rounded-md">
            <p className="font-medium mb-1">Error: {error}</p>
            <p className="text-sm">
              You'll need to manually run the SQL script below in your Supabase dashboard.
            </p>
          </div>
        )}

        <Button
          onClick={runSetup}
          disabled={loading}
          className="w-full mb-4"
        >
          {loading ? 'Checking...' : 'Check Database Setup'}
        </Button>
        
        {sqlScript && (
          <div className="mt-6">
            <h2 className="text-lg font-semibold mb-2">SQL to Run in Supabase</h2>
            <div className="bg-yellow-50 p-4 rounded-md mb-4 text-sm">
              <p className="mb-2"><strong>Instructions:</strong></p>
              <ol className="list-decimal ml-5 space-y-2">
                <li>Go to your <a href="https://supabase.com/dashboard" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">Supabase Dashboard</a></li>
                <li>Select your project</li>
                <li>Go to the "SQL Editor" from the left sidebar</li>
                <li>Create a new query</li>
                <li>Copy and paste the SQL below into the editor</li>
                <li>Click "Run" to execute the query</li>
                <li>Return to this page and try signing up again</li>
              </ol>
            </div>
            <div className="relative">
              <pre className="bg-gray-800 text-gray-200 p-4 rounded-md overflow-x-auto text-xs whitespace-pre">
                {sqlScript}
              </pre>
              <button
                onClick={() => {
                  navigator.clipboard.writeText(sqlScript);
                  alert('SQL copied to clipboard!');
                }}
                className="absolute top-2 right-2 bg-gray-700 hover:bg-gray-600 text-white px-2 py-1 rounded text-xs"
              >
                Copy
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
} 