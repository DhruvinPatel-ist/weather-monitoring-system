import NextAuth, { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import { login,uaepasslogin } from "@/services/auth.services";

export const authOptions: NextAuthOptions = {
  providers: [
    // --- Normal Login ---
    CredentialsProvider({
      id: "credentials",
      name: "Credentials",
      credentials: {
        email: { label: "Email", type: "text" },
        password: { label: "Password", type: "password" },
        rememberMe: { label: "Remember Me", type: "checkbox" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          throw new Error("Email and Password are required");
        }
        try {
          const userData = await login({
            email: credentials.email,
            password: credentials.password,
            rememberMe: credentials.rememberMe === "true",
          });

          return {
            id: userData.user.id,
            name: userData.user.name,
            email: userData.user.email,
            accessToken: userData.token,
            rememberMe: credentials.rememberMe === "true",
          };
        } catch (err) {
          console.error("Login failed:", err);
          throw new Error("Invalid credentials or network error");
        }
      },
    }),
 CredentialsProvider({
      id: "uaepass",
      name: "UAE Pass",
      credentials: {
        code: { label: "Code", type: "text" },
        state: { label: "State", type: "text" },
        rememberMe: { label: "Remember Me", type: "checkbox" },
      },
      async authorize(credentials) {
        if (!credentials?.code || !credentials?.state) return null;

         try {
          const userData = await uaepasslogin({
            code: credentials.code,
            state: credentials.state,
            rememberMe: true,
          });

          return {
            id: userData.user.id,
            name: userData.user.name,
            email: userData.user.email,
            accessToken: userData.token,
            rememberMe: true,
          };
        } catch (err) {
          console.error("Login failed:", err);
          throw new Error("Invalid credentials or network error");
        }
      },
    }),
  ],

  session: {
    strategy: "jwt",
  },

  callbacks: {
    async jwt({ token, user }: { token: any; user: any }) {
      if (user) {
        token.accessToken = user.accessToken;
        token.rememberMe = user.rememberMe; // Save rememberMe flag in token
      }
      return token;
    },
    async session({ session, token }: { session: any; token: any }) {
      if (token?.accessToken) {
        session.accessToken = token.accessToken;
      }
      if (token?.rememberMe) {
        session.rememberMe = token.rememberMe; // Make sure rememberMe is in the session
      }
      return session;
    },
  },

  pages: {
   signIn: "/",
  },
};

export default NextAuth(authOptions);