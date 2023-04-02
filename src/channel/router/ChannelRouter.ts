import { Router } from 'express';
import { auth } from '../../auth/middlewares';
import { findChannel, getChannelContents, subscribe, unsubscribe } from '../controllers/ChannelController';
import { query } from 'express-validator';

const router = Router()

router.get(
    '/:username',
    auth,
    findChannel,
)

router.get(
    '/:username/contents',
    query('skip').optional().isNumeric().bail().trim(),
    query('take').optional().isNumeric().bail().trim(),
    auth,
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
