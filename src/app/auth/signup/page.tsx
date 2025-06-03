'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { Button } from '@/components/Button';
import { UserOccupation } from '@/types/user';
import { useRouter } from 'next/navigation';

export default function SignUp() {
  const router = useRouter();
  const [fullName, setFullName] = useState('');
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [occupation, setOccupation] = useState<UserOccupation>('doctor');
  const [isLoading, setIsLoading] = useState(false);
  const [setupNeeded, setSetupNeeded] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function checkProfileTable() {
      try {
        // Try a simple query to check if table exists and accessible
        const { error } = await supabase.from('user_profiles').select('id').limit(1);
        
        if (error) {
          console.error("Error checking user_profiles table:", error);
          
          // Set setupNeeded if the table doesn't exist or permission issues
          if (error.message.includes('does not exist') || 
              error.message.includes('permission denied')) {
            setSetupNeeded(true);
          }
        }
      } catch (err) {
        console.error('Error checking user_profiles table:', err);
        setSetupNeeded(true);
      }
    }
    
    checkProfileTable();
  }, []);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    try {
      // Check if any required field is empty
      if (!fullName.trim() || !email.trim() || !password.trim() || !username.trim()) {
        throw new Error('Please fill in all fields');
      }
      
      // Check if database setup is needed first
      const setupResponse = await fetch('/api/setup-db');
      if (!setupResponse.ok) {
        console.error('Database setup API error:', await setupResponse.text());
        setSetupNeeded(true);
        throw new Error('Database setup required. Please run the SQL script in your Supabase dashboard.');
      }
      
      // First check if user exists
      try {
        const { data: existingUsers, error: existingError } = await supabase
          .from('user_profiles')
          .select('*')
          .eq('email', email)
          .or(`username.eq.${username}`);
        
        if (existingError) {
          if (existingError.message.includes('does not exist') || 
              existingError.message.includes('permission denied')) {
            setSetupNeeded(true);
            throw new Error('Database setup required. Please set up your database first.');
          }
          console.error('Error checking for existing user:', existingError);
        } else if (existingUsers && existingUsers.length > 0) {
          throw new Error('User with this email or username already exists');
        }
      } catch (checkError) {
        if (checkError instanceof Error && checkError.message.includes('Database setup required')) {
          throw checkError; // Re-throw setup errors
        }
        // Otherwise continue with sign up
      }

      // Sign up with Supabase Auth
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            name: fullName,
            username,
            occupation,
          },
        },
      });

      if (authError) throw authError;
      if (!authData.user) throw new Error('No user returned from sign up');

      // Create user profile only if database is set up
      if (!setupNeeded) {
        try {
          const { error: profileError } = await supabase.from('user_profiles').insert({
            user_id: authData.user.id,
            name: fullName,
            username,
            email,
            occupation,
          });

          if (profileError) {
            console.error('Error creating profile:', profileError);
            // Continue anyway since auth account was created
          }
        } catch (profileError) {
          console.error('Exception creating profile:', profileError);
          // Continue anyway since auth account was created
        }
      }

      // Redirect to success page or login
      router.push('/auth/signin?message=Account created successfully! Please verify your email and sign in.');
    } catch (error: Error | unknown) {
      setError(error instanceof Error ? error.message : 'An unknown error occurred');
      setIsLoading(false);
    }
  };

  if (setupNeeded) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-md w-full space-y-8 bg-white p-8 rounded-lg shadow-md">
          <div>
            <h2 className="text-center text-3xl font-extrabold text-gray-900">
              Database Setup Required
            </h2>
            <p className="mt-2 text-center text-sm text-gray-600">
              The database needs to be set up before you can register.
            </p>
          </div>
          <div className="space-y-4">
            <div className="bg-yellow-50 p-4 rounded-md">
              <p className="text-sm text-yellow-700">
                You need to run the SQL script in your Supabase SQL Editor to create the user_profiles table.
              </p>
            </div>
            <Button
              type="button"
              onClick={() => window.location.href = '/api/setup-db'}
              className="group relative w-full flex justify-center"
            >
              Get SQL Script
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
            Create your account
          </h2>
        </div>
        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          {error && (
            <div className="rounded-md bg-red-50 p-4">
              <div className="text-sm text-red-700">{error}</div>
            </div>
          )}
          <div className="rounded-md shadow-sm -space-y-px">
            <div>
              <label htmlFor="name" className="sr-only">
                Full Name
              </label>
              <input
                id="name"
                name="name"
                type="text"
                required
                className="appearance-none rounded-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-t-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 focus:z-10 sm:text-sm"
                placeholder="Full Name"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
              />
            </div>
            <div>
              <label htmlFor="username" className="sr-only">
                Username
              </label>
              <input
                id="username"
                name="username"
                type="text"
                required
                className="appearance-none rounded-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 focus:z-10 sm:text-sm"
                placeholder="Username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
              />
            </div>
            <div>
              <label htmlFor="email-address" className="sr-only">
                Email address
              </label>
              <input
                id="email-address"
                name="email"
                type="email"
                autoComplete="email"
                required
                className="appearance-none rounded-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 focus:z-10 sm:text-sm"
                placeholder="Email address"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
            <div>
              <label htmlFor="occupation" className="sr-only">
                Occupation
              </label>
              <select
                id="occupation"
                name="occupation"
                required
                className="appearance-none rounded-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 focus:z-10 sm:text-sm"
                value={occupation}
                onChange={(e) => setOccupation(e.target.value as UserOccupation)}
              >
                <option value="" disabled>Select your occupation</option>
                <option value="doctor">Doctor</option>
                <option value="nurse">Nurse</option>
                <option value="admin">Admin</option>
              </select>
            </div>
            <div>
              <label htmlFor="password" className="sr-only">
                Password
              </label>
              <input
                id="password"
                name="password"
                type="password"
                autoComplete="new-password"
                required
                className="appearance-none rounded-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-b-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 focus:z-10 sm:text-sm"
                placeholder="Password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>
          </div>

          <div>
            <Button
              type="submit"
              className="group relative w-full flex justify-center"
              disabled={isLoading}
            >
              {isLoading ? 'Creating account...' : 'Sign up'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}