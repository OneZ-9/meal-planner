import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";

import { normalizeEmail } from "@/lib/auth-validation";
import { connectDB } from "@/lib/mongodb";
import { UserModel } from "@/lib/models/user";

export const { handlers, auth, signIn, signOut } = NextAuth({
  pages: { signIn: "/login" },
  session: { strategy: "jwt" },
  providers: [
    Credentials({
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      authorize: async (credentials) => {
        if (
          typeof credentials.email !== "string" ||
          typeof credentials.password !== "string"
        ) {
          return null;
        }

        await connectDB();
        const user = await UserModel.findOne({
          email: normalizeEmail(credentials.email),
        }).select("+passwordHash");

        if (
          !user ||
          !(await bcrypt.compare(credentials.password, user.passwordHash))
        ) {
          return null;
        }

        return { id: user.id, name: user.name, email: user.email };
      },
    }),
  ],
  callbacks: {
    session: ({ session, token }) => {
      if (session.user && token.sub) {
        session.user.id = token.sub;
      }
      return session;
    },
  },
});
