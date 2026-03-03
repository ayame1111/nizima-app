'use server'

import { auth } from "@/auth"
import { prisma } from "@/lib/prisma"
import bcrypt from "bcryptjs"
import { revalidatePath } from "next/cache"

export async function updatePassword(formData: FormData) {
  const session = await auth()
  if (!session?.user?.email) {
    return { error: "Not authenticated" }
  }

  const currentPassword = formData.get("currentPassword") as string
  const newPassword = formData.get("newPassword") as string
  const confirmPassword = formData.get("confirmPassword") as string

  if (newPassword !== confirmPassword) {
    return { error: "New passwords do not match" }
  }

  if (newPassword.length < 6) {
    return { error: "Password must be at least 6 characters" }
  }

  const user = await prisma.user.findUnique({
    where: { email: session.user.email }
  })

  if (!user || !user.password) {
    return { error: "User not found" }
  }

  const passwordsMatch = await bcrypt.compare(currentPassword, user.password)

  if (!passwordsMatch) {
    return { error: "Incorrect current password" }
  }

  const hashedPassword = await bcrypt.hash(newPassword, 10)

  await prisma.user.update({
    where: { email: session.user.email },
    data: { password: hashedPassword }
  })

  revalidatePath("/account")
  return { success: "Password updated successfully" }
}
