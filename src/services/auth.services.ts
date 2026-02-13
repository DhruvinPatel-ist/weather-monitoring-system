// src/services/auth.service.ts
import api from "../app/api/api";

export interface LoginPayload {
  email: string;
  password: string;
  rememberMe: boolean; // ← Changed from string to boolean
}

export interface UaeLoginPayload {
  code: string;
  state: string;
  rememberMe: boolean; // ← Changed from string to boolean
}

// Update this interface to match your actual API response
export interface LoginResponse {
  token: string;
  user: {
    id: string;
    name: string;
    email: string;
    // Add any other user properties that might be needed
  };
}

export interface ForgetPasswordResponse {
  message: string;
  sessionId: string;
}

export const login = async ({
  email,
  password,
  rememberMe,
}: LoginPayload): Promise<LoginResponse> => {
  try {
    console.log("Sending login request with:", {
      email,
      password,
      rememberMe,
    });

    const response = await api.post("/login", {
      email,
      password,
      rememberMe, // This will now be properly passed as boolean
    });

    return response.data;
  } catch (error) {
    console.error("Login API error:", error);
    throw error;
  }
};

export const uaepasslogin = async ({
  code,
  state,
  rememberMe,
}: UaeLoginPayload): Promise<LoginResponse> => {
  try {
    console.log("Sending login request with:", {
      code,
      state,
      rememberMe,
    });

    const response = await api.post("/uaepass/callback", {
      code,
      state,
      rememberMe, // This will now be properly passed as boolean
    });

    return response.data;
  } catch (error) {
    console.error("Login API error:", error);
    throw error;
  }
};

export const forgetPassword = async (
  email: string
): Promise<ForgetPasswordResponse> => {
  try {
    const response = await api.post("/forgot-password", { email });
    return response.data;
  } catch (error) {
    console.error("Forget Password API error:", error);
    throw error;
  }
};
