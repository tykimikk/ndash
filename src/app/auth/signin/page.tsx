'use client';

import { FormEvent, useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { Button } from '@/components/Button';
import { useAuth } from '@/contexts/AuthContext';
import { Loader } from '@/components/Loader';

// ANTI-LOOP FLAG
const REDIRECT_KEY = 'ndash_redirect_in_progress';

export default function SignInPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [redirecting, setRedirecting] = useState(false);
  const [checkingSession, setCheckingSession] = useState(true);
  const [debugInfo, setDebugInfo] = useState<string | null>(null);
  
  const { clearRedirectFlag } = useAuth();
  
  // Clear existing flags on component mount
  useEffect(() => {
    // Check if we're in a redirect loop and break it
    const redirectAttempted = localStorage.getItem(REDIRECT_KEY);
    const currentTime = Date.now();
    const redirectTime = parseInt(redirectAttempted || '0', 10);
    
    // If a redirect was attempted in the last 3 seconds, break the loop
    if (redirectTime && (currentTime - redirectTime < 3000)) {
      console.log('Breaking potential redirect loop');
      localStorage.removeItem(REDIRECT_KEY);
      setCheckingSession(false);
      return;
    }
    
    // Check session normally
    async function checkSession() {
      try {
        const { data } = await supabase.auth.getSession();
        if (data.session) {
          // Set redirect flag before attempting redirect
          localStorage.setItem(REDIRECT_KEY, currentTime.toString());
          
          // Use most direct approach possible
          setRedirecting(true);
          setDebugInfo('Session found. Redirecting to dashboard now...');
          
          // Use simple browser navigation
          window.location.href = '/dashboard';
        }
      } catch (error) {
        console.error('Error checking session:', error);
      } finally {
        // Always mark checking as done, even if there was an error
        setCheckingSession(false);
      }
    }
    
    checkSession();
    clearRedirectFlag();
  }, [clearRedirectFlag]);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (loading || redirecting || checkingSession) return;
    
    setLoading(true);
    setError(null);
    setDebugInfo('Signing in...');

    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) throw error;
      
      if (data?.session) {
        // Set redirect flag in localStorage with timestamp
        localStorage.setItem(REDIRECT_KEY, Date.now().toString());
        
        setRedirecting(true);
        setDebugInfo('Login successful! Redirecting...');
        
        // Most simple, direct approach
        window.location.href = '/dashboard';
      } else {
        setError("Login succeeded but no session was created");
        setLoading(false);
      }
    } catch (error) {
      setError(error instanceof Error ? error.message : 'An error occurred');
      setRedirecting(false);
      setLoading(false);
    }
  }

  if (checkingSession) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <Loader size="lg" />
          <p className="mt-4 text-gray-700">Checking authentication...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
            Sign in to your account
          </h2>
        </div>
        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          {error && (
            <div className="rounded-md bg-red-50 p-4">
              <div className="text-sm text-red-700">{error}</div>
            </div>
          )}
          {redirecting && (
            <div className="rounded-md bg-blue-50 p-4">
              <div className="text-sm text-blue-700">Login successful! Redirecting to dashboard...</div>
            </div>
          )}
          {debugInfo && (
            <div className="rounded-md bg-gray-50 p-4">
              <pre className="text-xs text-gray-700 whitespace-pre-wrap">{debugInfo}</pre>
            </div>
          )}
          <div className="rounded-md shadow-sm -space-y-px">
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
                className="appearance-none rounded-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-t-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 focus:z-10 sm:text-sm"
                placeholder="Email address"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                disabled={loading || redirecting}
              />
            </div>
            <div>
              <label htmlFor="password" className="sr-only">
                Password
              </label>
              <input
                id="password"
                name="password"
                type="password"
                autoComplete="current-password"
                required
                className="appearance-none rounded-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-b-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 focus:z-10 sm:text-sm"
                placeholder="Password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                disabled={loading || redirecting}
              />
            </div>
          </div>

          <div>
            <Button
              type="submit"
              className="group relative w-full flex justify-center"
              disabled={loading || redirecting || checkingSession}
            >
              {redirecting ? 'Redirecting...' : loading ? 'Signing in...' : 'Sign in'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}