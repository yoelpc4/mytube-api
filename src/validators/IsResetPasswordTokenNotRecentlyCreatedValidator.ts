import { CustomValidator } from 'express-validator'
import { DateTime } from 'luxon'
import { db } from '@/utils'

export const IsResetPasswordTokenNotRecentlyCreatedValidator: CustomValidator = async input => {
    const resetPassword = await db.client.resetPassword.findFirst({
        select: {
          createdAt: true,
        },
        where: {
            email: input,
        },
    })

    const isRecentlyCreated = (createdAt: Date) => DateTime.fromJSDate(createdAt).plus({minute: 1}) >= DateTime.now()

    if (resetPassword && isRecentlyCreated(resetPassword.createdAt)) {
        throw new Error('Please wait before retrying')
    }

    return true
}
