import { createContext, useContext, useEffect, useState, useRef } from 'react';
import { User } from '@supabase/supabase-js';
import { supabase, getUserProfile } from '@/lib/supabase';
import { useRouter, usePathname } from 'next/navigation';
import { UserProfile } from '@/types/user';

// For debugging auth context behavior
const DEBUG = true;

type AuthContextType = {
  user: User | null;
  userProfile: UserProfile | null;
  loading: boolean;
  clearRedirectFlag: () => void;
  signOut: () => Promise<void>;
  refreshUserProfile: () => Promise<void>;
};

const AuthContext = createContext<AuthContextType>({ 
  user: null,
  userProfile: null,
  loading: true,
  clearRedirectFlag: () => {},
  signOut: async () => {},
  refreshUserProfile: async () => {}
});

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  const pathname = usePathname();
  const redirectInProgress = useRef(false);
  const lastPathRef = useRef(pathname);

  function clearRedirectFlag() {
    if (DEBUG) console.log('[AuthContext] Clearing redirect flag');
    redirectInProgress.current = false;
  }

  // Load user profile data
  async function refreshUserProfile() {
    if (user) {
      try {
        const profile = await getUserProfile(user.id);
        if (DEBUG) console.log('[AuthContext] User profile loaded:', profile);
        setUserProfile(profile);
      } catch (error) {
        console.error('[AuthContext] Error loading user profile:', error);
      }
    } else {
      setUserProfile(null);
    }
  }

  // Sign out function that handles redirection
  async function signOut() {
    try {
      if (DEBUG) console.log('[AuthContext] Signing out user');
      clearRedirectFlag();
      await supabase.auth.signOut();
      window.location.href = '/auth/signin';
    } catch (error) {
      console.error('[AuthContext] Error signing out:', error);
    }
  }

  // Track navigation and prevent redirects during normal navigation
  useEffect(() => {
    // Update last path when navigation occurs
    lastPathRef.current = pathname;
    
    if (DEBUG) console.log(`[AuthContext] Path changed to: ${pathname}`);
    
    // Navigation within dashboard should clear any redirect flags
    if (pathname?.startsWith('/dashboard')) {
      clearRedirectFlag();
    }
  }, [pathname]);

  // Load user profile when user changes
  useEffect(() => {
    if (user) {
      refreshUserProfile();
    }
  }, [user]);

  useEffect(() => {
    let isMounted = true;
    
    const checkSession = async () => {
      try {
        if (DEBUG) console.log('[AuthContext] Checking initial session');
        const { data: { session } } = await supabase.auth.getSession();
        
        if (!isMounted) return;
        
        if (session) {
          if (DEBUG) console.log('[AuthContext] Initial session found');
          setUser(session.user);
        } else {
          if (DEBUG) console.log('[AuthContext] No initial session found');
          setUser(null);
        }
      } catch (error) {
        console.error('[AuthContext] Error getting initial session:', error);
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    checkSession();

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (!isMounted) return;
      
      if (DEBUG) console.log(`[AuthContext] Auth state change: ${event}`);
      
      // Update user state regardless of redirect logic
      setUser(session?.user ?? null);
      setLoading(false);

      // Don't do any redirects if we're already in the middle of one
      if (redirectInProgress.current) {
        if (DEBUG) console.log('[AuthContext] Redirect already in progress, skipping');
        return;
      }

      // Don't redirect if we're within the same section
      const currentPathIsAuth = pathname?.startsWith('/auth/');
      const currentPathIsDashboard = pathname?.startsWith('/dashboard');

      if (event === 'SIGNED_IN') {
        if (DEBUG) console.log('[AuthContext] User signed in');
        if (currentPathIsAuth) {
          if (DEBUG) console.log('[AuthContext] Redirecting to dashboard after sign in');
          redirectInProgress.current = true;
          // Use direct browser navigation for more reliable redirect
          window.location.href = '/dashboard';
        }
      } else if (event === 'SIGNED_OUT') {
        if (DEBUG) console.log('[AuthContext] User signed out');
        if (currentPathIsDashboard) {
          if (DEBUG) console.log('[AuthContext] Redirecting to signin after sign out');
          redirectInProgress.current = true;
          // Use direct browser navigation for more reliable redirect
          window.location.href = '/auth/signin';
        }
      }
    });

    return () => {
      isMounted = false;
      subscription.unsubscribe();
    };
  }, [router, pathname]);

  return (
    <AuthContext.Provider value={{ 
      user, 
      userProfile,
      loading, 
      clearRedirectFlag, 
      signOut,
      refreshUserProfile
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);