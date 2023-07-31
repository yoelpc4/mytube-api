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

async function register(dto: RegisterDto) {
    const user = await db.client.$transaction(async tx => tx.user.create({
        data: {
            name: dto.name,
            username: dto.username,
            email: dto.email,
            password: await hash(dto.password),
        },
    }))

    return signAccessToken(user.id)
}

async function login(dto: LoginDto) {
    const user = await db.client.user.findUnique({
        select: {
            id: true,
            password: true,
        },
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

    return signAccessToken(user.id)
}

async function updateProfile(dto: UpdateProfileDto, user: User) {
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

async function updatePassword(dto: UpdatePasswordDto, user: User) {
    await db.client.user.update({
        data: {
            password: await hash(dto.password),
        },
        where: {
            id: user.id,
        },
    })
}

async function forgotPassword(dto: ForgotPasswordDto) {
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

    const url = new URL(`${process.env.FRONTEND_URL}/reset-password`)
    url.searchParams.set('email', dto.email)
    url.searchParams.set('token', token)

    const data = {
        name: user?.name,
        link: url.href,
    }

    const templatePath = join(cwd(), 'src', 'templates', 'resetPassword.handlebars')

    return await mail.send(dto.email, 'Password Reset Request', data, templatePath)
}

async function resetPassword(dto: ResetPasswordDto) {
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

function signAccessToken(id: number) {
    const payload: JwtPayload = {
        sub: id.toString(),
        exp: DateTime.now().plus({hour: 1}).toUnixInteger(),
        iat: DateTime.now().toUnixInteger(),
        iss: process.env.JWT_ISSUER,
    }

    return sign(payload, process.env.JWT_SECRET ?? 'secret')
}

export {
    register,
    login,
    updateProfile,
    updatePassword,
    forgotPassword,
    resetPassword,
}
