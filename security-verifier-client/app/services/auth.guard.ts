// app/services/auth.guard.ts

"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { getUser, isAuthenticated } from "./token.service";

// Re-export AuthUser type for consistency across the app
export type { AuthUser } from "./token.service";

interface GuardOptions {
  role?: "ADMIN" | "SECURITY" | "SUPERVISOR" | string;
  roles?: string[];
  allowedRoles?: string[];
}

export const useAuthGuard = (options?: GuardOptions) => {
  const router = useRouter();
  const [authorized, setAuthorized] = useState(false);

  const checkAuth = useCallback(() => {
    const authenticated = isAuthenticated();

    // 🔒 1. If not authenticated → redirect to login
    if (!authenticated) {
      setAuthorized(false);
      router.replace("/login");
      return;
    }

    // 🔐 2. If role-based access is required
    const allowedRoles: string[] = [];
    const rolesList = options?.allowedRoles || options?.roles;
    if (rolesList && rolesList.length > 0) {
      allowedRoles.push(...rolesList.map(r => r.toUpperCase()));
    } else if (options?.role) {
      allowedRoles.push(options.role.toUpperCase());
    }

    if (allowedRoles.length > 0) {
      const user = getUser();
      const userRole = user?.role?.toUpperCase();

      // If user data missing or role mismatch → redirect to login
      if (!user || !userRole || !allowedRoles.includes(userRole)) {
        setAuthorized(false);
        router.replace("/login");
        return;
      }
    }

    setAuthorized(true);
  }, [router, options?.role, options?.roles]);

  useEffect(() => {
    checkAuth();
  }, [checkAuth]);

  return { authorized };
};
