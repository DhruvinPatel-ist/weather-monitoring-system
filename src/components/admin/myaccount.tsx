"use client";

import { useEffect, useRef, useState } from "react";
import { Avatar, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { PasswordChangeModal } from "@/components/password-change-modal";
import { PasswordSuccessModal } from "@/components/password-success-modal";
import { useUserInfo } from "@/hooks/useDashboard";
import { UserService } from "@/services/userService";
import Image from "next/image";
import { useTranslations } from "next-intl";
import useControl from "@/hooks/useControl";
import { useLocale } from "next-intl";
import { toast } from "sonner";

interface MyAccountProps {
  onUserInfoUpdate: (
    firstName: string,
    email: string,
    profileImage: any
  ) => void;
}

const MyAccount = ({ onUserInfoUpdate }: MyAccountProps) => {
  const t = useTranslations("MyAccount");
  const locale = useLocale();
  const isRTL = locale === "ar";
  const { userId } = useControl();

  const [profileImage, setProfileImage] = useState<string | null>(null);
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [edited, setEdited] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const { data: userInfo, refetch } = useUserInfo(userId);

  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [organization, setOrganization] = useState("");
  const [emirateId, setEmirateId] = useState("");
const [imageError, setImageError] = useState<string | null>(null);

  useEffect(() => {
    if (userInfo) {
      setFirstName(userInfo.firstname || "");
      setLastName(userInfo.lastname || "");
      setEmail(userInfo.email || "");
      setPhone(userInfo.phone_no?.toString() || "");
      setOrganization(userInfo.organization || "");
      setEmirateId(userInfo.emirates_id || "");
      onUserInfoUpdate(
        userInfo.firstname || "User",
        userInfo.email || "user@example.com",
        userInfo.profile_picture || "/assets/header/profile.svg"
      );
    }
  }, [userInfo, onUserInfoUpdate]);

  const handleImageChange = (event: React.ChangeEvent<HTMLInputElement>) => {
  const file = event.target.files?.[0];
  if (file) {
    const maxSizeInBytes = 1 * 1024 * 1024; ; // 1 MB

    if (file.size > maxSizeInBytes) {
      setImageError(t("imageSizeError")); 
      return;
    }

    const reader = new FileReader();
    reader.onloadend = () => {
      setProfileImage(reader.result as string);
      setEdited(true);
      setImageError(null); // clear error
    };
    reader.readAsDataURL(file);
  }
};

  const handleUpdateChanges = async () => {
    if (!userInfo) return;

    const updatedData: Record<string, any> = {};

    if (firstName !== userInfo.firstname) updatedData.firstname = firstName;
    if (lastName !== userInfo.lastname) updatedData.lastname = lastName;
    if (email !== userInfo.email) updatedData.email = email;
    if (phone !== userInfo.phone_no?.toString())
      updatedData.phone_no = phone.trim();
    if (organization !== userInfo.organization)
      updatedData.organization = organization;
    if (emirateId !== userInfo.emirates_id) updatedData.emirates_id = emirateId;

    if (profileImage) {
      const base64Data = profileImage.replace(
        /^data:image\/[a-zA-Z]+;base64,/,
        ""
      );
      updatedData.profile_picture = base64Data;
    }

    if (Object.keys(updatedData).length === 0) return;

    try {
      setIsLoading(true);
      await UserService.updateUserInfo(
        userInfo.id?.toString() || "",
        updatedData
      );
      toast.success(t("updateSuccess"));
      setEdited(false);
      await refetch();
    } catch (error) {
      console.error("Error updating user info:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleInputChange =
    (setter: React.Dispatch<React.SetStateAction<string>>) =>
    (e: React.ChangeEvent<HTMLInputElement>) => {
      setter(e.target.value);
      setEdited(true);
    };

  const handleImageUploadClick = () => {
    fileInputRef.current?.click();
  };

  const handlePasswordSuccess = () => {
    setShowPasswordModal(false);
    setShowSuccessModal(true);
  };

  return (
    <div className="flex flex-col gap-4 overflow-y-auto max-h-[calc(100vh-240px)] w-full px-4 sm:px-6 md:px-8 lg:px-10 py-4 rounded-lg bg-white">
      <h2 className="text-xl font-semibold text-gray3">{t("myAccount")}</h2>

      {/* Profile Section */}
      <div className="flex flex-row items-center gap-4">
        <Avatar className="h-15 w-15 border-2 border-gray-100">
          <AvatarImage
            src={
              profileImage
                ? profileImage.startsWith("data:image/")
                  ? profileImage
                  : `data:image/jpeg;base64,${profileImage}`
                : userInfo?.profile_picture?.startsWith("data:image/")
                ? userInfo.profile_picture
                : userInfo?.profile_picture
                ? `data:image/jpeg;base64,${userInfo.profile_picture}`
                : "/assets/header/profile.svg"
            }
            alt="Admin"
          />
        </Avatar>
        <div className="relative">
          <Input
            type="file"
            ref={fileInputRef}
            onChange={handleImageChange}
            accept="image/*"
            className="hidden"
          />
          <Button
            variant="ghost"
            className={`absolute top-0 ${
              isRTL ? "left-0" : "right-0"
            } text-white rounded-full p-2 w-10 h-10 hover:bg-transparent`}
            onClick={handleImageUploadClick}
          >
            <Image
              src="/Setting/Layer2.svg"
              alt="Upload"
              width="20"
              height="20"
            />
          </Button>
        </div>
        <Button
          className="bg-blue3 hover:bg-blue2 text-white"
          onClick={() => setShowPasswordModal(true)}
        >
          {t("changePassword")}
        </Button>
      </div>

      {/* Form Section */}
      <div className="space-y-2">
 {imageError && <p className="text-red-500 text-sm">{imageError}</p>}
        </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-4 max-w-3xl">
        <div className="space-y-2">
          <Label htmlFor="firstName">{t("firstName")}</Label>
          <Input
            id="firstName"
            value={firstName}
            onChange={handleInputChange(setFirstName)}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="lastName">{t("lastName")}</Label>
          <Input
            id="lastName"
            value={lastName}
            onChange={handleInputChange(setLastName)}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="email">{t("email")}</Label>
          <Input
            id="email"
            value={email}
            onChange={handleInputChange(setEmail)}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="phone">{t("phoneNumber")}</Label>
          <Input
            id="phone"
            value={phone}
             maxLength={14}
             type="tel"
            onChange={handleInputChange(setPhone)}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="organization">{t("organization")}</Label>
          <Input
            id="organization"
            value={organization}
            onChange={handleInputChange(setOrganization)}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="emirateId">{t("emirateId")}</Label>
          <Input
            id="emirateId"
            value={emirateId}
            onChange={handleInputChange(setEmirateId)}
          />
        </div>
      </div>

      {/* Update Changes Button */}
      <Button
        className="mt-8 bg-blue3 hover:bg-blue3 text-white w-50"
        disabled={!edited || isLoading}
        onClick={handleUpdateChanges}
      >
        {isLoading ? t("updating") : t("updateChanges")}
      </Button>

      {/* Modals */}
      <PasswordChangeModal
        isOpen={showPasswordModal}
        onClose={() => setShowPasswordModal(false)}
        onSuccess={handlePasswordSuccess}
      />
      <PasswordSuccessModal
        isOpen={showSuccessModal}
        onClose={() => setShowSuccessModal(false)}
      />
    </div>
  );
};

export default MyAccount;
