// hooks/useLogin.ts
import { useMutation, UseMutationResult } from "@tanstack/react-query";
import {
  login,
  forgetPassword,
  LoginPayload,
  LoginResponse,
  ForgetPasswordResponse,
} from "../services/auth.services";

export const useLogin = (): UseMutationResult<
  LoginResponse,
  Error,
  LoginPayload
> => {
  return useMutation<LoginResponse, Error, LoginPayload>({
    mutationFn: login,
  });
};

export const useForgetPassword = (): UseMutationResult<
  ForgetPasswordResponse,
  Error,
  string
> => {
  return useMutation<ForgetPasswordResponse, Error, string>({
    mutationFn: forgetPassword,
  });
};
