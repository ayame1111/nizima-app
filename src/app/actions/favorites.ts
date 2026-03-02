'use server'

import { auth } from "@/auth"
import { prisma } from "@/lib/prisma"
import { revalidatePath } from "next/cache"

export async function toggleFavorite(productId: string) {
  const session = await auth()
  
  if (!session?.user?.id) {
    return { error: "Unauthorized" }
  }

  const userId = session.user.id

  // Check if already favorited
  const existing = await prisma.user.findFirst({
    where: {
      id: userId,
      favorites: {
        some: {
          id: productId
        }
      }
    }
  })

  if (existing) {
    // Unfavorite
    await prisma.user.update({
      where: { id: userId },
      data: {
        favorites: {
          disconnect: { id: productId }
        }
      }
    })
    revalidatePath('/')
    return { favorited: false }
  } else {
    // Favorite
    await prisma.user.update({
      where: { id: userId },
      data: {
        favorites: {
          connect: { id: productId }
        }
      }
    })
    revalidatePath('/')
    return { favorited: true }
  }
}
