"use client";

import { useEffect, useCallback } from "react";
import { signOut } from "next-auth/react";

/**
 * Hook to handle authentication errors
 * Automatically logs out the user when an unauthorized error is detected
 * Does not use router to avoid intl context issues
 */
export const useAuthErrorHandler = () => {
  const handleUnauthorizedError = useCallback(async () => {
    console.log("Unauthorized error detected. Logging out...");

    try {
      // Clear local storage and session storage
      localStorage.clear();
      sessionStorage.clear();

      // Clear any custom cookies (you can add more specific ones if needed)
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
      // This will handle the redirect to the login page automatically
      await signOut({
        redirect: true,
        callbackUrl: "/",
      });
    } catch (error) {
      console.error("Error during automatic logout:", error);
      // Fallback - force reload to root which will redirect according to middleware
      window.location.href = "/";
    }
  }, []);

  useEffect(() => {
    // Add event listener for unauthorized errors
    window.addEventListener("unauthorizedError", handleUnauthorizedError);

    // Clean up event listener on unmount
    return () => {
      window.removeEventListener("unauthorizedError", handleUnauthorizedError);
    };
  }, [handleUnauthorizedError]);

  return {
    handleUnauthorizedError,
  };
};

export default useAuthErrorHandler;
