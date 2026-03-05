'use client';

import { useEffect } from 'react';
import { useAuthStore } from '@/lib/auth-context';

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const { checkAuth, isLoading } = useAuthStore();

  useEffect(() => {
    // Check auth on mount
    checkAuth();
  }, []);

  return <>{children}</>;
}
