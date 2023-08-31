import { Response } from 'express';
import { ValidationError } from 'express-validator';
import { StatusCodes } from 'http-status-codes';

const sendValidationErrorResponse =  (res: Response, errors: ValidationError[]) => res.status(StatusCodes.BAD_REQUEST).json({
    message: 'Please fix the following errors',
    errors,
})

export {
    sendValidationErrorResponse,
}
