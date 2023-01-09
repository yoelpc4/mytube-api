import { Router } from 'express';
import { body } from 'express-validator'
import { auth } from '../middlewares';
import { getUser, login, register } from '../controllers';
import { IsEmailUniqueValidator, IsPasswordConfirmationMatchValidator } from '../validators';

const router = Router()

router.post(
    '/register',
    body('name').notEmpty().bail().isString().bail().trim(),
    body('email').notEmpty().bail().isEmail().bail().custom(IsEmailUniqueValidator).trim().normalizeEmail(),
    body('password').notEmpty().bail().isLength({ min: 8 }).bail().trim(),
    body('passwordConfirmation').notEmpty().bail().custom(IsPasswordConfirmationMatchValidator).bail(),
    register
)
router.post(
    '/login',
    body('email').notEmpty().bail().isEmail().bail().trim().normalizeEmail(),
    body('password').notEmpty().bail().isString().bail().trim(),
    login
)
router.get(
    '/user',
    auth,
    getUser
)

export default router
