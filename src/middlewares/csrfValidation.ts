import { NextFunction, Request, Response } from 'express';
import { StatusCodes } from 'http-status-codes';
import { csrf } from '@/utils'

export const csrfValidation = (req: Request, res: Response, next: NextFunction) => {
    if (!['GET', 'HEAD', 'OPTIONS'].includes(req.method) && !csrf.validateRequest(req)) {
        return res.status(StatusCodes.FORBIDDEN).json({
            message: 'Invalid CSRF token',
        })
    }

    return next()
}
