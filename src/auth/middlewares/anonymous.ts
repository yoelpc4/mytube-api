import passport from 'passport';

export const anonymous = passport.authenticate(['jwt', 'anonymous'], {
    session: false,
})
