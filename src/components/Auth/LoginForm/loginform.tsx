"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import {  SuccessDialog} from "@/components/admin/models/ConfirmDeleteModal";
import { SignupFormModal } from "@/components/admin/form/signup-form-modal";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Fingerprint, Eye, EyeOff } from "lucide-react";
import { useState } from "react";
import { useRouter } from "@/i18n/navigation";
import { signIn } from "next-auth/react";
import { useDeviceDetection } from "@/hooks/useDeviceDetection";
import Image from "next/image";
import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import React from "react";
import { useGoogleReCaptcha } from "react-google-recaptcha-v3";

interface LoginFormProps {
  isMounted: boolean;
  isRTL: boolean;
}

const formSchema = z.object({
  email: z.string().email({
    message: "Please enter a valid email address.",
  }),
  password: z.string().min(8, {
    message: "Password must be at least 8 characters.",
  }),
  rememberMe: z.boolean().default(false),
});

export default function LoginForm({ isRTL }: LoginFormProps) {
  const router = useRouter();
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [loginError, setLoginError] = useState<string | null>(null);
  const isMobileOrTablet = useDeviceDetection();
  const [isSuccessModalOpen, setIsSuccessModalOpen] = useState(false);
  const t = useTranslations("Login");
  const { executeRecaptcha } = useGoogleReCaptcha();
  const [isSignupModalOpen, setIsSignupModalOpen] = useState(false);
  const handleSignupModalClose = () => {
    setIsSignupModalOpen(false);
  };

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      email: "",
      password: "",
      rememberMe: false,
    },
  });

  // Function to verify reCAPTCHA using your existing endpoint
  const verifyRecaptcha = async (): Promise<boolean> => {
    const baseurl = process.env.NEXT_PUBLIC_API_BASE_URL;
    if (!executeRecaptcha) {
      console.error("reCAPTCHA not available");
      setLoginError(t("recaptchaNotAvailable"));
      return false;
    }

    try {
      // Execute reCAPTCHA and get token
      const token = await executeRecaptcha("login");

      if (!token) {
        setLoginError(t("recaptchaFailed"));
        return false;
      }

      // Verify token with your existing backend endpoint
      const response = await fetch(`${baseurl}verify-recaptcha`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ "g-recaptcha-response": token }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        console.error("reCAPTCHA verification failed:", errorData);
        setLoginError(t("recaptchaVerificationFailed"));
        return false;
      }

      const result = await response.json();

      if (!result.success) {
        console.error(
          "reCAPTCHA verification failed:",
          result.message || result.error
        );
        setLoginError(t("recaptchaVerificationFailed"));
        return false;
      }

      console.log("reCAPTCHA verification successful");
      return true;
    } catch (error) {
      console.error("reCAPTCHA verification error:", error);
      setLoginError(t("recaptchaError"));
      return false;
    }
  };

  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    setIsLoading(true);
    setLoginError(null);

    try {
      console.log("Form values being sent:", values);
      console.log("RememberMe type:", typeof values.rememberMe);
      // First verify reCAPTCHA using your endpoint
      const recaptchaVerified = await verifyRecaptcha();

      if (!recaptchaVerified) {
        setIsLoading(false);
        return;
      }

      // Proceed with login if reCAPTCHA is verified
      const response = await signIn("credentials", {
        email: values.email,
        password: values.password,
        rememberMe: values.rememberMe,
        redirect: false,
      });

      if (response?.error) {
        setLoginError(t("invalidCredentials"));
      } else {
        router.push("/dashboard");
      }
    } catch (error) {
      console.error("Login error:", error);
      setLoginError(t("unexpectedError"));
    } finally {
      setIsLoading(false);
    }
  };

  const handleLogin = () => {
    const baseurl = process.env.NEXT_PUBLIC_API_UAEPASS ?? "";
    // Redirect user to Node.js login endpoint
    window.location.href = baseurl;
  };

  return (
    <div
      className={`flex w-full flex-col ${
        isMobileOrTablet
          ? "items-start justify-center"
          : "items-center justify-center"
      }`}
      dir={isRTL ? "rtl" : "ltr"}
    >
      <div
        className={`${
          isMobileOrTablet ? "z-10 mb-6 w-2/5 md:hidden" : "hidden"
        }`}
      >
        <Image
          src="/logo.svg"
          alt={t("logoAlt")}
          width={280}
          height={280}
          priority
        />
      </div>

      <div className="w-full max-w-[400px] bg-transparent">
        <div className="mb-4 sm:mb-6">
          <h1 className="text-start text-xl font-bold text-white sm:text-2xl">
            {t("loginNow")}
          </h1>
          <p className="text-sm text-white sm:text-base">{t("welcomeBack")}</p>
        </div>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4" autoComplete="off">
            <FormField
              control={form.control}
              name="email"
              render={({ field }) => (
                <FormItem className="space-y-1.5">
                  <FormLabel className="text-sm text-white">
                    {t("email")}
                  </FormLabel>
                  <FormControl>
                    <Input
                      placeholder={t("emailPlaceholder")}
                      {...field}
                      className="h-9 w-full rounded-md border border-gray-300 bg-black/10 text-white backdrop-blur-[1px] sm:h-10"
                    />
                  </FormControl>
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="password"
              render={({ field }) => (
                <FormItem className="space-y-1.5">
                  <FormLabel className="text-sm text-white">
                    {t("password")}
                  </FormLabel>
                  <FormControl>
                    <div className="relative">
                      <Input
                        className="h-9 w-full rounded-md border border-gray-300 bg-black/10 text-white backdrop-blur-[1px] sm:h-10"
                        type={showPassword ? "text" : "password"}
                        placeholder={t("passwordPlaceholder")}
                        {...field}
                      />
                      <Button
                        type="button"
                        className={`absolute ${
                          isRTL ? "left-0" : "right-0"
                        } top-0 h-full bg-transparent px-2 py-2 hover:bg-transparent sm:px-3`}
                        onClick={() => setShowPassword(!showPassword)}
                      >
                        {showPassword ? (
                          <Eye className="h-3 w-3 text-white sm:h-4 sm:w-4" />
                        ) : (
                          <EyeOff className="h-3 w-3 text-white sm:h-4 sm:w-4" />
                        )}
                      </Button>
                    </div>
                  </FormControl>
                </FormItem>
              )}
            />

            <div className="flex items-center justify-between">
              <FormField
                control={form.control}
                name="rememberMe"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-center space-x-2">
                    <FormControl>
                      <Checkbox
                        checked={field.value}
                        onCheckedChange={field.onChange}
                        className="data-[state=checked]:bg-white data-[state=checked]:text-blue1"
                      />
                    </FormControl>
                    <FormLabel
                      className={`text-xs text-white sm:text-sm ${
                        isRTL ? "mr-2" : "ml-2"
                      }`}
                    >
                      {t("rememberMe")}
                    </FormLabel>
                  </FormItem>
                )}
              />

              <Link
                href="/forgetpassword"
                className="text-xs text-white hover:underline sm:text-sm"
              >
                {t("forgotPassword")}
              </Link>
            </div>

            {loginError && (
              <div className="mb-2 rounded-md bg-red-500/10 border border-red-500/20 p-3">
                <p className="text-sm text-red-400">{loginError}</p>
              </div>
            )}

            <Button
              type="submit"
              className="mt-2 flex w-full items-center justify-center bg-blue1 hover:bg-blue2"
              disabled={isLoading}
            >
              {isLoading ? (
                <svg
                  className="mr-2 h-4 w-4 animate-spin text-white"
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                >
                  <circle
                    className="opacity-25"
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    strokeWidth="4"
                  ></circle>
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"
                  ></path>
                </svg>
              ) : null}

              {isRTL ? (
                <>
                  {t("signIn")}
                  {!isLoading && (
                    <svg
                      width="15"
                      height="15"
                      viewBox="0 0 15 15"
                      className="mr-2 rotate-180"
                    >
                      <path
                        d="M8.14645 3.14645C8.34171 2.95118 8.65829 2.95118 8.85355 3.14645L12.8536 7.14645C13.0488 7.34171 13.0488 7.65829 12.8536 7.85355L8.85355 11.8536C8.65829 12.0488 8.34171 12.0488 8.14645 11.8536C7.95118 11.6583 7.95118 11.3417 8.14645 11.1464L11.2929 8H2.5C2.22386 8 2 7.77614 2 7.5C2 7.22386 2.22386 7 2.5 7H11.2929L8.14645 3.85355C7.95118 3.65829 7.95118 3.34171 8.14645 3.14645Z"
                        fill="currentColor"
                        fillRule="evenodd"
                        clipRule="evenodd"
                      />
                    </svg>
                  )}
                </>
              ) : (
                <>
                  {t("signIn")}
                  {!isLoading && (
                    <svg
                      width="15"
                      height="15"
                      viewBox="0 0 15 15"
                      className="ml-2"
                    >
                      <path
                        d="M8.14645 3.14645C8.34171 2.95118 8.65829 2.95118 8.85355 3.14645L12.8536 7.14645C13.0488 7.34171 13.0488 7.65829 12.8536 7.85355L8.85355 11.8536C8.65829 12.0488 8.34171 12.0488 8.14645 11.8536C7.95118 11.6583 7.95118 11.3417 8.14645 11.1464L11.2929 8H2.5C2.22386 8 2 7.77614 2 7.5C2 7.22386 2.22386 7 2.5 7H11.2929L8.14645 3.85355C7.95118 3.65829 7.95118 3.34171 8.14645 3.14645Z"
                        fill="currentColor"
                        fillRule="evenodd"
                        clipRule="evenodd"
                      />
                    </svg>
                  )}
                </>
              )}
            </Button>
          </form>
        </Form>
              <SignupFormModal
                isOpen={isSignupModalOpen}
                onClose={handleSignupModalClose}
                setIsSuccessModalOpen={setIsSuccessModalOpen}
              />
        <div className="relative mt-4 text-center">
          <span className="p-2 text-xs font-semibold text-white sm:text-sm">
            {t("or")}
          </span>
        </div>
        <div className="mt-3 flex justify-center">
          <Button
            className="w-full bg-black/20 text-white bg-blue1 hover:bg-blue2"
            onClick={() => setIsSignupModalOpen(true)}
          >
            
            <span className="text-xs sm:text-sm">{t("signUp")}</span>
          </Button>
        </div>
        <div className="mt-3 flex justify-center">
          <Button
            className="w-full bg-black/20 text-white hover:bg-black/50"
            onClick={handleLogin}
            disabled={false}
          >
            <Fingerprint
              className={`${
                isRTL ? "ml-2" : "mr-2"
              } h-3 w-3 text-white sm:h-4 sm:w-4`}
            />
            <span className="text-xs sm:text-sm">{t("signInWithUAEPASS")}</span>
          </Button>
        </div>
        <footer className="mt-6 w-full py-2 text-center text-xs text-white">
          {t("copyright")}
        </footer>
      </div>
      <SuccessDialog
              isOpen={isSuccessModalOpen}
              onClose={() => setIsSuccessModalOpen(false)}
              title={t("userCreatedTitle")}
              message={t("userCreatedMessage")}
            />
    </div>
  );
}
