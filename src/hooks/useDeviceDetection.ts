import { useState, useEffect } from "react";

export function useDeviceDetection() {
  // Always initialize to false to match SSR and client
  const [isMobileOrTablet, setIsMobileOrTablet] = useState(false);

  useEffect(() => {
    const checkDeviceType = () => {
      setIsMobileOrTablet(window.innerWidth < 770);
    };

    window.addEventListener("resize", checkDeviceType);

    // Initial check to ensure the state is correct on mount
    checkDeviceType();

    return () => {
      window.removeEventListener("resize", checkDeviceType);
    };
  }, []);

  return isMobileOrTablet;
}
