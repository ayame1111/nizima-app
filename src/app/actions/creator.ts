'use server';

import { prisma } from "@/lib/prisma";
import { auth } from "@/auth";
import { sendEmail } from "@/lib/email";
import { z } from "zod";

const ApplicationSchema = z.object({
  sellerName: z.string().min(2, "Seller Name is required"),
  contactInfo: z.string().min(5, "Contact info is required"),
  portfolio: z.string().min(5, "Please provide at least one portfolio link"),
  workSamples: z.string().min(10, "Please provide work samples"),
  style: z.string().min(2, "Please describe your style"),
  priceRange: z.string(),
  intro: z.string().min(10, "Please provide a short intro"),
  // Checkboxes will be collected as array from formData manually if needed, 
  // but Zod handles FormData entries as single values usually unless handled specifically.
  // We'll treat 'modelTypes' as a comma-separated string or handle it in the function body.
});

export async function submitCreatorApplication(prevState: any, formData: FormData) {
  const session = await auth();
  
  if (!session?.user?.email) {
    return { error: "You must be logged in to apply." };
  }

  // Handle checkboxes manually
  const modelTypes = formData.getAll('modelTypes').join(', ');
  
  const rawData = Object.fromEntries(formData.entries());
  // safeParse might fail on modelTypes if it expects array but gets string from Object.fromEntries (which takes last value)
  // So we pass everything but rely on our manual extraction for arrays
  
  const validatedFields = ApplicationSchema.safeParse(rawData);

  if (!validatedFields.success) {
    return { error: validatedFields.error.issues[0].message };
  }

  const { sellerName, contactInfo, portfolio, workSamples, style, priceRange, intro } = validatedFields.data;

  try {
      // Email to Admin
      await sendEmail({
        to: "contact@avataratelier.com",
        subject: `New Creator Application: ${sellerName} (${session.user.email})`,
        html: `
            <h1>New Creator Application</h1>
            <p><strong>User:</strong> ${session.user.name} (${session.user.email})</p>
            <p><strong>Seller Name:</strong> ${sellerName}</p>
            <p><strong>Contact:</strong> ${contactInfo}</p>
            <hr>
            <h3>Portfolio Links:</h3>
            <pre>${portfolio}</pre>
            
            <h3>Work Samples:</h3>
            <pre>${workSamples}</pre>
            
            <h3>Model Types:</h3>
            <p>${modelTypes}</p>
            
            <h3>Style / Niche:</h3>
            <p>${style}</p>
            
            <h3>Price Range:</h3>
            <p>${priceRange}</p>
            
            <h3>Intro:</h3>
            <p>${intro}</p>
            <hr>
            <p>To approve this user, use the admin dashboard.</p>
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
