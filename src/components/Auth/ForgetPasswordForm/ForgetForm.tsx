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
import { useForgetPassword } from "@/hooks/useLogin";
import { toast } from "sonner";

// Schema
const formSchema = z.object({
  email: z.string().email({
    message: "Please enter a valid email address.",
  }),
});

export default function ForgetForm() {
  const router = useRouter();
  const locale = useLocale();
  const isRTL = locale === "ar";
  const t = useTranslations("ForgotPassword");
  const loginT = useTranslations("Login");

  const forgetPasswordMutation = useForgetPassword();

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      email: "",
    },
  });

  const onSubmit = (values: z.infer<typeof formSchema>) => {
    forgetPasswordMutation.mutate(values.email, {
      onSuccess: (data) => {
        // ✅ Store sessionId & email in secure cookies for short duration (1 hour)
        Cookies.set("forgetSession", data.sessionId, {
          expires: 1 / 24, // 1 hour
          secure: true,
          sameSite: "Strict",
          httpOnly: true, 
        });

        Cookies.set("email", values.email, {
          expires: 1 / 24,
          secure: true,
          sameSite: "Strict",
          httpOnly: true, 
        });

        // ✅ Navigate to verify page
        router.push("/verify");
      },
      onError: (error) => {
        console.error("Forget password error:", error);
        toast(t("Error"));
      },
    });
  };

  return (
    <div
      className="flex flex-col h-full items-center"
      dir={isRTL ? "rtl" : "ltr"}
    >
      <div className="flex flex-col w-3/4 items-start mt-8 mb-8">
        <h1 className="text-2xl font-bold text-white text-start">
          {loginT("Forgot Password")}
        </h1>
        <p className="text-white">
          {t(
            "Enter your email address below, and we'll send you a link to reset your password"
          )}
        </p>
      </div>

      <div className="flex flex-col justify-center mt-8 w-3/4 h-2/4">
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6" autoComplete="off">
            <FormField
              control={form.control}
              name="email"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-white">
                    {loginT("Email")}
                  </FormLabel>
                  <FormControl>
                    <Input
                      placeholder={loginT("emailPlaceholder")}
                      {...field}
                      className="text-white bg-black/10 backdrop-blur-[1px] border border-gray-300 rounded-lg h-10"
                    />
                  </FormControl>
                </FormItem>
              )}
            />

            <Button
              type="submit"
              disabled={forgetPasswordMutation.isPending}
              className="w-full bg-blue1 hover:bg-blue2"
            >
              {t("Send Request")}
            </Button>
            <Button
              type="button"
              onClick={() => router.push("/")}
              className="w-full bg-blue1 hover:bg-blue3"
            >
              {t("Back to Login")}
            </Button>
          </form>
        </Form>
      </div>
    </div>
  );
}
