'use server'
import { signIn } from "@/auth"
import { AuthError } from "next-auth"

import { getIp } from "@/lib/ip";
import { prisma } from "@/lib/prisma";

export async function authenticate(prevState: string | undefined, formData: FormData) {
  try {
    const formDataObj = Object.fromEntries(formData);
    const redirectTo = (formDataObj.redirectTo as string) || '/';
    const email = formDataObj.email as string;
    
    await signIn('credentials', {
        ...formDataObj,
        redirectTo,
    })

    // If signIn is successful (doesn't throw), we can log the IP
    // Note: signIn throws redirect on success, so this code might not run unless we handle it carefully.
    // However, since signIn throws, we can't put logic AFTER it easily for success.
    // But we can try to update the IP *before* if we verify credentials manually, but that duplicates logic.
    // Alternatively, we can use a separate useEffect in the client to log IP after successful session,
    // but server-side is more reliable.
    // Given NextAuth architecture, the most reliable way to log IP on login is actually in the `authorize` callback
    // if we could access headers, or here if we catch the redirect.
    
  } catch (error) {
    // Check if it's a redirect (successful login)
    if (error instanceof Error && error.message === 'NEXT_REDIRECT') {
        // This is actually a success case in Next.js server actions
        try {
            const ip = await getIp();
            const email = formData.get('email') as string;
            if (email) {
                await prisma.user.update({
                    where: { email: email.toLowerCase() },
                    data: { lastLoginIp: ip }
                });
            }
        } catch (e) {
            console.error('Failed to log login IP', e);
        }
        throw error;
    }

    if (error instanceof AuthError) {
      switch (error.type) {
        case 'CredentialsSignin':
          return 'Invalid credentials.'
        default:
          return 'Something went wrong.'
      }
    }
    throw error
  }
}
