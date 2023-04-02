import { CustomValidator } from 'express-validator';
import { prisma } from '../../common/services';

export const IsUsernameUniqueValidator: CustomValidator = async input => {
    const user = await prisma.user.findUnique({
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
