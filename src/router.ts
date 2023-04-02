import { Router } from 'express';
import AuthRouter from './auth/router/AuthRouter';
import ChannelRouter from './channel/router/ChannelRouter';
import ContentRouter from './content/router/ContentRouter';

const router = Router()

router.use('/auth', AuthRouter)
router.use('/channels', ChannelRouter)
router.use('/contents', ContentRouter)

export default router
