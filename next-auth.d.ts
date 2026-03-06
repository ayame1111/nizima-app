import NextAuth from "next-auth"

declare module "next-auth" {
  interface Session {
    user: {
      id: string
      name?: string | null
      email?: string | null
      image?: string | null
      role: string
      slug?: string | null
    }
  }

  interface User {
    role: string
    slug?: string | null
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    role: string
    slug?: string | null
  }
}
