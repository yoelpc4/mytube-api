import { PassportStatic } from 'passport';
import { ExtractJwt, Strategy as JwtStrategy, StrategyOptions } from 'passport-jwt';
import { Strategy as AnonymousStrategy } from 'passport-anonymous';
import { JwtPayload } from 'jsonwebtoken';
import { prisma } from '../../common/services';

export const configureStrategy = (passport: PassportStatic) => {
    const jwtOptions: StrategyOptions = {
        issuer: process.env.JWT_ISSUER,
        jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
        secretOrKey: process.env.JWT_SECRET,
    }

    passport.use(new JwtStrategy(jwtOptions, async (payload: JwtPayload, done) => {
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

    passport.use(new AnonymousStrategy())
}
