"use client";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useLocale } from "next-intl";
import { useLocalePreference } from "@/hooks/useLocalePreference";
import { useEffect, useState } from "react";

interface LanguageToggleProps {
  className?: string;
}

export function LanguageToggle({ className }: LanguageToggleProps) {
  const [isClient, setIsClient] = useState(false);
  useEffect(() => setIsClient(true), []);
  // Always call hooks at the top
  const locale = useLocale();
  const { changeLocale, isPending } = useLocalePreference();
  const nextLocale = locale === "en" ? "ar" : "en";
  const handleToggle = () => changeLocale(nextLocale);
  const isChatPage = typeof window !== "undefined" && /^\/(en|ar)?\/?chat$/.test(window.location.pathname);
  // Only render the button on client and not on chat page
  if (!isClient || isChatPage) return null;
  return (
    <Button
      variant="outline"
      onClick={handleToggle}
      className={cn(
        "text-white bg-transparent hover:bg-transparent hover:text-white rounded-4xl",
        className,
        { "opacity-50": isPending }
      )}
      disabled={isPending}
    >
      {nextLocale === "en" ? "English" : "العربية"}
    </Button>
  );
}
