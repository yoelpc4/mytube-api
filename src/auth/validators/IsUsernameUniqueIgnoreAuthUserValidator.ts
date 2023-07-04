import { CustomValidator } from 'express-validator';
import { prisma } from '../../common/services';

export const IsUsernameUniqueIgnoreAuthUserValidator: CustomValidator = async (input, { req }) => {
    const user = await prisma.user.findFirst({
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
