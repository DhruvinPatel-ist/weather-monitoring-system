"use client";

import { useEffect } from "react";
import { signOut } from "next-auth/react";
import { useRouter } from "@/i18n/navigation";

/**
 * Component to handle authentication errors globally
 * Listens for unauthorized error events and triggers logout
 */
export function AuthErrorHandler() {
  const router = useRouter();

  useEffect(() => {
    const handleUnauthorizedError = async () => {
      console.log("Unauthorized error detected. Logging out...");

      try {
        // Clear all local storage and session storage
        localStorage.clear();
        sessionStorage.clear();

        // Use NextAuth signOut to properly clear session
        await signOut({
          redirect: true,
          callbackUrl: "/",
        });
      } catch (error) {
        console.error("Error during automatic logout:", error);
        // Fallback - force redirect to login
        router.push("/");
      }
    };

    // Add event listener for unauthorized errors
    window.addEventListener("unauthorizedError", handleUnauthorizedError);

    // Clean up event listener
    return () => {
      window.removeEventListener("unauthorizedError", handleUnauthorizedError);
    };
  }, [router]);

  // This component doesn't render anything
  return null;
}

export default AuthErrorHandler;
