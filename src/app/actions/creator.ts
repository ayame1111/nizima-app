'use server';

import { prisma } from "@/lib/prisma";
import { auth } from "@/auth";
import { sendEmail } from "@/lib/email";
import { z } from "zod";

const ApplicationSchema = z.object({
  portfolio: z.string().min(10, "Please provide at least one link"),
  experience: z.string(),
  motivation: z.string().min(10, "Please tell us a bit more about your motivation"),
});

export async function submitCreatorApplication(prevState: any, formData: FormData) {
  const session = await auth();
  
  if (!session?.user?.email) {
    return { error: "You must be logged in to apply." };
  }

  const validatedFields = ApplicationSchema.safeParse(Object.fromEntries(formData.entries()));

  if (!validatedFields.success) {
    return { error: "Please fill in all fields correctly." };
  }

  const { portfolio, experience, motivation } = validatedFields.data;
  const portfolioLinks = portfolio;
  const experienceLevel = experience;
  const motivationText = motivation;

  // In a real app, you would save this to a "CreatorApplication" table in Prisma.
  // For now, we'll just email the admin about it.

  try {
      // Email to Admin
      await sendEmail({
        to: process.env.SMTP_USER || "admin@avataratelier.com", // Send to admin
        subject: `New Creator Application: ${session.user.name || session.user.email}`,
        html: `
            <h1>New Creator Application</h1>
            <p><strong>User:</strong> ${session.user.name} (${session.user.email})</p>
            <p><strong>Experience:</strong> ${experienceLevel}</p>
            <h3>Portfolio:</h3>
            <pre>${portfolioLinks}</pre>
            <h3>Motivation:</h3>
            <p>${motivationText}</p>
            <hr>
            <p>To approve this user, use the admin promotion link.</p>
        `
      });

      // Confirmation email to user
      await sendEmail({
          to: session.user.email,
          subject: "Application Received - Avatar Atelier",
          html: `
            <h1>Application Received</h1>
            <p>Hi ${session.user.name || 'there'},</p>
            <p>We have received your application to become a creator on Avatar Atelier.</p>
            <p>Our team will review your portfolio and get back to you soon.</p>
            <p>Best,<br>The Avatar Atelier Team</p>
          `
      });

      return { success: true };
  } catch (error) {
      console.error("Failed to submit application:", error);
      return { error: "Failed to submit application. Please try again later." };
  }
}
