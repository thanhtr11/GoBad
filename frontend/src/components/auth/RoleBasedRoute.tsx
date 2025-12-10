import React from 'react';
import { useAuth } from '../../context/AuthContext';

export type UserRole = 'ADMIN' | 'MEMBER' | 'GUEST';

interface RoleBasedRouteProps {
  children: React.ReactNode;
  requiredRoles?: UserRole[];
  fallback?: React.ReactNode;
}

/**
 * Component that conditionally renders based on user role
 */
export function RoleBasedRoute({
  children,
  requiredRoles = ['ADMIN', 'MEMBER'],
  fallback = <AccessDenied />,
}: RoleBasedRouteProps) {
  const { user } = useAuth();

  if (!user) {
    return fallback;
  }

  const userRole = (user.role || 'MEMBER') as UserRole;

  if (!requiredRoles.includes(userRole)) {
    return fallback;
  }

  return <>{children}</>;
}

/**
 * Component that shows/hides UI elements based on role
 */
interface RoleBasedRenderProps {
  children: React.ReactNode;
  roles: UserRole[];
}

export function RoleBasedRender({ children, roles }: RoleBasedRenderProps) {
  const { user } = useAuth();

  if (!user) return null;

  const userRole = (user.role || 'MEMBER') as UserRole;

  if (!roles.includes(userRole)) {
    return null;
  }

  return <>{children}</>;
}

/**
 * Component for admin-only content
 */
interface AdminOnlyProps {
  children: React.ReactNode;
}

export function AdminOnly({ children }: AdminOnlyProps) {
  return (
    <RoleBasedRender roles={['ADMIN']}>
      {children}
    </RoleBasedRender>
  );
}

/**
 * Component for member-only content
 */
interface MemberOnlyProps {
  children: React.ReactNode;
}

export function MemberOnly({ children }: MemberOnlyProps) {
  return (
    <RoleBasedRender roles={['ADMIN', 'MEMBER']}>
      {children}
    </RoleBasedRender>
  );
}

/**
 * Access denied fallback component
 */
function AccessDenied() {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-50">
      <div className="text-center">
        <h1 className="text-4xl font-bold text-gray-900">Access Denied</h1>
        <p className="mt-4 text-gray-600">You do not have permission to access this resource.</p>
        <p className="mt-2 text-sm text-gray-500">
          Please contact an administrator if you believe this is a mistake.
        </p>
      </div>
    </div>
  );
}
