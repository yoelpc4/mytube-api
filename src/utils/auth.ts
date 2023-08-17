import { Express, Request } from 'express'
import passport from 'passport'
import { Strategy as AnonymousStrategy } from 'passport-anonymous'
import { Strategy as JwtStrategy, StrategyOptions } from 'passport-jwt'
import { JwtPayload } from 'jsonwebtoken'
import { db } from '@/utils'

const issuer = process.env.JWT_ISSUER

if (!issuer) {
    throw new Error('Undefined JWT issuer')
}

const secret = process.env.JWT_SECRET

if (!secret) {
    throw new Error('Undefined JWT secret')
}

const cookieName = process.env.JWT_COOKIE_NAME

if (!cookieName) {
    throw new Error('Undefined JWT cookie name')
}

const jwtOptions: StrategyOptions = {
    issuer,
    jwtFromRequest: (req: Request) => req.cookies?.[`${cookieName}`],
    secretOrKey: secret,
}

const setup = (app: Express) => {
    app.use(passport.initialize())

    passport.use(new JwtStrategy(jwtOptions, async ({sub}: JwtPayload, cb) => {
        try {
            if (!sub) {
                return cb(null, false)
            }

            const user = await db.client.user.findUnique({
                select: {
                  id: true,
                  name: true,
                  username: true,
                  email: true,
                },
                where: {
                    id: +sub,
                },
            })

            return cb(null, user ?? false)
        } catch (error) {
            return cb(error)
        }
    }))

    passport.use(new AnonymousStrategy())
}

export {
    setup,
}
