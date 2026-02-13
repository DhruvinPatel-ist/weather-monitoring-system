import { useQuery } from "@tanstack/react-query";
import { UserResponse, UserData } from "@/types/user";
import api from "@/app/api/api";
import { getSession } from "next-auth/react";

const roleMap: Record<number, string> = {
  1: "admin",
  2: "viewer",
  3: "editor",
};

const mapRoleToId = (role: string): number => {
  switch (role) {
    case "admin":
      return 1;
    case "viewer":
      return 2;
    default:
      return 2; // default to viewer
  }
};

// const parsePhoneNumber = (phone: string, defaultCountryCode = "971") => {
//   if (!phone) return { countryCode: defaultCountryCode, phoneNumber: "" };

//   const cleanPhone = phone.trim();

//   if (cleanPhone.includes("-")) {
//     const [cc, rest] = cleanPhone.split("-");
//     return { countryCode: cc.startsWith("+") ? cc.slice(1) : cc, phoneNumber: rest };
//   }

//   if (cleanPhone.startsWith("+")) {
//     const cc = cleanPhone.match(/^\+(\d{1,3})/)?.[1] || defaultCountryCode;
//     const rest = cleanPhone.slice(cc.length + 1); // skip +cc
//     return { countryCode: cc, phoneNumber: rest };
//   }

//   return { countryCode: defaultCountryCode, phoneNumber: cleanPhone };
// };

// const formatPhoneNumber = (phone: string | number, defaultCountryCode = "971") => {
//   const { countryCode, phoneNumber } = parsePhoneNumber(phone.toString(), defaultCountryCode);
//   return `+${countryCode}-${phoneNumber}`;
// };

const formatDate = (dateString: string) => {
  const date = new Date(dateString);
  return date.toISOString().split("T")[0];
};

export const getPendingUsers = async (): Promise<UserData[]> => {
  const session = await getSession();
  if (!session?.accessToken) {
    throw new Error("No access token available");
  }

  const response = await api.get<UserResponse[]>("/pendingusers", {
    headers: {
      Authorization: `Bearer ${session.accessToken}`,
    },
  });

  return response.data.map((user) => ({
    id: user.id?.toString() ?? "",
    firstname: user.firstname ?? "-",
    lastname: user.lastname ?? "",
    email: user.email ?? "-",
    password: "",
    emirates_id: user.emirates_id ?? "-",
    uuid: user.uuid ?? "-",
    phone_no:String(user.phone_no) ?? 0,
    role: roleMap[user.role_id] || "unknown",
    organization: user.organization ?? "-",
    status: (user.status?.toLowerCase() ?? "inactive") as "active" | "inactive",
    createdAt: formatDate(user.created_at ?? new Date().toISOString()),
  }));
};
export function usePendingUsers() {
  return useQuery({
    queryKey: ["pendingusers"],
    queryFn: getPendingUsers,
  });
}

export const createPendingUser = async (userData: UserData) => {
  const session = await getSession();
  if (!session?.accessToken) throw new Error("No access token");

  const phoneDigitsOnly = userData.phone_no.replace(/\D/g, "");
  const payload = {
    email: userData.email.trim(),
    password: userData.password.trim(),
    firstname: userData.firstname.trim(),
    lastname: userData.lastname.trim(),
    emirates_id: userData.emirates_id.trim(),
    uuid: userData.uuid.trim(),
    phone_no: String(phoneDigitsOnly),
    role_id: mapRoleToId(userData.role),
    organization: userData.organization.trim(),
    status: "active",
  };

  return api.post("/users", payload, {
    headers: {
      Authorization: `Bearer ${session.accessToken}`,
    },
  });
};


export const deletePendingUser = async (id: string) => {
  const session = await getSession();
  if (!session?.accessToken) {
    throw new Error("No access token available");
  }
  return api.delete(`/pendingusers/${id}`, {
    headers: {
      Authorization: `Bearer ${session.accessToken}`,
    },
  });
};


