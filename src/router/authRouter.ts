import { Router } from 'express'
import { body } from 'express-validator'
import { authController } from '@/controllers'
import { auth } from '@/middlewares'
import {
    IsCurrentPasswordMatchValidator,
    IsEmailExistsValidator,
    IsEmailUniqueIgnoreAuthUserValidator,
    IsEmailUniqueValidator,
    IsPasswordConfirmationMatchValidator,
    IsResetPasswordTokenValidValidator,
    IsUsernameUniqueIgnoreAuthUserValidator,
    IsUsernameUniqueValidator,
} from '@/validators'

const router = Router()

router.post(
    '/register',
    body('name')
        .notEmpty()
        .bail()
        .isString()
        .bail()
        .trim(),
    body('username')
        .notEmpty()
        .bail()
        .custom(IsUsernameUniqueValidator)
        .bail()
        .trim(),
    body('email')
        .notEmpty()
        .bail()
        .isEmail()
        .bail()
        .custom(IsEmailUniqueValidator)
        .bail()
        .trim()
        .normalizeEmail(),
    body('password')
        .notEmpty()
        .bail()
        .isLength({min: 8})
        .bail()
        .trim(),
    body('passwordConfirmation')
        .notEmpty()
        .bail()
        .custom(IsPasswordConfirmationMatchValidator),
    authController.register
)

router.post(
    '/login',
    body('username')
        .notEmpty()
        .trim(),
    body('password')
        .notEmpty()
        .bail()
        .isString()
        .bail()
        .trim(),
    authController.login
)

router.post(
    '/logout',
    auth,
    authController.logout
)

router.get(
    '/user',
    auth,
    authController.getUser
)

router.post(
    '/update-profile',
    auth,
    body('name')
        .notEmpty()
        .bail()
        .isString()
        .bail()
        .trim(),
    body('username')
        .notEmpty()
        .bail()
        .custom(IsUsernameUniqueIgnoreAuthUserValidator)
        .bail()
        .trim(),
    body('email')
        .notEmpty()
        .bail()
        .isEmail()
        .bail()
        .custom(IsEmailUniqueIgnoreAuthUserValidator)
        .bail()
        .trim()
        .normalizeEmail(),
    authController.updateProfile
)

router.post(
    '/update-password',
    auth,
    body('currentPassword')
        .notEmpty()
        .bail()
        .isString()
        .bail()
        .custom(IsCurrentPasswordMatchValidator)
        .trim(),
    body('password')
        .notEmpty()
        .bail()
        .isLength({min: 8})
        .bail()
        .trim(),
    body('passwordConfirmation')
        .notEmpty()
        .bail()
        .custom(IsPasswordConfirmationMatchValidator),
    authController.updatePassword
)

router.post(
    '/forgot-password',
    body('email')
        .notEmpty()
        .bail()
        .isEmail()
        .bail()
        .custom(IsEmailExistsValidator)
        .bail()
        .trim()
        .normalizeEmail(),
    authController.forgotPassword
)

router.post(
    '/reset-password',
    body('email')
        .notEmpty()
        .bail()
        .isEmail()
        .bail()
        .custom(IsResetPasswordTokenValidValidator)
        .bail()
        .trim()
        .normalizeEmail(),
    body('token')
        .notEmpty()
        .bail()
        .trim(),
    body('password')
        .notEmpty()
        .bail()
        .isLength({min: 8})
        .bail()
        .trim(),
    body('passwordConfirmation')
        .notEmpty()
        .bail()
        .custom(IsPasswordConfirmationMatchValidator),
    authController.resetPassword
)

export default router
