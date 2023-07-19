import { hash, verify } from 'argon2';
import { JwtPayload, sign } from 'jsonwebtoken';
import { User } from '@prisma/client';
import { prisma } from '@/common/services';
import { UnauthorizedException } from '@/common/exceptions';
import { LoginDto, RegisterDto, UpdatePasswordDto, UpdateProfileDto } from '@/auth/dto';

export class AuthService {
    async register(dto: RegisterDto) {
        const hashedPassword = await hash(dto.password)

        const user = await prisma.$transaction(tx => tx.user.create({
            data: {
                name: dto.name,
                username: dto.username,
                email: dto.email,
                password: hashedPassword,
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
        const hashedPassword = await hash(dto.password)

        await prisma.user.update({
            data: {
              password: hashedPassword,
            },
            where: {
                id: user.id,
            },
        })
    }

    private signAccessToken(id: number) {
        const now = Math.floor(Date.now() / 1000)

        const payload: JwtPayload = {
            sub: id.toString(),
            exp: now + (60 * 60), // 1 hour later
            iat: now,
            iss: process.env.JWT_ISSUER,
        }

        const secret = process.env.JWT_SECRET

        if (!secret) {
            throw new Error('JWT_SECRET env value is undefined')
        }

        return sign(payload, secret)
    }
}
