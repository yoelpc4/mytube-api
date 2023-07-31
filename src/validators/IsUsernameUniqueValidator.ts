import { CustomValidator } from 'express-validator'
import { db } from '@/utils'

export const IsUsernameUniqueValidator: CustomValidator = async input => {
    const user = await db.client.user.findUnique({
        select: {
            id: true,
        },
        where: {
            username: input,
        },
    })

    if (user) {
        throw new Error('Username has already been taken')
    }

    return true
}
