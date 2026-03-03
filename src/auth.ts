import NextAuth from "next-auth"
import Credentials from "next-auth/providers/credentials"
import { prisma } from "@/lib/prisma"
import bcrypt from "bcryptjs"
import { z } from "zod"

export const { handlers, signIn, signOut, auth } = NextAuth({
  trustHost: true,
  providers: [
    Credentials({
      async authorize(credentials) {
        const parsedCredentials = z
          .object({ email: z.string().email(), password: z.string().min(6) })
          .safeParse(credentials);

        if (parsedCredentials.success) {
          const { email, password } = parsedCredentials.data;
          const normalizedEmail = email.toLowerCase();
          const user = await prisma.user.findUnique({ where: { email: normalizedEmail } });
          
          if (!user) {
            console.log('User not found:', normalizedEmail);
            return null;
          }
          
          if (!user.password) {
             console.log('User has no password (OAuth?):', normalizedEmail);
             return null;
          }

          const passwordsMatch = await bcrypt.compare(password, user.password);

          if (passwordsMatch) {
            console.log('User authenticated:', normalizedEmail);
            return user;
          } else {
            console.log('Invalid password for:', normalizedEmail);
          }
        } else {
            console.log('Invalid credentials format');
        }

        return null;
      },
    }),
  ],
  pages: {
    signIn: '/login',
  },
  callbacks: {
    async session({ session, token }) {
      if (session?.user && token.sub) {
        // @ts-ignore
        session.user.id = token.sub;
        // @ts-ignore
        session.user.role = token.role;
      }
      return session;
    },
    async jwt({ token, user }) {
        if (user) {
            token.sub = user.id;
            // @ts-ignore
            token.role = user.role;
        }
        return token;
    }
  },
  session: {
    strategy: "jwt",
  },
})
