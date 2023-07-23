import { CustomValidator } from 'express-validator';
import { prisma } from '@/common/services';
import { DateTime } from 'luxon';

export const IsResetPasswordTokenNotRecentlyCreatedValidator: CustomValidator = async input => {
    const resetPassword = await prisma.resetPassword.findFirst({
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
