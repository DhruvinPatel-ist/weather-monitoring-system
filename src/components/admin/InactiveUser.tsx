
"use client";

import {  useEffect, useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import Image from "next/image";
import { usePendingUsers } from "@/services/usePendingUserManagement";
import { useUserMutations } from "@/hooks/usePendingProfile";
import { UserData } from "@/types/user";
// import { useDeviceDetection } from "@/hooks/useDeviceDetection";
import {
  ConfirmDeleteModal,
  SuccessDialog,
} from "@/components/admin/models/ConfirmDeleteModal";
import { useTranslations } from "next-intl";
import PaginationControls from "@/hooks/shared/PaginationControls";
import { toast } from "sonner";
import { ArrowUp, ArrowDown } from "lucide-react";


interface UserManagementPageProps {
  page: number;
  perPage: number;
  onPageChange?: (newPage: number) => void;
  setTotalItems?: (n: number) => void; // <-- Add this
}

export default function UserInactiveTable({
  page,
  perPage,
  onPageChange,
  setTotalItems, // <-- Add this
}: UserManagementPageProps) {
  const t = useTranslations("UserManagement");
  // const isMobileOrTablet = useDeviceDetection();
  const { data: users = [], isLoading, isError } = usePendingUsers();
  const {  create,remove } = useUserMutations();
  // const updateStatus = useUserStatusMutation();

 
  const [selectedRows, setSelectedRows] = useState<string[]>([]);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [deleteUserId, setDeleteUserId] = useState<string | null>(null);
  const [isSuccessModalOpen, setIsSuccessModalOpen] = useState(false);

  const [currentPage, setCurrentPage] = useState(page);
  const [createdSortDirection, setCreatedSortDirection] = useState<
    "asc" | "desc"
  >("desc");

  useEffect(() => {
    setCurrentPage(page);
  }, [page]);

  useEffect(() => {
    if (setTotalItems) setTotalItems(users.length);
  }, [users, setTotalItems]);

  const startIndex = (currentPage - 1) * perPage;
  const sortedUsers = useMemo(() => {
    const copy = [...users];
    copy.sort((a, b) => {
      const aTime = a.createdAt ? new Date(a.createdAt).getTime() : 0;
      const bTime = b.createdAt ? new Date(b.createdAt).getTime() : 0;
      return createdSortDirection === "desc" ? bTime - aTime : aTime - bTime;
    });
    return copy;
  }, [users, createdSortDirection]);

  const paginatedUsers = sortedUsers.slice(startIndex, startIndex + perPage);

  const toggleCreatedSort = () => {
    setCreatedSortDirection((prev) => (prev === "desc" ? "asc" : "desc"));
  };

  const handleOpenModal = (mode: "create" | "edit", user?: UserData) => {
    
    handleSubmit(user || {});
    handleApproveUser(user?.id || "");
  };
  
  

  const handleSubmit = async (
    userData: Partial<UserData> & { id?: string }
  ) => {
   
      await create.mutateAsync(userData as UserData);
      toast.success("User created successfully");
    
  };

  const handleDeleteUser = async () => {
    if (!deleteUserId) {
    alert("No user selected for deletion");
      return
    };

    try {
      await remove.mutateAsync(deleteUserId);
      setIsDeleteModalOpen(false);
      setDeleteUserId(null);
      setIsSuccessModalOpen(true);
    } catch (error) {
      console.error("Error deleting user:", error);
      toast.error("Failed to delete user. Please try again.");
    }
  };
 const handleApproveUser = async (approvedUserId: string) => {
    if (!approvedUserId) {
    alert("No user selected for deletion");
      return
    };

    try {
      await remove.mutateAsync(approvedUserId);
      // setIsDeleteModalOpen(false);
      // setDeleteUserId(null);
      // setIsSuccessModalOpen(true);
    } catch (error) {
      console.error("Error deleting user:", error);
      // toast.error("Failed to delete user. Please try again.");
    }
  };
  useEffect(() => {
    if (isSuccessModalOpen) {
      const timer = setTimeout(() => setIsSuccessModalOpen(false), 2000);
      return () => clearTimeout(timer);
    }
  }, [isSuccessModalOpen]);

  const handleSelectRow = (id: string) => {
    setSelectedRows((prev) =>
      prev.includes(id) ? prev.filter((row) => row !== id) : [...prev, id]
    );
  };

  

  return (
    <div className="w-full">
      <div className="flex items-center justify-between mt-4 mb-4">
        <h1 className="text-lg font-semibold text-[#252c32]">{t("title")}</h1>
        {/* <Button
          variant="default"
          className="gap-2 bg-[#009fac] hover:bg-[#008a96]"
          onClick={() => handleOpenModal("create")}
        >
          + {t("newUser")}
        </Button> */}
      </div>

      <div
        className="border rounded-md overflow-hidden"
        dir={typeof document !== "undefined" ? document.dir : "ltr"}
      >
        <div className="w-full overflow-x-auto max-h-[calc(100vh-370px)] min-h-[280px]">
          <table className="min-w-[900px] w-full text-sm text-left rtl:text-right">
            <thead className="sticky top-0 bg-white shadow-sm text-gray-700 text-xs md:text-sm font-semibold">
              <tr className="border-b border-gray-200">
                <th className="px-3 md:px-4 py-3">
                  <Checkbox
                    checked={
                      selectedRows.length === paginatedUsers.length &&
                      paginatedUsers.length > 0
                    }
                    onCheckedChange={() => {
                      if (selectedRows.length === paginatedUsers.length) {
                        setSelectedRows([]);
                      } else {
                        setSelectedRows(paginatedUsers.map((row) => row.id!));
                      }
                    }}
                  />
                </th>
                <th className="px-3 md:px-4 py-3 text-center">
                  {t("username")}
                </th>
                <th className="px-3 md:px-4 py-3 text-center">{t("email")}</th>
                <th className="px-3 md:px-4 py-3 text-center">
                  {t("organization")}
                </th>
                <th className="px-3 md:px-4 py-3 text-center">{t("role")}</th>
                <th
                  className="px-3 md:px-4 py-3 text-center cursor-pointer select-none"
                  onClick={toggleCreatedSort}
                >
                  <div className="flex items-center justify-center gap-1">
                    <span>{t("createdDate")}</span>
                    <span className="flex flex-col">
                      <ArrowUp
                        className={`h-3 w-3 -mb-0.5 ${
                          createdSortDirection === "asc"
                            ? "text-blue3 opacity-100"
                            : "text-gray-400 opacity-40"
                        }`}
                      />
                      <ArrowDown
                        className={`h-3 w-3 -mt-0.5 ${
                          createdSortDirection === "desc"
                            ? "text-blue3 opacity-100"
                            : "text-gray-400 opacity-40"
                        }`}
                      />
                    </span>
                  </div>
                </th>
                {/* <th className="px-3 md:px-4 py-3 text-center">{t("status")}</th> */}
                <th className="px-3 md:px-4 py-3 text-center">
                  {t("actions")}
                </th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                [...Array(5)].map((_, i) => (
                  <tr key={i} className="border-b border-gray-100">
                    {Array(8)
                      .fill(null)
                      .map((_, idx) => (
                        <td key={idx} className="px-3 md:px-4 py-3">
                          <div className="h-4 bg-gray-200 rounded w-full animate-pulse" />
                        </td>
                      ))}
                  </tr>
                ))
              ) : isError ? (
                <tr>
                  <td colSpan={8} className="text-center text-red-500 py-4">
                    {t("loadFailed")}
                  </td>
                </tr>
              ) : paginatedUsers.length === 0 ? (
                <tr>
                  <td colSpan={8} className="text-center text-gray-500 py-4">
                    {t("noUsers")}
                  </td>
                </tr>
              ) : (
                paginatedUsers.map((user) => (
                  <tr key={user.id} className="border-b hover:bg-gray-50">
                    <td className="px-3 md:px-4 py-3">
                      <Checkbox
                        checked={selectedRows.includes(user.id!)}
                        onCheckedChange={() => handleSelectRow(user.id!)}
                      />
                    </td>
                    <td className="px-3 md:px-4 py-3 font-medium text-center">
                      {`${user.firstname ?? "-"}_${
                        user.lastname ?? ""
                      }`.toLowerCase()}
                    </td>
                    <td className="px-3 md:px-4 py-3 text-center">
                      {user.email ?? "-"}
                    </td>
                    <td className="px-3 md:px-4 py-3 text-center">
                      {user.organization ?? "-"}
                    </td>
                    <td className="px-3 md:px-4 py-3 capitalize text-center">
                      {user.role ?? "-"}
                    </td>
                    <td className="px-3 md:px-4 py-3 text-center">
                      {user.createdAt ?? "-"}
                    </td>
                    
                    <td className="px-3 md:px-4 py-3 text-center">
                      <div className="flex justify-center gap-2">
                        <Button
                          onClick={() => {
                            setDeleteUserId(user.id!);
                            handleOpenModal("edit", user)
                            
                          }}
                          variant="ghost"
                          className="hover:bg-transparent"
                        >
                          <Image
                            src="/Setting/approve.svg"
                            alt="edit"
                            width={18}
                            height={18}
                          />
                        </Button>
                        <Button
                          onClick={() => {
                            setDeleteUserId(user.id!);
                            setIsDeleteModalOpen(true);
                          }}
                          variant="ghost"
                          className="hover:bg-transparent"
                        >
                          <Image
                            src="/Setting/cross.svg"
                            alt="delete"
                            width={20}
                            height={20}
                          />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
      <ConfirmDeleteModal
        isOpen={isDeleteModalOpen}
        onConfirm={handleDeleteUser}
        onCancel={() => {
          setIsDeleteModalOpen(false);
          setDeleteUserId(null);
        }}
        title={t("rejectUser")}
        description={t("rejectUserConfirmation")}
        confirmLabel={t("rejectUser")}
      />

       <SuccessDialog
        isOpen={isSuccessModalOpen}
        onClose={() => setIsSuccessModalOpen(false)}
        title={t("userRejectedTitle")}
        message={t("userRejectedMessage")}
      />
      {!isLoading && users.length > 0 && (
        <PaginationControls
          currentPage={page}
          totalItems={users.length}
          itemsPerPage={perPage}
          onPageChange={(newPage) => {
            if (onPageChange) onPageChange(newPage);
          }}
        />
      )}
    </div>
  );
}
