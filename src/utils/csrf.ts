import { doubleCsrf } from 'csrf-csrf';

const secret = process.env.CSRF_SECRET

if (!secret) {
    throw new Error('Undefined CSRF secret')
}

const cookieName = process.env.CSRF_COOKIE_NAME

if (!cookieName) {
    throw new Error('Undefined CSRF cookie name')
}

const cookieDomain = process.env.CSRF_COOKIE_DOMAIN

if (!cookieDomain) {
    throw new Error('Undefined CSRF cookie domain')
}

const {
    validateRequest,
    generateToken,
} = doubleCsrf({
    cookieName,
    cookieOptions: {
        domain: cookieDomain,
        secure: process.env.CSRF_COOKIE_SECURE === 'true',
        sameSite: 'lax',
    },
    getSecret: () => secret,
})

export {
    validateRequest,
    generateToken,
}
