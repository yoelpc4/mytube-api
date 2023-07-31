import { CustomValidator } from 'express-validator'
import { db } from '@/utils'

export const IsEmailExistsValidator: CustomValidator = async input => {
    const user = await db.client.user.findUnique({
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
