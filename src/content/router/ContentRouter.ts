import { Router } from 'express';
import { createContent, deleteContent, findContent, getContents, updateContent } from '../controllers';
import { auth } from '../../auth/middlewares';
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

router.post(
    '/',
    auth,
    createContent
)

router.get(
    '/:id',
    auth,
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

export default router
