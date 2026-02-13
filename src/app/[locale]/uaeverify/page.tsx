"use client";
import { Button } from "@/components/ui/button";
import { Hourglass, X } from "lucide-react";
import Image from "next/image";
import { useRouter } from "@/i18n/navigation";

export default function UAEVerifyPage() {
  const router = useRouter();
  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-white">
      {/* Header */}
      <div className="w-full h-4 flex justify-start bg-teal-500 fixed top-0 left-0"></div>
      <div className="flex items-center gap-2 w-5xl px-4 sm:px-8 ml-8 mb-8">
        <Image
          src="/assets/UAELogin.svg"
          alt="UaeLogo"
          width={25}
          height={25}
        />
        <h1 className="text-lg font-medium text-gray-800">
          Approve Login Request
        </h1>
      </div>
      {/* Main Container - Centered both vertically and horizontally */}
      <div className="flex flex-col items-center justify-center w-full max-w-5xl px-4">
        {/* Main Content Card */}
        <div className="w-full px-4 sm:px-8 mb-8">
          <div className="bg-white rounded-xl w-full p-6 sm:p-8 shadow-md border border-teal-500">
            {/* UAE PASS Header */}
            <div className="flex justify-between items-start">
              <div className="flex items-center gap-3">
                <div className="relative h-10 w-10">
                  <Image
                    src="/assets/UAELogin.svg"
                    alt="UaeLogo"
                    width={50}
                    height={50}
                  />
                </div>
                <div>
                  <div className="text-gray-600 text-sm">
                    بطاقة المرور الإماراتية
                  </div>
                  <div className="font-medium">UAE PASS</div>
                </div>
              </div>
              <Button
                variant="default"
                className="flex items-center text-red-500 bg-transparent hover:bg-transparent border-0 shadow-none gap-1 text-sm"
                onClick={() => router.push("/")}
              >
                Cancel Request <X className="h-4 w-4" />
              </Button>
            </div>

            <div className="mt-8">
              <p className="text-gray-600">Login request from</p>
              <h2 className="text-gray-800 font-medium mt-1">
                Fujairah Environment Authority - Weather Monitoring System
              </h2>
            </div>

            {/* Authentication Section */}
            <div className="mt-12 flex flex-col md:flex-row items-center md:items-start justify-between gap-6">
              <div className="space-y-8">
                <h3 className="text-xl sm:text-2xl font-medium text-gray-800">
                  Open your UAE PASS app, select the
                  <br />
                  number shown and confirm to login
                </h3>

                <div className="flex items-center justify-center md:justify-start">
                  <div className="h-16 w-16 bg-gray-100 rounded-md flex items-center justify-center text-3xl font-medium text-gray-700 border border-gray-200 shadow-sm">
                    02
                  </div>
                </div>

                <div className="flex items-center gap-2 text-amber-600 font-medium">
                  <Hourglass className="h-5 w-5" />
                  <span>Waiting for your confirmation</span>
                </div>
              </div>

              <div className="relative h-64 w-64 mx-auto md:mx-0">
                <div className="absolute right-0 top-0 h-full w-48">
                  <div className="relative h-full w-full bg-gray-200 rounded-lg flex items-center justify-center">
                    <div className="h-2 w-10 bg-gray-300 rounded-full absolute top-4"></div>
                    <div className="h-24 w-32 bg-gray-300 rounded-md mt-8"></div>
                  </div>
                </div>
                <div className="absolute bottom-0 left-0">
                  <div className="h-40 w-28 bg-white rounded-2xl shadow-lg border-4 border-white flex flex-col items-center justify-center">
                    <div className="h-3 w-3 bg-green-500 rounded-full mb-2"></div>
                    <div className="h-8 w-8 bg-amber-500 rounded-full flex items-center justify-center">
                      <div className="h-2 w-2 bg-white rounded-full"></div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="font-semibold text-center text-gray-700 w-full mb-6">
          <p>Powered by UAE PASS</p>
        </div>
      </div>
    </div>
  );
}
