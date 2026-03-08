'use server';

import { prisma } from '@/lib/prisma';
import { z } from 'zod';

const schema = z.object({
  email: z.string().email(),
});

export async function subscribeToNewsletter(prevState: any, formData: FormData) {
  const email = formData.get('email');
  
  const validatedFields = schema.safeParse({ email });
  
  if (!validatedFields.success) {
    return {
      message: 'Invalid email address',
      success: false,
    };
  }
  
  const { email: validatedEmail } = validatedFields.data;
  
  try {
    const existingSubscriber = await prisma.newsletterSubscriber.findUnique({
      where: { email: validatedEmail },
    });
    
    if (existingSubscriber) {
      if (!existingSubscriber.isActive) {
        await prisma.newsletterSubscriber.update({
          where: { email: validatedEmail },
          data: { isActive: true },
        });
        return { message: 'Welcome back! You have been resubscribed.', success: true };
      }
      return { message: 'You are already subscribed.', success: true };
    }
    
    await prisma.newsletterSubscriber.create({
      data: { email: validatedEmail },
    });
    
    return { message: 'Thank you for subscribing!', success: true };
  } catch (error) {
    console.error('Newsletter subscription error:', error);
    return { message: 'Something went wrong. Please try again.', success: false };
  }
}
