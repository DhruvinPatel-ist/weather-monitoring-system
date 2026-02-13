import type { Metadata } from "next";
import { Roboto, Noto_Kufi_Arabic } from "next/font/google";
import "@/styles/globals.css";
import { SessionProvider } from "@/providers/SessionProvider";
import { Providers } from "@/providers";
import { Toaster } from "sonner";
import Script from "next/script";
import { UserDataProvider } from "@/providers/UserDataProvider";

const roboto = Roboto({
  variable: "--font-roboto",
  weight: ["400", "500", "700"],
  subsets: ["latin"],
});

const notoKufiArabic = Noto_Kufi_Arabic({
  variable: "--font-noto-kufi-arabic",
  weight: ["400", "700"],
  subsets: ["arabic"],
});

export const metadata: Metadata = {
  title: "FEA Weather",
  description: "Fea Weather",
  icons: {
    icon: "/favicon.svg",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={`${roboto.variable} ${notoKufiArabic.variable}`}>
      <body className="font-roboto font-noto-kufi-arabic">
        {/* ✅ Google Analytics Scripts */}
        <Script
          strategy="afterInteractive"
          src="https://www.googletagmanager.com/gtag/js?id=G-EBCPFGCE53"
        />
        <Script
          id="gtag-init"
          strategy="afterInteractive"
          dangerouslySetInnerHTML={{
            __html: `
              window.dataLayer = window.dataLayer || [];
              function gtag(){dataLayer.push(arguments);}
              gtag('js', new Date());

              // Sanitize page_path to prevent injection
              const safePath = window.location.pathname.replace(/[^a-zA-Z0-9/_-]/g, '');
              gtag('config', 'G-EBCPFGCE53', { page_path: safePath });
            `,
          }}
        />

        {/* ✅ Toaster for notifications */}
        <Toaster position="top-center" richColors />

        {/* ✅ Providers for session and user data */}
        <Providers>
          <SessionProvider>
            <UserDataProvider>{children}</UserDataProvider>
          </SessionProvider>
        </Providers>
      </body>
    </html>
  );
}