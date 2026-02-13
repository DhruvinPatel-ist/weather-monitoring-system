import { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import { login,uaepasslogin } from "@/services/auth.services";

export const authOptions: NextAuthOptions = {
  providers: [
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        email: { label: "Email", type: "text" },
        password: { label: "Password", type: "password" },
        rememberMe: { label: "Remember Me", type: "checkbox" }, // Keep the rememberMe checkbox
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) return null;

        try {
          const response = await login({
            email: credentials.email,
            password: credentials.password,
            rememberMe: credentials.rememberMe === "true",
          });

          // Check if the response contains a token and handle the user object accordingly
          if (response && response.token) {
            return {
              id: "user-id", // Replace with the actual user ID if available
              name: credentials.email.split("@")[0], // This is just an example
              email: credentials.email,
              accessToken: response.token,
              rememberMe: credentials.rememberMe === "true",
            };
          }

          return null; // If no response token, return null
        } catch (err) {
          console.error("Login failed:", err); // Log the error for debugging
          return null; // In case of error, return null
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
            } catch (err:any) {
             // console.error("Login failed:", err);
             if (err?.response?.data?.message === "usernotfound") {
                throw new Error("usernotfound");
              }
              else if (err?.response?.data?.message === "userinactive") {
                throw new Error("userinactive");
              }
              else if (err?.response?.data?.message === "newusercreated") {
                throw new Error("newusercreated");
              }
              
              else if (err?.response?.data?.message === "sop1userfound") {
                throw new Error("sop1userfound");
              }
              throw new Error(err?.message || "Unexpected error");
            }
          },
        }),
  ],
  session: {
    strategy: "jwt", // Using JWT-based sessions
  },
   /* cookies: {
    sessionToken: {
      name: `__Secure-next-auth.session-token`,
      options: {
        httpOnly: true,
        sameSite: "lax", // or 'strict' for more security
        path: "/",
        secure: process.env.NODE_ENV === "production", // only send over HTTPS
      },
    },
  },  */
  callbacks: {
    // Store the token and email in the JWT token
    async jwt({ token, user }) {
      if (user) {
        token.accessToken = user.accessToken; // Store accessToken in the JWT token
        token.email = user.email; // Store email in the JWT token
      }
      return token;
    },

    // Attach the JWT token information to the session object
    async session({ session, token }) {
      if (token?.accessToken) {
        session.accessToken = token.accessToken as string; // Attach the accessToken to the session
      }
      if (token?.email) {
        session.user = {
          ...session.user,
          email: token.email as string, // Attach email to the session user
        };
      }
      return session; // Return the updated session object
    },
  },
  pages: {
    signIn: "/",
    error: "/", // Redirect to the login page if there's an error
  },
  secret: process.env.NEXTAUTH_SECRET, // Ensure the secret is set in environment variables
};
