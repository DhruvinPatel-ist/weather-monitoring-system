"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import api from "@/app/api/api";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { UserData } from "@/types/user";
import { useTranslations } from "next-intl";
import { toast } from "sonner";

interface SignupFormProps {
  isOpen: boolean;
  onClose: () => void;
  setIsSuccessModalOpen:(isOpen: boolean)=>void;
}

export function SignupFormModal({
  isOpen,
  onClose,
  setIsSuccessModalOpen
  
}: SignupFormProps) {
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
//   const [originalPhone, setOriginalPhone] = useState("");
 const onSubmit = async (
    userData: Partial<UserData> & { id?: string }
  ) => {
    console.log("Submitting user data:", userData);
     const payload = {
    email: (userData.email?.trim() ?? ""),
    password: (userData.password?.trim() ?? ""),
    firstname: (userData.firstname?.trim() ?? ""),
    lastname: (userData.lastname?.trim() ?? ""),
    emirates_id: (userData.emirates_id?.trim() ?? ""),
    // uuid: userData.uuid.trim(),
     phone_no: (userData.phone_no?.trim() ?? ""),
  };

  api.post("/pendingusers", payload ).then(() => {
    setIsSuccessModalOpen(true)
      toast.success("User created successfully");

  });
    onClose();
  };
  useEffect(() => {
    
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
        status: "inactive",
      });
    //    setOriginalPhone("");
    
    setShowSuccess(false);
  }, [ isOpen]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setUserData((prev) => ({ ...prev, [name]: value }));
  };

 const handlephoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
   const { name, value } = e.target;
   // Only allow digits
   const digitsOnly = value.replace(/\D/g, "");
   setUserData((prev) => ({ ...prev, [name]: digitsOnly }));
 }

  const handleSubmit = async (e: React.FormEvent) => {
    try {
      e.preventDefault();

      if (
        !userData.email ||
        !userData.firstname ||
        !userData.lastname ||
        !userData.phone_no
      ) {
        toast.error(t("fillRequiredFields"));
        return;
      }
      // let response: any;  
        
      const response:any = await onSubmit({ ...userData});
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
    <>
      {isOpen && (
        <div
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            width: "100vw",
            height: "100vh",
            zIndex: 40,
            backdropFilter: "blur(8px)",
            background: "rgba(0,0,0,0.2)",
            transition: "backdrop-filter 0.3s",
          }}
        />
      )}
      <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
        {showSuccess ? (
          <DialogContent className="sm:max-w-[750px] w-full flex flex-col items-center justify-center py-10" onInteractOutside={(e) => e.preventDefault()}>
            <div className="mb-4">
              <div className="h-20 w-20 rounded-full bg-[#009fac] flex items-center justify-center" >
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
              {t("userCreatedSuccess")}
            </h2>
          </DialogContent>
        ) : (
          <DialogContent className="sm:max-w-[700px] w-full max-h-[700px] p-4" onInteractOutside={(e) => e.preventDefault()}>
            <DialogHeader className="border-b-2">
              <DialogTitle className="text-xl font-semibold">
                {t("RegistrationForm")}
              </DialogTitle>
            </DialogHeader>

            <form
              id="user-form"
              onSubmit={handleSubmit}
              className="space-y-4 max-h-[500px] overflow-auto border-b py-2"
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
                <Label htmlFor="phone_no">{t("phoneNumber")} {"*"}</Label>
                <Input
                  id="phone_no"
                  name="phone_no"
                  type="tel"
                  value={userData.phone_no}
                  onChange={handlephoneChange}
                  placeholder={t("enterPhoneNumber")}
                  required={true}
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

            </form>

            <div className="flex justify-end mt-4">
              <Button
                type="submit"
                form="user-form"
                className="bg-[#009fac] hover:bg-[#008a96] text-white"
              >
                {t("register")}
              </Button>
            </div>
          </DialogContent>
        )}
      </Dialog>
    </>
  );
}
