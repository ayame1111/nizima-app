import { PrismaClient } from '@prisma/client'
import { PrismaBetterSqlite3 } from '@prisma/adapter-better-sqlite3'

const globalForPrisma = global as unknown as { prisma: PrismaClient }

const makePrisma = () => {
  const dbUrl = process.env.DATABASE_URL || 'file:./dev.db';
  // Remove 'file:' prefix if present, as better-sqlite3 expects a path
  const filename = dbUrl.replace(/^file:/, '');
  
  const adapter = new PrismaBetterSqlite3({
    url: filename
  });
  
  return new PrismaClient({ adapter });
}

export const prisma = globalForPrisma.prisma || makePrisma()

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma
