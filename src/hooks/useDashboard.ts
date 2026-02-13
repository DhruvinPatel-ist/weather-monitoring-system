import { useQuery } from "@tanstack/react-query";
import { AccountService, UserService } from "@/services/userService";
import { Station } from "@/components/Dashboard/view/parameter-view";
import { UserInfo } from "@/types/user";
import { useSession } from "next-auth/react";
import jwt from "jsonwebtoken";
import { useUserStore } from "@/stores/useUserStore";
import { useEffect } from "react";

// Interface for decoded JWT token
interface DecodedToken {
  id: string;
  username: string;
}

// 🔵 Fetch all stations
async function fetchStations(): Promise<Station[]> {
  const rawStations = await AccountService.getStations();

  const mappedStations: Station[] = rawStations.map((station: any) => ({
    id: station.id,
    name: station.title,
    longitude: station.longitude,
    latitude: station.latitude,
    status: station.status, // default online
    lastUpdated: station.updated_at,
    ftp_status: station.ftp_status,
    onSelectStation: () => {}, // Add empty function as default
  }));

  return mappedStations;
}
// 🟠 Hook to fetch stations
export function useStations() {
  return useQuery<Station[]>({
    queryKey: ["stations"],
    queryFn: fetchStations,
    staleTime: 5 * 60 * 1000, // 5 mins
  });
}

export function useUserInfoHeader() {
  const { data: session, status } = useSession();
  const { setUserInfo, userInfo: storeUserInfo } = useUserStore();

  const decoded = session?.accessToken
    ? (jwt.decode(session.accessToken) as DecodedToken | null)
    : null;

  const userId = decoded?.id;

  const query = useQuery<UserInfo>({
    queryKey: ["userInfo", userId],
    queryFn: async () => {
      if (!userId) throw new Error("User ID missing");
      const info = await UserService.getUserInfo(userId);
      return info;
    },
    enabled: status === "authenticated" && !!userId,
    staleTime: 0, // Always stale so it fetches immediately
    refetchOnMount: false,
    refetchOnWindowFocus: false,
    refetchOnReconnect: false,
    retry: 3,
  });

  // ✅ Trigger refetch when login just succeeds
  useEffect(() => {
    if (
      status === "authenticated" &&
      !!userId &&
      !query.data &&
      !query.isFetching
    ) {
      query.refetch();
    }
  }, [status, userId, query]);

  useEffect(() => {
    if (query.data && !query.isLoading) {
      setUserInfo(query.data);
    }
  }, [query.data, query.isLoading, setUserInfo]);

  return {
    ...query,
    userInfo: query.data || storeUserInfo,
  };
}

export function useUserInfo(userId?: string) {
  const { setUserInfo, userInfo: storeUserInfo } = useUserStore();

  const query = useQuery<UserInfo>({
    queryKey: ["userInfo", userId],
    queryFn: async () => {
      if (!userId) throw new Error("User ID missing");
      const info = await UserService.getUserInfo(userId);
      return info;
    },
    enabled: !!userId, // Only run if userId is provided
    staleTime: 0,
    refetchOnMount: false,
    refetchOnWindowFocus: false,
    refetchOnReconnect: false,
    retry: 1,
  });

  useEffect(() => {
    if (!!userId && !query.data && !query.isFetching) {
      query.refetch();
    }
  }, [userId, query]);

  useEffect(() => {
    if (query.data && !query.isLoading) {
      setUserInfo(query.data);
    }
  }, [query.data, query.isLoading, setUserInfo]);

  return {
    ...query,
    userInfo: query.data || storeUserInfo,
  };
}
