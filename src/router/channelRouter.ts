import { Router } from 'express'
import { query } from 'express-validator'
import { channelController } from '@/controllers'
import { anonymous, auth } from '@/middlewares'

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

export default router
