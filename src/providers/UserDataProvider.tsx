"use client";

import { ReactNode, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useUserInfo } from "@/hooks/useDashboard";

interface UserDataProviderProps {
  children: ReactNode;
}

export function UserDataProvider({ children }: UserDataProviderProps) {
  const { status } = useSession();
  const { refetch } = useUserInfo(); // this refetch triggers Zustand sync inside the hook

  useEffect(() => {
    if (status === "authenticated") {
      refetch(); // Force fetch once after login
    }
  }, [status, refetch]);

  return <>{children}</>;
}
