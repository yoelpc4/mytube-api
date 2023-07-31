import { verify } from 'argon2'
import { CustomValidator } from 'express-validator'
import { db } from '@/utils'

export const IsCurrentPasswordMatchValidator: CustomValidator = async (input, {req}) => {
    const user = await db.client.user.findUnique({
        select: {
            id: true,
            password: true,
        },
        where: {
            id: req.user.id,
        },
    })

    if (!user) {
        throw new Error('User not found')
    }

    const isPasswordMatch = await verify(user.password, input)

    if (!isPasswordMatch) {
        throw new Error("Current password doesn't match")
    }

    return true
}
