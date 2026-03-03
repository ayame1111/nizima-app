'use server'

import { prisma } from "@/lib/prisma"
import bcrypt from "bcryptjs"
import { z } from "zod"
import crypto from "crypto"

const RegisterSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
  name: z.string().min(2),
})

export async function register(prevState: any, formData: FormData) {
  const validatedFields = RegisterSchema.safeParse(Object.fromEntries(formData.entries()))

  if (!validatedFields.success) {
    return { error: "Invalid fields" }
  }

  const { email, password, name } = validatedFields.data
  const normalizedEmail = email.toLowerCase()

  const existingUser = await prisma.user.findUnique({
    where: { email: normalizedEmail },
  })

  if (existingUser) {
    return { error: "Email already in use" }
  }

  const hashedPassword = await bcrypt.hash(password, 10)

  await prisma.user.create({
    data: {
      email: normalizedEmail,
      password: hashedPassword,
      name,
    },
  })

  return { success: "User created!" }
}

const ForgotPasswordSchema = z.object({
  email: z.string().email(),
})

export async function forgotPassword(prevState: any, formData: FormData) {
  const validatedFields = ForgotPasswordSchema.safeParse(Object.fromEntries(formData.entries()))

  if (!validatedFields.success) {
    return { error: "Invalid email" }
  }

  const { email } = validatedFields.data
  const normalizedEmail = email.toLowerCase()

  const user = await prisma.user.findUnique({
    where: { email: normalizedEmail },
  })

  if (!user) {
    // Return success to avoid enumeration attacks
    return { success: "If an account exists, a reset link has been sent." }
  }

  const token = crypto.randomBytes(32).toString("hex")
  const expiry = new Date(Date.now() + 3600000) // 1 hour

  await prisma.user.update({
    where: { email: normalizedEmail },
    data: {
      resetToken: token,
      resetTokenExpiry: expiry,
    },
  })

  // In a real app, send email here.
  // For now, log the reset link to the server console so the user can see it in logs.
  console.log(`[PASSWORD RESET] Link for ${normalizedEmail}: ${process.env.NEXTAUTH_URL || 'http://localhost:3000'}/reset-password?token=${token}`)

  return { success: "If an account exists, a reset link has been sent." }
}

const ResetPasswordSchema = z.object({
  token: z.string(),
  password: z.string().min(6),
})

export async function resetPassword(prevState: any, formData: FormData) {
  const validatedFields = ResetPasswordSchema.safeParse(Object.fromEntries(formData.entries()))

  if (!validatedFields.success) {
    return { error: "Invalid fields" }
  }

  const { token, password } = validatedFields.data

  const user = await prisma.user.findFirst({
    where: {
      resetToken: token,
      resetTokenExpiry: { gt: new Date() },
    },
  })

  if (!user) {
    return { error: "Invalid or expired token" }
  }

  const hashedPassword = await bcrypt.hash(password, 10)

  await prisma.user.update({
    where: { id: user.id },
    data: {
      password: hashedPassword,
      resetToken: null,
      resetTokenExpiry: null,
    },
  })

  return { success: "Password reset successfully! You can now login." }
}
