import { useSession, signIn, signOut } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import useChat from "@/hooks/useChat";

export function useAuth(requireAuth = false, redirectTo = "/") {
  const { data: session, status } = useSession();
  const router = useRouter();

  const isAuthenticated = !!session?.accessToken;
  const isLoading = status === "loading";

  useEffect(() => {
    // Only redirect after the loading state is complete
    if (!isLoading) {
      if (requireAuth && !isAuthenticated) {
        router.push(redirectTo);
      }
    }
  }, [isAuthenticated, isLoading, requireAuth, redirectTo, router]);

  // Import useChat for session management
  const { clearUserSession, resetChat } = useChat();

  const login = async (credentials: {
    email: string;
    password: string;
    rememberMe?: boolean;
  }) => {
    // Clear any previous session/chat data before login
    clearUserSession();
    resetChat();
    // Return the signIn promise so you can await it
    return signIn("credentials", {
      ...credentials,
      redirect: false, // Important: handle redirects programmatically
    }).then((result) => {
      if (result?.ok) {
        router.push("/dashboard"); // Single programmatic redirect
      }
      return result;
    });
  };

  const logout = async () => {
    return signOut({
      redirect: false, // Important: handle redirects programmatically
    }).then(() => {
      router.push("/"); // Single programmatic redirect
    });
  };

  return {
    session,
    isAuthenticated,
    isLoading,
    login,
    logout,
  };
}
