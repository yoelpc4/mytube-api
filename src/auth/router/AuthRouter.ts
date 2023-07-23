import { Router } from 'express';
import { body } from 'express-validator'
import { auth } from '@/auth/middlewares';
import {
    forgotPassword,
    getUser,
    login,
    register,
    resetPassword,
    updatePassword,
    updateProfile
} from '@/auth/controllers';
import {
    IsCurrentPasswordMatchValidator,
    IsEmailExistsValidator,
    IsEmailUniqueIgnoreAuthUserValidator,
    IsEmailUniqueValidator,
    IsPasswordConfirmationMatchValidator,
    IsResetPasswordTokenNotRecentlyCreatedValidator,
    IsResetPasswordTokenValidValidator,
    IsUsernameUniqueIgnoreAuthUserValidator,
    IsUsernameUniqueValidator,
} from '@/auth/validators';

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
    register
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
    login
)

router.get(
    '/user',
    auth,
    getUser
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
    updateProfile
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
    updatePassword
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
        .custom(IsResetPasswordTokenNotRecentlyCreatedValidator)
        .bail()
        .trim()
        .normalizeEmail(),
    forgotPassword
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
    resetPassword
)

export default router
