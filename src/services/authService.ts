import { User } from '@prisma/client'
import { hash, verify as verifyHash } from 'argon2'
import { randomBytes } from 'crypto'
import { DateTime } from 'luxon'
import { JwtPayload, sign, verify as verifyJwt } from 'jsonwebtoken'
import { join } from 'path'
import { cwd } from 'process'
import { ForgotPasswordDto, LoginDto, RefreshTokenDto, RegisterDto, ResetPasswordDto, UpdatePasswordDto } from '@/dto'
import { NotFoundException, UnauthorizedException } from '@/exceptions'
import { db, mail } from '@/utils'

const issuer = process.env.JWT_ISSUER

if (!issuer) {
    throw new Error('Undefined JWT issuer')
}

const accessTokenSecret = process.env.JWT_ACCESS_TOKEN_SECRET

if (!accessTokenSecret) {
    throw new Error('Undefined JWT access token secret')
}

const refreshTokenSecret = process.env.JWT_REFRESH_TOKEN_SECRET

if (!refreshTokenSecret) {
    throw new Error('Undefined JWT refresh token secret')
}

const signAccessToken = (userId: number) => {
    const now = DateTime.now()

    const payload: JwtPayload = {
        sub: userId.toString(),
        exp: now.plus({minutes: 15}).toUnixInteger(),
        iat: now.toUnixInteger(),
        iss: issuer,
    }

    return sign(payload, accessTokenSecret)
}

const signRefreshToken = async (userId: number) => {
    const now = DateTime.now()

    const payload: JwtPayload = {
        sub: userId.toString(),
        exp: now.plus({day: 1}).toUnixInteger(),
        iat: now.toUnixInteger(),
        iss: issuer,
    }

    const refreshToken = sign(payload, refreshTokenSecret)

    await db.client.refreshToken.deleteMany({
        where: {
            userId,
        },
    })

    await db.client.refreshToken.create({
        data: {
            userId,
            token: await hash(refreshToken),
        },
    })

    return refreshToken
}

const register = async (dto: RegisterDto) => {
    const user = await db.client.user.create({
        data: {
            name: dto.name,
            username: dto.username,
            email: dto.email,
            password: await hash(dto.password),
        },
    })

    const accessToken = signAccessToken(user.id)

    const refreshToken = await signRefreshToken(user.id)

    return {
        accessToken,
        refreshToken,
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

    const isPasswordMatch = await verifyHash(user.password, dto.password)

    if (!isPasswordMatch) {
        throw new UnauthorizedException()
    }

    const accessToken = signAccessToken(user.id)

    const refreshToken = await signRefreshToken(user.id)

    return {
        accessToken,
        refreshToken,
        user,
    }
}

const refresh = async (dto: RefreshTokenDto) => {
    const {sub} = verifyJwt(dto.token, refreshTokenSecret, {
        issuer,
    })

    if (!sub) {
        throw new NotFoundException('Undefined sub')
    }

    const userId = +sub

    const refreshToken = await db.client.refreshToken.findUnique({
        select: {
            token: true,
        },
        where: {
            userId,
        }
    })

    if (!refreshToken) {
        throw new NotFoundException('Refresh token not found')
    }

    const isRefreshTokenMatch = await verifyHash(refreshToken.token, dto.token)

    if (!isRefreshTokenMatch) {
        throw new UnauthorizedException('Refresh token not match')
    }

    return signAccessToken(userId)
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

    return await mail.send(dto.email, 'Reset Password', data, templatePath)
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

export {
    register,
    login,
    refresh,
    forgotPassword,
    resetPassword,
    updatePassword,
}
