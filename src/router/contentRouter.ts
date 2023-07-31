import { Router } from 'express'
import { body, query } from 'express-validator'
import { contentController } from '@/controllers'
import { anonymous, auth } from '@/middlewares'
import { IsValidStatusValidator } from '@/validators'

const router = Router()

router.get(
    '/',
    auth,
    query('sort.field')
        .if(query('sort.order').exists())
        .notEmpty()
        .bail()
        .isIn(['id', 'title', 'createdAt', 'updatedAt'])
        .bail()
        .trim(),
    query('sort.order')
        .if(query('sort.field').exists())
        .notEmpty()
        .bail()
        .isIn(['asc', 'desc'])
        .bail()
        .trim(),
    query('skip')
        .optional()
        .isNumeric()
        .bail()
        .trim(),
    query('take')
        .optional()
        .isNumeric()
        .bail()
        .trim(),
    contentController.getContents
)

router.get(
    '/feeds',
    anonymous,
    query('cursor')
        .optional()
        .isNumeric()
        .bail()
        .trim(),
    query('take')
        .optional()
        .isNumeric()
        .bail()
        .trim(),
    contentController.getContentFeeds
)

router.get(
    '/histories',
    auth,
    query('cursor')
        .optional()
        .isNumeric()
        .bail()
        .trim(),
    query('take')
        .optional()
        .isNumeric()
        .bail()
        .trim(),
    contentController.getContentHistories
)

router.post(
    '/',
    auth,
    contentController.createContent
)

router.get(
    '/:id',
    anonymous,
    contentController.findContent
)

router.put(
    '/:id',
    auth,
    body('title')
        .notEmpty()
        .bail()
        .isString()
        .bail()
        .trim(),
    body('description')
        .optional()
        .isString()
        .bail()
        .trim(),
    body('tags')
        .optional()
        .isString()
        .bail()
        .trim(),
    body('status')
        .notEmpty()
        .isString()
        .bail()
        .custom(IsValidStatusValidator)
        .bail()
        .trim(),
    contentController.updateContent
)

router.delete(
    '/:id',
    auth,
    contentController.deleteContent
)

router.post(
    '/:id/like',
    auth,
    contentController.likeContent
)

router.post(
    '/:id/dislike',
    auth,
    contentController.dislikeContent
)

export default router
