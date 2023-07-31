import { Express } from 'express'
import passport from 'passport'
import { ExtractJwt, Strategy as JwtStrategy, StrategyOptions } from 'passport-jwt'
import { Strategy as AnonymousStrategy } from 'passport-anonymous'
import { JwtPayload } from 'jsonwebtoken'
import { db } from '@/utils'

function configure(app: Express) {
    app.use(passport.initialize())

    const jwtOptions: StrategyOptions = {
        issuer: process.env.JWT_ISSUER,
        jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
        secretOrKey: process.env.JWT_SECRET,
    }
    passport.use(new JwtStrategy(jwtOptions, async (payload: JwtPayload, cb) => {
        try {
            const sub = payload.sub

            if (!sub) {
                return cb(null, false)
            }

            const user = await db.client.user.findUnique({
                where: {
                    id: +sub,
                },
            })

            if (!user) {
                return cb(null, false)
            }

            return cb(null, user)
        } catch (error) {
            return cb(error, false)
        }
    }))

    passport.use(new AnonymousStrategy())
}

export {
    configure,
}
