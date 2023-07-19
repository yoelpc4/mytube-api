import { CustomValidator } from 'express-validator';
import { prisma } from '@/common/services';

export const IsEmailUniqueIgnoreAuthUserValidator: CustomValidator = async (input, { req }) => {
    const user = await prisma.user.findFirst({
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
