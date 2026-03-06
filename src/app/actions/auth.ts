'use server'

import { prisma } from "@/lib/prisma"
import bcrypt from "bcryptjs"
import { z } from "zod"
import crypto from "crypto"
import { sendEmail } from "@/lib/email"

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

  // Generate unique slug from name
  let slug = name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
  if (!slug) slug = `user-${Math.random().toString(36).substring(2, 7)}`;
  
  let uniqueSlug = slug;
  let count = 1;
  while (await prisma.user.findUnique({ where: { slug: uniqueSlug } })) {
    uniqueSlug = `${slug}-${count}`;
    count++;
  }

  const hashedPassword = await bcrypt.hash(password, 10)

  await prisma.user.create({
    data: {
      email: normalizedEmail,
      password: hashedPassword,
      name,
      slug: uniqueSlug,
    },
  })

  try {
    await sendEmail({
      to: normalizedEmail,
      subject: "Welcome to Avatar Atelier",
      html: `
        <h1>Welcome to Avatar Atelier!</h1>
        <p>Hi ${name},</p>
        <p>Thank you for creating an account. We're excited to have you on board.</p>
        <p>Best regards,<br>The Avatar Atelier Team</p>
      `,
    })
  } catch (error) {
    console.error("Failed to send welcome email:", error)
  }

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
  const resetLink = `${process.env.NEXTAUTH_URL || 'http://localhost:3000'}/reset-password?token=${token}`;
  console.log(`[PASSWORD RESET] Link for ${normalizedEmail}: ${resetLink}`)

  try {
    await sendEmail({
      to: normalizedEmail,
      subject: "Reset your Avatar Atelier password",
      html: `
        <h1>Password Reset Request</h1>
        <p>Someone requested a password reset for your account.</p>
        <p>Click the link below to reset your password:</p>
        <a href="${resetLink}">${resetLink}</a>
        <p>If you didn't request this, you can safely ignore this email.</p>
        <p>This link will expire in 1 hour.</p>
      `,
    })
  } catch (error) {
    console.error("Failed to send reset email:", error)
  }

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
