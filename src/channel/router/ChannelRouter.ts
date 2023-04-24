import { Router } from 'express';
import { anonymous, auth } from '../../auth/middlewares';
import { findChannel, getChannelContents, subscribe, unsubscribe } from '../controllers/ChannelController';
import { query } from 'express-validator';

const router = Router()

router.get(
    '/:username',
    anonymous,
    findChannel,
)

router.get(
    '/:createdById/contents',
    query('cursor').optional().isNumeric().bail().trim(),
    query('take').optional().isNumeric().bail().trim(),
    anonymous,
    getChannelContents,
)

router.post(
    '/:id/subscribe',
    auth,
    subscribe,
)

router.post(
    '/:id/unsubscribe',
    auth,
    unsubscribe,
)

export default router
