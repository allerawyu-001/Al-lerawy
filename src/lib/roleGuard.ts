// src/lib/roleGuard.ts
import { redirect } from "@tanstack/react-router";
import { type AuthContext } from "@/hooks/use-auth"; // optional import for typing

/**
 * Route guard that ensures the authenticated user has one of the required roles.
 * Usage in a route definition:
 *   beforeLoad: requireRoles(["admin", "super_admin"])
 */
export function requireRoles(requiredRoles: string[]) {
  return async ({ context }: { context: AuthContext }) => {
    const role = context.auth?.role as string | undefined;
    if (!role || !requiredRoles.includes(role)) {
      // Redirect to a generic access‑denied page
      throw redirect({ to: "/access-denied" });
    }
  };
}
