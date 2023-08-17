import { Request, Response } from 'express';
import { StatusCodes } from 'http-status-codes';
import { csrf } from '@/utils'

const getCsrfToken = (req: Request, res: Response) => {
    const csrfToken = csrf.generateToken(res, req)

    return res.status(StatusCodes.OK).json({
        csrfToken,
    })
}

export {
    getCsrfToken,
}
