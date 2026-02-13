"use client";

import { useLocale } from "next-intl";
import { useLocaleStore } from "@/stores/useLocaleStore";
import { createNavigation } from "next-intl/navigation";
import { useTransition } from "react";

const { useRouter, usePathname } = createNavigation({
  locales: ["en", "ar"],
});

export function useLocalePreference() {
  const currentLocale = useLocale();
  const { locale: storedLocale, setLocale } = useLocaleStore();
  const router = useRouter();
  const pathname = usePathname();
  const [isPending, startTransition] = useTransition();

  const changeLocale = (newLocale: "en" | "ar") => {
    if (newLocale === currentLocale) return;

    startTransition(() => {
      // Store the preference
      setLocale(newLocale);
      // Navigate to the new locale
      router.replace(pathname, { locale: newLocale });
    });
  };

  return {
    currentLocale,
    storedLocale,
    changeLocale,
    isPending,
  };
}
