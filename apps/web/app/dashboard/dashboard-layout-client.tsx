'use client';

import { useEffect } from 'react';
import { Navbar } from '../../components/dashboard/navbar';

export function DashboardLayoutClient({
  children,
}: {
  children: React.ReactNode;
}) {
  useEffect(() => {
    console.log('[DashboardLayout] Layout mounted, pathname:', window.location.pathname);
  }, []);

  return (
    <>
      <Navbar />
      {children}
    </>
  );
}

