'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { MouseEvent, useState, useEffect } from 'react';
import { ChevronLeft, ChevronRight, Home, UserPlus } from 'lucide-react';

export function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const { user, clearRedirectFlag } = useAuth();
  const [collapsed, setCollapsed] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  // Store collapsed state in localStorage
  useEffect(() => {
    const savedState = localStorage.getItem('sidebar_collapsed');
    if (savedState) {
      setCollapsed(savedState === 'true');
    }
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

  // Update localStorage when state changes
  useEffect(() => {
    localStorage.setItem('sidebar_collapsed', collapsed.toString());
    // Dispatch an event so other components can react to sidebar state change
    window.dispatchEvent(new Event('sidebar_state_changed'));
  }, [collapsed]);

  if (!user || isMobile) return null;
  
  // Handle navigation without triggering auth redirects
  const handleNavigation = (e: MouseEvent<HTMLAnchorElement>, path: string) => {
    e.preventDefault();
    clearRedirectFlag(); // Prevent any redirect checks during navigation
    router.push(path);
  };

  const toggleSidebar = () => {
    setCollapsed(!collapsed);
  };

  return (
    <div 
      className={`fixed top-0 left-0 bottom-0 ${collapsed ? 'w-16' : 'w-64'} bg-slate-50 dark:bg-slate-900 border-r border-slate-200 dark:border-slate-800 text-slate-900 dark:text-slate-100 shadow-md transition-all duration-300 z-20`}
    >
      <div className="h-16 flex items-center px-3 justify-between transition-colors duration-300 border-b border-slate-200 dark:border-slate-800">
        {!collapsed && (
          <Link 
            href="/dashboard" 
            onClick={(e) => handleNavigation(e, "/dashboard")}
            className="text-xl font-bold text-primary transition-colors duration-300"
          >
            NDash
          </Link>
        )}
        <button 
          onClick={toggleSidebar}
          className="p-2 rounded-md hover:bg-slate-200 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-400 transition-colors duration-300 ml-auto"
          aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
        >
          {collapsed ? <ChevronRight size={18} /> : <ChevronLeft size={18} />}
        </button>
      </div>
      
      <nav className="p-2 space-y-2">
        <Link
          href="/dashboard"
          onClick={(e) => handleNavigation(e, "/dashboard")}
          className={`flex items-center px-4 py-2 rounded-md transition-colors duration-300 ${
            pathname === '/dashboard' 
              ? 'bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400' 
              : 'text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800/60'
          }`}
          title="Dashboard"
        >
          <Home size={18} />
          {!collapsed && <span className="ml-3">Dashboard</span>}
        </Link>
        <Link
          href="/dashboard/patients/new"
          onClick={(e) => handleNavigation(e, "/dashboard/patients/new")}
          className={`flex items-center px-4 py-2 rounded-md transition-colors duration-300 ${
            pathname === '/dashboard/patients/new' 
              ? 'bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400' 
              : 'text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800/60'
          }`}
          title="New Patient"
        >
          <UserPlus size={18} />
          {!collapsed && <span className="ml-3">New Patient</span>}
        </Link>
      </nav>
    </div>
  );
}