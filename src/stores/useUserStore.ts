import { create } from "zustand";
import { persist } from "zustand/middleware";
import { UserInfo } from "@/types/user";

interface UserState {
  userInfo: UserInfo | null;
  setUserInfo: (info: UserInfo) => void;
  resetUser: () => void; // Add this function
}

export const useUserStore = create<UserState>()(
  persist(
    (set) => ({
      userInfo: null,
      setUserInfo: (info) => set({ userInfo: info }),
      resetUser: () => set({ userInfo: null }), // Implement the function
    }),
    {
      name: "user-storage",
    }
  )
);
