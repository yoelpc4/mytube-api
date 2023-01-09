import { Router } from 'express';
import authRouter from './auth/router/AuthRouter';

const router = Router()

router.use('/auth', authRouter)

export default router
