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
            // We can't easily get request headers here in NextAuth v5 authorize callback directly
            // IP logging will be handled by a separate server action or middleware if needed
            // But for now we will rely on the session callback or login action wrapper if we had one.
            // Actually, we can update LastLogin in the database here but we don't have the IP easily.
            // A better place is the jwt callback if it receives request info, or a separate login action.
            
            // Update last login time
            await prisma.user.update({
                where: { id: user.id },
                data: { lastLoginAt: new Date() }
            });
            
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
        // @ts-ignore
        session.user.slug = token.slug;
      }
      return session;
    },
    async jwt({ token, user }) {
        if (user) {
            token.sub = user.id;
            // @ts-ignore
            token.role = user.role;
            // @ts-ignore
            token.slug = user.slug;
        }
        return token;
    }
  },
  session: {
    strategy: "jwt",
  },
})
