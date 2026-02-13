import { NextIntlClientProvider } from "next-intl";
import { notFound } from "next/navigation";
import { routing } from "@/i18n/routing";
import { SessionProvider } from "@/providers/SessionProvider";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { Analytics } from "@/components/Analytics"; // ✅ Add this line
import AuthErrorBoundary from "@/components/Auth/AuthErrorBoundary";
import { LocaleSync } from "@/components/LocaleSync";

export default async function LocaleLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params?: Promise<{ locale: string }>;
}) {
  // Safely resolve the params promise
  const resolvedParams = await (params || Promise.resolve({ locale: "en" }));
  const locale = resolvedParams.locale;

  // Type check to ensure locale is one of our supported locales
  if (!routing.locales.includes(locale as any)) {
    notFound();
  }

  // Get the session to pass to SessionProvider
  const session = await getServerSession(authOptions);

  // Load messages for the current locale
  let messages;
  try {
    messages = (await import(`../../../messages/${locale}.json`)).default;
  } catch (error) {
    console.error("Failed to load messages:", error);
    notFound();
  }

  return (
    <div
      className={locale === "ar" ? "rtl" : "ltr"}
      dir={locale === "ar" ? "rtl" : "ltr"}
    >
      <SessionProvider session={session}>
        <NextIntlClientProvider locale={locale} messages={messages}>
          <LocaleSync />
          <Analytics /> {/* ✅ Add Analytics tracking here */}
          <AuthErrorBoundary>{children}</AuthErrorBoundary>
        </NextIntlClientProvider>
      </SessionProvider>
    </div>
  );
}
