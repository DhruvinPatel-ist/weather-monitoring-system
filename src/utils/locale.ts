export function getStoredLocale(): string | null {
  if (typeof window === "undefined") return null;

  try {
    const stored = localStorage.getItem("locale-storage");
    if (stored) {
      const parsed = JSON.parse(stored);
      if (parsed?.state?.locale && ["en", "ar"].includes(parsed.state.locale)) {
        return parsed.state.locale;
      }
    }
  } catch (e) {
    console.warn("Failed to parse stored locale:", e);
  }

  return null;
}

export function setStoredLocale(locale: "en" | "ar"): void {
  if (typeof window === "undefined") return;

  try {
    const storeValue = JSON.stringify({
      state: { locale },
      version: 0,
    });
    localStorage.setItem("locale-storage", storeValue);
    // Also set as cookie for server-side access
    document.cookie = `locale-storage=${storeValue}; path=/; max-age=${
      7 * 24 * 60 * 60
    }`; // 7 days
  } catch (e) {
    console.warn("Failed to store locale:", e);
  }
}
