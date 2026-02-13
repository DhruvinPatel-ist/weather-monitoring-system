"use client";
import { Check } from "lucide-react";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { useRouter } from "@/i18n/navigation";

export default function UAELoginPage() {
  const router = useRouter();

  return (
    <div className="flex flex-col h-screen">
      {/* Header */}
      <div className="w-full h-4 bg-green1"></div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col items-center justify-center px-4 py-8">
        <div className="w-full max-w-md mx-auto flex flex-col items-center">
          {/* Logo */}
          <div className="mb-4">
            <Image
              src="/assets/UAELogin.svg"
              alt="UAE PASS Logo"
              width={50}
              height={50}
              className="mx-auto"
            />
          </div>

          {/* Title */}
          <h1 className="text-[#47536d] text-2xl font-medium mb-8">
            Login to UAE PASS
          </h1>

          {/* Form */}
          <div className="w-full space-y-6">
            {/* Input */}
            <div className="w-full">
              <input
                type="text"
                placeholder="Emirate ID, email, or phone eg. 971500000000"
                className="w-full px-4 py-3 border border-[#d9d9d9] rounded-md focus:outline-none focus:ring-2 focus:ring-[#00aeef]"
              />
            </div>

            {/* Remember me */}
            <div className="flex items-center">
              <div className="h-5 w-5 rounded border border-[#00aeef] bg-[#00aeef] flex items-center justify-center mr-2">
                <Check className="h-4 w-4 text-white" />
              </div>
              <span className="text-[#47536d]">Remember me</span>
            </div>

            {/* Login Button */}
            <Button
              className="w-full bg-[#78849e] text-white py-3 rounded-md hover:bg-[#47536d] transition-colors"
              onClick={() => router.push("/uaeverify")}
            >
              Log in
            </Button>

            {/* Divider */}
            <div className="relative my-8">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-[#d9d9d9]"></div>
              </div>
            </div>

            {/* Account options */}
            <div className="text-center space-y-4">
              <p className="text-[#47536d]">
                Don&apos;t have UAEPASS account?
                <a href="#" className="text-green1 ml-1 hover:underline">
                  Create new account
                </a>
              </p>
              <p>
                <a href="#" className="text-green1 hover:underline">
                  Recover your account
                </a>
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Footer - Recaptcha placeholder */}
      <div className="h-16 flex justify-center items-center p-4">
        <h1>Copyright 2025 UAE PASS All rights reserved.</h1>
      </div>
    </div>
  );
}
