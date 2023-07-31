import { Response } from 'express';
import { ValidationError } from 'express-validator';
import { StatusCodes } from 'http-status-codes';

const getFileUrl = (path: string) => `${process.env.APP_URL}/${path}`

const sendValidationErrorResponse =  (res: Response, errors: ValidationError[]) => res.status(StatusCodes.BAD_REQUEST).json({
    message: 'Please fix the following errors',
    errors,
})

export {
    getFileUrl,
    sendValidationErrorResponse,
}
