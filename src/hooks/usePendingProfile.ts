import { useMutation, useQueryClient } from "@tanstack/react-query";
import {
  createPendingUser,
//   updatePendingUser,
  deletePendingUser,
} from "@/services/usePendingUserManagement";
import { UserData } from "@/types/user";
import { toast } from "sonner"; // or your preferred toast library


export function useUserMutations() {
  const queryClient = useQueryClient();

  const create = useMutation({
    mutationFn: (user: UserData) => createPendingUser(user),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["users"] });
      toast.success("User created successfully");
    },
    onError: (error: any) => {
      console.error("Create User Error:", error);
      toast.error("Failed to create user");
    },
  });

  const remove = useMutation({
    mutationFn: (id: string) => deletePendingUser(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["pendingusers"] });
      toast.success("Pending User Status updated successfully");
    },
    onError: (error: any) => {
      console.error("Delete User Error:", error);
      toast.error("Failed to Update Pending  user");
    },
  });

  return { create,  remove };
}
