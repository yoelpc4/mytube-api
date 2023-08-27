import { Router } from 'express';
import { dashboardController } from '@/controllers';
import { auth } from '@/middlewares';

const router = Router()

router.get(
    '/',
    auth,
    dashboardController.getDashboard
)

export default router
