import { defineRouting } from "next-intl/routing";

export const routing = defineRouting({
  // A list of all locales that are supported
  locales: ["en", "ar"],
  // Used when no locale matches
  defaultLocale: "en",
  // Enable locale prefix always to ensure URLs contain locale
  localePrefix: "always",
});
