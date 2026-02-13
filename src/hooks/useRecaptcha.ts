import { useGoogleReCaptcha } from "react-google-recaptcha-v3";
import { useState } from "react";

interface UseRecaptchaReturn {
  verifyRecaptcha: (action: string) => Promise<boolean>;
  isVerifying: boolean;
  error: string | null;
}

export function useRecaptcha(): UseRecaptchaReturn {
  const { executeRecaptcha } = useGoogleReCaptcha();
  const [isVerifying, setIsVerifying] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const verifyRecaptcha = async (action: string): Promise<boolean> => {
    if (!executeRecaptcha) {
      setError("reCAPTCHA not available");
      return false;
    }

    setIsVerifying(true);
    setError(null);

    try {
      // Execute reCAPTCHA and get token
      const token = await executeRecaptcha(action);

      if (!token) {
        setError("Failed to get reCAPTCHA token");
        return false;
      }

      // Verify token with your existing backend endpoint
      const response = await fetch("/api/verify-recaptcha", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ token }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        setError(errorData.message || "reCAPTCHA verification failed");
        return false;
      }

      const result = await response.json();

      if (!result.success) {
        setError(
          result.message || result.error || "reCAPTCHA verification failed"
        );
        return false;
      }

      return true;
    } catch (err) {
      setError("reCAPTCHA verification error");
      console.error("reCAPTCHA verification error:", err);
      return false;
    } finally {
      setIsVerifying(false);
    }
  };

  return {
    verifyRecaptcha,
    isVerifying,
    error,
  };
}
