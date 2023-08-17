import { User } from '@prisma/client'
import { hash, verify } from 'argon2'
import { randomBytes } from 'crypto'
import { DateTime } from 'luxon'
import { JwtPayload, sign } from 'jsonwebtoken'
import { join } from 'path'
import { cwd } from 'process'
import {
    ForgotPasswordDto,
    LoginDto,
    RegisterDto,
    ResetPasswordDto,
    UpdatePasswordDto,
    UpdateProfileDto
} from '@/dto'
import { UnauthorizedException } from '@/exceptions'
import { db, mail } from '@/utils'

const signAccessToken = (id: number) => {
    const issuer = process.env.JWT_ISSUER

    if (!issuer) {
        throw new Error('Undefined JWT issuer')
    }

    const secret = process.env.JWT_SECRET

    if (!secret) {
        throw new Error('Undefined JWT secret')
    }

    const now = DateTime.now()

    const payload: JwtPayload = {
        sub: id.toString(),
        exp: now.plus({hour: 1}).toUnixInteger(),
        iat: now.toUnixInteger(),
        iss: issuer,
    }

    return sign(payload, secret)
}

const register = async (dto: RegisterDto) => {
    const user = await db.client.$transaction(async tx => tx.user.create({
        data: {
            name: dto.name,
            username: dto.username,
            email: dto.email,
            password: await hash(dto.password),
        },
    }))

    const accessToken = signAccessToken(user.id)

    return {
        accessToken,
        user,
    }
}

const login = async (dto: LoginDto) => {
    const user = await db.client.user.findUnique({
        where: {
            username: dto.username,
        },
    })

    if (!user) {
        throw new UnauthorizedException()
    }

    const isPasswordMatch = await verify(user.password, dto.password)

    if (!isPasswordMatch) {
        throw new UnauthorizedException()
    }

    const accessToken = signAccessToken(user.id)

    return {
        accessToken,
        user,
    }
}

const updateProfile = async (dto: UpdateProfileDto, user: User) => {
    return await db.client.user.update({
        data: {
            name: dto.name,
            username: dto.username,
            email: dto.email,
        },
        where: {
            id: user.id,
        },
    })
}

const updatePassword = async (dto: UpdatePasswordDto, user: User) => {
    await db.client.user.update({
        data: {
            password: await hash(dto.password),
        },
        where: {
            id: user.id,
        },
    })
}

const forgotPassword = async (dto: ForgotPasswordDto) => {
    const user = await db.client.user.findUnique({
        select: {
            name: true,
        },
        where: {
            email: dto.email,
        },
    })

    await db.client.resetPassword.deleteMany({
        where: {
            email: dto.email,
        },
    })

    const token = randomBytes(32).toString('hex')

    await db.client.resetPassword.create({
        data: {
            email: dto.email,
            token: await hash(token),
        },
    })

    const url = new URL(`${process.env.APP_URL}/reset-password`)
    url.searchParams.set('email', dto.email)
    url.searchParams.set('token', token)

    const data = {
        name: user?.name,
        link: url.href,
    }

    const templatePath = join(cwd(), 'src', 'templates', 'resetPassword.handlebars')

    return await mail.send(dto.email, 'Password Reset Request', data, templatePath)
}

const resetPassword = async (dto: ResetPasswordDto) => {
    await db.client.user.update({
        data: {
            password: await hash(dto.password),
        },
        where: {
            email: dto.email,
        },
    })

    await db.client.resetPassword.deleteMany({
        where: {
            email: dto.email,
        },
    })
}

export {
    register,
    login,
    updateProfile,
    updatePassword,
    forgotPassword,
    resetPassword,
}
