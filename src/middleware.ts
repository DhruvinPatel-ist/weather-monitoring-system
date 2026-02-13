import { NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";
import type { NextRequest } from "next/server";
import createIntlMiddleware from "next-intl/middleware";
import { routing } from "@/i18n/routing";

const intlMiddleware = createIntlMiddleware(routing);
const allowedLocales = ["en", "ar"];

export async function middleware(request: NextRequest) {
  const path = request.nextUrl.pathname;

  // ✅ Locale handling from cookie safely
  let storedLocale = routing.defaultLocale;
  const preferredLocale = request.cookies.get("locale-storage")?.value;

  if (preferredLocale) {
    try {
      const parsed = JSON.parse(preferredLocale);
      if (parsed?.state?.locale && allowedLocales.includes(parsed.state.locale)) {
        storedLocale = parsed.state.locale;
      }
    } catch (e) {
      console.error("Failed to parse preferred locale:", e);
    }
  }

  const locale = path.match(/^\/(en|ar)/)?.[1] || storedLocale;

  const cookies = request.cookies;
  const hasForgetSession = cookies.has("forgetSession");

  const publicPaths = ["/", "/uaelogin", "/forgetpassword", "/uaepass/callback"];

  const isPublicPath = publicPaths.some(
    (publicPath) =>
      path === publicPath ||
      path === `/${locale}${publicPath}` ||
      path === `/${locale}`
  );

  const isVerifyOrResetPath =
    path === `/${locale}/verify` || path === `/${locale}/resetpassword`;

  // 🔐 Protected routes: forget session required
  if (isVerifyOrResetPath && !hasForgetSession) {
    return NextResponse.redirect(
      new URL(`/${locale}/forgetpassword`, request.url)
    );
  }

  // 🔐 Protected routes: login required
  const token = await getToken({
    req: request,
    secret: process.env.NEXTAUTH_SECRET,
  });

  const isUaepassCallback =
    path === "/uaepass/callback" || path === `/${locale}/uaepass/callback`;

  if (!isPublicPath && !isUaepassCallback && !isVerifyOrResetPath && !token) {
    return NextResponse.redirect(new URL(`/${locale}`, request.url));
  }

  // 🔁 Redirect logged-in users away from public login routes
  if (token && isPublicPath && !path.includes("/dashboard")) {
    return NextResponse.redirect(new URL(`/${locale}/dashboard`, request.url));
  }

  // Root path redirect to preferred locale
  if (path === "/" && storedLocale !== routing.defaultLocale) {
    return NextResponse.redirect(new URL(`/${storedLocale}`, request.url));
  }

  // Apply i18n middleware
  const response = intlMiddleware(request);

  // ✅ Secure NEXT_LOCALE cookie
  if (locale) {
    response.cookies.set("NEXT_LOCALE", locale, {
      httpOnly: false, // client-side access required
      secure: true,    // only over HTTPS
      sameSite: "lax", // mitigates CSRF
      path: "/",
    });
  }

  // ✅ Security headers compatible with UAEPASS, Google Analytics, and reCAPTCHA
  const isDev = process.env.NODE_ENV === "development";

if (!isDev) {
  // ✅ Only apply strict security headers in production
  response.headers.set("X-Frame-Options", "DENY");
 response.headers.set(
  "Content-Security-Policy",
  `
    default-src 'self';
    script-src 'self' 'unsafe-inline' https://www.googletagmanager.com https://www.google-analytics.com https://www.google.com/recaptcha/ https://www.gstatic.com;
    connect-src 'self' https://www.google-analytics.com https://www.google.com/recaptcha/ https://www.gstatic.com https://*.tile.openstreetmap.org;
    img-src 'self' data: https://www.google.com https://www.gstatic.com https://www.google-analytics.com https://*.tile.openstreetmap.org https://unpkg.com;
    frame-src https://www.google.com https://www.gstatic.com;
    style-src 'self' 'unsafe-inline' https://www.gstatic.com;
    frame-ancestors 'none';
  `.replace(/\s+/g, " ")
);
  response.headers.set(
    "Strict-Transport-Security",
    "max-age=31536000; includeSubDomains; preload"
  );
  response.headers.set("X-Powered-By", ""); // hide Next.js info
}

  return response;
}

export const config = {
  matcher: [
    "/",
    "/uaepass/callback",
    "/(en|ar)/uaepass/callback",
    "/(en|ar)/:path*",
    "/_next/data/:path*",
  ],
};