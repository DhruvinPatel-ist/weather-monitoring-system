"use client";

import { useEffect } from "react";
import { useLocaleStore } from "@/stores/useLocaleStore";
import { useLocale } from "next-intl";

export function LocaleSync() {
  const { locale: storedLocale, setLocale } = useLocaleStore();
  const currentLocale = useLocale();

  useEffect(() => {
    // Initialize the store with the current locale if not set
    if (!storedLocale || storedLocale !== currentLocale) {
      setLocale(currentLocale);
    }
  }, [currentLocale, storedLocale, setLocale]);

  // Sync the locale store with a cookie for server-side access
  useEffect(() => {
    if (typeof window !== "undefined") {
      const storeValue = localStorage.getItem("locale-storage");
      if (storeValue) {
        document.cookie = `locale-storage=${storeValue}; path=/; max-age=${
          7 * 24 * 60 * 60
        }`; // 7 days
      }
    }
  }, [storedLocale]);

  return null; // This component doesn't render anything
}
