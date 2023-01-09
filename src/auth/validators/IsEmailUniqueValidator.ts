import { CustomValidator } from 'express-validator';
import { prisma } from '../../common/services';

export const IsEmailUniqueValidator: CustomValidator = async value => {
    const user = await prisma.user.findUnique({
        select: {
            id: true,
        },
        where: {
            email: value,
        },
    })

    if (user) {
        throw new Error('Email has already been taken')
    }

    return true
}
