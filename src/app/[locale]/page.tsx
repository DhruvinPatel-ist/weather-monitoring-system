"use client";

import React, { useState, useEffect } from "react";
import LoginForm from "@/components/Auth/LoginForm/loginform";
import LoginSidebar from "@/components/Auth/LoginForm/LoginFormSidebar/loginformsidebar";
import Image from "next/image";
import { LanguageToggle } from "@/components/Auth/language-toggle";
import { useLocale } from "next-intl";
import { useDeviceDetection } from "@/hooks/useDeviceDetection";

import RecaptchaProvider from "@/providers/RecaptchaProvider";

export default function Home() {
  const locale = useLocale();
  const [isMounted, setIsMounted] = useState(false);
  const isMobileOrTablet = useDeviceDetection();

  useEffect(() => {
    setIsMounted(true);
  }, []);

  if (!isMounted) return null;

  const isRTL = locale === "ar";

  return (
    <RecaptchaProvider>
      <div className="flex items-center justify-center max-h-screen w-full overflow-hidden relative font-[family-name:var(--font-geist-sans)]">
      {/* Background Image */}
      <div className="absolute w-full h-full z-0">
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
        <div className="flex flex-col h-full md:flex-row shadow-2xl border border-gray-300 rounded-lg overflow-hidden bg-white/10 backdrop-blur-[1px] w-full max-w-screen">
          {/* Sidebar */}
          <div className="hidden md:flex md:w-1/2">
            <LoginSidebar isMounted={isMounted} isRTL={isRTL} />
          </div>

          {/* Login Form */}
          <div className="w-full md:w-1/2 flex flex-col items-center justify-center p-6 md:p-8 lg:p-12">
            <div
              className={`absolute top-4 ${
                isRTL ? "left-4 md:left-1/14" : "right-8 md:right-1/14"
              } ${isMobileOrTablet ? "hidden" : ""}`}
            >
              <Image
                src="/logo.svg"
                alt={"logoAlt"}
                width={230}
                height={230}
                priority
              />
            </div>
            <div
              className={`absolute top-4 ${
                isRTL ? "left-4 md:left-8" : "right-4 md:right-8"
              }`}
            >
              <div>
                <LanguageToggle />
              </div>
            </div>

            <LoginForm isMounted={isMounted} isRTL={isRTL} />
          </div>
        </div>
      </div>
      </div>
    </RecaptchaProvider>
  );
}
