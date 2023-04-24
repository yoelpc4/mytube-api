import { Router } from 'express';
import {
    createContent,
    deleteContent,
    dislikeContent,
    findContent,
    getContents,
    getContentHistories,
    getContentFeeds,
    likeContent,
    updateContent
} from '../controllers';
import { anonymous, auth } from '../../auth/middlewares';
import { body, query } from 'express-validator';
import { IsValidStatusValidator } from '../validators/IsValidStatusValidator';

const router = Router()

router.get(
    '/',
    auth,
    query('sort.field').if(query('sort.order').exists()).notEmpty().bail().isIn(['id', 'title', 'createdAt', 'updatedAt']).bail().trim(),
    query('sort.order').if(query('sort.field').exists()).notEmpty().bail().isIn(['asc', 'desc']).bail().trim(),
    query('skip').optional().isNumeric().bail().trim(),
    query('take').optional().isNumeric().bail().trim(),
    getContents
)

router.get(
    '/feeds',
    anonymous,
    query('cursor').optional().isNumeric().bail().trim(),
    query('take').optional().isNumeric().bail().trim(),
    getContentFeeds
)

router.get(
    '/histories',
    auth,
    query('cursor').optional().isNumeric().bail().trim(),
    query('take').optional().isNumeric().bail().trim(),
    getContentHistories
)

router.post(
    '/',
    auth,
    createContent
)

router.get(
    '/:id',
    anonymous,
    findContent
)

router.put(
    '/:id',
    auth,
    body('title').notEmpty().bail().isString().bail().trim(),
    body('description').optional().isString().bail().trim(),
    body('tags').optional().isString().bail().trim(),
    body('status').notEmpty().isString().bail().custom(IsValidStatusValidator).bail().trim(),
    updateContent
)

router.delete(
    '/:id',
    auth,
    deleteContent
)

router.post(
    '/:id/like',
    auth,
    likeContent
)

router.post(
    '/:id/dislike',
    auth,
    dislikeContent
)

export default router
