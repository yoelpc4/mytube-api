import { CustomValidator } from 'express-validator'
import { db } from '@/utils'

export const IsEmailUniqueIgnoreAuthUserValidator: CustomValidator = async (input, { req }) => {
    const user = await db.client.user.findFirst({
        select: {
            id: true,
        },
        where: {
            email: input,
            id: {
                not: req.user.id,
            },
        },
    })

    if (user) {
        throw new Error('Email has already been taken')
    }

    return true
}
