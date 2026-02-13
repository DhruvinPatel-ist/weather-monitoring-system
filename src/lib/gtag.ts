// lib/gtag.ts

export const GA_MEASUREMENT_ID = "G-EBCPFGCE53"; // Replace with your ID

export const pageview = (url: string) => {
  if (typeof window !== "undefined" && window.gtag) {
    window.gtag("config", GA_MEASUREMENT_ID, {
      page_path: url,
    });
  }
};
