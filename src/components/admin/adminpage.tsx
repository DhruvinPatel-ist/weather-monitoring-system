// app/admin/AdminPage.tsx
"use client";

import { useState } from "react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import MyAccount from "./myaccount";
import UserTable from "./usertable";
 import UserInactiveTable from "./InactiveUser";
import ThresholdManagement from "@/components/admin/threshold";
// import FTPConfiguration from "./ftppage";
import UserActivity from "./userActivity";
import { IconMyaccount } from "@/icons/admin/IconMyaccount";
import { IconUser } from "@/icons/admin/IconUser";
 import {IconActiveUser} from "@/icons/admin/IconActiveUser";
import { IconThreshold } from "@/icons/admin/IconThreshold";
// import { IconFtp } from "@/icons/admin/IconFtp";
import useControl from "@/hooks/useControl";
import { useDeviceDetection } from "@/hooks/useDeviceDetection";
import { X } from "lucide-react";
import { useRouter } from "@/i18n/navigation";
import { useTranslations } from "next-intl";
import { IconUserActivity } from "@/icons/admin/IconUserActivity";
import { IconSiteConfiguration } from "@/icons/admin/IconSiteConfiguration";
import { IconEmailConfiguration } from "@/icons/admin/IconEmailConfiguration";
import { IconTemplate } from "@/icons/admin/IconTemplate";
import SiteConfiguration from "./site-configuration-list";
import EmailConfiguration from "./email-configuration-list";
import TemplateList from "./TemplateList";

