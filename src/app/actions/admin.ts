'use server'

import { auth } from "@/auth"
import { prisma } from "@/lib/prisma"
import { revalidatePath } from "next/cache"

export async function updateUserRole(formData: FormData) {
    const session = await auth()
    // @ts-ignore
    if (session?.user?.role !== 'ADMIN') {
        return { error: "Unauthorized" }
    }
    
    const userId = formData.get('userId') as string
    const newRole = formData.get('role') as string

    if (!userId || !newRole) return { error: "Missing fields" }

    await prisma.user.update({
        where: { id: userId },
        data: { role: newRole }
    })
    
    revalidatePath('/admin/users')
    return { success: true }
}

export async function assignCreatorRoleByEmail(formData: FormData) {
    const session = await auth()
    // @ts-ignore
    if (session?.user?.role !== 'ADMIN') {
        return { error: "Unauthorized" }
    }
    
    const email = formData.get('email') as string
    
    if (!email) return { error: "Email is required" }

    const user = await prisma.user.findUnique({
        where: { email }
    })

    if (!user) {
        return { error: "User not found" }
    }

    await prisma.user.update({
        where: { id: user.id },
        data: { role: 'CREATOR' }
    })
    
    revalidatePath('/admin/users')
    return { success: true, message: `Role updated for ${user.email}` }
}
