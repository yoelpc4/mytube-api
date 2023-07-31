import { Router } from 'express'
import authRouter from './authRouter'
import channelRouter from './channelRouter'
import contentRouter from './contentRouter'

const router = Router()

router.use('/auth', authRouter)
router.use('/channels', channelRouter)
router.use('/contents', contentRouter)

export default router
