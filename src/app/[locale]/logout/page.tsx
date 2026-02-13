import MainLayout from "@/components/layout/MainLayout";
import { LogoutModal } from "@/components/logout/logout-modal";
import React from "react";

const page = () => {
  return (
    <MainLayout>
      <LogoutModal />
    </MainLayout>
  );
};

export default page;
