'use server';

import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { z } from "zod";

const profileSchema = z.object({
  bio: z.string().max(500).optional(),
  socialLinks: z.object({
    twitter: z.string().url().optional().or(z.literal("")),
    youtube: z.string().url().optional().or(z.literal("")),
    website: z.string().url().optional().or(z.literal("")),
    instagram: z.string().url().optional().or(z.literal("")),
  }).optional(),
});

export async function updateProfile(formData: FormData) {
  const session = await auth();
  if (!session?.user?.id) {
    return { error: "Unauthorized" };
  }

  const bio = formData.get("bio") as string;
  const twitter = formData.get("twitter") as string;
  const youtube = formData.get("youtube") as string;
  const website = formData.get("website") as string;
  const instagram = formData.get("instagram") as string;
  
  // Handle banner upload would ideally be here or separate
  // For now, let's assume banner is handled via client-side upload to an endpoint or separate action
  // But to keep it simple, we can skip banner file handling in this server action if we use the existing file-proxy logic
  
  try {
    const socialLinks = {
      twitter: twitter || undefined,
      youtube: youtube || undefined,
      website: website || undefined,
      instagram: instagram || undefined,
    };

    await prisma.user.update({
      where: { id: session.user.id },
      data: {
        bio,
        socialLinks: socialLinks,
      },
    });

    revalidatePath("/profile");
    revalidatePath(`/creator/${session.user.id}`);
    return { success: true };
  } catch (error) {
    console.error("Profile update error:", error);
    return { error: "Failed to update profile" };
  }
}
