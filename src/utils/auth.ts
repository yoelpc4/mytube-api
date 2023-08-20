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

const accessTokenSecret = process.env.JWT_ACCESS_TOKEN_SECRET

if (!accessTokenSecret) {
    throw new Error('Undefined JWT access token secret')
}

const accessTokenCookieName = process.env.JWT_ACCESS_TOKEN_COOKIE_NAME

if (!accessTokenCookieName) {
    throw new Error('Undefined JWT access token cookie name')
}

const jwtOptions: StrategyOptions = {
    issuer,
    jwtFromRequest: (req: Request) => req.cookies[accessTokenCookieName],
    secretOrKey: accessTokenSecret,
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
