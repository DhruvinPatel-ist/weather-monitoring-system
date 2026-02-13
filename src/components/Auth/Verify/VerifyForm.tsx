"use client";

import { useState, useRef, useEffect } from "react";
import Cookies from "js-cookie";
import { useRouter } from "@/i18n/navigation";
import { Button } from "@/components/ui/button";
import { useTranslations, useLocale } from "next-intl";
import api from "@/app/api/api";
import { useForgetPassword } from "@/hooks/useLogin";
import { toast } from "sonner";

interface VerifyFormProps {
  length?: number;
}

export default function VerifyForm({ length = 6 }: VerifyFormProps) {
  const router = useRouter();
  const locale = useLocale();
  const t = useTranslations("ForgotPassword");
  const isRTL = locale === "ar";

  const [otp, setOtp] = useState<string[]>(Array(length).fill(""));
  const [timeLeft, setTimeLeft] = useState<number>(120);
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  const sessionId = Cookies.get("forgetSession"); // match cookie key
  const email = Cookies.get("email");
  const forgetPasswordMutation = useForgetPassword();

  useEffect(() => {
    if (timeLeft <= 0) return;
    const timer = setInterval(() => setTimeLeft((prev) => prev - 1), 1000);
    return () => clearInterval(timer);
  }, [timeLeft]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, "0")} : ${secs
      .toString()
      .padStart(2, "0")}`;
  };

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement>,
    index: number
  ) => {
    const value = e.target.value;
    if (!/^\d*$/.test(value)) return;

    const newOtp = [...otp];
    newOtp[index] = value.slice(-1);
    setOtp(newOtp);

    if (value && index < length - 1) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handleKeyDown = (
    e: React.KeyboardEvent<HTMLInputElement>,
    index: number
  ) => {
    if (e.key === "Backspace" && !otp[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handlePaste = (e: React.ClipboardEvent<HTMLInputElement>) => {
    e.preventDefault();
    const pasted = e.clipboardData.getData("text").slice(0, length).split("");
    const newOtp = Array(length).fill("");
    for (let i = 0; i < pasted.length; i++) {
      newOtp[i] = pasted[i];
    }
    setOtp(newOtp);
    inputRefs.current[Math.min(pasted.length, length - 1)]?.focus();
  };

  const handleVerify = async () => {
    const code = otp.join("");
    try {
      const response = await api.post("/verify-passcode", {
        sessionId,
        passcode: code,
      });

      const token = response.data.token;
      Cookies.set("sessionToken", token, { secure: true, expires: 1,sameSite: "Strict", httpOnly: true });
      router.push("/resetpassword");
    } catch (err) {
      console.error("OTP verification failed:", err);
      toast("Invalid or expired code");
    }
  };

  const handleResend = () => {
    if (!email) {
      toast(t("Error"));
      return;
    }
    // Remove old forgetSession token
    Cookies.remove("forgetSession");
    forgetPasswordMutation.mutate(email, {
      onSuccess: (data) => {
        // Store new sessionId as forgetSession
        Cookies.set("forgetSession", data.sessionId, {
          expires: 1 / 24, // 1 hour
          secure: true,
          sameSite: "Strict",
           httpOnly: true, 
        });
        setOtp(Array(length).fill(""));
        setTimeLeft(120);
        inputRefs.current[0]?.focus();
      },
      onError: (error) => {
        console.error("Resend error:", error);
        toast(t("Error"));
      },
    });
  };

  return (
    <div
      className="flex flex-col items-center w-full max-w-md mx-auto"
      dir={isRTL ? "rtl" : "ltr"}
    >
      <h1 className="text-3xl font-bold text-white mb-2">
        {t("Enter your passcode")}
      </h1>
      <p className="text-white/90 mb-8">
        {t("We've sent the code to your email ID")}
      </p>

      <div className="flex gap-3 justify-center mb-6">
        {otp.map((digit, index) => (
          <input
            key={index}
            ref={(ref) => {
              inputRefs.current[index] = ref;
            }}
            type="text"
            inputMode="numeric"
            maxLength={1}
            value={digit}
            onChange={(e) => handleChange(e, index)}
            onKeyDown={(e) => handleKeyDown(e, index)}
            onPaste={index === 0 ? handlePaste : undefined}
            className="w-12 h-12 text-center text-2xl font-bold bg-black/20 text-white rounded-lg border border-white/30"
          />
        ))}
      </div>

      <p className="text-white mb-2">
        {t("Code expires in")}:{" "}
        <span className="font-semibold">{formatTime(timeLeft)}</span>
      </p>

      <div className="text-white mb-4">
        {t("Didn't receive code?")}
        <button
          onClick={handleResend}
          disabled={timeLeft > 0 || forgetPasswordMutation.isPending}
          className="ml-2 text-blue-400 hover:text-blue-500 disabled:text-gray-400"
        >
          {forgetPasswordMutation.isPending ? t("Sending") : t("Resend Code")}
        </button>
      </div>

      <Button
        onClick={handleVerify}
        disabled={otp.join("").length !== length}
        className="w-full py-4 text-lg font-semibold bg-blue1 hover:bg-blue2"
      >
        {t("Verify OTP")}
      </Button>
    </div>
  );
}
