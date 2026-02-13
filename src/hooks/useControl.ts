"use client";

import { useEffect, useState, useRef } from "react";
import { getSession } from "next-auth/react";
import { jwtDecode } from "jwt-decode";

interface DecodedToken {
  id: string;
  role_id: number;
  iat: number;
  exp: number;
}

export default function useControl() {
  const [isAdmin, setIsAdmin] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const lastTokenRef = useRef<string | null>(null);
  const [userId, setUserId] = useState("");

  useEffect(() => {
    let active = true;

    const checkSession = async () => {
      try {
        const session = await getSession();
        if (!active) return;

        const accessToken = session?.accessToken as string | undefined;

        // Only decode if token is new
        if (accessToken && accessToken !== lastTokenRef.current) {
          lastTokenRef.current = accessToken;
          const decoded = jwtDecode<DecodedToken>(accessToken);
          setUserId(decoded.id);
          setIsAdmin(decoded.role_id === 1);
        }

        // No token or unchanged token
        if (!accessToken) {
          setIsAdmin(false);
          setUserId("");
        }
      } catch (error) {
        console.error("Failed to decode JWT", error);
        setIsAdmin(false);
        setUserId("");
      } finally {
        if (active) setIsLoading(false);
      }
    };

    checkSession();

    return () => {
      active = false;
      lastTokenRef.current = null;
    };
  }, []);

  return { isAdmin, userId, isLoading };
}
