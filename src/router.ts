import { Router } from 'express';
import AuthRouter from './auth/router/AuthRouter';

const router = Router()

router.use('/auth', AuthRouter)

export default router
