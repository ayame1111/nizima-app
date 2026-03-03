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
