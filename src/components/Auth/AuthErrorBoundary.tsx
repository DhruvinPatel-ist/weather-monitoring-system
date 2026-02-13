"use client";

import { ReactNode, useEffect } from "react";
import { signOut } from "next-auth/react";
import { useRouter } from "@/i18n/navigation";
import { useUserStore } from "@/stores/useUserStore";

interface AuthErrorBoundaryProps {
  children: ReactNode;
}

/**
 * Component that wraps the app to handle authentication errors globally
 * Now uses the next-intl router since it's within the proper context
 */
export function AuthErrorBoundary({ children }: AuthErrorBoundaryProps) {
  const router = useRouter();
  const resetUser = useUserStore.getState().resetUser;

  useEffect(() => {
    const handleUnauthorizedError = async () => {
      console.log("Unauthorized error detected. Logging out...");

      try {
        // ✅ Clear Zustand state
        resetUser();

        // Clear local storage and session storage
        localStorage.clear();
        sessionStorage.clear();

        // Clear auth cookies
        const cookiesToClear = [
          "next-auth.session-token",
          "next-auth.csrf-token",
          "next-auth.callback-url",
          "__Secure-next-auth.session-token",
          "__Host-next-auth.csrf-token",
        ];

        cookiesToClear.forEach((cookieName) => {
          document.cookie = `${cookieName}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;`;
          document.cookie = `${cookieName}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/; domain=localhost;`;
          document.cookie = `${cookieName}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/; domain=.localhost;`;
        });

        // Use NextAuth signOut to properly clear session
        await signOut({
          redirect: false, // We'll handle redirection with the next-intl router
        });

        // Use next-intl router for proper localized navigation
        router.push("/");
      } catch (error) {
        console.error("Error during automatic logout:", error);
        // Fallback - force reload to login
        window.location.href = "/";
      }
    };

    // Add event listener for unauthorized errors
    window.addEventListener("unauthorizedError", handleUnauthorizedError);

    // Clean up event listener on unmount
    return () => {
      window.removeEventListener("unauthorizedError", handleUnauthorizedError);
    };
  }, [router, resetUser]);

  // Simply render children - the event listener handles the auth error logic
  return <>{children}</>;
}

export default AuthErrorBoundary;
