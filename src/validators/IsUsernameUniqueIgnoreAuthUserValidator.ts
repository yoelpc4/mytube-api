import { CustomValidator } from 'express-validator'
import { db } from '@/utils'

export const IsUsernameUniqueIgnoreAuthUserValidator: CustomValidator = async (input, { req }) => {
    const user = await db.client.user.findFirst({
        select: {
            id: true,
        },
        where: {
            username: input,
            id: {
                not: req.user.id,
            },
        },
    })

    if (user) {
        throw new Error('Username has already been taken')
    }

    return true
}
