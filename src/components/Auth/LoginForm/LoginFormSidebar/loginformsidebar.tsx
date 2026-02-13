"use client";

import Image from "next/image";
interface LoginSidebarProps {
  isMounted: boolean;
  isRTL: boolean;
}

const LoginSidebar: React.FC<LoginSidebarProps> = ({ isRTL }) => {
  return (
    <div className="flex flex-col h-full w-full bg-transparent relative">
      {/* Logo - visible on all screen sizes */}
      <div
        className={`absolute top-6 left-6 sm:top-8 sm:left-8 md:top-10 md:left-10 z-10 ${
          isRTL ? "right-6 left-auto" : ""
        }`}
      >
        {isRTL ? (
          <Image
            src="/arwmd.png" // RTL version of logo
            alt="شعار"
            width={220}
            height={220}
            priority
          />
        ) : (
          <Image
            src="/wmd.png" // LTR version of logo
            alt="Logo"
            width={220}
            height={220}
            priority
          />
        )}
      </div>

      {/* Illustration - hidden on small screens, visible on medium and larger */}
      <div className="hidden md:block rounded-2xl w-full h-full">
        <Image
          src={"/LoginIllustrations.svg"}
          alt="LoginIllustrations"
          className={`absolute ${
            isRTL ? "right-0" : "-left-10"
          } bottom-0 md:-bottom-16 lg:-bottom-20 xl:-bottom-25`}
          width={590}
          height={590}
          sizes="(max-width: 768px) 0px, (max-width: 1024px) 800px"
        />
      </div>
    </div>
  );
};
export default LoginSidebar;
