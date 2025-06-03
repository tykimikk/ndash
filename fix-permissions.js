const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing Supabase URL or key in environment variables');
  process.exit(1);
}

console.log('Using URL:', supabaseUrl);
console.log('Using key type:', process.env.SUPABASE_SERVICE_ROLE_KEY ? 'service_role' : 'anon');

const supabase = createClient(supabaseUrl, supabaseKey);

async function fixPermissions() {
  console.log('Attempting to fix permissions...');

  try {
    // First check if the table exists
    console.log('Checking if user_profiles table exists...');
    const { data, error: checkError } = await supabase
      .from('user_profiles')
      .select('count', { count: 'exact', head: true });

    if (checkError) {
      if (checkError.message.includes('does not exist')) {
        console.log('The user_profiles table does not exist yet. Running table creation SQL...');
        
        // SQL to create the user_profiles table
        const createTableSql = `
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
        `;

        try {
          // Try to execute the SQL directly
          const { error: createError } = await supabase.rpc('exec_sql', { sql: createTableSql });
          if (createError) {
            console.error('Failed to create table with exec_sql RPC:', createError);
          } else {
            console.log('Successfully created user_profiles table!');
          }
        } catch (directError) {
          console.error('Error executing SQL directly:', directError);
        }
      } else {
        console.log('Error checking table:', checkError);
      }
    } else {
      console.log('The user_profiles table exists!', data);
    }

    // Now try to run the SQL to fix permissions
    console.log('Setting up permissions...');
    const permissionsSql = `
      -- Grant schema usage
      grant usage on schema public to postgres, anon, authenticated, service_role;

      -- Grant privileges on existing tables, functions, and sequences
      grant all privileges on all tables in schema public to postgres, anon, authenticated, service_role;
      grant all privileges on all functions in schema public to postgres, anon, authenticated, service_role;
      grant all privileges on all sequences in schema public to postgres, anon, authenticated, service_role;

      -- Set default privileges for future objects
      alter default privileges in schema public grant all on tables to postgres, anon, authenticated, service_role;
      alter default privileges in schema public grant all on functions to postgres, anon, authenticated, service_role;
      alter default privileges in schema public grant all on sequences to postgres, anon, authenticated, service_role;

      -- Create specific policies for user_profiles
      DROP POLICY IF EXISTS "Allow select own profile" ON public.user_profiles;
      CREATE POLICY "Allow select own profile" ON public.user_profiles FOR
      SELECT TO authenticated USING (auth.uid() = user_id);

      DROP POLICY IF EXISTS "Allow insert own profile" ON public.user_profiles;
      CREATE POLICY "Allow insert own profile" ON public.user_profiles FOR
      INSERT TO authenticated WITH CHECK (auth.uid() = user_id);

      DROP POLICY IF EXISTS "Allow update own profile" ON public.user_profiles;
      CREATE POLICY "Allow update own profile" ON public.user_profiles FOR
      UPDATE TO authenticated USING (auth.uid() = user_id);
    `;

    try {
      // Try to execute the SQL directly
      const { error: permError } = await supabase.rpc('exec_sql', { sql: permissionsSql });
      if (permError) {
        console.error('Failed to set permissions with exec_sql RPC:', permError);
      } else {
        console.log('Successfully set permissions!');
      }
    } catch (directPermError) {
      console.error('Error executing permissions SQL directly:', directPermError);
    }

    // Final check
    console.log('\nFinal check - trying to access user_profiles...');
    const { error: finalError } = await supabase
      .from('user_profiles')
      .select('count', { count: 'exact', head: true });

    if (finalError) {
      console.error('Still having issues accessing user_profiles:', finalError);
      
      console.log('\nPlease run the SQL manually:');
      console.log('1. Go to your Supabase dashboard: https://app.supabase.com/');
      console.log('2. Select your project');
      console.log('3. Go to the SQL Editor');
      console.log('4. Create a new query');
      console.log('5. Paste the following SQL:');
      console.log('```');
      console.log(permissionsSql);
      console.log('```');
      console.log('6. Run the query');
      console.log('7. Return to your application and try signing up again');
    } else {
      console.log('Success! You should now be able to use the application.');
    }
  } catch (error) {
    console.error('An error occurred:', error);
  }
}

fixPermissions(); 