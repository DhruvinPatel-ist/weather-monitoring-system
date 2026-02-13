"use client";

import React from "react";
import LoginSidebar from "@/components/Auth/LoginForm/LoginFormSidebar/loginformsidebar";
import Image from "next/image";
import ResetPasswordForm from "@/components/Auth/Reset/ResetPasswordForm";

export default function Home() {
  // Define isMounted and isRTL variables
  const [isMounted, setIsMounted] = React.useState(false);
  React.useEffect(() => {
    setIsMounted(true);
  }, []);
  const isRTL = false; // Set this based on your locale or requirements

  return (
    <div className="flex items-center justify-center h-screen w-full overflow-hidden relative font-[family-name:var(--font-geist-sans)]">
      {/* Background Image */}
      <div className="absolute w-full h-full inset-0 z-0">
        <Image
          src="/LoginBackground.png"
          alt="Login Background"
          fill
          priority
          className="object-cover"
        />
        <div className="z-0">
          <Image
            src="/wave.svg"
            alt="Login"
            className="absolute top-0 left-0 w-full h-full"
            width={240}
            height={240}
          />
        </div>
      </div>

      {/* Content Container */}
      <div className="flex h-screen w-full justify-center items-center p-8 sm:p-8 md:p-4 lg:p-8 py-6 md:py-10">
        <div className="flex flex-col h-full md:flex-row shadow-2xl border border-gray-300 rounded-2xl overflow-hidden bg-black/10 backdrop-blur-[1px] w-full max-w-screen">
          {/* Left side - Sidebar (Hidden on mobile) */}
          <div className="hidden md:flex md:w-1/2">
            <LoginSidebar isMounted={isMounted} isRTL={isRTL} />
          </div>
          {/* Right side - Login form */}
          <div className="w-full md:w-1/2 flex flex-col items-center justify-center p-6 md:p-8 lg:p-12">
            <ResetPasswordForm />
          </div>
        </div>
      </div>
    </div>
  );
}
