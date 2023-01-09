import { PassportStatic } from 'passport';
import { ExtractJwt, Strategy, StrategyOptions } from 'passport-jwt';
import { JwtPayload } from 'jsonwebtoken';
import { prisma } from '../../common/services';

const options: StrategyOptions = {
    issuer: process.env.JWT_ISSUER,
    jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
    secretOrKey: process.env.JWT_SECRET,
}

export const configureStrategy = (passport: PassportStatic) => passport.use(new Strategy(options, async (payload: JwtPayload, done) => {
    try {
        const sub = payload.sub

        if (!sub) {
            return done(null, false)
        }

        const user = await prisma.user.findUnique({
            where: {
                id: +sub,
            },
        })

        if (!user) {
            return done(null, false)
        }

        return done(null, user)
    } catch (error) {
        return done(error, false)
    }
}))
