import { verify } from 'argon2';
import { CustomValidator } from 'express-validator';
import { DateTime } from 'luxon';
import { prisma } from '@/common/services';

export const IsResetPasswordTokenValidValidator: CustomValidator = async (input, {req}) => {
    const errorMessage = 'Invalid password reset token, please request another!'

    const resetPassword = await prisma.resetPassword.findFirst({
        select: {
            token: true,
            createdAt: true,
        },
        where: {
            email: input,
        },
    })

    if (!resetPassword) {
        throw new Error(errorMessage)
    }

    const isExpired = DateTime.fromJSDate(resetPassword.createdAt).plus({hour: 1}) < DateTime.now()

    if (isExpired) {
        throw new Error(errorMessage)
    }

    if (!await verify(resetPassword.token, req.body.token)) {
        throw new Error(errorMessage)
    }

    return true
}
