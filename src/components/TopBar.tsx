'use client';

import { useTheme } from '@/contexts/ThemeContext';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import { useEffect, useState, useRef } from 'react';
import { Bell } from 'lucide-react';

export function TopBar() {
  const { theme, toggleTheme } = useTheme();
  const { user, userProfile, signOut } = useAuth();
  const router = useRouter();
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  
  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setDropdownOpen(false);
      }
    }
    
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);
  
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

  // Get the first letter of the user's name for the avatar
  const getInitials = () => {
    if (!userProfile?.name) return 'U';
    
    // Get initials from first and last name
    const nameParts = userProfile.name.split(' ');
    if (nameParts.length > 1) {
      return (nameParts[0][0] + nameParts[nameParts.length - 1][0]).toUpperCase();
    }
    
    // If only one name, return the first letter
    return userProfile.name.charAt(0).toUpperCase();
  };

  const handleSignOut = async () => {
    setDropdownOpen(false);
    await signOut();
  };

  const navigateToProfile = () => {
    setDropdownOpen(false);
    router.push('/dashboard/profile');
  };

  return (
    <div className={`fixed top-0 right-0 ${isMobile ? 'left-0' : sidebarCollapsed ? 'left-16' : 'left-64'} h-16 px-8 flex items-center justify-end transition-all duration-300 bg-background text-foreground`}>
      
      <div className="flex items-center space-x-4">
        {/* Dark Mode Toggle */}
        <button 
          onClick={toggleTheme}
          className="p-2 rounded-md hover:bg-muted text-muted-foreground"
          aria-label="Toggle dark mode"
        >
          {theme === 'dark' ? (
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
            </svg>
          ) : (
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 9.003 0 008.354-5.646z" />
            </svg>
          )}
        </button>
        
        {/* Notifications Icon */}
        <button 
          className="p-2 relative rounded-md hover:bg-muted text-muted-foreground"
          aria-label="Notifications"
        >
          <Bell size={20} />
          <span className="absolute top-1 right-1 w-2 h-2 bg-error rounded-full"></span>
        </button>
        
        {/* User Dropdown */}
        {user && (
          <div className="relative" ref={dropdownRef}>
            <button 
              onClick={() => setDropdownOpen(!dropdownOpen)}
              className="flex items-center p-1.5 rounded-full hover:bg-muted" 
              aria-label="User menu"
            >
              <div 
                className="w-10 h-10 rounded-full flex items-center justify-center font-semibold text-primary-foreground bg-primary"
                style={{ boxShadow: '0 0 0 2px var(--background), 0 0 0 4px var(--ring)' }}
              >
                {getInitials()}
              </div>
            </button>
            
            {/* Dropdown menu */}
            {dropdownOpen && (
              <div className="absolute right-0 mt-2 w-56 rounded-xl shadow-lg overflow-hidden z-50 bg-card text-card-foreground border border-border">
                <div className="py-1">
                  {userProfile && (
                    <div className="px-4 py-3 border-b border-border">
                      <p className="text-sm font-medium">{userProfile.name}</p>
                      <p className="text-xs text-muted-foreground">{user.email}</p>
                    </div>
                  )}
                  <button
                    onClick={navigateToProfile}
                    className="block w-full text-left px-4 py-2.5 text-sm hover:bg-muted"
                  >
                    My Profile
                  </button>
                  <button
                    onClick={handleSignOut}
                    className="block w-full text-left px-4 py-2.5 text-sm hover:bg-muted text-error"
                  >
                    Sign out
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
        
        {!user && (
          <button
            onClick={() => router.push('/auth/signin')}
            className="px-4 py-2 text-sm font-medium rounded-md hover:bg-muted text-foreground"
          >
            Sign in
          </button>
        )}
      </div>
    </div>
  );
}