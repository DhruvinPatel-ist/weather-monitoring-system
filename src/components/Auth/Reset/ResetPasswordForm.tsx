"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import Cookies from "js-cookie";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { useRouter } from "@/i18n/navigation";
import { useTranslations, useLocale } from "next-intl";
import api from "@/app/api/api";
import bcrypt from "bcryptjs"; // ✅ import bcryptjs
import { useState } from "react"; // ✅ import useState for toggling password visibility
import { Eye, EyeOff } from "lucide-react";
import Image from "next/image";
import { toast } from "sonner";

// Schema for reset password
const formSchema = z
  .object({
    password: z.string().min(8, {
      message: "Password must be at least 8 characters.",
    }),
    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords do not match.",
    path: ["confirmPassword"],
  });

export default function ResetPasswordForm() {
  const router = useRouter();
  const locale = useLocale();
  const isRTL = locale === "ar"; // Check if the locale is Arabic
  const t = useTranslations("ResetPassword");

  const sessionId = Cookies.get("forgetSession");

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      password: "",
      confirmPassword: "",
    },
  });

  // Separate states to toggle password visibility
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);

  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    try {
      // ✅ Hash the password before sending
      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash(values.password, salt);

      await api.post("/reset-password", {
        sessionId,
        newPassword: hashedPassword,
      });

      Cookies.remove("forgetSession");
      Cookies.remove("email");
      setShowSuccess(true); // Show success modal
    } catch (error) {
      console.error("Reset password error:", error);
      toast(t("Error"));
    }
  };

  return (
    <div
      className="flex flex-col h-full items-center"
      dir={isRTL ? "rtl" : "ltr"} // Adjust the text direction based on locale
    >
      {/* Replace form area with success modal on success */}
      {showSuccess ? (
        <div className="flex flex-col h-full w-full justify-center items-center bg-transparent rounded-lg">
          <div>
            <Image
              src="/resetSuccess.svg"
              alt="Success"
              width={150}
              height={150}
            />
          </div>
          <div className="flex flex-col  items-start mt-8 mb-8">
            <p className="mb-6 text-white text-center font-bold">
              {t("Password has been Updated Successfully")}
            </p>
            <Button
              className="w-full bg-blue1 hover:bg-blue2"
              onClick={() => router.push("/login")}
            >
              {t("Back to Login")}
            </Button>
          </div>
        </div>
      ) : (
        <div className="flex flex-col h-full items-center">
          <div className="flex flex-col w-3/4 items-start mt-8 mb-8">
            <h1 className="text-2xl font-bold text-white text-start">
              {t("Reset Your Password")}
            </h1>
            <p className="text-white">{t("Instruction")}</p>
          </div>
          <div className="flex flex-col justify-center mt-8 w-3/4 h-2/4">
            <Form {...form}>
              <form
                onSubmit={form.handleSubmit(onSubmit)}
                className="space-y-6"
                autoComplete="off"
              >
                <FormField
                  control={form.control}
                  name="password"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-white">
                        {t("New Password")}
                      </FormLabel>
                      <FormControl>
                        <div className="relative">
                          <Input
                            type={showPassword ? "text" : "password"} // Toggle password visibility
                            placeholder={t("Enter your new password")}
                            {...field}
                            className="text-white bg-black/10 backdrop-blur-[1px] border border-gray-300 rounded-lg h-10"
                          />
                          <button
                            type="button"
                            className="absolute right-2 top-1/2 transform -translate-y-1/2 text-white"
                            onClick={() => setShowPassword((prev) => !prev)} // Toggle show password
                          >
                            {showPassword ? <Eye /> : <EyeOff />}{" "}
                            {/* Show icons instead of text */}
                          </button>
                        </div>
                      </FormControl>
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="confirmPassword"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-white">
                        {t("Confirm Password")}
                      </FormLabel>
                      <FormControl>
                        <div className="relative">
                          <Input
                            type={showConfirmPassword ? "text" : "password"} // Toggle password visibility
                            placeholder={t("Re-enter your new password")}
                            {...field}
                            className="text-white bg-black/10 backdrop-blur-[1px] border border-gray-300 rounded-lg h-10"
                          />
                          <button
                            type="button"
                            className="absolute right-2 top-1/2 transform -translate-y-1/2 text-white"
                            onClick={() =>
                              setShowConfirmPassword((prev) => !prev)
                            } // Toggle show password
                          >
                            {showConfirmPassword ? <Eye /> : <EyeOff />}{" "}
                            {/* Show icons instead of text */}
                          </button>
                        </div>
                      </FormControl>
                    </FormItem>
                  )}
                />
                <Button
                  type="submit"
                  className="w-full bg-blue1 hover:bg-blue2"
                >
                  {t("Reset Password")}
                </Button>
              </form>
            </Form>
          </div>
        </div>
      )}
    </div>
  );
}
