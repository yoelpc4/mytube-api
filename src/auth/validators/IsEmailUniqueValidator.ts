import { CustomValidator } from 'express-validator';
import { prisma } from '@/common/services';

export const IsEmailUniqueValidator: CustomValidator = async input => {
    const user = await prisma.user.findUnique({
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
