'use client';

import { useEffect, useState } from 'react';
import { Sidebar } from './Sidebar';
import { TopBar } from './TopBar';
import { supabase } from '@/lib/supabase';
import { Loader } from './Loader';

// Emergency anti-loop flag key
const PROTECTED_REDIRECT_KEY = 'protected_redirect_attempted';

export default function ProtectedLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [isLoading, setIsLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  
  // Listen for sidebar state changes
  useEffect(() => {
    // Initialize from localStorage
    const savedState = localStorage.getItem('sidebar_collapsed');
    if (savedState) {
      setSidebarCollapsed(savedState === 'true');
    }

    // Listen for changes
    const handleSidebarChange = () => {
      const currentState = localStorage.getItem('sidebar_collapsed') === 'true';
      setSidebarCollapsed(currentState);
    };

    window.addEventListener('sidebar_state_changed', handleSidebarChange);
    return () => {
      window.removeEventListener('sidebar_state_changed', handleSidebarChange);
    };
  }, []);

  // Check for mobile viewport
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    
    // Initial check
    checkMobile();
    
    // Add event listener
    window.addEventListener('resize', checkMobile);
    
    // Cleanup
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  useEffect(() => {
    // Check for potential redirect loop
    const redirectAttempted = localStorage.getItem(PROTECTED_REDIRECT_KEY);
    const currentTime = Date.now();
    const redirectTime = parseInt(redirectAttempted || '0', 10);
    
    // If a redirect was attempted recently, break the loop
    if (redirectTime && (currentTime - redirectTime < 3000)) {
      console.log('Breaking potential redirect loop in protected layout');
      localStorage.removeItem(PROTECTED_REDIRECT_KEY);
      setIsLoading(false);
      return;
    }
    
    async function checkAuth() {
      try {
        // Get session directly
        const { data } = await supabase.auth.getSession();
        
        if (!data.session) {
          console.log('No session found in protected layout');
          // Set flag to prevent loop
          localStorage.setItem(PROTECTED_REDIRECT_KEY, currentTime.toString());
          // Redirect to login
          window.location.href = '/auth/signin';
        } else {
          console.log('User is authenticated in protected layout');
          setIsAuthenticated(true);
        }
      } catch (error) {
        console.error('Error checking auth in protected layout:', error);
        window.location.href = '/auth/signin';
      } finally {
        setIsLoading(false);
      }
    }

    checkAuth();
  }, []);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <Loader size="lg" />
          <p className="mt-4 text-gray-700">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <p className="text-gray-700">Not authenticated. Redirecting...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Sidebar />
      <TopBar />
      <main 
        className={`${isMobile ? 'pl-0' : sidebarCollapsed ? 'pl-16' : 'pl-64'} pt-16 min-h-[calc(100vh-4rem)] bg-background transition-all duration-300`}
      >
        {children}
      </main>
    </div>
  );
}