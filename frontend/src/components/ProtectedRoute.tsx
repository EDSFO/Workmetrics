'use client';

import { useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useAuthStore, UserRole } from '@/lib/auth-context';

interface ProtectedRouteProps {
  children: React.ReactNode;
  allowedRoles?: UserRole[]; // AIDEV-NOTE: Optional array of allowed roles
}

export function ProtectedRoute({ children, allowedRoles }: ProtectedRouteProps) {
  const router = useRouter();
  const pathname = usePathname();
  const { user, token, isLoading, hasRole } = useAuthStore();

  useEffect(() => {
    // Skip check if still loading or on public pages
    if (isLoading) return;

    const publicPaths = ['/login', '/register'];
    const isPublicPath = publicPaths.includes(pathname);

    if (!token && !isPublicPath) {
      router.push('/login');
    } else if (token && isPublicPath) {
      router.push('/');
    }
  }, [token, isLoading, pathname, router]);

  // AIDEV-NOTE: Check role-based access
  useEffect(() => {
    if (isLoading || !token) return;

    // If allowedRoles is specified, check user role
    if (allowedRoles && allowedRoles.length > 0) {
      if (!hasRole(allowedRoles)) {
        // Redirect to home if user doesn't have required role
        router.push('/');
      }
    }
  }, [user, isLoading, token, allowedRoles, hasRole, router]);

  // Don't render anything while checking auth
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  // If on a public page and logged in, let them see it
  const publicPaths = ['/login', '/register'];
  if (publicPaths.includes(pathname)) {
    return <>{children}</>;
  }

  // If not logged in and trying to access protected route, show nothing (redirect will happen)
  if (!token) {
    return null;
  }

  // AIDEV-NOTE: Check if user has required role
  if (allowedRoles && allowedRoles.length > 0) {
    if (!hasRole(allowedRoles)) {
      return (
        <div className="min-h-screen flex items-center justify-center">
          <div className="text-center">
            <h1 className="text-2xl font-bold text-gray-800 mb-2">Access Denied</h1>
            <p className="text-gray-600">You do not have permission to view this page.</p>
          </div>
        </div>
      );
    }
  }

  return <>{children}</>;
}
