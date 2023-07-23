import { User } from '@prisma/client';
import { hash, verify } from 'argon2';
import { randomBytes } from 'crypto';
import { DateTime } from 'luxon'
import { JwtPayload, sign } from 'jsonwebtoken';
import { join } from 'path';
import { cwd } from 'process';
import { prisma, sendEmail } from '@/common/services';
import { UnauthorizedException } from '@/common/exceptions';
import {
    ForgotPasswordDto,
    LoginDto,
    RegisterDto,
    ResetPasswordDto,
    UpdatePasswordDto,
    UpdateProfileDto
} from '@/auth/dto';

export class AuthService {
    async register(dto: RegisterDto) {
        const user = await prisma.$transaction(async tx => tx.user.create({
            data: {
                name: dto.name,
                username: dto.username,
                email: dto.email,
                password: await hash(dto.password),
            },
        }))

        return this.signAccessToken(user.id)
    }

    async login(dto: LoginDto) {
        const user = await prisma.user.findUnique({
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

        return this.signAccessToken(user.id)
    }

    async updateProfile(dto: UpdateProfileDto, user: User) {
        return await prisma.user.update({
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

    async updatePassword(dto: UpdatePasswordDto, user: User) {
        await prisma.user.update({
            data: {
              password: await hash(dto.password),
            },
            where: {
                id: user.id,
            },
        })
    }

    async forgotPassword(dto: ForgotPasswordDto) {
        const user = await prisma.user.findUnique({
            select: {
                name: true,
            },
            where: {
                email: dto.email,
            },
        })

        await prisma.resetPassword.deleteMany({
            where: {
                email: dto.email,
            },
        })

        const token = randomBytes(32).toString('hex')

        await prisma.resetPassword.create({
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

        const templatePath = join(cwd(), 'src', 'auth', 'templates', 'resetPassword.handlebars')

        return await sendEmail(dto.email, 'Password Reset Request', data, templatePath)
    }

    async resetPassword(dto: ResetPasswordDto) {
        await prisma.user.update({
            data: {
                password: await hash(dto.password),
            },
            where: {
                email: dto.email,
            },
        })

        await prisma.resetPassword.deleteMany({
            where: {
                email: dto.email,
            },
        })
    }

    private signAccessToken(id: number) {
        const payload: JwtPayload = {
            sub: id.toString(),
            exp: DateTime.now().plus({hour: 1}).toUnixInteger(),
            iat: DateTime.now().toUnixInteger(),
            iss: process.env.JWT_ISSUER,
        }

        return sign(payload, process.env.JWT_SECRET ?? 'secret')
    }
}
