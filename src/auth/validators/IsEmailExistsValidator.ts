import { CustomValidator } from 'express-validator';
import { prisma } from '@/common/services';

export const IsEmailExistsValidator: CustomValidator = async input => {
    const user = await prisma.user.findUnique({
        select: {
            id: true,
        },
        where: {
            email: input,
        },
    })

    if (!user) {
        throw new Error("We can't find a user with that email")
    }

    return true
}