export default function AdminPage() {
  const { isAdmin, isLoading } = useControl();
  const isMobileOrTablet = useDeviceDetection();
  const router = useRouter();
  const t = useTranslations();

  const [firstName, setFirstName] = useState("");
  const [email, setEmail] = useState("");
  const [profileImage, setProfileImage] = useState("");

  const [activeTab, setActiveTab] = useState("my-account");
  const [userManagementPage, setUserManagementPage] = useState(1);
  const [thresholdManagementPage, setThresholdManagementPage] = useState(1);
  // const [ftpConfigPage, setFtpConfigPage] = useState(1);
  const [userActivityPage, setUserActivityPage] = useState(1);
  const itemsPerPage = 10;
  const [siteConfigurationPage, setSiteConfigurationPage] = useState(1);
  const [emailConfigurationPage, setEmailConfigurationPage] = useState(1);
  const [templatePage, setTemplatePage] = useState(1);

  const [userManagementTotal, setUserManagementTotal] = useState(0);
  const [thresholdManagementTotal, setThresholdManagementTotal] = useState(0);
  // const [ftpConfigTotal, setFtpConfigTotal] = useState(0);
  const [userActivityTotal, setUserActivityTotal] = useState(0);
  const [siteConfigurationTotal, setSiteConfigurationTotal] = useState(0);
  const [emailConfigurationTotal, setEmailConfigurationTotal] = useState(0);
  const [templateTotal, setTemplateTotal] = useState(0);

  // const getCurrentPage = () => {
  //   switch (activeTab) {
  //     case "user-management":
  //       return userManagementPage;
  //     case "threshold-management":
  //       return thresholdManagementPage;
  //     case "ftp-configuration":
  //       return ftpConfigPage;
  //     default:
  //       return 1;
  //   }
  // };

  const getTotalItems = () => {
    switch (activeTab) {
      case "user-management":
        return userManagementTotal;
      case "threshold-management":
        return thresholdManagementTotal;
      // case "ftp-configuration":
      //   return ftpConfigTotal;
      case "User-Activity-Log":
        return userActivityTotal;
      case "Site Configuration":
        return siteConfigurationTotal;
      case "Email Configuration":
        return emailConfigurationTotal;
      case "Template":
        return templateTotal;
      default:
        return 0;
    }
  };

  // const shouldShowPagination = isAdmin && activeTab !== "my-account";

  const handlePageChange = (newPage: number) => {
    if (newPage < 1 || newPage > Math.ceil(getTotalItems() / itemsPerPage))
      return;

    switch (activeTab) {
      case "user-management":
        setUserManagementPage(newPage);
        break;
      case "threshold-management":
        setThresholdManagementPage(newPage);
        break;
      // case "ftp-configuration":
      //   setFtpConfigPage(newPage);
      //   break;
      case "email-configuration":
        setEmailConfigurationPage(newPage);
        break;
      case "User-Activity-Log":
        setUserActivityPage(newPage); // <-- FIXED
        break;
      case "Site Configuration":
        setSiteConfigurationPage(newPage);
        break;
      case "Template":
        setTemplatePage(newPage);
        break;
    }
  };

  if (isLoading) {
    return (
      <div className="w-full h-full p-3 md:p-6 bg-white1 rounded-lg">
        <div className="flex items-center gap-4 mb-4">
          <div className="h-14 w-14 rounded-full bg-gray-300 animate-pulse" />
          <div className="flex flex-col gap-2">
            <div className="h-4 w-32 bg-gray-300 rounded animate-pulse" />
            <div className="h-3 w-20 bg-gray-200 rounded animate-pulse" />
          </div>
        </div>
        <div className="flex gap-2 mb-4">
          {Array(4)
            .fill(null)
            .map((_, idx) => (
              <div
                key={idx}
                className="h-8 w-28 rounded-md bg-gray-200 animate-pulse"
              />
            ))}
        </div>
        <div className="h-64 bg-gray-100 rounded-md animate-pulse" />
      </div>
    );
  }

  function SetProfile(image: string) {
    setProfileImage(image);
  }

  // function getTotalPages(): number {
  //   switch (activeTab) {
  //     case "user-management":
  //       return Math.ceil(userManagementTotal / itemsPerPage);
  //     case "threshold-management":
  //       return Math.ceil(thresholdManagementTotal / itemsPerPage);
  //     case "ftp-configuration":
  //       return Math.ceil(ftpConfigTotal / itemsPerPage);
  //     default:
  //       return 1;
  //   }
  // }

  return (
    <div className="w-full h-full p-2 md:p-4 bg-white1 rounded-lg">
      <div className="flex items-center gap-4 mb-4">
        <Avatar className="h-12 w-12 md:h-14 md:w-14 border-2 border-gray-100">
          <AvatarImage
            src={
              profileImage
                ? profileImage.startsWith("data:image/")
                  ? profileImage
                  : `data:image/jpeg;base64,${profileImage}`
                : "/assets/header/profile.svg"
            }
            alt={t("Admin.profileImageAlt")}
          />
          <AvatarFallback></AvatarFallback>
        </Avatar>
        <div>
          <h1 className="text-lg md:text-xl font-semibold">{firstName}</h1>
          <p className="text-xs md:text-sm text-gray-500">{email}</p>
        </div>
        <div className="flex justify-end rtl:left-2 ltr:right-2 w-full">
          <button
            className="p-2 text-gray-500 hover:text-red-500"
            onClick={() => router.push("/dashboard")}
            aria-label={t("Common.close")}
          >
            <X size={20} />
          </button>
        </div>
      </div>

      {isAdmin && (
        <div className="flex gap-2 mb-4 overflow-auto hide-scrollbar">
          <TabButton
            label={t("Admin.myAccount")}
            tab="my-account"
            icon={
              <IconMyaccount
                color={
                  activeTab === "my-account" ? "var(--color-white)" : "gray"
                }
                className="!h-4 !w-4 sm:!h-5 sm:!w-5"
              />
            }
            activeTab={activeTab}
            setActiveTab={setActiveTab}
            isMobileOrTablet={isMobileOrTablet}
          />
          <TabButton
            label={t("Admin.userManagement")}
            tab="user-management"
            icon={
              <IconUser
                color={
                  activeTab === "user-management"
                    ? "var(--color-white)"
                    : "gray"
                }
                className="!h-4 !w-4 sm:!h-5 sm:!w-5"
              />
            }
            activeTab={activeTab}
            setActiveTab={setActiveTab}
            isMobileOrTablet={isMobileOrTablet}
          />
          <TabButton
            label={t("Admin.thresholdManagement")}
            tab="threshold-management"
            icon={
              <IconThreshold
                color={
                  activeTab === "threshold-management"
                    ? "var(--color-white)"
                    : "gray"
                }
                className="!h-4 !w-4 sm:!h-5 sm:!w-5"
              />
            }
            activeTab={activeTab}
            setActiveTab={setActiveTab}
            isMobileOrTablet={isMobileOrTablet}
          />
          {/* <TabButton
            label={t("Admin.ftpConfiguration")}
            tab="ftp-configuration"
            icon={
              <IconFtp
                color={
                  activeTab === "ftp-configuration"
                    ? "var(--color-white)"
                    : "gray"
                }
                className="!h-4 !w-4 sm:!h-5 sm:!w-5"
              />
            }
            activeTab={activeTab}
            setActiveTab={setActiveTab}
            isMobileOrTablet={isMobileOrTablet}
          /> */}
          <TabButton
            label={t("Admin.siteConfiguration")}
            tab="Site Configuration"
            icon={
              <IconSiteConfiguration
                color={
                  activeTab === "Site Configuration"
                    ? "var(--color-white)"
                    : "gray"
                }
                className="!h-4 !w-4 sm:!h-5 sm:!w-5"
              />
            }
            activeTab={activeTab}
            setActiveTab={setActiveTab}
            isMobileOrTablet={isMobileOrTablet}
          />
          <TabButton
            label={t("Admin.emailConfiguration")}
            tab="Email Configuration"
            icon={
              <IconEmailConfiguration
                color={
                  activeTab === "Email Configuration"
                    ? "var(--color-white)"
                    : "gray"
                }
                className="!h-4 !w-4 sm:!h-5 sm:!w-5"
              />
            }
            activeTab={activeTab}
            setActiveTab={setActiveTab}
            isMobileOrTablet={isMobileOrTablet}
          />
          <TabButton
            label={t("Admin.template")}
            tab="Template"
            icon={
              <IconTemplate
                color={activeTab === "Template" ? "var(--color-white)" : "gray"}
                className="!h-4 !w-4 sm:!h-5 sm:!w-5"
              />
            }
            activeTab={activeTab}
            setActiveTab={setActiveTab}
            isMobileOrTablet={isMobileOrTablet}
          />
          <TabButton
            label={t("Admin.userActivityLog")}
            tab="User-Activity-Log"
            icon={
              <IconUserActivity
                color={
                  activeTab === "User-Activity-Log"
                    ? "var(--color-white)"
                    : "gray"
                }
                className="!h-4 !w-4 sm:!h-5 sm:!w-5"
              />
            }
            activeTab={activeTab}
            setActiveTab={setActiveTab}
            isMobileOrTablet={isMobileOrTablet}
          />
          <TabButton
            label={t("Admin.approveUser")}
            tab="user-allow"
            icon={
              <IconActiveUser color={
                  activeTab === "user-allow"
                    ? "var(--color-white)"
                    : "gray"
                } className="!h-4 !w-4 sm:!h-5 sm:!w-5" />
            }
      
            activeTab={activeTab}
            setActiveTab={setActiveTab}
            isMobileOrTablet={isMobileOrTablet}
          />
        </div>
        
      )}

      <div className="flex flex-col overflow-y-auto">
        {activeTab === "my-account" && (
          <MyAccount
            onUserInfoUpdate={(firstName, email, profileImage) => {
              setFirstName(firstName);
              setEmail(email);
              SetProfile(profileImage);
            }}
          />
        )}
        {isAdmin && activeTab === "user-management" && (
          <UserTable
            page={userManagementPage}
            perPage={itemsPerPage}
            onPageChange={(newPage) => handlePageChange(newPage)}
            setTotalItems={setUserManagementTotal} // <-- Add this
          />
        )}
        {isAdmin && activeTab === "user-allow" && (
          <UserInactiveTable
            page={userManagementPage}
            perPage={itemsPerPage}
            onPageChange={(newPage) => handlePageChange(newPage)}
            setTotalItems={setUserManagementTotal} // <-- Add this
          />
        )} 
        {isAdmin && activeTab === "threshold-management" && (
          <ThresholdManagement
            page={thresholdManagementPage}
            perPage={itemsPerPage}
            onPageChange={(newPage) => handlePageChange(newPage)}
            setTotalItems={setThresholdManagementTotal} // <-- Add this
          />
        )}
        {/* {isAdmin && activeTab === "ftp-configuration" && (
          <FTPConfiguration
            page={ftpConfigPage}
            perPage={itemsPerPage}
            onPageChange={handlePageChange}
            setTotalItems={setFtpConfigTotal} // <-- Add this
          />
        )} */}
        {isAdmin && activeTab === "User-Activity-Log" && (
          <UserActivity
            page={userActivityPage}
            perPage={500}
            onPageChange={handlePageChange}
            setTotalItems={setUserActivityTotal} // <-- FIXED
          />
        )}
        {isAdmin && activeTab === "Site Configuration" && (
          <SiteConfiguration
            page={siteConfigurationPage}
            perPage={10}
            onPageChange={handlePageChange}
            setTotalItems={setSiteConfigurationTotal}
          />
        )}
        {isAdmin && activeTab === "Email Configuration" && (
          <EmailConfiguration
            page={emailConfigurationPage}
            perPage={10}
            onPageChange={handlePageChange}
            setTotalItems={setEmailConfigurationTotal}
          />
        )}
        {isAdmin && activeTab === "Template" && (
          <TemplateList
            page={templatePage}
            perPage={10}
            onPageChange={handlePageChange}
            setTotalItems={setTemplateTotal}
          />
        )}
      </div>
    </div>
  );
}

function TabButton({
  label,
  tab,
  icon,
  activeTab,
  setActiveTab,
}: // isMobileOrTablet,
any) {
  return (
    <button
      onClick={() => setActiveTab(tab)}
      className={`flex items-center gap-1 sm:gap-2 py-1 sm:py-2 px-2 sm:px-4 rounded-md text-xs sm:text-sm ${
        activeTab === tab ? "bg-blue3 text-white" : "bg-white text-gray-700"
      }`}
    >
      {icon}
      <span className="whitespace-nowrap">{label}</span>
    </button>
  );
}
