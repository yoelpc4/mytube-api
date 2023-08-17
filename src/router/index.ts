import { Router } from 'express'
import { csrfController } from '@/controllers';
import { csrfValidation, throttle } from '@/middlewares';
import authRouter from './authRouter'
import channelRouter from './channelRouter'
import contentRouter from './contentRouter'

const router = Router()

router.use(throttle)

router.get('/csrf-token', csrfController.getCsrfToken)

router.use(csrfValidation)

router.use('/auth', authRouter)

router.use('/channels', channelRouter)

router.use('/contents', contentRouter)

export default router
