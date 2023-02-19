import { Router } from 'express';
import AuthRouter from './auth/router/AuthRouter';
import ContentRouter from './content/router/ContentRouter';

const router = Router()

router.use('/auth', AuthRouter)
router.use('/contents', ContentRouter)

export default router
