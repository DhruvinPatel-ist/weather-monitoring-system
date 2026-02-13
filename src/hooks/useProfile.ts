import { useMutation, useQueryClient } from "@tanstack/react-query";
import {
  createUser,
  updateUser,
  deleteUser,
  updateUserStatus,
} from "@/services/useUserManagement";
import { UserData } from "@/types/user";
import { toast } from "sonner"; // or your preferred toast library

export function useUserStatusMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      id,
      status,
    }: {
      id: string;
      status: "active" | "inactive";
    }) => updateUserStatus(id, status),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["users"] });
      toast.success("User status updated successfully");
    },
    onError: (error: any) => {
      console.error("Update User Status Error:", error);
      toast.error("Failed to update user status");
    },
  });
}

export function useUserMutations() {
  const queryClient = useQueryClient();

  const create = useMutation({
    mutationFn: (user: UserData) => createUser(user),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["users"] });
      toast.success("User created successfully");
    },
    onError: (error: any) => {
      console.error("Create User Error:", error);
      toast.error("Failed to create user");
    },
  });

  const update = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<UserData> }) =>
      updateUser(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["users"] });
      toast.success("User updated successfully");
    },
    onError: (error: any) => {
      console.error("Update User Error:", error);
      toast.error("Failed to update user");
    },
  });

  const remove = useMutation({
    mutationFn: (id: string) => deleteUser(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["users"] });
      toast.success("User deleted successfully");
    },
    onError: (error: any) => {
      console.error("Delete User Error:", error);
      toast.error("Failed to delete user");
    },
  });

  return { create, update, remove };
}
