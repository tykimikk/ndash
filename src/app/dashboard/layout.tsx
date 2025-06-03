'use client';

import ProtectedLayout from '@/components/ProtectedLayout';
import { useEffect } from 'react';

// For debugging
const DEBUG = true;

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  useEffect(() => {
    if (DEBUG) console.log('[DashboardLayout] Mounted');
  }, []);

  return <ProtectedLayout>{children}</ProtectedLayout>;
}