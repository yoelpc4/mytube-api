import { CustomValidator } from 'express-validator'
import { db } from '@/utils'

export const IsEmailUniqueValidator: CustomValidator = async input => {
    const user = await db.client.user.findUnique({
        select: {
            id: true,
        },
        where: {
            email: input,
        },
    })

    if (user) {
        throw new Error('Email has already been taken')
    }

    return true
}
