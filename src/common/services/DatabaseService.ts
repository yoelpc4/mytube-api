import { PrismaClient } from '@prisma/client'

const globalForPrisma: { prisma: PrismaClient } = global as unknown as { prisma: PrismaClient }

export const prisma: PrismaClient = globalForPrisma.prisma || new PrismaClient({ log: ['query'] })

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma