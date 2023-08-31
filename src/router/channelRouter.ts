import { User } from '@prisma/client';
import { Router } from 'express'
import { body, query } from 'express-validator'
import { StatusCodes } from 'http-status-codes';
import { channelController } from '@/controllers'
import { anonymous, auth } from '@/middlewares'
import { IsEmailUniqueIgnoreAuthUserValidator, IsUsernameUniqueIgnoreAuthUserValidator } from '@/validators';

const router = Router()

router.get(
    '/:username',
    anonymous,
    channelController.findChannel,
)

router.get(
    '/:createdById/contents',
    query('cursor')
        .optional()
        .isNumeric()
        .bail()
        .trim(),
    query('take')
        .optional()
        .isNumeric()
        .bail()
        .trim(),
    anonymous,
    channelController.getChannelContents,
)

router.post(
    '/:id/subscribe',
    auth,
    channelController.subscribe,
)

router.post(
    '/:id/unsubscribe',
    auth,
    channelController.unsubscribe,
)

router.put(
    '/:username',
    auth,
    (req, res, next) =>
        req.params.username === (req.user as User).username ? next() : res.status(StatusCodes.FORBIDDEN).json({
            message: 'You have no permission to update this channel',
        }),
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
    channelController.updateChannel
)

export default router
