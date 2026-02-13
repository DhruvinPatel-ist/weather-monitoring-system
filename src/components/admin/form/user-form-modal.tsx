"use client";

import { useState, useEffect } from "react";
import bcrypt from "bcryptjs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
// import { PhoneInput } from "@/components/ui/phone-input";
import { UserData } from "@/types/user";
import { useTranslations } from "next-intl";
import { toast } from "sonner";

interface UserFormProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (userData: Partial<UserData> & { id?: string }) => void;
  initialData?: UserData | null;
  mode: "create" | "edit";
}

export function UserFormModal({
  isOpen,
  onClose,
  onSubmit,
  initialData,
  mode,
}: UserFormProps) {
  const t = useTranslations("UserManagement");

  const [userData, setUserData] = useState<UserData>({
    email: "",
    password: "",
    firstname: "",
    lastname: "",
    emirates_id: "",
    uuid: "",
    phone_no: "",
    role: "",
    organization: "",
    status: "active",
  });

  const [showSuccess, setShowSuccess] = useState(false);
  // const [originalPhone, setOriginalPhone] = useState("");

  useEffect(() => {
    if (initialData && mode === "edit") {
      setUserData({
        ...initialData,
        password: "", // password is reset on edit form
        status: initialData.status || "active",
      });
      // setOriginalPhone(initialData.phone_no || "");
    } else {
      setUserData({
        email: "",
        password: "",
        firstname: "",
        lastname: "",
        uuid: "",
        emirates_id: "",
        phone_no: "",
        role: "",
        organization: "",
        status: "active",
      });
      //  setOriginalPhone("");
    }
    setShowSuccess(false);
  }, [initialData, mode, isOpen]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setUserData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSelectChange = (name: keyof UserData, value: string) => {
    setUserData((prev) => ({ ...prev, [name]: value }));
  };
   const handlephoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
   const { name, value } = e.target;
   // Only allow digits
   const digitsOnly = value.replace(/\D/g, "");
   setUserData((prev) => ({ ...prev, [name]: digitsOnly }));
 }

  // const handlePhoneChange = (value: string) => {
  //   setUserData((prev) => ({ ...prev, phone_no: value }));
  // };

  const handleSubmit = async (e: React.FormEvent) => {
    try {
      e.preventDefault();   
      if(userData.password && userData.password.length <8){
        toast.error(t("passwordMinLength"));
        return;
      }
      if (
        !userData.role ||
        !userData.email ||
        !userData.firstname ||
        !userData.lastname
      ) {
        toast.error(t("fillRequiredFields"));
        return;
      }
      let response: any;  
      if (mode === "create") {
        if (!userData.password) {
          toast.error(t("passwordRequired")); // Add this key in your translations
          return;
        }

        const hashedPassword = await bcrypt.hash(userData.password, 10);
       response = await onSubmit({ ...userData, password: hashedPassword });
      } else if (mode === "edit" && initialData?.id) {
        const changedFields: Partial<UserData> = {};

        Object.entries(userData).forEach(([key, value]) => {
          const oldValue = (initialData as any)[key];
          const isOptionalField = [
            "phone_no",
            "uuid",
            "emirates_id",
            "organization",
          ].includes(key);

          if (value !== oldValue) {
            if (isOptionalField && value === "") return; // skip empty optional fields
            (changedFields as any)[key] = value;
          }
        });

        if (Object.keys(changedFields).length === 0) {
          toast.error("No Changes Detected"); // Optional: handle no changes
          return;
        }
        response = await onSubmit({ id: initialData.id, ...changedFields});
      }
      if (response?.error) {
          toast.error(response.error);
          return; // stop execution, don’t show success
        }
      setShowSuccess(true);
    } catch (err) {
      console.error("Form submission error:", err);
      toast.error(
        t("somethingWentWrong") || "An error occurred. Please try again."
      );
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      {showSuccess ? (
        <DialogContent className="sm:max-w-[500px] flex flex-col items-center justify-center py-10">
          <div className="mb-4">
            <div className="h-20 w-20 rounded-full bg-[#009fac] flex items-center justify-center">
              <svg
                width="40"
                height="40"
                viewBox="0 0 24 24"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  d="M20 6L9 17L4 12"
                  stroke="white"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </div>
          </div>
          <h2 className="text-2xl font-semibold text-center">
            {mode === "create"
              ? t("userCreatedSuccess")
              : t("userUpdatedSuccess")}
          </h2>
        </DialogContent>
      ) : (
        <DialogContent className="sm:max-w-[500px] max-h-[500px] p-4">
          <DialogHeader className="border-b-2">
            <DialogTitle className="text-xl font-semibold">
              {mode === "create" ? t("createUser") : t("editUser")}
            </DialogTitle>
          </DialogHeader>

          <form
            id="user-form"
            onSubmit={handleSubmit}
            className="space-y-4 max-h-[350px] overflow-auto border-b py-2"
            autoComplete="off"
          >
            <div className="grid grid-cols-1 gap-4">
              <div className="space-y-2">
                <Label htmlFor="firstname">{t("firstName")} *</Label>
                <Input
                  id="firstname"
                  name="firstname"
                  value={userData.firstname}
                  onChange={handleChange}
                  placeholder={t("enterFirstName")}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="lastname">{t("lastName")} *</Label>
                <Input
                  id="lastname"
                  name="lastname"
                  value={userData.lastname}
                  onChange={handleChange}
                  placeholder={t("enterLastName")}
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="email">{t("email")} *</Label>
              <Input
                id="email"
                name="email"
                type="email"
                value={userData.email}
                onChange={handleChange}
                placeholder="email@example.com"
                required
              />
            </div>

            
              <div className="space-y-2">
                <Label htmlFor="password">{t("password")} {mode === "create" ? "*" : ""}</Label>
                <Input
                  id="password"
                  name="password"
                  type="password"
                  value={userData.password}
                  onChange={handleChange}
                  placeholder={t("enterPassword")}
                  required ={mode === "create"}
                />
              </div>
            
            <div className="space-y-2">
              <Label htmlFor="uuid">{t("uuidOptional")}</Label>
              <Input
                id="uuid"
                name="uuid"
                value={userData.uuid}
                onChange={handleChange}
                placeholder="784-YYYY-XXXXXXX-X"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="emirates_id">{t("emiratesIdOptional")}</Label>
              <Input
                id="emirates_id"
                name="emirates_id"
                value={userData.emirates_id}
                onChange={handleChange}
                placeholder="784-YYYY-XXXXXXX-X"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="phone_no">{t("phoneNumberOptional")}</Label>
              <Input
                id="phone_no"
                name="phone_no"
                value={userData.phone_no}
                type='tel'
                onChange={handlephoneChange}
                placeholder="(countryCode) Phone Number"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="role">{t("userType")} *</Label>
              <Select
                value={userData.role}
                onValueChange={(value) => handleSelectChange("role", value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder={t("selectUserType")} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="admin">{t("admin")}</SelectItem>
                  <SelectItem value="viewer">{t("viewer")}</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="organization">{t("organizationOptional")}</Label>
              <Input
                id="organization"
                name="organization"
                value={userData.organization}
                onChange={handleChange}
                placeholder={t("enterOrganization")}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="status">{t("status")} *</Label>
              <Select
                value={userData.status}
                onValueChange={(value) => handleSelectChange("status", value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder={t("selectStatus")} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="active">{t("active")}</SelectItem>
                  <SelectItem value="inactive">{t("inactive")}</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </form>

          <div className="flex justify-end mt-4">
            <Button
              type="submit"
              form="user-form"
              className="bg-[#009fac] hover:bg-[#008a96] text-white"
            >
              {mode === "create" ? t("addUser") : t("saveChanges")}
            </Button>
          </div>
        </DialogContent>
      )}
    </Dialog>
  );
}
