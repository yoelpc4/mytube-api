import { PrismaClient } from '@prisma/client'

const globalClient: { client: PrismaClient } = global as unknown as { client: PrismaClient }

const client: PrismaClient = globalClient.client || new PrismaClient({ log: ['query'] })

if (process.env.NODE_ENV !== 'production') {
    globalClient.client = client
}

export {
    client,
}
