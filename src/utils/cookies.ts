// utils/cookies.ts

/**
 * Get the value of a cookie by name
 */
export function getCookie(name: string): string | null {
  const value = `; ${document.cookie}`;
  const parts = value.split(`; ${name}=`);
  if (parts.length === 2) return parts.pop()?.split(";").shift() || null;
  return null;
}

/**
 * Set a cookie with optional expiration in days (default: 7)
 */
export function setCookie(name: string, value: string, days = 7) {
  const expires = new Date(Date.now() + days * 864e5).toUTCString();
  const secure = location.protocol === "https:" ? "; Secure" : "";
  const sameSite = "; SameSite=Strict";

  document.cookie = `${name}=${value}; path=/; expires=${expires}${secure}${sameSite}`;
}

/**
 * Remove a cookie by setting its expiration date to the past
 */
export function removeCookie(name: string): void {
  document.cookie = `${name}=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT`;
}
